import { Router } from 'express';
import mongoose from 'mongoose';
import { getRedis, isRedisAvailable } from '../config/redis.js';

const router = Router();

// 1. Liveness Probe (process is alive)
router.get('/live', (req, res) => {
  res.status(200).json({ status: 'live', uptime: process.uptime() });
});

// 2. Readiness Probe (can accept traffic)
router.get('/ready', (req, res) => {
  const isMongoReady = mongoose.connection.readyState === 1;

  if (!isMongoReady) {
    return res.status(503).json({
      status: 'not_ready',
      reason: 'Database connection unavailable',
    });
  }

  res.status(200).json({
    status: 'ready',
    database: 'connected',
    redis: isRedisAvailable() ? 'connected' : 'degraded_optional',
  });
});

// 3. Comprehensive Health Status
router.get('/', async (req, res) => {
  const startTime = Date.now();
  let mongoLatencyMs = null;
  let redisLatencyMs = null;

  // Measure Mongo ping
  try {
    if (mongoose.connection.readyState === 1) {
      const mStart = Date.now();
      await mongoose.connection.db.admin().ping();
      mongoLatencyMs = Date.now() - mStart;
    }
  } catch {
    mongoLatencyMs = -1;
  }

  // Measure Redis ping
  try {
    const redis = getRedis();
    if (redis && isRedisAvailable()) {
      const rStart = Date.now();
      await redis.ping();
      redisLatencyMs = Date.now() - rStart;
    }
  } catch {
    redisLatencyMs = -1;
  }

  const isHealthy = mongoose.connection.readyState === 1;
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    durationMs: Date.now() - startTime,
    dependencies: {
      mongodb: {
        status: mongoose.connection.readyState === 1 ? 'up' : 'down',
        latencyMs: mongoLatencyMs,
      },
      redis: {
        status: isRedisAvailable() ? 'up' : 'down_optional',
        latencyMs: redisLatencyMs,
      },
      stripe: {
        configured: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
      },
      email: {
        configured: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
      },
    },
  });
});

export default router;
