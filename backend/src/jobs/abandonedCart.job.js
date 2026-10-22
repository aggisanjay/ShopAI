import Cart from '../models/Cart.model.js';
import { createManagedQueue, createManagedWorker } from '../config/bullmq.js';
import { addEmailJob } from './email.job.js';
import logger from '../utils/logger.js';
import { businessCartAbandonmentTotal } from '../observability/metrics.js';

const QUEUE_NAME = 'abandoned-cart';

let cartQueue = null;

export const initAbandonedCartWorker = async () => {
  try {
    cartQueue = createManagedQueue(QUEUE_NAME, {
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'fixed', delay: 10000 },
        removeOnComplete: 50,
        removeOnFail: 100,
      },
    });

    await cartQueue.add(
      'check-abandoned',
      {},
      {
        repeat: { every: 2 * 60 * 60 * 1000 },
        jobId: 'abandoned-cart-check-repeater',
      }
    );

    const worker = createManagedWorker(QUEUE_NAME, async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const carts = await Cart.find({
        lastActivity: { $lt: twoHoursAgo },
        isAbandoned: false,
        'items.0': { $exists: true },
      })
        .populate('user', 'name email')
        .limit(50)
        .lean();

      let abandonedCount = 0;
      for (const cart of carts) {
        if (!cart.user?.email) continue;

        // Atomically mark as abandoned to prevent duplicate emails across worker instances
        const updated = await Cart.findOneAndUpdate(
          { _id: cart._id, isAbandoned: false },
          { isAbandoned: true, abandonedNotifiedAt: new Date() },
          { new: true }
        );

        if (updated) {
          abandonedCount++;
          businessCartAbandonmentTotal.inc();

          await addEmailJob(
            {
              to: cart.user.email,
              template: 'abandonedCart',
              data: {
                name: cart.user.name,
                cartUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/cart`,
              },
            },
            { jobId: `abandoned-cart:${cart._id}:${cart.user._id}` }
          );
        }
      }

      if (abandonedCount > 0) {
        logger.info(`Abandoned cart emails processed: ${abandonedCount}`);
      }
    }, { concurrency: 1 });

    logger.info('🛒 Abandoned cart worker ready');
    return worker;
  } catch (err) {
    cartQueue = null;
    logger.warn('🛒 Abandoned cart worker skipped:', err.message);
    return null;
  }
};
