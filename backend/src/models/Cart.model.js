import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: mongoose.Schema.Types.ObjectId,
  variantName: String,
  quantity: { type: Number, required: true, min: 1, max: 100 },
  price: Number, // snapshot at add time
  addedAt: { type: Date, default: Date.now },
}, { _id: true });

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [cartItemSchema],
  couponCode: String,
  couponDiscount: { type: Number, default: 0 },
  lastActivity: { type: Date, default: Date.now },
  isAbandoned: { type: Boolean, default: false },
  abandonedNotifiedAt: Date,
}, { timestamps: true });

cartSchema.index({ user: 1 }, { unique: true });
cartSchema.index({ lastActivity: 1, isAbandoned: 1 });

cartSchema.virtual('totalItems').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

cartSchema.virtual('subtotal').get(function () {
  return this.items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
});

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
