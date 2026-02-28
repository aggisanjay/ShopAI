import { Router } from 'express';
import { body } from 'express-validator';
import * as productController from '../controllers/product.controller.js';
import { authenticate, authorize, optionalAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

router.get('/', productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/trending', productController.getTrendingProducts);
router.get('/search', optionalAuth, productController.searchProducts);
router.get('/slug/:slug', optionalAuth, productController.getProductBySlug);
router.get('/:id', productController.getProductById);

router.post('/', authenticate, authorize('admin', 'vendor'), [
  body('name').notEmpty().trim(),
  body('price').isFloat({ min: 0 }),
  body('category').notEmpty(),
  body('description').notEmpty(),
  validate,
], productController.createProduct);

router.put('/:id', authenticate, authorize('admin', 'vendor'), productController.updateProduct);
router.delete('/:id', authenticate, authorize('admin'), productController.deleteProduct);

export default router;
