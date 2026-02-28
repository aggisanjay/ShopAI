import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/profile', userController.getProfile);
router.patch('/profile', userController.updateProfile);
router.get('/wishlist', userController.getWishlist);
router.post('/wishlist/:productId', userController.toggleWishlist);
router.post('/addresses', userController.addAddress);
router.patch('/addresses/:addressId', userController.updateAddress);
router.delete('/addresses/:addressId', userController.deleteAddress);

// Admin
router.get('/', authorize('admin'), userController.getAllUsers);
router.patch('/:id/toggle-status', authorize('admin'), userController.toggleUserStatus);

export default router;
