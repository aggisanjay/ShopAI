import { Queue, Worker } from 'bullmq';
import { getRedisConfig } from './redis.js';
import logger from '../utils/logger.js';
import {
  bullmqJobsWaiting,
  bullmqJobsActive,
  bullmqJobsCompletedTotal,
  bullmqJobsFailedTotal,
  bullmqJobsRetriedTotal,
  bullmqJobsStalledTotal,
  bullmqJobDurationSeconds,
} from '../observability/metrics.js';

const registeredQueues = new Map();
const registeredWorkers = new Map();

export const getBullMQConnection = () => {
  const config = getRedisConfig();
  if (config.url) {
    return {
      url: config.url,
      tls: config.tls,
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      connectTimeout: 5000,
    };
  }

  return {
    host: config.host,
    port: config.port,
    password: config.password,
    tls: config.tls,
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    connectTimeout: 5000,
  };
};

export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  timeout: 45000, // 45 seconds max execution
  removeOnComplete: 100,
  removeOnFail: 200,
};

/**
 * Safely create a BullMQ Queue with metrics and lifecycle tracking
 */
export const createManagedQueue = (queueName, opts = {}) => {
  if (registeredQueues.has(queueName)) {
    return registeredQueues.get(queueName);
  }

  try {
    const queue = new Queue(queueName, {
      connection: getBullMQConnection(),
      defaultJobOptions: {
        ...DEFAULT_JOB_OPTIONS,
        ...opts.defaultJobOptions,
      },
      ...opts,
    });

    queue.on('error', (err) => {
      logger.warn(`BullMQ Queue [${queueName}] error: ${err.message}`);
    });

    registeredQueues.set(queueName, queue);
    return queue;
  } catch (err) {
    logger.warn(`Failed to create BullMQ Queue [${queueName}]: ${err.message}`);
    return null;
  }
};

/**
 * Safely create a BullMQ Worker with structured instrumentation, retry/stall handlers
 */
export const createManagedWorker = (queueName, processor, opts = {}) => {
  try {
    const instrumentedProcessor = async (job) => {
      const startTime = process.hrtime();
      const jobName = job.name || 'default';

      try {
        const result = await processor(job);
        const diff = process.hrtime(startTime);
        const durationSec = diff[0] + diff[1] * 1e-9;

        bullmqJobsCompletedTotal.inc({ queue: queueName });
        bullmqJobDurationSeconds.observe({ queue: queueName, job_name: jobName }, durationSec);

        return result;
      } catch (err) {
        const diff = process.hrtime(startTime);
        const durationSec = diff[0] + diff[1] * 1e-9;
        bullmqJobDurationSeconds.observe({ queue: queueName, job_name: jobName }, durationSec);

        if (job.attemptsMade < (job.opts?.attempts || 3)) {
          bullmqJobsRetriedTotal.inc({ queue: queueName });
          logger.warn(`BullMQ Job ${job.id} [${jobName}] failed, retrying (attempt ${job.attemptsMade + 1}): ${err.message}`);
        } else {
          bullmqJobsFailedTotal.inc({ queue: queueName });
          logger.error(`BullMQ Job ${job.id} [${jobName}] permanently failed: ${err.message}`, {
            jobId: job.id,
            queue: queueName,
            data: job.data,
            stack: err.stack,
          });
        }
        throw err;
      }
    };

    const worker = new Worker(queueName, instrumentedProcessor, {
      connection: getBullMQConnection(),
      concurrency: opts.concurrency || 5,
      ...opts,
    });

    worker.on('error', (err) => {
      logger.warn(`BullMQ Worker [${queueName}] error: ${err.message}`);
    });

    worker.on('stalled', (jobId) => {
      bullmqJobsStalledTotal.inc({ queue: queueName });
      logger.warn(`BullMQ Worker [${queueName}] detected stalled job: ${jobId}`);
    });

    registeredWorkers.set(queueName, worker);
    return worker;
  } catch (err) {
    logger.warn(`Failed to create BullMQ Worker [${queueName}]: ${err.message}`);
    return null;
  }
};

/**
 * Periodic queue depth metrics collector
 */
export const updateQueueMetrics = async () => {
  for (const [name, queue] of registeredQueues.entries()) {
    try {
      const counts = await queue.getJobCounts('waiting', 'active');
      bullmqJobsWaiting.set({ queue: name }, counts.waiting || 0);
      bullmqJobsActive.set({ queue: name }, counts.active || 0);
    } catch {
      // Ignore transient connection issues
    }
  }
};

/**
 * Graceful shutdown for all workers and queues
 */
export const shutdownBullMQ = async () => {
  logger.info('Closing all BullMQ workers and queues...');
  const workerCloses = Array.from(registeredWorkers.values()).map(w => w.close().catch(() => {}));
  const queueCloses = Array.from(registeredQueues.values()).map(q => q.close().catch(() => {}));
  await Promise.allSettled([...workerCloses, ...queueCloses]);
  registeredWorkers.clear();
  registeredQueues.clear();
  logger.info('All BullMQ workers and queues closed cleanly');
};
