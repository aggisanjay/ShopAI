import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, lowercase: true },
  description: String,
  image: String,
  icon: String,
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  ancestors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  metaTitle: String,
  metaDescription: String,
  productCount: { type: Number, default: 0 },
}, { timestamps: true });

categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ name: 1 }, { unique: true });
categorySchema.index({ parent: 1, isActive: 1 });
categorySchema.index({ ancestors: 1 });

const Category = mongoose.model('Category', categorySchema);
export default Category;
