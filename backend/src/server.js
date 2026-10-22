import 'dotenv/config';
import app from './app.js';
import mongoose from 'mongoose';
import { connectDB } from './config/database.js';
import { connectRedis, getRedis } from './config/redis.js';
import { initializeWorkers } from './jobs/index.js';
import { shutdownBullMQ } from './config/bullmq.js';
import logger from './utils/logger.js';

const PORT = process.env.PORT || 5000;

let server = null;
let isShuttingDown = false;

const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`${signal} received. Initiating graceful shutdown...`);

  // Stop accepting new HTTP requests
  if (server) {
    await new Promise((resolve) => server.close(resolve));
    logger.info('HTTP server closed');
  }

  // Gracefully stop background workers and queues
  try {
    await shutdownBullMQ();
  } catch (err) {
    logger.warn('Error during BullMQ shutdown:', err.message);
  }

  // Close Redis client
  try {
    const redis = getRedis();
    if (redis) {
      await redis.quit();
      logger.info('Redis connection closed cleanly');
    }
  } catch (err) {
    logger.warn('Error during Redis shutdown:', err.message);
  }

  // Close MongoDB connection
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed cleanly');
    }
  } catch (err) {
    logger.warn('Error during MongoDB shutdown:', err.message);
  }

  logger.info('Graceful shutdown completed');
  process.exit(0);
};

const startServer = async () => {
  try {
    // 1. Connect MongoDB
    await connectDB();

    // 2. Connect Redis (graceful fallback if down)
    await connectRedis();

    // 3. Initialize background queues & workers
    await initializeWorkers();

    // 4. Start HTTP Server
    server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });

    // 5. Register shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Promise Rejection:', {
        reason: reason?.message || reason,
        stack: reason?.stack,
      });
    });

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', {
        error: err.message,
        stack: err.stack,
      });
      gracefulShutdown('uncaughtException');
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
