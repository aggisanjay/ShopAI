import mongoose from 'mongoose';
import Product from '../models/Product.model.js';
import Event from '../models/Event.model.js';
import Order from '../models/Order.model.js';
import { cacheGet, cacheSet } from '../config/redis.js';
import logger from '../utils/logger.js';

const { Types } = mongoose;

// Event weights for affinity scoring
const EVENT_WEIGHTS = {
  purchase: 10,
  add_to_cart: 5,
  wishlist: 4,
  review: 3,
  view: 1,
  click: 0.5,
};

// Cosine similarity between two vectors
const cosineSimilarity = (a, b) => {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] ** 2;
    normB += b[i] ** 2;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
};

// Build a simple content vector from product features
const buildContentVector = (product, allTags, allBrands, categories) => {
  const vec = [];

  // Price bucket (normalized 0-1 in ₹0-50000 range)
  vec.push(Math.min(product.price / 50000, 1));

  // Rating normalized
  vec.push((product.rating || 0) / 5);

  // Category one-hot (top 50)
  const catId = product.category?.toString();
  for (const cat of categories) {
    vec.push(cat === catId ? 1 : 0);
  }

  // Brand one-hot (top 30)
  const brand = (product.brand || '').toLowerCase();
  for (const b of allBrands) {
    vec.push(b === brand ? 1 : 0);
  }

  // Tag membership (top 100 tags)
  const productTags = new Set((product.tags || []).map(t => t.toLowerCase()));
  for (const tag of allTags) {
    vec.push(productTags.has(tag) ? 1 : 0);
  }

  return vec;
};

export class RecommendationService {
  // Track user event
  async trackEvent(data) {
    try {
      await Event.create(data);
    } catch (err) {
      logger.error('Event tracking error:', err);
    }
  }

  // Get user affinity scores: { productId -> score }
  async getUserAffinityMap(userId) {
    const events = await Event.find({
      user: userId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // 30 days
    }).lean();

    const affinityMap = {};
    for (const event of events) {
      if (!event.product) continue;
      const pid = event.product.toString();
      const weight = EVENT_WEIGHTS[event.type] || 0;

      // Apply recency decay (exponential decay over 30 days)
      const daysAgo = (Date.now() - new Date(event.createdAt).getTime()) / (24 * 60 * 60 * 1000);
      const decayFactor = Math.exp(-0.05 * daysAgo);

      affinityMap[pid] = (affinityMap[pid] || 0) + weight * decayFactor;
    }

    return affinityMap;
  }

  // Content-based: products similar to a given product
  async getRelatedProducts(productId, limit = 10) {
    const cacheKey = `reco:related:${productId}:${limit}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const sourceProduct = await Product.findById(productId)
      .select('category brand tags price rating contentVector')
      .lean();

    if (!sourceProduct) return [];

    // Find candidates: same category, published
    const candidates = await Product.find({
      _id: { $ne: productId },
      category: sourceProduct.category,
      isActive: true,
      isPublished: true,
    })
      .select('_id name thumbnail price comparePrice rating reviewCount category brand tags contentVector')
      .limit(100)
      .lean();

    // Score candidates
    let scored;
    if (sourceProduct.contentVector?.length > 0) {
      // Use pre-computed vectors
      scored = candidates.map(p => ({
        ...p,
        score: cosineSimilarity(sourceProduct.contentVector, p.contentVector),
      }));
    } else {
      // Fallback: Jaccard similarity on tags
      const sourceTags = new Set(sourceProduct.tags || []);
      scored = candidates.map(p => {
        const pTags = new Set(p.tags || []);
        const intersection = [...sourceTags].filter(t => pTags.has(t)).length;
        const union = new Set([...sourceTags, ...pTags]).size;
        const tagScore = union > 0 ? intersection / union : 0;
        const brandScore = p.brand === sourceProduct.brand ? 0.3 : 0;
        return { ...p, score: tagScore + brandScore };
      });
    }

    const results = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ contentVector, ...p }) => p);

    await cacheSet(cacheKey, results, 3600); // 1 hour
    return results;
  }

  // Collaborative filtering: what similar users bought
  async getCollaborativeRecommendations(userId, limit = 12) {
    const cacheKey = `reco:collab:${userId}:${limit}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    // Find products this user interacted with
    const userEvents = await Event.find({ user: userId, type: { $in: ['purchase', 'add_to_cart', 'view'] } })
      .select('product')
      .limit(50)
      .lean();

    const userProductIds = [...new Set(userEvents.map(e => e.product?.toString()).filter(Boolean))];
    if (userProductIds.length === 0) return [];

    // Find users who also interacted with these products
    const similarUserEvents = await Event.aggregate([
      { $match: { product: { $in: userProductIds.map(id => new Types.ObjectId(id)) }, user: { $ne: userId } } },
      { $group: { _id: '$user', sharedProducts: { $addToSet: '$product' }, eventCount: { $sum: 1 } } },
      { $sort: { eventCount: -1 } },
      { $limit: 20 },
    ]);

    const similarUserIds = similarUserEvents.map(u => u._id);

    // Find products those users interacted with that current user hasn't seen
    const recommendations = await Event.aggregate([
      {
        $match: {
          user: { $in: similarUserIds },
          product: { $nin: userProductIds.map(id => new Types.ObjectId(id)) },
          type: { $in: ['purchase', 'add_to_cart'] },
        }
      },
      { $group: { _id: '$product', score: { $sum: 1 } } },
      { $sort: { score: -1 } },
      { $limit: limit },
    ]);

    const productIds = recommendations.map(r => r._id);
    const products = await Product.find({ _id: { $in: productIds }, isActive: true, isPublished: true })
      .select('-embedding -contentVector')
      .populate('category', 'name slug')
      .lean();

    await cacheSet(cacheKey, products, 1800); // 30 min
    return products;
  }

