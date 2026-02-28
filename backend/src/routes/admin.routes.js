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
  await cacheDelPattern('*');
  ApiResponse.success(res, {}, 'Cache cleared');
}));

export default router;
