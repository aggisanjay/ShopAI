import { Router } from 'express';
import * as reviewController from '../controllers/review.controller.js';
import { authenticate, optionalAuth } from '../middlewares/auth.middleware.js';

const router = Router({ mergeParams: true });

router.get('/product/:productId', reviewController.getProductReviews);
router.post('/product/:productId', authenticate, reviewController.createReview);
router.patch('/:id', authenticate, reviewController.updateReview);
router.delete('/:id', authenticate, reviewController.deleteReview);
router.post('/:id/helpful', optionalAuth, reviewController.voteHelpful);

export default router;
