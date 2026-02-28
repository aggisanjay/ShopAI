// Shared BullMQ Redis connection config
// BullMQ needs its own connection (separate from ioredis client)
// Returns null if Redis is not available — all jobs gracefully skip

export const getBullMQConnection = () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  tls: process.env.REDIS_HOST?.includes('upstash.io') ? {} : undefined,
  // Prevent BullMQ from spamming reconnect errors
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  retryStrategy: (times) => {
    if (times > 2) return null; // stop retrying
    return Math.min(times * 500, 2000);
  },
  connectTimeout: 3000,
});

// Safely create a BullMQ Queue, returning null if Redis unavailable
export const safeBullQueue = async (Queue, name, opts = {}) => {
  try {
    const q = new Queue(name, {
      connection: getBullMQConnection(),
      ...opts,
    });
    // Test connection
    await q.waitUntilReady();
    return q;
  } catch {
    return null;
  }
};

// Safely create a BullMQ Worker, returning null if Redis unavailable
export const safeBullWorker = async (Worker, name, processor, opts = {}) => {
  try {
    const w = new Worker(name, processor, {
      connection: getBullMQConnection(),
      ...opts,
    });
    await w.waitUntilReady();
    return w;
  } catch {
    return null;
  }
};
