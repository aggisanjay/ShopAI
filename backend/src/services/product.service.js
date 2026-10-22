import mongoose from 'mongoose';
import Product from '../models/Product.model.js';
import Category from '../models/Category.model.js';
import { ApiError } from '../utils/apiResponse.js';
import { cacheGet, cacheSet, cacheDel, cacheDelPattern } from '../config/redis.js';
import { cacheKeys, CACHE_TTL } from '../config/cacheKeyBuilder.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.js';

export class ProductService {
  async getProducts(query = {}) {
    const { page, limit, skip } = getPagination(query);
    const cacheKey = cacheKeys.productsList(query);

    const cached = await cacheGet(cacheKey, 'products_list');
    if (cached) return cached;

    // Build filter
    const filter = { isActive: true, isPublished: true };

    if (query.category) {
      if (mongoose.Types.ObjectId.isValid(query.category)) {
        filter.category = query.category;
      } else {
        const cat = await Category.findOne({ slug: query.category }).select('_id').lean();
        if (cat) filter.category = cat._id;
        else filter.category = new mongoose.Types.ObjectId(); // Fallback to non-existent ID
      }
    }

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

    // Sort mapping with compound index alignment
    const sortMap = {
      newest: { createdAt: -1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      rating: { rating: -1 },
      trending: { trendingScore: -1, createdAt: -1 },
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

    await cacheSet(cacheKey, result, CACHE_TTL.PRODUCTS_LIST, 'products_list');
    return result;
  }

  async getProductById(id) {
    const cacheKey = cacheKeys.productDetail(id);
    const cached = await cacheGet(cacheKey, 'product_detail');
    if (cached) return cached;

    const product = await Product.findOne({ _id: id, isActive: true })
      .select('-embedding -contentVector -costPrice')
      .populate('category', 'name slug')
      .populate('vendor', 'name')
      .lean();

    if (!product) throw ApiError.notFound('Product not found');

    await cacheSet(cacheKey, product, CACHE_TTL.PRODUCT_DETAIL, 'product_detail');
    return product;
  }

  async getProductBySlug(slug) {
    const cacheKey = cacheKeys.productSlug(slug);
    const cached = await cacheGet(cacheKey, 'product_detail');
    if (cached) return cached;

    const product = await Product.findOne({ slug, isActive: true })
      .select('-embedding -contentVector -costPrice')
      .populate('category', 'name slug ancestors')
      .populate('vendor', 'name')
      .lean();

    if (!product) throw ApiError.notFound('Product not found');

    await cacheSet(cacheKey, product, CACHE_TTL.PRODUCT_DETAIL, 'product_detail');
    return product;
  }

  async createProduct(data) {
    const product = await Product.create(data);

    // Update category product count
    if (data.category) {
      await Category.findByIdAndUpdate(data.category, { $inc: { productCount: 1 } });
    }

    await cacheDelPattern('shopai:v1:products:*', 'products');
    return product;
  }

  async updateProduct(id, data) {
    const product = await Product.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!product) throw ApiError.notFound('Product not found');

    await cacheDel(cacheKeys.productDetail(id), cacheKeys.productSlug(product.slug));
    await cacheDelPattern('shopai:v1:products:*', 'products');
    return product;
  }

  async deleteProduct(id) {
    const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!product) throw ApiError.notFound('Product not found');

    if (product.category) {
      await Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } });
    }

    await cacheDel(cacheKeys.productDetail(id), cacheKeys.productSlug(product.slug));
    await cacheDelPattern('shopai:v1:products:*', 'products');
  }

  async searchProducts(q, options = {}) {
    const { page, limit, skip } = getPagination(options);

    const filter = { $text: { $search: q }, isActive: true, isPublished: true };

    if (options.category) {
      if (mongoose.Types.ObjectId.isValid(options.category)) {
        filter.category = options.category;
      } else {
        const cat = await Category.findOne({ slug: options.category }).select('_id').lean();
        if (cat) filter.category = cat._id;
        else filter.category = new mongoose.Types.ObjectId();
      }
    }

    const [products, total] = await Promise.all([
      Product.find(filter, { score: { $meta: 'textScore' } })
        .select('-embedding -contentVector -costPrice')
        .populate('category', 'name slug')
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return { products, pagination: buildPaginationMeta(total, page, limit) };
  }

  /**
   * Safe view increment: update database counter WITHOUT invalidating product cache
   */
  async incrementViewCount(productId) {
    try {
      await Product.findByIdAndUpdate(productId, { $inc: { viewCount: 1 } });
    } catch {
      // Fire-and-forget; analytics counters should not degrade user read experience
    }
  }

  async updateStock(productId, quantity, session = null) {
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
    const cacheKey = cacheKeys.productsFeatured(limit);
    const cached = await cacheGet(cacheKey, 'products_featured');
    if (cached) return cached;

    const products = await Product.find({ isFeatured: true, isActive: true, isPublished: true })
      .select('-embedding -contentVector -costPrice')
      .limit(limit)
      .lean();

    await cacheSet(cacheKey, products, CACHE_TTL.PRODUCTS_FEATURED, 'products_featured');
    return products;
  }

  async getTrendingProducts(limit = 20) {
    const cacheKey = cacheKeys.productsTrending(limit);
    const cached = await cacheGet(cacheKey, 'products_trending');
    if (cached) return cached;

    const products = await Product.find({ isActive: true, isPublished: true })
      .select('-embedding -contentVector -costPrice')
      .sort({ trendingScore: -1 })
      .limit(limit)
      .lean();

    await cacheSet(cacheKey, products, CACHE_TTL.PRODUCTS_TRENDING, 'products_trending');
    return products;
  }
}

export default new ProductService();