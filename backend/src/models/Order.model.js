import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  thumbnail: String,
  sku: String,
  variantId: mongoose.Schema.Types.ObjectId,
  variantName: String,
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  comparePrice: Number,
  totalPrice: { type: Number, required: true },
}, { _id: true });

const statusHistorySchema = new mongoose.Schema({
  status: String,
  timestamp: { type: Date, default: Date.now },
  note: String,
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String }, // auto-generated, unique enforced via index

  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],

  // Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'return_requested', 'returned'],
    default: 'pending',
  },
  statusHistory: [statusHistorySchema],

  // Pricing breakdown
  subtotal: { type: Number, required: true },
  shippingCost: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  couponCode: String,

  // Shipping address
  shippingAddress: {
    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },

  // Payment
  paymentMethod: { type: String, enum: ['stripe', 'cod', 'wallet'], default: 'stripe' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  stripePaymentIntentId: String,
  stripeChargeId: String,
  paidAt: Date,

  // Tracking
  trackingNumber: String,
  trackingUrl: String,
  estimatedDelivery: Date,
  deliveredAt: Date,

  // Notes
  customerNote: String,
  adminNote: String,

  // Vendor
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Fraud
  fraudScore: { type: Number, default: 0 },
  ipAddress: String,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

// Auto-generate order number
orderSchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  const date = new Date();
  const prefix = `ORD${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const count = await this.constructor.countDocuments();
  this.orderNumber = `${prefix}${String(count + 1).padStart(6, '0')}`;
  next();
});

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 }, { unique: true, sparse: true });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ 'stripePaymentIntentId': 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ vendor: 1, status: 1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
