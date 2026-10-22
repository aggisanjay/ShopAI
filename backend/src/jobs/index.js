import { isRedisAvailable } from '../config/redis.js';
import { updateQueueMetrics } from '../config/bullmq.js';
import { initEmailWorker } from './email.job.js';
import { initRecoWorker } from './recommendation.job.js';
import { initAnalyticsWorker } from './analytics.job.js';
import { initAbandonedCartWorker } from './abandonedCart.job.js';
import logger from '../utils/logger.js';

let metricsInterval = null;

export const initializeWorkers = async () => {
  if (!isRedisAvailable()) {
    logger.warn('⏭️  Background workers skipped (Redis not available)');
    return;
  }

  logger.info('🔧 Initializing background workers...');

  await Promise.allSettled([
    initEmailWorker(),
    initRecoWorker(),
    initAnalyticsWorker(),
    initAbandonedCartWorker(),
  ]);

  if (!metricsInterval) {
    metricsInterval = setInterval(() => {
      updateQueueMetrics().catch(() => {});
    }, 15000);
    metricsInterval.unref(); // Prevent keeping event loop active on shutdown
  }

  logger.info('✅ Background workers initialized');
};
