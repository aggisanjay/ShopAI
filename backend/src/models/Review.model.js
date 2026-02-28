import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, trim: true, maxlength: 200 },
  body: { type: String, trim: true, maxlength: 5000 },
  images: [String],
  isVerifiedPurchase: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: true },
  helpfulVotes: { type: Number, default: 0 },
  reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  vendorResponse: {
    body: String,
    respondedAt: Date,
  },
}, { timestamps: true });

// One review per user per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, isApproved: 1, createdAt: -1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ rating: 1 });

// Update product rating after review save/delete
reviewSchema.post('save', async function () {
  const Product = mongoose.model('Product');
  const stats = await mongoose.model('Review').aggregate([
    { $match: { product: this.product, isApproved: true } },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
        dist1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
        dist2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        dist3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        dist4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        dist5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
      }
    }
  ]);

  if (stats.length > 0) {
    const s = stats[0];
    await Product.findByIdAndUpdate(this.product, {
      rating: Math.round(s.avgRating * 10) / 10,
      reviewCount: s.count,
      'ratingDistribution.1': s.dist1,
      'ratingDistribution.2': s.dist2,
      'ratingDistribution.3': s.dist3,
      'ratingDistribution.4': s.dist4,
      'ratingDistribution.5': s.dist5,
    });
  }
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;
