import Category from '../models/Category.model.js';
import { ApiError, ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { cacheGet, cacheSet, cacheDel } from '../config/redis.js';

export const getAllCategories = asyncHandler(async (req, res) => {
  const cacheKey = 'categories:all';
  const cached = await cacheGet(cacheKey);
  if (cached) return ApiResponse.success(res, { categories: cached });

  const categories = await Category.find({ isActive: true })
    .populate('parent', 'name slug')
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  await cacheSet(cacheKey, categories, 3600);
  ApiResponse.success(res, { categories });
});

export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true })
    .populate('parent', 'name slug')
    .lean();
  if (!category) throw ApiError.notFound('Category not found');
  ApiResponse.success(res, { category });
});

export const createCategory = asyncHandler(async (req, res) => {
  if (req.body.parent) {
    const parent = await Category.findById(req.body.parent);
    if (!parent) throw ApiError.notFound('Parent category not found');
    req.body.ancestors = [...parent.ancestors, parent._id];
  }

  const category = await Category.create(req.body);
  await cacheDel('categories:all');
  ApiResponse.created(res, { category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!category) throw ApiError.notFound('Category not found');
  await cacheDel('categories:all');
  ApiResponse.success(res, { category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!category) throw ApiError.notFound('Category not found');
  await cacheDel('categories:all');
  ApiResponse.success(res, {}, 'Category deleted');
});

export const getCategoryTree = asyncHandler(async (req, res) => {
  const cacheKey = 'categories:tree';
  const cached = await cacheGet(cacheKey);
  if (cached) return ApiResponse.success(res, { tree: cached });

  const categories = await Category.find({ isActive: true })
    .select('name slug image icon parent sortOrder productCount')
    .lean();

  const buildTree = (parentId = null) =>
    categories
      .filter(c => (c.parent ? c.parent.toString() : null) === (parentId ? parentId.toString() : null))
      .map(c => ({ ...c, children: buildTree(c._id) }))
      .sort((a, b) => a.sortOrder - b.sortOrder);

  const tree = buildTree();
  await cacheSet(cacheKey, tree, 3600);
  ApiResponse.success(res, { tree });
});
