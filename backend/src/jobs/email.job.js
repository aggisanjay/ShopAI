import nodemailer from 'nodemailer';
import { createManagedQueue, createManagedWorker } from '../config/bullmq.js';
import logger from '../utils/logger.js';
import { businessEmailFailuresTotal } from '../observability/metrics.js';

const QUEUE_NAME = 'emails';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: parseInt(process.env.SMTP_PORT) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  debug: false,
  logger: false,
});

const templates = {
  welcome: ({ name }) => ({
    subject: 'Welcome to ShopAI! 🎉',
    html: `<h1>Hi ${name || 'there'}!</h1><p>Welcome to ShopAI. Discover smart, curated shopping.</p>`,
  }),
  orderConfirm: (order) => ({
    subject: `Order Confirmed - #${order.orderNumber || ''}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
        <h2 style="color: #0f172a; margin-top: 0;">Order Confirmed! 🎉</h2>
        <p>Hi ${order.shippingAddress?.fullName || 'Customer'},</p>
        <p>Thank you for your order! Your order <strong>#${order.orderNumber || ''}</strong> has been received and is being processed.</p>
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Total Amount:</strong> ₹${order.totalAmount?.toLocaleString?.() || order.totalAmount}</p>
          <p style="margin: 4px 0 0 0;"><strong>Payment Method:</strong> ${order.paymentMethod?.toUpperCase?.() || 'ONLINE'}</p>
        </div>
      </div>
    `,
  }),
  orderDelivered: (order) => ({
    subject: `Your order #${order.orderNumber || ''} has been delivered! 📦`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
        <h2 style="color: #0f172a; margin-top: 0;">Delivered! 📦</h2>
        <p>Hi ${order.shippingAddress?.fullName || 'Customer'},</p>
        <p>Your order <strong>#${order.orderNumber || ''}</strong> has been delivered. We hope you love your purchase!</p>
      </div>
    `,
  }),
  resetPassword: ({ name, resetUrl }) => ({
    subject: 'Reset Your Password',
    html: `<p>Hi ${name || 'User'},</p><p><a href="${resetUrl}">Click here to reset your password</a> (expires in 30 minutes).</p>`,
  }),
  abandonedCart: ({ name, cartUrl }) => ({
    subject: '🛒 You left something behind!',
    html: `<p>Hi ${name || 'there'},</p><p>You left items in your shopping cart. <a href="${cartUrl}">Click here to complete your purchase</a>.</p>`,
  }),
  orderShipped: ({ orderNumber, trackingNumber }) => ({
    subject: `Your order #${orderNumber} has shipped!`,
    html: `<p>Your order has shipped! Tracking number: <strong>${trackingNumber || 'Available in account'}</strong></p>`,
  }),
};

let emailQueue = null;

export const initEmailWorker = async () => {
  try {
    emailQueue = createManagedQueue(QUEUE_NAME, {
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });

    const worker = createManagedWorker(QUEUE_NAME, async (job) => {
      const { to, subject, template, data, html } = job.data;
      const t = template && templates[template] ? templates[template](data || {}) : { subject, html };

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || `ShopAI <${process.env.SMTP_USER || 'no-reply@shopai.com'}>`,
          to,
          subject: t.subject || subject,
          html: t.html || html,
        });
        logger.info(`Email sent successfully → ${to} [${template || 'custom'}]`);
      } catch (err) {
        businessEmailFailuresTotal.inc({ template: template || 'custom' });
        throw err;
      }
    }, { concurrency: 5 });

    logger.info('📧 Email worker ready');
    return worker;
  } catch (err) {
    emailQueue = null;
    logger.warn('📧 Email worker initialization skipped:', err.message);
    return null;
  }
};

/**
 * Add an email job to the queue with idempotency support
 */
export const addEmailJob = async (data, opts = {}) => {
  if (!emailQueue) {
    logger.debug(`[EMAIL SKIP] to=${data.to} template=${data.template}`);
    return;
  }

  // Idempotency: generate deterministic jobId if order-related
  const jobId = opts.jobId || (data.template && data.data?.orderNumber
    ? `email:${data.template}:${data.data.orderNumber}`
    : undefined);

  try {
    await emailQueue.add('send-email', data, {
      jobId,
      ...opts,
    });
  } catch (err) {
    logger.warn(`Failed to enqueue email job: ${err.message}`);
  }
};
