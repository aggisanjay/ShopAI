import { Queue, Worker } from 'bullmq';
import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

const QUEUE_NAME = 'emails';

const bullConn = () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  tls: process.env.REDIS_HOST?.includes('upstash.io') ? {} : undefined,
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: parseInt(process.env.SMTP_PORT) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  debug: false,
  logger: false,
});

const templates = {
  welcome: ({ name }) => ({
    subject: 'Welcome to ShopAI! 🎉',
    html: `<h1>Hi ${name}!</h1><p>Welcome to ShopAI.</p>`,
  }),
  orderConfirm: (order) => ({
    subject: `Order Confirmed - #${order.orderNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
        <h2 style="color: #0f172a; margin-top: 0;">Order Confirmed! 🎉</h2>
        <p>Hi ${order.shippingAddress.fullName},</p>
        <p>Thank you for your order! Your order <strong>#${order.orderNumber}</strong> has been received and is being processed.</p>
        
        <h3 style="border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-top: 24px;">Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <thead>
            <tr style="text-align: left; color: #64748b; font-size: 14px;">
              <th style="padding: 12px 0;">Item</th>
              <th style="padding: 12px 0; text-align: center;">Qty</th>
              <th style="padding: 12px 10px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 12px 0;">${item.name}</td>
                <td style="padding: 12px 0; text-align: center;">${item.quantity}</td>
                <td style="padding: 12px 10px; text-align: right;">₹${item.totalPrice.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b;">Subtotal</span>
            <span>₹${order.subtotal.toLocaleString()}</span>
          </div>
          ${order.discountAmount ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #10b981;">
            <span>Discount</span>
            <span>-₹${order.discountAmount.toLocaleString()}</span>
          </div>` : ''}
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b;">Shipping</span>
            <span>${order.shippingCost === 0 ? 'FREE' : `₹${order.shippingCost}`}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b;">Tax (GST)</span>
            <span>₹${order.taxAmount.toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 12px; font-weight: bold; font-size: 18px; border-top: 1px solid #e2e8f0; pt: 12px;">
            <span>Total</span>
            <span style="color: #0f172a;">₹${order.totalAmount.toLocaleString()}</span>
          </div>
        </div>
        
        <div style="margin-top: 24px;">
          <h4 style="margin-bottom: 8px;">Shipping Address:</h4>
          <p style="color: #475569; font-size: 14px; margin: 0;">
            ${order.shippingAddress.addressLine1}${order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}<br>
            ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}
          </p>
        </div>
      </div>
    `
  }),
  orderDelivered: (order) => ({
    subject: `Your order #${order.orderNumber} has been delivered! 📦`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
        <h2 style="color: #0f172a; margin-top: 0;">Delivered! 📦</h2>
        <p>Hi ${order.shippingAddress.fullName},</p>
        <p>Great news! Your order <strong>#${order.orderNumber}</strong> has been delivered. We hope you love your purchase!</p>
        
        <h3 style="border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-top: 24px;">Delivery Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tbody>
            ${order.items.map(item => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 12px 0;">${item.name}</td>
                <td style="padding: 12px 0; text-align: center;">× ${item.quantity}</td>
                <td style="padding: 12px 0; text-align: right;">₹${item.totalPrice.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="text-align: center; margin-top: 32px;">
          <p style="color: #64748b; font-size: 14px;">How was your experience? Feel free to leave a review on our website.</p>
        </div>
      </div>
    `
  }),
  resetPassword: ({ name, resetUrl }) => ({
    subject: 'Reset Your Password',
    html: `<p>Hi ${name},</p><p><a href="${resetUrl}">Reset password</a> — expires in 30 min.</p>`,
  }),
  abandonedCart: ({ name, cartUrl }) => ({
    subject: '🛒 You left something behind!',
    html: `<p>Hi ${name},</p><p><a href="${cartUrl}">Complete your purchase</a></p>`,
  }),
  orderShipped: ({ orderNumber, trackingNumber }) => ({
    subject: `Your order #${orderNumber} has shipped!`,
    html: `<p>Tracking: <strong>${trackingNumber}</strong></p>`,
  }),
};

let emailQueue = null;

// Called AFTER connectRedis() — never at module load time
export const initEmailWorker = async () => {
  try {
    emailQueue = new Queue(QUEUE_NAME, {
      connection: bullConn(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });
    emailQueue.on('error', () => {});

    const worker = new Worker(QUEUE_NAME, async (job) => {
      const { to, subject, template, data, html } = job.data;
      const t = template && templates[template] ? templates[template](data || {}) : { subject, html };
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || `ShopAI <${process.env.SMTP_USER}>`,
        to,
        subject: t.subject || subject,
        html: t.html || html,
      });
      logger.info(`Email sent → ${to} [${template || 'custom'}]`);
    }, { connection: bullConn(), concurrency: 5 });

    worker.on('error', () => {});
    worker.on('failed', (job, err) => {
      logger.error(`Email job ${job?.id} failed:`, { message: err.message, stack: err.stack, ...err });
    });
    logger.info('📧 Email worker ready');
    return worker;
  } catch {
    emailQueue = null;
    logger.warn('📧 Email worker skipped');
    return null;
  }
};

export const addEmailJob = async (data, opts = {}) => {
  if (!emailQueue) {
    logger.debug(`[EMAIL SKIP] to=${data.to} template=${data.template}`);
    return;
  }
  try { await emailQueue.add('send-email', data, opts); } catch {}
};
