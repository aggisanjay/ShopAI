import Redis from 'ioredis';
import logger from '../utils/logger.js';

let redisClient = null;
let redisAvailable = false;

// Quick probe — one attempt, no retries, no logs on failure
const probeRedis = () =>
  new Promise((resolve) => {
    const probe = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      tls: process.env.REDIS_HOST?.includes('upstash.io') ? {} : undefined,
      connectTimeout: 2000,
      retryStrategy: () => null,   // never retry
      enableOfflineQueue: false,
      lazyConnect: true,
    });
    probe.on('error', () => {});   // swallow all errors silently
    probe.connect()
      .then(() => { probe.disconnect(); resolve(true); })
      .catch(() => resolve(false));
  });

export const connectRedis = async () => {
  redisAvailable = await probeRedis();

  if (!redisAvailable) {
    logger.warn('⚠️  Redis not available — caching and background queues disabled');
    return null;
  }

  redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_HOST?.includes('upstash.io') ? {} : undefined,
    retryStrategy: (times) => (times > 5 ? null : Math.min(times * 300, 3000)),
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    connectTimeout: 3000,
  });

  redisClient.on('connect', () => logger.info('✅ Redis connected'));
  redisClient.on('error', () => {}); // warn happened once above; no spam
  redisClient.on('close', () => { redisAvailable = false; redisClient = null; });

  logger.info('✅ Redis ready');
  return redisClient;
};

export const getRedis = () => redisClient;
export const isRedisAvailable = () => redisAvailable;

// ── Cache helpers (all silent no-ops when Redis is down) ─────────────────────

export const cacheGet = async (key) => {
  if (!redisClient) return null;
  try { const d = await redisClient.get(key); return d ? JSON.parse(d) : null; }
  catch { return null; }
};

export const cacheSet = async (key, value, ttlSeconds = 3600) => {
  if (!redisClient) return;
  try { await redisClient.setex(key, ttlSeconds, JSON.stringify(value)); } catch {}
};

export const cacheDel = async (...keys) => {
  if (!redisClient) return;
  try { await redisClient.del(...keys); } catch {}
};

export const cacheDelPattern = async (pattern) => {
  if (!redisClient) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) await redisClient.del(...keys);
  } catch {}
};
