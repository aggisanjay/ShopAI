export const CACHE_PREFIX = 'shopai:v1';

export const CACHE_TTL = {
  PRODUCTS_LIST: 300,        // 5 min
  PRODUCT_DETAIL: 600,       // 10 min
  PRODUCTS_FEATURED: 1800,   // 30 min
  PRODUCTS_TRENDING: 900,    // 15 min
  CATEGORIES: 3600,          // 1 hour
  RECO_RELATED: 3600,        // 1 hour
  RECO_USER: 900,            // 15 min
  RECO_FBT: 3600,            // 1 hour
};

// Canonicalize query parameters to prevent cache key fragmentation
export const canonicalizeParams = (query = {}) => {
  const keys = Object.keys(query).sort();
  const sorted = {};
  for (const k of keys) {
    if (query[k] !== undefined && query[k] !== null && query[k] !== '') {
      sorted[k] = String(query[k]).trim();
    }
  }
  return JSON.stringify(sorted);
};

export const cacheKeys = {
  productsList: (query) => `${CACHE_PREFIX}:products:list:${canonicalizeParams(query)}`,
  productDetail: (id) => `${CACHE_PREFIX}:product:${id}`,
  productSlug: (slug) => `${CACHE_PREFIX}:product:slug:${slug}`,
  productsFeatured: (limit) => `${CACHE_PREFIX}:products:featured:${limit}`,
  productsTrending: (limit) => `${CACHE_PREFIX}:products:trending:${limit}`,
  categoriesList: () => `${CACHE_PREFIX}:categories:all`,
  categoriesTree: () => `${CACHE_PREFIX}:categories:tree`,
  recoRelated: (productId, limit) => `${CACHE_PREFIX}:reco:related:${productId}:${limit}`,
  recoFbt: (productId, limit) => `${CACHE_PREFIX}:reco:fbt:${productId}:${limit}`,
  recoTrending: (limit) => `${CACHE_PREFIX}:reco:trending:${limit}`,
  recoUser: (userId, limit) => `${CACHE_PREFIX}:reco:user:${userId}:${limit}`,
};
