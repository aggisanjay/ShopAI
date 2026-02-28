import recommendationService from '../services/recommendation.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const trackEvent = asyncHandler(async (req, res) => {
  await recommendationService.trackEvent({
    user: req.user?._id,
    sessionId: req.body.sessionId || req.headers['x-session-id'],
    type: req.body.type,
    product: req.body.productId,
    category: req.body.categoryId,
    searchQuery: req.body.searchQuery,
    metadata: req.body.metadata,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
  ApiResponse.success(res, {}, 'Event tracked');
});

export const getRelatedProducts = asyncHandler(async (req, res) => {
  const products = await recommendationService.getRelatedProducts(
    req.params.productId,
    parseInt(req.query.limit) || 10
  );
  ApiResponse.success(res, { products });
});

export const getPersonalizedRecommendations = asyncHandler(async (req, res) => {
  const products = await recommendationService.getPersonalizedRecommendations(
    req.user._id,
    parseInt(req.query.limit) || 20
  );
  ApiResponse.success(res, { products });
});

export const getTrending = asyncHandler(async (req, res) => {
  const products = await recommendationService.getTrendingRecommendations(
    parseInt(req.query.limit) || 20
  );
  ApiResponse.success(res, { products });
});

export const getFrequentlyBoughtTogether = asyncHandler(async (req, res) => {
  const products = await recommendationService.getFrequentlyBoughtTogether(
    req.params.productId,
    parseInt(req.query.limit) || 5
  );
  ApiResponse.success(res, { products });
});

export const getCollaborativeRecommendations = asyncHandler(async (req, res) => {
  const products = await recommendationService.getCollaborativeRecommendations(
    req.user._id,
    parseInt(req.query.limit) || 12
  );
  ApiResponse.success(res, { products });
});
