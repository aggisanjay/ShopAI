import Review from '../models/Review.model.js';
import Order from '../models/Order.model.js';
import { ApiError } from '../utils/apiResponse.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.js';

export const getProductReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { rating, sort = 'newest' } = req.query;

  const filter = { product: req.params.productId, isApproved: true };
  if (rating) filter.rating = parseInt(rating);

  const sortMap = {
    newest: { createdAt: -1 },
    helpful: { helpfulVotes: -1 },
    highest: { rating: -1 },
    lowest: { rating: 1 },
  };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name avatar')
      .sort(sortMap[sort])
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
  ]);

  ApiResponse.paginated(res, { reviews }, buildPaginationMeta(total, page, limit));
});

export const createReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, title, body, images } = req.body;

  // Check if user has purchased this product
  const order = await Order.findOne({
    user: req.user._id,
    'items.product': productId,
    status: 'delivered',
  });

  const existing = await Review.findOne({ product: productId, user: req.user._id });
  if (existing) throw ApiError.conflict('You have already reviewed this product');

  const review = await Review.create({
    product: productId,
    user: req.user._id,
    order: order?._id,
    rating,
    title,
    body,
    images,
    isVerifiedPurchase: !!order,
  });

  await review.populate('user', 'name avatar');
  ApiResponse.created(res, { review }, 'Review submitted');
});

export const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, user: req.user._id });
  if (!review) throw ApiError.notFound('Review not found');

  Object.assign(review, req.body);
  await review.save();

  ApiResponse.success(res, { review }, 'Review updated');
});

export const deleteReview = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.user.role !== 'admin') filter.user = req.user._id;

  const review = await Review.findOneAndDelete(filter);
  if (!review) throw ApiError.notFound('Review not found');

  ApiResponse.success(res, {}, 'Review deleted');
});

export const voteHelpful = asyncHandler(async (req, res) => {
  await Review.findByIdAndUpdate(req.params.id, { $inc: { helpfulVotes: 1 } });
  ApiResponse.success(res, {}, 'Voted as helpful');
});
