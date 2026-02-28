import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate, authorize('admin'));

router.get('/dashboard', analyticsController.getDashboardStats);
router.get('/sales-chart', analyticsController.getSalesChart);
router.get('/top-products', analyticsController.getTopProducts);
router.get('/recent-orders', analyticsController.getRecentOrders);

export default router;
