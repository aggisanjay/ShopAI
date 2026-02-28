import orderService from '../services/order.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.user._id, req.body);
  ApiResponse.created(res, { order }, 'Order placed successfully');
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const result = await orderService.getUserOrders(req.user._id, req.query);
  ApiResponse.paginated(res, { orders: result.orders }, result.pagination);
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id, req.user._id);
  ApiResponse.success(res, { order });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(req.params.id, req.user._id);
  ApiResponse.success(res, { order }, 'Order cancelled');
});

// Admin
export const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, ...filters } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const Order = (await import('../models/Order.model.js')).default;
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Order.countDocuments(filter),
  ]);

  ApiResponse.paginated(res, { orders }, {
    total, page: parseInt(page), limit: parseInt(limit),
    totalPages: Math.ceil(total / limit),
  });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const order = await orderService.updateOrderStatus(req.params.id, status, note, req.user._id);
  ApiResponse.success(res, { order }, 'Order status updated');
});

export const getAdminOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id);
  ApiResponse.success(res, { order });
});
