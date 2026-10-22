import Stripe from 'stripe';
import Order from '../models/Order.model.js';
import Product from '../models/Product.model.js';
import WebhookEvent from '../models/WebhookEvent.model.js';
import orderService from './order.service.js';
import { ApiError } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import { businessPaymentTransactionsTotal } from '../observability/metrics.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export class PaymentService {
  async createPaymentIntent(orderId, userId) {
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) throw ApiError.notFound('Order not found');
    if (order.paymentStatus === 'paid') throw ApiError.conflict('Order already paid');

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalAmount * 100), // convert to smallest currency unit (paise)
      currency: 'inr',
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        userId: userId.toString(),
      },
      payment_method_types: ['card'],
      description: `Order ${order.orderNumber} for ${userId.toString()}`,
    });

    order.stripePaymentIntentId = paymentIntent.id;
    await order.save();

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: order.totalAmount,
    };
  }

  /**
   * Idempotent Stripe webhook handler
   */
  async handleWebhook(rawBody, signature) {
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      logger.error('Stripe webhook signature verification failed:', { error: err.message });
      throw ApiError.badRequest(`Webhook signature error: ${err.message}`);
    }

    // Webhook Deduplication / Idempotency Check
    const existingEvent = await WebhookEvent.findOne({ eventId: event.id });
    if (existingEvent && existingEvent.status === 'processed') {
      logger.info(`Duplicate webhook event skipped: ${event.id} [${event.type}]`);
      return { received: true, deduplicated: true };
    }

    // Record event as processing
    await WebhookEvent.findOneAndUpdate(
      { eventId: event.id },
      { eventId: event.id, type: event.type, status: 'processing', metadata: event.data?.object?.id },
      { upsert: true, new: true }
    );

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;

        case 'charge.dispute.created':
          await this.handleDispute(event.data.object);
          break;

        case 'charge.refunded':
          await this.handleRefund(event.data.object);
          break;

        default:
          logger.debug(`Unhandled Stripe event: ${event.type}`);
      }

      await WebhookEvent.findOneAndUpdate(
        { eventId: event.id },
        { status: 'processed', processedAt: new Date() }
      );

      return { received: true };
    } catch (err) {
      await WebhookEvent.findOneAndUpdate(
        { eventId: event.id },
        { status: 'failed', metadata: { error: err.message } }
      );
      throw err;
    }
  }

  async handlePaymentSuccess(paymentIntent) {
    const order = await Order.findOne({ stripePaymentIntentId: paymentIntent.id });
    if (!order) {
      logger.error(`No order found for payment intent: ${paymentIntent.id}`);
      return;
    }

    const charges = await stripe.charges.list({ payment_intent: paymentIntent.id, limit: 1 });
    const chargeId = charges.data[0]?.id;

    await orderService.confirmPayment(paymentIntent.id, chargeId);
    logger.info(`Payment confirmed for order: ${order.orderNumber}`);
  }

  async handlePaymentFailure(paymentIntent) {
    const order = await Order.findOne({ stripePaymentIntentId: paymentIntent.id });
    if (!order) return;

    if (order.status !== 'cancelled') {
      order.paymentStatus = 'failed';
      order.status = 'cancelled';
      order.statusHistory.push({ status: 'cancelled', note: 'Payment failed via Stripe' });

      // Correctness: Atomically release reserved inventory
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { reservedStock: -item.quantity },
        });
      }

      await order.save();
      businessPaymentTransactionsTotal.inc({ status: 'failed', payment_method: 'stripe' });
      logger.warn(`Payment failed and reserved inventory released for order: ${order.orderNumber}`);
    }
  }

  async handleRefund(charge) {
    const order = await Order.findOne({ stripeChargeId: charge.id });
    if (!order) return;

    order.paymentStatus = 'refunded';
    order.status = 'refunded';
    order.statusHistory.push({ status: 'refunded', note: `Payment refunded: ${charge.amount_refunded / 100}` });
    await order.save();
    businessPaymentTransactionsTotal.inc({ status: 'refunded', payment_method: 'stripe' });
  }

  async handleDispute(charge) {
    const order = await Order.findOne({ stripeChargeId: charge.payment_intent });
    if (!order) return;

    order.adminNote = `Dispute opened: ${charge.id}`;
    order.fraudScore = 100;
    await order.save();
    logger.warn(`Dispute opened for order: ${order.orderNumber}`);
  }

  async refundOrder(orderId, reason = 'requested_by_customer') {
    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');
    if (!order.stripeChargeId) throw ApiError.badRequest('No charge available to refund');

    const refund = await stripe.refunds.create({
      charge: order.stripeChargeId,
      reason,
      metadata: { orderId: order._id.toString(), orderNumber: order.orderNumber },
    });

    return refund;
  }

  async verifyPayment(orderId, userId) {
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) throw ApiError.notFound('Order not found');
    if (order.paymentStatus === 'paid') return order;

    if (!order.stripePaymentIntentId) {
      throw ApiError.badRequest('No payment intent associated with this order');
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      const charges = await stripe.charges.list({ payment_intent: paymentIntent.id, limit: 1 });
      const chargeId = charges.data[0]?.id;

      await orderService.confirmPayment(paymentIntent.id, chargeId);
      logger.info(`Payment verified and confirmed for order: ${order.orderNumber}`);
      return await Order.findById(order._id);
    } else if (paymentIntent.status === 'requires_payment_method' || paymentIntent.status === 'canceled') {
      if (order.status !== 'cancelled') {
        order.paymentStatus = 'failed';
        order.status = 'cancelled';
        order.statusHistory.push({ status: 'cancelled', note: `Payment status: ${paymentIntent.status}` });

        // Release reserved inventory
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { reservedStock: -item.quantity },
          });
        }
        await order.save();
        businessPaymentTransactionsTotal.inc({ status: 'failed', payment_method: 'stripe' });
      }
    }

    return order;
  }
}

export default new PaymentService();