  // Hybrid personalized recommendations
  async getPersonalizedRecommendations(userId, limit = 20) {
    const cacheKey = `reco:personalized:${userId}:${limit}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const [contentBased, collaborative, trending] = await Promise.allSettled([
      this.getPersonalContentBased(userId, Math.ceil(limit * 0.5)),
      this.getCollaborativeRecommendations(userId, Math.ceil(limit * 0.3)),
      this.getTrendingRecommendations(Math.ceil(limit * 0.2)),
    ]);

    const seenIds = new Set();
    const results = [];

    const addProducts = (products, weight) => {
      if (!products?.value) return;
      for (const p of products.value) {
        const id = p._id.toString();
        if (!seenIds.has(id)) {
          seenIds.add(id);
          results.push({ ...p, _recoWeight: weight });
        }
      }
    };

    addProducts(contentBased, 0.5);
    addProducts(collaborative, 0.3);
    addProducts(trending, 0.2);

    const final = results.slice(0, limit);
    await cacheSet(cacheKey, final, 900); // 15 min
    return final;
  }

  async getPersonalContentBased(userId, limit) {
    const affinityMap = await this.getUserAffinityMap(userId);
    const topProductIds = Object.entries(affinityMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id]) => id);

    if (topProductIds.length === 0) return [];

    // Get categories/tags from top interacted products
    const topProducts = await Product.find({ _id: { $in: topProductIds } })
      .select('category brand tags')
      .lean();

    const preferredCategories = [...new Set(topProducts.map(p => p.category?.toString()))];
    const preferredBrands = [...new Set(topProducts.map(p => p.brand).filter(Boolean))];
    const preferredTags = [...new Set(topProducts.flatMap(p => p.tags || []))];

    return Product.find({
      _id: { $nin: topProductIds },
      isActive: true,
      isPublished: true,
      $or: [
        { category: { $in: preferredCategories } },
        { brand: { $in: preferredBrands } },
        { tags: { $in: preferredTags } },
      ],
    })
      .select('-embedding -contentVector')
      .sort({ trendingScore: -1 })
      .limit(limit)
      .lean();
  }

  async getTrendingRecommendations(limit = 20) {
    const cacheKey = `reco:trending:${limit}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const products = await Product.find({ isActive: true, isPublished: true })
      .select('-embedding -contentVector')
      .sort({ trendingScore: -1, purchaseCount: -1 })
      .limit(limit)
      .lean();

    await cacheSet(cacheKey, products, 600);
    return products;
  }

  // Frequently bought together (from order data)
  async getFrequentlyBoughtTogether(productId, limit = 5) {
    const cacheKey = `reco:fbt:${productId}:${limit}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const result = await Order.aggregate([
      { $match: { 'items.product': new mongoose.Types.ObjectId(productId), status: { $in: ['delivered', 'confirmed', 'processing', 'shipped'] } } },
      { $unwind: '$items' },
      { $match: { 'items.product': { $ne: new mongoose.Types.ObjectId(productId) } } },
      { $group: { _id: '$items.product', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    const productIds = result.map(r => r._id);
    const products = await Product.find({ _id: { $in: productIds }, isActive: true, isPublished: true })
      .select('-embedding -contentVector')
      .lean();

    await cacheSet(cacheKey, products, 3600);
    return products;
  }

  // Recompute trending scores (called by background job)
  async recomputeTrendingScores() {
    logger.info('Recomputing trending scores...');

    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const events = await Event.aggregate([
      { $match: { createdAt: { $gte: cutoff }, product: { $exists: true } } },
      {
        $group: {
          _id: '$product',
          views: { $sum: { $cond: [{ $eq: ['$type', 'view'] }, 1, 0] } },
          carts: { $sum: { $cond: [{ $eq: ['$type', 'add_to_cart'] }, 5, 0] } },
          purchases: { $sum: { $cond: [{ $eq: ['$type', 'purchase'] }, 10, 0] } },
        }
      },
      { $addFields: { trendingScore: { $add: ['$views', '$carts', '$purchases'] } } },
    ]);

    const bulkOps = events.map(e => ({
      updateOne: {
        filter: { _id: e._id },
        update: { $set: { trendingScore: e.trendingScore } },
      },
    }));

    if (bulkOps.length > 0) {
      await Product.bulkWrite(bulkOps);
    }

    logger.info(`Updated trending scores for ${bulkOps.length} products`);
  }
}

export default new RecommendationService();
