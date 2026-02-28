

import Product from '../models/Product.model.js';
import Category from '../models/Category.model.js';
import { ApiError } from '../utils/apiResponse.js';
import { cacheGet, cacheSet, cacheDel, cacheDelPattern } from '../config/redis.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.js';

export class ProductService {
  async getProducts(query) {
    const { page, limit, skip } = getPagination(query);
    const cacheKey = `products:list:${JSON.stringify(query)}`;

    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    // Build filter
    const filter = { isActive: true, isPublished: true };

    if (query.category) filter.category = query.category;
    if (query.brand) filter.brand = { $regex: query.brand, $options: 'i' };
    if (query.minPrice || query.maxPrice) {
      filter.price = {};
      if (query.minPrice) filter.price.$gte = parseFloat(query.minPrice);
      if (query.maxPrice) filter.price.$lte = parseFloat(query.maxPrice);
    }
    if (query.rating) filter.rating = { $gte: parseFloat(query.rating) };
    if (query.inStock === 'true') filter.stock = { $gt: 0 };
    if (query.isFeatured === 'true') filter.isFeatured = true;
    if (query.tags) filter.tags = { $in: query.tags.split(',') };

    // Full-text search
    if (query.q) {
      filter.$text = { $search: query.q };
    }

    // Sort
    const sortMap = {
      newest: { createdAt: -1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      rating: { rating: -1 },
      trending: { trendingScore: -1 },
      popular: { purchaseCount: -1 },
    };
    const sort = sortMap[query.sort] || { trendingScore: -1, createdAt: -1 };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select('-embedding -contentVector -costPrice')
        .populate('category', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    const result = {
      products,
      pagination: buildPaginationMeta(total, page, limit),
    };

    await cacheSet(cacheKey, result, 300); // 5 min cache
    return result;
  }

  async getProductById(id) {
    const cacheKey = `product:${id}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const product = await Product.findOne({ _id: id, isActive: true })
      .select('-embedding -contentVector -costPrice')
      .populate('category', 'name slug')
      .populate('vendor', 'name')
      .lean();

    if (!product) throw ApiError.notFound('Product not found');

    await cacheSet(cacheKey, product, 600); // 10 min
    return product;
  }

  async getProductBySlug(slug) {
    const cacheKey = `product:slug:${slug}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const product = await Product.findOne({ slug, isActive: true })
      .select('-embedding -contentVector -costPrice')
      .populate('category', 'name slug ancestors')
      .populate('vendor', 'name')
      .lean();

    if (!product) throw ApiError.notFound('Product not found');

    await cacheSet(cacheKey, product, 600);
    return product;
  }

  async createProduct(data) {
    const product = await Product.create(data);

    // Update category product count
    await Category.findByIdAndUpdate(data.category, { $inc: { productCount: 1 } });

    await cacheDelPattern('products:list:*');
    return product;
  }

  async updateProduct(id, data) {
    const product = await Product.findByIdAndUpdate(id, data, {
      new: true, runValidators: true,
    });
    if (!product) throw ApiError.notFound('Product not found');

    await cacheDel(`product:${id}`, `product:slug:${product.slug}`);
    await cacheDelPattern('products:list:*');
    return product;
  }

  async deleteProduct(id) {
    const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!product) throw ApiError.notFound('Product not found');

    await Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } });
    await cacheDel(`product:${id}`, `product:slug:${product.slug}`);
    await cacheDelPattern('products:list:*');
  }

  async searchProducts(q, options = {}) {
    const { page, limit, skip } = getPagination(options);

    const filter = { $text: { $search: q }, isActive: true, isPublished: true };

    const [products, total] = await Promise.all([
      Product.find(filter, { score: { $meta: 'textScore' } })
        .select('-embedding -contentVector')
        .populate('category', 'name slug')
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return { products, pagination: buildPaginationMeta(total, page, limit) };
  }

  async incrementViewCount(productId) {
    await Product.findByIdAndUpdate(productId, { $inc: { viewCount: 1 } });
    await cacheDel(`product:${productId}`);
  }

  async updateStock(productId, quantity, session = null) {
    // Atomic stock decrement with MongoDB findOneAndUpdate
    const product = await Product.findOneAndUpdate(
      {
        _id: productId,
        $expr: { $gte: [{ $subtract: ['$stock', '$reservedStock'] }, quantity] },
      },
      { $inc: { reservedStock: quantity } },
      { new: true, session }
    );

    if (!product) {
      throw ApiError.conflict('Insufficient stock for product');
    }

    return product;
  }

  async getFeaturedProducts(limit = 12) {
    const cacheKey = `products:featured:${limit}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const products = await Product.find({ isFeatured: true, isActive: true, isPublished: true })
      .select('-embedding -contentVector')
      .limit(limit)
      .lean();

    await cacheSet(cacheKey, products, 1800); // 30 min
    return products;
  }

  async getTrendingProducts(limit = 20) {
    const cacheKey = `products:trending:${limit}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const products = await Product.find({ isActive: true, isPublished: true })
      .select('-embedding -contentVector')
      .sort({ trendingScore: -1 })
      .limit(limit)
      .lean();

    await cacheSet(cacheKey, products, 900); // 15 min
    return products;
  }
}

export default new ProductService();