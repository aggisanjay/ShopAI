import Order from '../models/Order.model.js';
import Product from '../models/Product.model.js';
import User from '../models/User.model.js';
import Event from '../models/Event.model.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { cacheGet, cacheSet } from '../config/redis.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const cacheKey = 'analytics:dashboard';
  const cached = await cacheGet(cacheKey);
  if (cached) return ApiResponse.success(res, cached);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalRevenue,
    monthRevenue,
    lastMonthRevenue,
    totalOrders,
    monthOrders,
    totalUsers,
    newUsers,
    lowStockProducts,
  ] = await Promise.all([
    Order.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    Order.aggregate([{ $match: { paymentStatus: 'paid', createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    Order.aggregate([{ $match: { paymentStatus: 'paid', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Product.countDocuments({ $expr: { $lte: ['$stock', '$lowStockThreshold'] }, isActive: true }),
  ]);

  const stats = {
    revenue: {
      total: totalRevenue[0]?.total || 0,
      thisMonth: monthRevenue[0]?.total || 0,
      lastMonth: lastMonthRevenue[0]?.total || 0,
      growth: lastMonthRevenue[0]?.total
        ? (((monthRevenue[0]?.total || 0) - lastMonthRevenue[0].total) / lastMonthRevenue[0].total * 100).toFixed(1)
        : 0,
    },
    orders: { total: totalOrders, thisMonth: monthOrders },
    users: { total: totalUsers, newThisMonth: newUsers },
    inventory: { lowStockCount: lowStockProducts },
  };

  await cacheSet(cacheKey, stats, 300); // 5 min
  ApiResponse.success(res, stats);
});

export const getSalesChart = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const data = await Order.aggregate([
    { $match: { paymentStatus: 'paid', createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 },
      }
    },
    { $sort: { _id: 1 } },
  ]);

  ApiResponse.success(res, { chart: data });
});

export const getTopProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: true })
    .sort({ purchaseCount: -1, rating: -1 })
    .limit(10)
    .select('name thumbnail price purchaseCount rating reviewCount')
    .lean();

  ApiResponse.success(res, { products });
});

export const getRecentOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate('user', 'name email avatar')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  ApiResponse.success(res, { orders });
});
