import { Queue, Worker } from 'bullmq';
import recommendationService from '../services/recommendation.service.js';
import logger from '../utils/logger.js';

const QUEUE_NAME = 'recommendations';

const bullConn = () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  tls: process.env.REDIS_HOST?.includes('upstash.io') ? {} : undefined,
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
});

let recoQueue = null;

export const initRecoWorker = async () => {
  try {
    recoQueue = new Queue(QUEUE_NAME, {
      connection: bullConn(),
      defaultJobOptions: { removeOnComplete: 50, removeOnFail: 100 },
    });
    recoQueue.on('error', () => {});

    await recoQueue.add('recompute-trending', {}, {
      repeat: { every: 60 * 60 * 1000 },
      jobId: 'trending-recompute',
    });

    const worker = new Worker(QUEUE_NAME, async (job) => {
      if (job.name === 'recompute-trending') {
        await recommendationService.recomputeTrendingScores();
        logger.info('Trending scores recomputed');
      }
    }, { connection: bullConn() });

    worker.on('error', () => {});
    worker.on('failed', (job, err) => logger.error(`Reco job ${job?.id} failed:`, err.message));
    logger.info('🤖 Recommendation worker ready');
    return worker;
  } catch {
    recoQueue = null;
    logger.warn('🤖 Recommendation worker skipped');
    return null;
  }
};

export const addRecoJob = async (name, data = {}) => {
  if (!recoQueue) return;
  try { await recoQueue.add(name, data); } catch {}
};
