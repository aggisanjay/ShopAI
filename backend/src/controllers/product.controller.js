import productService from '../services/product.service.js';
import recommendationService from '../services/recommendation.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getProducts = asyncHandler(async (req, res) => {
  const result = await productService.getProducts(req.query);
  ApiResponse.paginated(res, { products: result.products }, result.pagination);
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await productService.getProductBySlug(req.params.slug);

  // Track view event
  if (req.user || req.headers['x-session-id']) {
    recommendationService.trackEvent({
      user: req.user?._id,
      sessionId: req.headers['x-session-id'],
      type: 'view',
      product: product._id,
      category: product.category?._id,
      metadata: { source: req.query.source || 'direct', price: product.price },
    });
    productService.incrementViewCount(product._id);
  }

  ApiResponse.success(res, { product });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  ApiResponse.success(res, { product });
});

export const searchProducts = asyncHandler(async (req, res) => {
  const { q, ...options } = req.query;
  if (!q?.trim()) return ApiResponse.success(res, { products: [], pagination: {} });

  // Track search event
  if (req.user) {
    recommendationService.trackEvent({
      user: req.user._id,
      type: 'search',
      searchQuery: q,
    });
  }

  const result = await productService.searchProducts(q, options);
  ApiResponse.paginated(res, { products: result.products }, result.pagination);
});

export const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await productService.getFeaturedProducts(parseInt(req.query.limit) || 12);
  ApiResponse.success(res, { products });
});

export const getTrendingProducts = asyncHandler(async (req, res) => {
  const products = await productService.getTrendingProducts(parseInt(req.query.limit) || 20);
  ApiResponse.success(res, { products });
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct({
    ...req.body,
    vendor: req.user.role === 'vendor' ? req.user._id : req.body.vendor,
  });
  ApiResponse.created(res, { product }, 'Product created');
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  ApiResponse.success(res, { product }, 'Product updated');
});

export const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id);
  ApiResponse.success(res, {}, 'Product deleted');
});
