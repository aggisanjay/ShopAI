// order.routes.js
import { Router } from 'express';
import * as orderController from '../controllers/order.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', orderController.createOrder);
router.get('/my', orderController.getMyOrders);
router.get('/my/:id', orderController.getOrderById);
router.patch('/my/:id/cancel', orderController.cancelOrder);

// Admin routes
router.get('/', authorize('admin'), orderController.getAllOrders);
router.get('/:id', authorize('admin'), orderController.getAdminOrderById);
router.patch('/:id/status', authorize('admin'), orderController.updateOrderStatus);

export default router;
