import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate,
], authController.register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
], authController.login);

router.post('/refresh', authController.refresh);

router.post('/logout', authenticate, authController.logout);

router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
  validate,
], authController.forgotPassword);

router.post('/reset-password/:token', [
  body('password').isLength({ min: 6 }),
  validate,
], authController.resetPassword);

router.post('/change-password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
  validate,
], authController.changePassword);

router.get('/me', authenticate, authController.getMe);

export default router;
