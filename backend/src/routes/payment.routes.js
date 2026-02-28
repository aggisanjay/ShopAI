import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

// Stripe webhook - raw body required
router.post('/webhook', paymentController.handleWebhook);

router.use(authenticate);

router.post('/intent/:orderId', paymentController.createPaymentIntent);
router.post('/verify/:orderId', paymentController.verifyPayment);
router.post('/refund/:orderId', authorize('admin'), paymentController.refundOrder);

export default router;
