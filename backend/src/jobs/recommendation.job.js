import { createManagedQueue, createManagedWorker } from '../config/bullmq.js';
import recommendationService from '../services/recommendation.service.js';
import logger from '../utils/logger.js';

const QUEUE_NAME = 'recommendations';

let recoQueue = null;

export const initRecoWorker = async () => {
  try {
    recoQueue = createManagedQueue(QUEUE_NAME, {
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 50,
        removeOnFail: 100,
      },
    });

    await recoQueue.add(
      'recompute-trending',
      {},
      {
        repeat: { every: 60 * 60 * 1000 },
        jobId: 'trending-recompute-hourly',
      }
    );

    const worker = createManagedWorker(QUEUE_NAME, async (job) => {
      if (job.name === 'recompute-trending') {
        await recommendationService.recomputeTrendingScores();
        logger.info('Trending scores recomputed successfully');
      }
    }, { concurrency: 1 });

    logger.info('🤖 Recommendation worker ready');
    return worker;
  } catch (err) {
    recoQueue = null;
    logger.warn('🤖 Recommendation worker skipped:', err.message);
    return null;
  }
};

export const addRecoJob = async (name, data = {}, opts = {}) => {
  if (!recoQueue) return;
  try {
    await recoQueue.add(name, data, opts);
  } catch (err) {
    logger.warn(`Failed to enqueue recommendation job: ${err.message}`);
  }
};
