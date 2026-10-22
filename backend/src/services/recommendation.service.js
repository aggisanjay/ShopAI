import mongoose from 'mongoose';
import Product from '../models/Product.model.js';
import Event from '../models/Event.model.js';
import Order from '../models/Order.model.js';
import { cacheGet, cacheSet, fetchOrSet } from '../config/redis.js';
import { cacheKeys, CACHE_TTL } from '../config/cacheKeyBuilder.js';
import logger from '../utils/logger.js';
import {
  businessRecommendationImpressionsTotal,
  businessRecommendationClicksTotal,
} from '../observability/metrics.js';

const { Types } = mongoose;

const EVENT_WEIGHTS = {
  purchase: 10,
  add_to_cart: 5,
  wishlist: 4,
  review: 3,
  view: 1,
  click: 0.5,
};

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

export class RecommendationService {
  async trackEvent(data) {
    try {
      if (data.type === 'click' && data.metadata?.source === 'recommendation') {
        businessRecommendationClicksTotal.inc({ strategy: data.metadata?.strategy || 'general' });
      }
      await Event.create(data);
    } catch (err) {
      logger.warn('Event tracking error:', err.message);
    }
  }

  /**
   * Bounded user affinity scoring (capped to 200 most recent interaction events)
   */
  async getUserAffinityMap(userId) {
    const events = await Event.find({
      user: userId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    })
      .select('product type createdAt')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const affinityMap = {};
    for (const event of events) {
      if (!event.product) continue;
      const pid = event.product.toString();
      const weight = EVENT_WEIGHTS[event.type] || 0;

      const daysAgo = (Date.now() - new Date(event.createdAt).getTime()) / (24 * 60 * 60 * 1000);
      const decayFactor = Math.exp(-0.05 * daysAgo);

      affinityMap[pid] = (affinityMap[pid] || 0) + weight * decayFactor;
    }

    return affinityMap;
  }

  async getRelatedProducts(productId, limit = 10) {
    const cacheKey = cacheKeys.recoRelated(productId, limit);
    return fetchOrSet(cacheKey, async () => {
      const sourceProduct = await Product.findById(productId)
        .select('category brand tags price rating contentVector')
        .lean();

      if (!sourceProduct) return [];

      const candidates = await Product.find({
        _id: { $ne: productId },
        category: sourceProduct.category,
        isActive: true,
        isPublished: true,
      })
        .select('_id name thumbnail price comparePrice rating reviewCount category brand tags contentVector')
        .limit(60)
        .lean();

      let scored;
      if (sourceProduct.contentVector?.length > 0) {
        scored = candidates.map(p => ({
          ...p,
          score: cosineSimilarity(sourceProduct.contentVector, p.contentVector),
        }));
      } else {
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

      return results;
    }, CACHE_TTL.RECO_RELATED, 'reco_related');
  }

  async getCollaborativeRecommendations(userId, limit = 12) {
    // Bound user past events
    const userEvents = await Event.find({ user: userId, type: { $in: ['purchase', 'add_to_cart', 'view'] } })
      .select('product')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const userProductIds = [...new Set(userEvents.map(e => e.product?.toString()).filter(Boolean))];
    if (userProductIds.length === 0) return [];

    const objectIds = userProductIds.map(id => new Types.ObjectId(id));

    // Find similar users capped at 10
    const similarUserEvents = await Event.aggregate([
      { $match: { product: { $in: objectIds }, user: { $ne: new Types.ObjectId(userId) } } },
      { $group: { _id: '$user', eventCount: { $sum: 1 } } },
      { $sort: { eventCount: -1 } },
      { $limit: 10 },
    ]);

    const similarUserIds = similarUserEvents.map(u => u._id);
    if (similarUserIds.length === 0) return [];

    const recommendations = await Event.aggregate([
      {
        $match: {
          user: { $in: similarUserIds },
          product: { $nin: objectIds },
          type: { $in: ['purchase', 'add_to_cart'] },
        },
      },
      { $group: { _id: '$product', score: { $sum: 1 } } },
      { $sort: { score: -1 } },
      { $limit: limit },
    ]);

    const productIds = recommendations.map(r => r._id);
    return Product.find({ _id: { $in: productIds }, isActive: true, isPublished: true })
      .select('-embedding -contentVector -costPrice')
      .populate('category', 'name slug')
      .limit(limit)
      .lean();
  }

  /**
   * Deterministic personalized recommendations with cold-start fallback
   */
  async getPersonalizedRecommendations(userId, limit = 20) {
    if (!userId) {
      return this.getTrendingRecommendations(limit);
    }

    const cacheKey = cacheKeys.recoUser(userId, limit);
    return fetchOrSet(cacheKey, async () => {
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

      // Cold start fallback: if user has no history and recommendations are empty
      if (results.length === 0) {
        return this.getTrendingRecommendations(limit);
      }

      businessRecommendationImpressionsTotal.inc({ strategy: 'personalized' });
      return results.slice(0, limit);
    }, CACHE_TTL.RECO_USER, 'reco_personalized');
  }

  async getPersonalContentBased(userId, limit) {
    const affinityMap = await this.getUserAffinityMap(userId);
    const topProductIds = Object.entries(affinityMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id]) => id);

