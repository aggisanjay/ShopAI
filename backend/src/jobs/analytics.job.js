import { Queue, Worker } from 'bullmq';
import logger from '../utils/logger.js';

const QUEUE_NAME = 'analytics';

const bullConn = () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  tls: process.env.REDIS_HOST?.includes('upstash.io') ? {} : undefined,
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
});

let analyticsQueue = null;

export const initAnalyticsWorker = async () => {
  try {
    analyticsQueue = new Queue(QUEUE_NAME, {
      connection: bullConn(),
      defaultJobOptions: { removeOnComplete: 200, removeOnFail: 100 },
    });
    analyticsQueue.on('error', () => {});

    const worker = new Worker(QUEUE_NAME, async (job) => {
      const { event, data } = job.data;
      logger.debug(`Analytics event: ${event}`, data);
    }, { connection: bullConn(), concurrency: 10 });

    worker.on('error', () => {});
    worker.on('failed', (job, err) => logger.error(`Analytics job ${job?.id} failed:`, err.message));
    logger.info('📊 Analytics worker ready');
    return worker;
  } catch {
    analyticsQueue = null;
    logger.warn('📊 Analytics worker skipped');
    return null;
  }
};

export const addAnalyticsJob = async (event, data = {}) => {
  if (!analyticsQueue) return;
  try { await analyticsQueue.add('track', { event, data, ts: Date.now() }); } catch {}
};
