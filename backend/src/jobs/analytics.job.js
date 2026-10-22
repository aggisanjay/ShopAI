import { createManagedQueue, createManagedWorker } from '../config/bullmq.js';
import logger from '../utils/logger.js';

const QUEUE_NAME = 'analytics';

let analyticsQueue = null;

export const initAnalyticsWorker = async () => {
  try {
    analyticsQueue = createManagedQueue(QUEUE_NAME, {
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 200,
        removeOnFail: 100,
      },
    });

    const worker = createManagedWorker(QUEUE_NAME, async (job) => {
      const { event, data } = job.data;
      logger.debug(`Analytics event processed: ${event}`, { event, data });
    }, { concurrency: 10 });

    logger.info('📊 Analytics worker ready');
    return worker;
  } catch (err) {
    analyticsQueue = null;
    logger.warn('📊 Analytics worker skipped:', err.message);
    return null;
  }
};

export const addAnalyticsJob = async (event, data = {}) => {
  if (!analyticsQueue) return;
  try {
    await analyticsQueue.add('track', { event, data, ts: Date.now() });
  } catch (err) {
    logger.warn(`Failed to enqueue analytics job: ${err.message}`);
  }
};
