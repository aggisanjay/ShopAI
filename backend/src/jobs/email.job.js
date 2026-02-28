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
  orderConfirm: ({ orderNumber, totalAmount }) => ({
    subject: `Order Confirmed #${orderNumber}`,
    html: `<h2>Order #${orderNumber} confirmed!</h2><p>Total: ₹${totalAmount}</p>`,
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
