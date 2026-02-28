import { Router } from 'express';
import * as recoController from '../controllers/recommendation.controller.js';
import { authenticate, optionalAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/events', optionalAuth, recoController.trackEvent);
router.get('/trending', recoController.getTrending);
router.get('/related/:productId', recoController.getRelatedProducts);
router.get('/fbt/:productId', recoController.getFrequentlyBoughtTogether);
router.get('/personalized', authenticate, recoController.getPersonalizedRecommendations);
router.get('/collaborative', authenticate, recoController.getCollaborativeRecommendations);

export default router;
