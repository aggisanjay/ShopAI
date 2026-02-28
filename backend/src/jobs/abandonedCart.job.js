import { Queue, Worker } from 'bullmq';
import Cart from '../models/Cart.model.js';
import { addEmailJob } from './email.job.js';
import logger from '../utils/logger.js';

const QUEUE_NAME = 'abandoned-cart';

const bullConn = () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  tls: process.env.REDIS_HOST?.includes('upstash.io') ? {} : undefined,
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
});

export const initAbandonedCartWorker = async () => {
  try {
    const cartQueue = new Queue(QUEUE_NAME, {
      connection: bullConn(),
      defaultJobOptions: { removeOnComplete: 50, removeOnFail: 100 },
    });
    cartQueue.on('error', () => {});

    await cartQueue.add('check-abandoned', {}, {
      repeat: { every: 2 * 60 * 60 * 1000 },
      jobId: 'abandoned-cart-check',
    });

    const worker = new Worker(QUEUE_NAME, async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const carts = await Cart.find({
        lastActivity: { $lt: twoHoursAgo },
        isAbandoned: false,
        'items.0': { $exists: true },
      }).populate('user', 'name email').limit(100);

      for (const cart of carts) {
        if (!cart.user?.email) continue;
        cart.isAbandoned = true;
        cart.abandonedNotifiedAt = new Date();
        await cart.save();
        await addEmailJob({
          to: cart.user.email,
          template: 'abandonedCart',
          data: {
            name: cart.user.name,
            cartUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/cart`,
          },
        });
      }
      if (carts.length > 0) logger.info(`Abandoned cart emails queued: ${carts.length}`);
    }, { connection: bullConn() });

    worker.on('error', () => {});
    worker.on('failed', (job, err) => logger.error(`Cart job ${job?.id} failed:`, err.message));
    logger.info('🛒 Abandoned cart worker ready');
    return worker;
  } catch {
    logger.warn('🛒 Abandoned cart worker skipped');
    return null;
  }
};
