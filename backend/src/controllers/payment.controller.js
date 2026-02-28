import paymentService from '../services/payment.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createPaymentIntent = asyncHandler(async (req, res) => {
  const data = await paymentService.createPaymentIntent(req.params.orderId, req.user._id);
  ApiResponse.success(res, data, 'Payment intent created');
});

export const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const result = await paymentService.handleWebhook(req.body, signature);
  res.json(result);
});

export const refundOrder = asyncHandler(async (req, res) => {
  const refund = await paymentService.refundOrder(req.params.orderId, req.body.reason);
  ApiResponse.success(res, { refund }, 'Refund initiated');
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const data = await paymentService.verifyPayment(req.params.orderId, req.user._id);
  ApiResponse.success(res, data, 'Payment verified');
});
