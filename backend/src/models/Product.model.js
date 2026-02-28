import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  name: String, // e.g., "Color", "Size"
  value: String, // e.g., "Red", "XL"
  sku: String,
  price: Number,
  comparePrice: Number,
  stock: { type: Number, default: 0 },
  images: [String],
  barcode: String,
}, { _id: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 500 },
  slug: { type: String, required: true, lowercase: true },
  description: { type: String, required: true },
  shortDescription: String,
  sku: { type: String, unique: true, sparse: true },
  barcode: String,

  // Pricing
  price: { type: Number, required: true, min: 0 },
  comparePrice: { type: Number, min: 0 }, // original/MRP price
  costPrice: { type: Number, min: 0, select: false }, // for margin calc

  // Inventory
  stock: { type: Number, default: 0, min: 0 },
  lowStockThreshold: { type: Number, default: 5 },
  trackInventory: { type: Boolean, default: true },
  allowBackorder: { type: Boolean, default: false },
  reservedStock: { type: Number, default: 0 }, // held by pending orders

  // Taxonomy
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  brand: { type: String, trim: true },
  tags: [{ type: String, trim: true, lowercase: true }],

  // Images & Media
  images: [String],
  thumbnail: String,
  videos: [String],

  // Variants
  hasVariants: { type: Boolean, default: false },
  variants: [variantSchema],

  // Attributes (for filtering)
  attributes: [{
    key: String,
    value: String,
  }],

  // Ratings & Reviews
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  ratingDistribution: {
    1: { type: Number, default: 0 },
    2: { type: Number, default: 0 },
    3: { type: Number, default: 0 },
    4: { type: Number, default: 0 },
    5: { type: Number, default: 0 },
  },

  // AI / Recommendation fields
  embedding: { type: [Number], select: false }, // vector embedding
  contentVector: { type: [Number], select: false }, // TF-IDF-like features
  viewCount: { type: Number, default: 0 },
  purchaseCount: { type: Number, default: 0 },
  cartAddCount: { type: Number, default: 0 },
  trendingScore: { type: Number, default: 0 },

  // Shipping
  weight: Number, // in grams
  dimensions: {
    length: Number, width: Number, height: Number, // in cm
  },
  shippingClass: { type: String, enum: ['standard', 'express', 'heavy', 'fragile'], default: 'standard' },
  freeShipping: { type: Boolean, default: false },

  // Status
  isActive: { type: Boolean, default: true },
  isPublished: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  publishedAt: Date,

  // Vendor
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // SEO
  metaTitle: String,
  metaDescription: String,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual: discount percentage
productSchema.virtual('discountPercentage').get(function () {
  if (this.comparePrice && this.comparePrice > this.price) {
    return Math.round((1 - this.price / this.comparePrice) * 100);
  }
  return 0;
});

// Virtual: available stock
productSchema.virtual('availableStock').get(function () {
  return Math.max(0, this.stock - this.reservedStock);
});

// Indexes
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ category: 1, isActive: 1, isPublished: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ trendingScore: -1 });
productSchema.index({ purchaseCount: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ tags: 1 });
productSchema.index({ vendor: 1 });
productSchema.index(
  { name: 'text', description: 'text', brand: 'text', tags: 'text' },
  { weights: { name: 10, brand: 5, tags: 3, description: 1 }, name: 'product_text_index' }
);

const Product = mongoose.model('Product', productSchema);
export default Product;
