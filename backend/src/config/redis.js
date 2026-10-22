import Redis from 'ioredis';
import logger from '../utils/logger.js';
import {
  redisConnectedGauge,
  redisCacheHitsTotal,
  redisCacheMissesTotal,
  redisOperationDurationSeconds,
  redisErrorsTotal,
  redisInvalidationsTotal,
} from '../observability/metrics.js';

let redisClient = null;
let redisAvailable = false;
let isConnecting = false;

// Single-flight in-flight promise cache to protect against cache stampedes
const inFlightRequests = new Map();

export const getRedisConfig = () => {
  if (process.env.REDIS_URL) {
    return {
      url: process.env.REDIS_URL,
      tls: (process.env.REDIS_URL.startsWith('rediss://') || process.env.REDIS_URL.includes('upstash.io')) ? {} : undefined,
    };
  }

  const host = process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.REDIS_PORT) || 6379;
  const password = process.env.REDIS_PASSWORD || undefined;
  const useTls = host.includes('upstash.io') || process.env.REDIS_TLS === 'true';

  return {
    host,
    port,
    password,
    tls: useTls ? {} : undefined,
  };
};

export const connectRedis = async () => {
  if (redisClient && redisAvailable) {
    return redisClient;
  }
  if (isConnecting && redisClient) {
    return redisClient;
  }

  isConnecting = true;
  const config = getRedisConfig();

  try {
    const clientOptions = {
      ...(config.url ? { path: config.url } : { host: config.host, port: config.port, password: config.password }),
      tls: config.tls,
      connectTimeout: 5000,
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 5) {
          logger.warn(`Redis reconnect limit exceeded (${times} attempts). Suspending retry.`);
          return null;
        }
        return Math.min(times * 500, 3000);
      },
    };

    const client = config.url ? new Redis(config.url, clientOptions) : new Redis(clientOptions);

    client.on('connect', () => {
      redisAvailable = true;
      redisConnectedGauge.set(1);
      logger.info('✅ Redis connected successfully');
    });

    client.on('ready', () => {
      redisAvailable = true;
      redisConnectedGauge.set(1);
    });

    client.on('error', (err) => {
      redisErrorsTotal.inc({ command: 'connection' });
      logger.warn(`Redis connection error: ${err.message}`);
    });

    client.on('close', () => {
      redisAvailable = false;
      redisConnectedGauge.set(0);
    });

    await client.connect();
    redisClient = client;
    redisAvailable = true;
    redisConnectedGauge.set(1);
    isConnecting = false;
    return redisClient;
  } catch (err) {
    redisAvailable = false;
    redisConnectedGauge.set(0);
    redisClient = null;
    isConnecting = false;
    logger.warn(`⚠️  Redis unavailable (${err.message}) — graceful database fallback active`);
    return null;
  }
};

export const getRedis = () => redisClient;
export const isRedisAvailable = () => redisAvailable && redisClient?.status === 'ready';

// ─── Observable Cache Helpers with DB fallback ─────────────────────────────

export const cacheGet = async (key, cacheName = 'general') => {
  if (!isRedisAvailable()) {
    redisCacheMissesTotal.inc({ cache_name: cacheName });
    return null;
  }

  const start = process.hrtime();
  try {
    const data = await redisClient.get(key);
    const diff = process.hrtime(start);
    redisOperationDurationSeconds.observe({ command: 'get' }, diff[0] + diff[1] * 1e-9);

    if (data) {
      redisCacheHitsTotal.inc({ cache_name: cacheName });
      return JSON.parse(data);
    } else {
      redisCacheMissesTotal.inc({ cache_name: cacheName });
      return null;
    }
  } catch (err) {
    redisErrorsTotal.inc({ command: 'get' });
    redisCacheMissesTotal.inc({ cache_name: cacheName });
    logger.warn(`Redis cacheGet failed for ${key}: ${err.message}`);
    return null;
  }
};

export const cacheSet = async (key, value, ttlSeconds = 3600, cacheName = 'general') => {
  if (!isRedisAvailable() || value === undefined) return;

  const start = process.hrtime();
  try {
    await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
    const diff = process.hrtime(start);
    redisOperationDurationSeconds.observe({ command: 'setex' }, diff[0] + diff[1] * 1e-9);
  } catch (err) {
    redisErrorsTotal.inc({ command: 'setex' });
    logger.warn(`Redis cacheSet failed for ${key}: ${err.message}`);
  }
};

export const cacheDel = async (...keys) => {
  if (!isRedisAvailable() || keys.length === 0) return;

  const validKeys = keys.filter(Boolean);
  if (validKeys.length === 0) return;

  const start = process.hrtime();
  try {
    await redisClient.del(...validKeys);
    redisInvalidationsTotal.inc({ namespace: 'direct' }, validKeys.length);
    const diff = process.hrtime(start);
    redisOperationDurationSeconds.observe({ command: 'del' }, diff[0] + diff[1] * 1e-9);
  } catch (err) {
    redisErrorsTotal.inc({ command: 'del' });
    logger.warn(`Redis cacheDel failed: ${err.message}`);
  }
};

/**
 * Safe, non-blocking pattern deletion using Redis SCAN instead of blocking KEYS *
 */
export const cacheDelPattern = async (pattern, namespace = 'pattern') => {
  if (!isRedisAvailable() || !pattern) return;

  const start = process.hrtime();
  try {
    let cursor = '0';
    let totalDeleted = 0;

    do {
      const [nextCursor, matchedKeys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;

      if (matchedKeys.length > 0) {
        await redisClient.del(...matchedKeys);
        totalDeleted += matchedKeys.length;
      }
    } while (cursor !== '0');

    if (totalDeleted > 0) {
      redisInvalidationsTotal.inc({ namespace }, totalDeleted);
    }
    const diff = process.hrtime(start);
    redisOperationDurationSeconds.observe({ command: 'scan_del' }, diff[0] + diff[1] * 1e-9);
  } catch (err) {
    redisErrorsTotal.inc({ command: 'scan_del' });
    logger.warn(`Redis cacheDelPattern failed for pattern "${pattern}": ${err.message}`);
  }
};

/**
 * Cache stampede protection: single-flight execution for expensive queries
 */
export const fetchOrSet = async (key, fetcherFn, ttlSeconds = 300, cacheName = 'general') => {
  // 1. Try cache read
  const cached = await cacheGet(key, cacheName);
  if (cached !== null) {
    return cached;
  }

  // 2. Check if identical request is already running
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key);
  }

  // 3. Initiate single-flight computation
  const promise = (async () => {
    try {
      const result = await fetcherFn();
      if (result !== undefined && result !== null) {
        await cacheSet(key, result, ttlSeconds, cacheName);
      }
      return result;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, promise);
  return promise;
};
