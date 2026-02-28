import mongoose from 'mongoose';
import Order from '../models/Order.model.js';
import Cart from '../models/Cart.model.js';
import Product from '../models/Product.model.js';
import Coupon from '../models/Coupon.model.js';
import { ApiError } from '../utils/apiResponse.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.js';
import { addEmailJob } from '../jobs/email.job.js';
import { addAnalyticsJob } from '../jobs/analytics.job.js';

export class OrderService {
  async createOrder(userId, { shippingAddress, paymentMethod, couponCode, note }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Fetch user's cart
      const cart = await Cart.findOne({ user: userId })
        .populate('items.product')
        .session(session);

      if (!cart || cart.items.length === 0) {
        throw ApiError.badRequest('Cart is empty');
      }

      // Validate stock and build order items
      const orderItems = [];
      let subtotal = 0;

      for (const item of cart.items) {
        const product = item.product;
        if (!product || !product.isActive || !product.isPublished) {
          throw ApiError.badRequest(`Product "${product?.name}" is no longer available`);
        }

        const availableStock = product.stock - product.reservedStock;
        if (product.trackInventory && availableStock < item.quantity) {
          throw ApiError.conflict(`Only ${availableStock} units available for "${product.name}"`);
        }

        // Reserve stock atomically
        const updated = await Product.findOneAndUpdate(
          {
            _id: product._id,
            $expr: { $gte: [{ $subtract: ['$stock', '$reservedStock'] }, item.quantity] },
          },
          { $inc: { reservedStock: item.quantity } },
          { new: true, session }
        );

        if (!updated) {
          throw ApiError.conflict(`Insufficient stock for "${product.name}"`);
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

      // Coupon validation
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

          await Coupon.findByIdAndUpdate(coupon._id,
            { $inc: { usageCount: 1 }, $push: { usedBy: userId } },
            { session }
          );
        }
      }

      const shippingCost = subtotal >= 500 ? 0 : 49;
      const taxRate = 0.18;
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = Math.round(taxableAmount * taxRate * 100) / 100;
      const totalAmount = taxableAmount + shippingCost + taxAmount;

      // Create order
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

      // Clear cart
      await Cart.findByIdAndDelete(cart._id, { session });

      await session.commitTransaction();

      // Post-commit side effects: Send confirmation email
      try {
        const User = (await import('../models/User.model.js')).default;
        const user = await User.findById(userId).select('email').lean();
        
        if (user?.email) {
          await addEmailJob({
            to: user.email,
            subject: `Order Confirmed - #${order.orderNumber}`,
            template: 'orderConfirm',
            data: { orderNumber: order.orderNumber, totalAmount: order.totalAmount },
          });
        }
      } catch (emailErr) {
        logger.error('Failed to queue order confirmation email:', emailErr);
      }

      await addAnalyticsJob({ type: 'order_created', orderId: order._id });

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
      throw ApiError.badRequest(`Cannot transition from ${order.status} to ${status}`);
    }

    order.status = status;
    order.statusHistory.push({ status, note, updatedBy: adminId });

    if (status === 'delivered') order.deliveredAt = new Date();

    // Release reserved stock if cancelled
    if (status === 'cancelled' || status === 'returned') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { reservedStock: -item.quantity, ...(status === 'returned' ? { stock: -item.quantity } : {}) },
        });
      }
    }

    // Confirm stock deduction on delivery
    if (status === 'delivered') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity, reservedStock: -item.quantity, purchaseCount: item.quantity },
        });
      }
    }

    await order.save();
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

    // Release reserved stock
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

    order.paymentStatus = 'paid';
    order.stripeChargeId = chargeId;
    order.paidAt = new Date();
    order.status = 'confirmed';
    order.statusHistory.push({ status: 'confirmed', note: 'Payment confirmed' });

    await order.save();
    return order;
  }
}

export default new OrderService();
