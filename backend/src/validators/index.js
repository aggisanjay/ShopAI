import { body, param, query } from 'express-validator';

export const productCreateValidators = [
  body('name').trim().notEmpty().withMessage('Product name is required').isLength({ max: 500 }),
  body('description').notEmpty().withMessage('Description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('category').isMongoId().withMessage('Valid category ID required'),
  body('stock').optional().isInt({ min: 0 }),
  body('comparePrice').optional().isFloat({ min: 0 }),
];

export const orderCreateValidators = [
  body('shippingAddress').isObject().withMessage('Shipping address required'),
  body('shippingAddress.fullName').notEmpty(),
  body('shippingAddress.phone').notEmpty(),
  body('shippingAddress.addressLine1').notEmpty(),
  body('shippingAddress.city').notEmpty(),
  body('shippingAddress.state').notEmpty(),
  body('shippingAddress.postalCode').notEmpty(),
  body('paymentMethod').isIn(['stripe', 'cod', 'wallet']),
];

export const paginationValidators = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];
