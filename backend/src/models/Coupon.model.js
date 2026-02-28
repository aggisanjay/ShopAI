import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, uppercase: true, trim: true },
  type: { type: String, enum: ['percentage', 'fixed', 'free_shipping'], required: true },
  value: { type: Number, required: true, min: 0 },
  maxDiscount: Number, // cap for percentage discounts
  minOrderAmount: { type: Number, default: 0 },
  usageLimit: Number,
  usageCount: { type: Number, default: 0 },
  userUsageLimit: { type: Number, default: 1 },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  isActive: { type: Boolean, default: true },
  startsAt: Date,
  expiresAt: Date,
  description: String,
}, { timestamps: true });

couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ isActive: 1, expiresAt: 1 });

couponSchema.methods.isValid = function (userId, orderAmount) {
  const now = new Date();
  if (!this.isActive) return { valid: false, reason: 'Coupon is inactive' };
  if (this.expiresAt && now > this.expiresAt) return { valid: false, reason: 'Coupon has expired' };
  if (this.startsAt && now < this.startsAt) return { valid: false, reason: 'Coupon not yet active' };
  if (this.usageLimit && this.usageCount >= this.usageLimit) return { valid: false, reason: 'Coupon usage limit reached' };
  if (orderAmount < this.minOrderAmount) return { valid: false, reason: `Minimum order amount is ₹${this.minOrderAmount}` };
  const userUses = this.usedBy.filter(id => id.toString() === userId.toString()).length;
  if (userUses >= this.userUsageLimit) return { valid: false, reason: 'You have already used this coupon' };
  return { valid: true };
};

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
