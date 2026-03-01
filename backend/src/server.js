// import 'dotenv/config';
// import app from './app.js';
// import { connectDB } from './config/database.js';
// import { connectRedis } from './config/redis.js';
// import { initializeWorkers } from './jobs/index.js';
// import logger from './utils/logger.js';

// const PORT = process.env.PORT || 5000;

// const startServer = async () => {
//   try {
//     await connectDB();
//     await connectRedis();
//     await initializeWorkers();

//     const server = app.listen(PORT, () => {
//       logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
//     });

//     // Graceful shutdown
//     const gracefulShutdown = (signal) => {
//       logger.info(`${signal} received. Starting graceful shutdown...`);
//       server.close(() => {
//         logger.info('HTTP server closed.');
//         process.exit(0);
//       });
//     };

//     process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
//     process.on('SIGINT', () => gracefulShutdown('SIGINT'));

//     process.on('unhandledRejection', (err) => {
//       logger.error('Unhandled Rejection:', err);
//       server.close(() => process.exit(1));
//     });

//   } catch (error) {
//     logger.error('Failed to start server:', error);
//     process.exit(1);
//   }
// };

// startServer();

import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/database.js';
import { connectRedis } from './config/redis.js';
import { initializeWorkers } from './jobs/index.js';
import logger from './utils/logger.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();
    await initializeWorkers();

    if (process.env.NODE_ENV !== 'production') {
      app.listen(PORT, () => {
        logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      });
    }
  } catch (error) {
    logger.error('Failed to start server:', error);
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

// Start server logic
startServer();

export default app;

