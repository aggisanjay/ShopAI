import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import Product from '../models/Product.model.js';
import Coupon from '../models/Coupon.model.js';
import { cacheDelPattern } from '../config/redis.js';

const router = Router();
router.use(authenticate, authorize('admin'));

// Bulk product publish/unpublish
router.patch('/products/bulk-status', asyncHandler(async (req, res) => {
  const { ids, isPublished } = req.body;
  await Product.updateMany({ _id: { $in: ids } }, { isPublished });
  await cacheDelPattern('products:*');
  ApiResponse.success(res, {}, `${ids.length} products updated`);
}));

// Coupon management
router.get('/coupons', asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
  ApiResponse.success(res, { coupons });
}));

router.post('/coupons', asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  ApiResponse.created(res, { coupon });
}));

router.patch('/coupons/:id', asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  ApiResponse.success(res, { coupon });
}));

router.delete('/coupons/:id', asyncHandler(async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  ApiResponse.success(res, {}, 'Coupon deleted');
}));

// Low stock alerts
router.get('/low-stock', asyncHandler(async (req, res) => {
  const products = await Product.find({
    $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    isActive: true,
  })
    .select('name thumbnail stock lowStockThreshold sku')
    .sort({ stock: 1 })
    .lean();
  ApiResponse.success(res, { products });
}));

// Cache management
router.post('/cache/clear', asyncHandler(async (req, res) => {
  await cacheDelPattern('shopai:v1:*', 'admin_clear');
  ApiResponse.success(res, {}, 'Cache cleared');
}));

// System Observability & Real-Time Metrics
router.get('/observability', asyncHandler(async (req, res) => {
  const { register } = await import('../observability/metrics.js');
  const mongoose = (await import('mongoose')).default;
  const { getRedis, isRedisAvailable } = await import('../config/redis.js');

  const metricsJson = await register.getMetricsAsJSON();

  const getMetricValue = (name) => {
    const metric = metricsJson.find(m => m.name === name);
    if (!metric) return 0;
    return metric.values.reduce((sum, v) => sum + (v.value || 0), 0);
  };

  const cacheHits = getMetricValue('shopai_redis_cache_hits_total');
  const cacheMisses = getMetricValue('shopai_redis_cache_misses_total');
  const cacheTotal = cacheHits + cacheMisses;
  const cacheHitRatio = cacheTotal > 0 ? Math.round((cacheHits / cacheTotal) * 100) : 100;

  const totalRequests = getMetricValue('shopai_http_requests_total');
  const totalErrors = getMetricValue('shopai_http_errors_total');
  const errorRate = totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(2) : '0.00';
  const rateLimitHits = getMetricValue('shopai_rate_limit_hits_total');

  let mongoLatency = -1;
  try {
    if (mongoose.connection.readyState === 1) {
      const mStart = Date.now();
      await mongoose.connection.db.admin().ping();
      mongoLatency = Date.now() - mStart;
    }
  } catch {}

  let redisLatency = -1;
  try {
    const redis = getRedis();
    if (redis && isRedisAvailable()) {
      const rStart = Date.now();
      await redis.ping();
      redisLatency = Date.now() - rStart;
    }
  } catch {}

  ApiResponse.success(res, {
    summary: {
      uptimeSeconds: Math.round(process.uptime()),
      memoryMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      totalRequests,
      totalErrors,
      errorRate: `${errorRate}%`,
      rateLimitHits,
      cacheHits,
      cacheMisses,
      cacheHitRatio: `${cacheHitRatio}%`,
      mongoLatencyMs: mongoLatency,
      redisLatencyMs: redisLatency,
      mongoConnected: mongoose.connection.readyState === 1,
      redisConnected: isRedisAvailable(),
    },
    metrics: metricsJson,
  });
}));

export default router;