    if (topProductIds.length === 0) return [];

    const topProducts = await Product.find({ _id: { $in: topProductIds } })
      .select('category brand tags')
      .lean();

    const preferredCategories = [...new Set(topProducts.map(p => p.category?.toString()).filter(Boolean))];
    const preferredBrands = [...new Set(topProducts.map(p => p.brand).filter(Boolean))];

    return Product.find({
      _id: { $nin: topProductIds.map(id => new Types.ObjectId(id)) },
      isActive: true,
      isPublished: true,
      category: { $in: preferredCategories },
    })
      .select('-embedding -contentVector -costPrice')
      .sort({ trendingScore: -1 })
      .limit(limit)
      .lean();
  }

  async getTrendingRecommendations(limit = 20) {
    const cacheKey = cacheKeys.recoTrending(limit);
    return fetchOrSet(cacheKey, async () => {
      const products = await Product.find({ isActive: true, isPublished: true })
        .select('-embedding -contentVector -costPrice')
        .sort({ trendingScore: -1, purchaseCount: -1 })
        .limit(limit)
        .lean();

      businessRecommendationImpressionsTotal.inc({ strategy: 'trending' });
      return products;
    }, CACHE_TTL.PRODUCTS_TRENDING, 'reco_trending');
  }

  async getFrequentlyBoughtTogether(productId, limit = 5) {
    const cacheKey = cacheKeys.recoFbt(productId, limit);
    return fetchOrSet(cacheKey, async () => {
      const result = await Order.aggregate([
        {
          $match: {
            'items.product': new Types.ObjectId(productId),
            status: { $in: ['delivered', 'confirmed', 'processing', 'shipped'] },
          },
        },
        { $unwind: '$items' },
        { $match: { 'items.product': { $ne: new Types.ObjectId(productId) } } },
        { $group: { _id: '$items.product', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit },
      ]);

      const productIds = result.map(r => r._id);
      return Product.find({ _id: { $in: productIds }, isActive: true, isPublished: true })
        .select('-embedding -contentVector -costPrice')
        .lean();
    }, CACHE_TTL.RECO_FBT, 'reco_fbt');
  }

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
        },
      },
      { $addFields: { trendingScore: { $add: ['$views', '$carts', '$purchases'] } } },
      { $sort: { trendingScore: -1 } },
      { $limit: 500 },
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

  /**
   * Offline evaluation metrics (Precision@K, Recall@K, NDCG@K)
   */
  evaluateRecommendations(recommendedIds, groundTruthIds, k = 10) {
    const topK = recommendedIds.slice(0, k);
    const truthSet = new Set(groundTruthIds.map(String));

    let hits = 0;
    let dcg = 0;
    let idcg = 0;

    topK.forEach((id, idx) => {
      const isRelevant = truthSet.has(String(id));
      if (isRelevant) {
        hits++;
        dcg += 1 / Math.log2(idx + 2);
      }
    });

    const maxHits = Math.min(k, groundTruthIds.length);
    for (let i = 0; i < maxHits; i++) {
      idcg += 1 / Math.log2(i + 2);
    }

    const precisionAtK = topK.length > 0 ? hits / topK.length : 0;
    const recallAtK = groundTruthIds.length > 0 ? hits / groundTruthIds.length : 0;
    const ndcgAtK = idcg > 0 ? dcg / idcg : 0;

    return {
      k,
      hits,
      precisionAtK: Math.round(precisionAtK * 1000) / 1000,
      recallAtK: Math.round(recallAtK * 1000) / 1000,
      ndcgAtK: Math.round(ndcgAtK * 1000) / 1000,
    };
  }
}

export default new RecommendationService();
