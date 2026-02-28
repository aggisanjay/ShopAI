import { isRedisAvailable } from '../config/redis.js';
import { initEmailWorker } from './email.job.js';
import { initRecoWorker } from './recommendation.job.js';
import { initAnalyticsWorker } from './analytics.job.js';
import { initAbandonedCartWorker } from './abandonedCart.job.js';
import logger from '../utils/logger.js';

// Called AFTER connectRedis() — safe to check isRedisAvailable() here
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

  logger.info('✅ Background workers initialized');
};
