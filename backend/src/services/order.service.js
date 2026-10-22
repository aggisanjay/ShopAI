import mongoose from 'mongoose';
import Order from '../models/Order.model.js';
import Cart from '../models/Cart.model.js';
import Product from '../models/Product.model.js';
import Coupon from '../models/Coupon.model.js';
import { ApiError } from '../utils/apiResponse.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.js';
import { addEmailJob } from '../jobs/email.job.js';
import { addAnalyticsJob } from '../jobs/analytics.job.js';
import logger from '../utils/logger.js';
import {
  businessOrdersCreatedTotal,
  businessPaymentTransactionsTotal,
  businessLowStockEventsTotal,
} from '../observability/metrics.js';

export class OrderService {
  async createOrder(userId, { shippingAddress, paymentMethod = 'stripe', couponCode, note }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Fetch user's cart inside transaction
      const cart = await Cart.findOne({ user: userId })
        .populate('items.product')
        .session(session);

      if (!cart || cart.items.length === 0) {
        throw ApiError.badRequest('Cart is empty');
      }

      const orderItems = [];
      let subtotal = 0;

      for (const item of cart.items) {
        const product = item.product;
        if (!product || !product.isActive || !product.isPublished) {
          throw ApiError.badRequest(`Product "${product?.name || 'Item'}" is no longer available`);
        }

        const availableStock = product.stock - product.reservedStock;
        if (product.trackInventory && availableStock < item.quantity) {
          throw ApiError.conflict(`Only ${Math.max(0, availableStock)} units available for "${product.name}"`);
        }

        // Atomically reserve stock inside the transaction
        const updated = await Product.findOneAndUpdate(
          {
            _id: product._id,
            $expr: { $gte: [{ $subtract: ['$stock', '$reservedStock'] }, item.quantity] },
          },
          { $inc: { reservedStock: item.quantity } },
          { new: true, session }
        );

        if (!updated) {
          throw ApiError.conflict(`Insufficient stock available for "${product.name}"`);
        }

        // Check low stock threshold
        if (updated.stock - updated.reservedStock <= updated.lowStockThreshold) {
          businessLowStockEventsTotal.inc();
        }

        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
          product: product._id,
          name: product.name,
          thumbnail: product.thumbnail,
          sku: product.sku,
          quantity: item.quantity,
          price: product.price,
          comparePrice: product.comparePrice,
          totalPrice: itemTotal,
        });
      }

      // Authoritative server-side coupon validation
      let discountAmount = 0;
      if (couponCode) {
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() }).session(session);
        if (coupon) {
          const validity = coupon.isValid(userId, subtotal);
          if (!validity.valid) throw ApiError.badRequest(validity.reason);

          if (coupon.type === 'percentage') {
            discountAmount = Math.min((subtotal * coupon.value) / 100, coupon.maxDiscount || Infinity);
          } else if (coupon.type === 'fixed') {
            discountAmount = Math.min(coupon.value, subtotal);
          }

          await Coupon.findByIdAndUpdate(
            coupon._id,
            { $inc: { usageCount: 1 }, $push: { usedBy: userId } },
            { session }
          );
        }
      }

      // Authoritative pricing calculation
      const shippingCost = subtotal >= 500 ? 0 : 49;
      const taxRate = 0.18;
      const taxableAmount = Math.max(0, subtotal - discountAmount);
      const taxAmount = Math.round(taxableAmount * taxRate * 100) / 100;
      const totalAmount = Math.round((taxableAmount + shippingCost + taxAmount) * 100) / 100;

      // Create order document
      const [order] = await Order.create([{
        user: userId,
        items: orderItems,
        subtotal,
        shippingCost,
        taxAmount,
        discountAmount,
        totalAmount,
        shippingAddress,
        paymentMethod,
        couponCode,
        customerNote: note,
        status: 'pending',
        paymentStatus: 'pending',
        statusHistory: [{ status: 'pending', note: 'Order placed' }],
      }], { session });

      // Clear user cart
      await Cart.findByIdAndDelete(cart._id, { session });

      await session.commitTransaction();

      businessOrdersCreatedTotal.inc({ payment_method: paymentMethod });

      // Post-commit side effects: Send order confirmation email with idempotent key
      try {
        const User = (await import('../models/User.model.js')).default;
        const user = await User.findById(userId).select('email name').lean();

        if (user?.email) {
          await addEmailJob(
            {
              to: user.email,
              template: 'orderConfirm',
              data: {
                ...order.toObject(),
                shippingAddress: {
                  ...order.shippingAddress,
                  fullName: order.shippingAddress?.fullName || user.name,
                },
              },
            },
            { jobId: `order-confirm:${order.orderNumber}` }
          );
        }
      } catch (emailErr) {
        logger.warn('Failed to queue order confirmation email:', emailErr.message);
      }

      await addAnalyticsJob({ type: 'order_created', orderId: order._id, totalAmount });
      return order;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getUserOrders(userId, query) {
    const { page, limit, skip } = getPagination(query);
    const filter = { user: userId };
    if (query.status) filter.status = query.status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .select('-statusHistory -stripeChargeId -ipAddress')
        .populate('items.product', 'name thumbnail slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return { orders, pagination: buildPaginationMeta(total, page, limit) };
  }

  async getOrderById(orderId, userId = null) {
    const filter = { _id: orderId };
    if (userId) filter.user = userId;

    const order = await Order.findOne(filter)
      .populate('items.product', 'name thumbnail slug sku')
      .populate('user', 'name email')
      .lean();

    if (!order) throw ApiError.notFound('Order not found');
    return order;
  }

  async updateOrderStatus(orderId, status, note, adminId) {
    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');

    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: ['return_requested'],
      return_requested: ['returned', 'delivered'],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      throw ApiError.badRequest(`Cannot transition order from "${order.status}" to "${status}"`);
    }

    const previousStatus = order.status;
    order.status = status;
    order.statusHistory.push({ status, note, updatedBy: adminId });

    if (status === 'delivered') order.deliveredAt = new Date();

    // Correct stock transitions:
    // 1. Cancelled before delivery: release reserved stock
    if (status === 'cancelled' && ['pending', 'confirmed', 'processing'].includes(previousStatus)) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { reservedStock: -item.quantity },
        });
      }
    }

    // 2. Delivered: deduct physical stock and decrement reservedStock
    if (status === 'delivered') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity, reservedStock: -item.quantity, purchaseCount: item.quantity },
        });
      }
    }

    // 3. Returned after delivery: return physical stock to warehouse inventory
    if (status === 'returned' && ['return_requested', 'delivered'].includes(previousStatus)) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity, purchaseCount: -item.quantity },
        });
      }
    }

    await order.save();

    // Email on delivery
    if (status === 'delivered') {
      try {
        const User = (await import('../models/User.model.js')).default;
        const user = await User.findById(order.user).select('email').lean();
        if (user?.email) {
          await addEmailJob({
            to: user.email,
            template: 'orderDelivered',
            data: order.toObject(),
          }, { jobId: `order-delivered:${order.orderNumber}` });
        }
      } catch (err) {
        logger.warn('Failed to queue delivery email:', err.message);
      }
    }

    return order;
  }

  async cancelOrder(orderId, userId) {
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) throw ApiError.notFound('Order not found');
    if (!['pending', 'confirmed'].includes(order.status)) {
      throw ApiError.badRequest('Order cannot be cancelled at this stage');
    }

    order.status = 'cancelled';
    order.statusHistory.push({ status: 'cancelled', note: 'Cancelled by user' });

    // Atomically release reserved stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { reservedStock: -item.quantity },
      });
    }

    await order.save();
    return order;
  }

  async confirmPayment(paymentIntentId, chargeId) {
    const order = await Order.findOne({ stripePaymentIntentId: paymentIntentId });
    if (!order) throw ApiError.notFound('Order not found for payment intent');

    // Idempotency check: if already confirmed/paid, return order immediately
    if (order.paymentStatus === 'paid' && order.status !== 'pending') {
      return order;
    }

    order.paymentStatus = 'paid';
    order.stripeChargeId = chargeId;
    order.paidAt = new Date();
    order.status = 'confirmed';
    order.statusHistory.push({ status: 'confirmed', note: 'Payment confirmed via Stripe' });

    await order.save();
    businessPaymentTransactionsTotal.inc({ status: 'succeeded', payment_method: order.paymentMethod });
    return order;
  }
}

export default new OrderService();
