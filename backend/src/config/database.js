import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import {
  mongodbConnectedGauge,
  mongodbOperationsTotal,
  mongodbOperationDurationSeconds,
  mongodbSlowQueriesTotal,
  mongodbQueryErrorsTotal,
} from '../observability/metrics.js';

let isPluginAttached = false;

// Attach global timing plugin for Mongoose queries
const attachMongooseMetrics = () => {
  if (isPluginAttached) return;
  isPluginAttached = true;

  const SLOW_QUERY_THRESHOLD_MS = 100;

  mongoose.plugin((schema) => {
    // Queries: find, findOne, findById, countDocuments, etc.
    schema.pre(['find', 'findOne', 'findOneAndUpdate', 'countDocuments', 'aggregate'], function () {
      this._startTime = process.hrtime();
    });

    schema.post(['find', 'findOne', 'findOneAndUpdate', 'countDocuments'], function (docs) {
      if (this._startTime) {
        const diff = process.hrtime(this._startTime);
        const durationSec = diff[0] + diff[1] * 1e-9;
        const durationMs = durationSec * 1000;
        const collection = this.model?.collection?.name || 'unknown';
        const operation = this.op || 'query';

        mongodbOperationsTotal.inc({ collection, operation });
        mongodbOperationDurationSeconds.observe({ collection, operation }, durationSec);

        if (durationMs > SLOW_QUERY_THRESHOLD_MS) {
          mongodbSlowQueriesTotal.inc({ collection, operation });
          logger.warn(`Slow MongoDB query: ${collection}.${operation} took ${durationMs.toFixed(1)}ms`, {
            collection,
            operation,
            filter: this.getFilter?.(),
          });
        }
      }
    });

    // Save/Insert operations
    schema.pre('save', function () {
      this._saveStartTime = process.hrtime();
    });

    schema.post('save', function () {
      if (this._saveStartTime) {
        const diff = process.hrtime(this._saveStartTime);
        const durationSec = diff[0] + diff[1] * 1e-9;
        const collection = this.constructor.collection.name;

        mongodbOperationsTotal.inc({ collection, operation: 'save' });
        mongodbOperationDurationSeconds.observe({ collection, operation: 'save' }, durationSec);
      }
    });
  });
};

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    mongodbConnectedGauge.set(1);
    return mongoose.connection;
  }

  attachMongooseMetrics();

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE) || 20,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
    });

    mongodbConnectedGauge.set(1);
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      mongodbConnectedGauge.set(0);
      mongodbQueryErrorsTotal.inc({ collection: 'connection', operation: 'event' });
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      mongodbConnectedGauge.set(0);
      logger.warn('MongoDB disconnected. Reconnecting...');
    });

    mongoose.connection.on('reconnected', () => {
      mongodbConnectedGauge.set(1);
      logger.info('MongoDB reconnected');
    });

    return conn;
  } catch (error) {
    mongodbConnectedGauge.set(0);
    logger.error('MongoDB connection failed:', error.message);
    throw error;
  }
};
