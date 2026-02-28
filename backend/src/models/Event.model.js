import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  sessionId: { type: String, index: true }, // for anonymous users
  type: {
    type: String,
    required: true,
    enum: ['view', 'click', 'add_to_cart', 'remove_from_cart', 'purchase', 'search', 'wishlist', 'review', 'share'],
    index: true,
  },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', index: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  searchQuery: String,
  metadata: {
    source: String, // 'homepage', 'search', 'recommendation', 'category', 'detail'
    position: Number, // position in listing
    price: Number,
    quantity: Number,
  },
  ipAddress: String,
  userAgent: String,
  createdAt: { type: Date, default: Date.now, expires: 90 * 24 * 60 * 60 }, // TTL 90 days
}, { timestamps: false });

// Compound indexes for recommendation queries
eventSchema.index({ user: 1, type: 1, createdAt: -1 });
eventSchema.index({ product: 1, type: 1, createdAt: -1 });
eventSchema.index({ user: 1, product: 1, type: 1 });
eventSchema.index({ createdAt: -1 });

const Event = mongoose.model('Event', eventSchema);
export default Event;
