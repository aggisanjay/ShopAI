import client from 'prom-client';

// Initialize default recommended Prometheus registry and system metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'shopai_' });

// ─── 1. HTTP Metrics ────────────────────────────────────────────────────────
export const httpRequestsTotal = new client.Counter({
  name: 'shopai_http_requests_total',
  help: 'Total count of HTTP requests processed',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpErrorsTotal = new client.Counter({
  name: 'shopai_http_errors_total',
  help: 'Total count of HTTP request errors',
  labelNames: ['method', 'route', 'error_type'],
  registers: [register],
});

export const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'shopai_http_request_duration_seconds',
  help: 'Histogram of HTTP request durations in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

export const httpTimeoutsTotal = new client.Counter({
  name: 'shopai_http_timeouts_total',
  help: 'Total count of request timeouts',
  registers: [register],
});

export const rateLimitHitsTotal = new client.Counter({
  name: 'shopai_rate_limit_hits_total',
  help: 'Total count of requests rejected by rate limiting',
  labelNames: ['endpoint_group'],
  registers: [register],
});

// ─── 2. Database Metrics ────────────────────────────────────────────────────
export const mongodbConnectedGauge = new client.Gauge({
  name: 'shopai_mongodb_connected',
  help: 'MongoDB connection state (1 connected, 0 disconnected)',
  registers: [register],
});

export const mongodbOperationsTotal = new client.Counter({
  name: 'shopai_mongodb_operations_total',
  help: 'Total MongoDB database operations executed',
  labelNames: ['collection', 'operation'],
  registers: [register],
});

export const mongodbOperationDurationSeconds = new client.Histogram({
  name: 'shopai_mongodb_operation_duration_seconds',
  help: 'MongoDB operation execution time in seconds',
  labelNames: ['collection', 'operation'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2],
  registers: [register],
});

export const mongodbSlowQueriesTotal = new client.Counter({
  name: 'shopai_mongodb_slow_queries_total',
  help: 'Queries taking longer than threshold (e.g. 100ms)',
  labelNames: ['collection', 'operation'],
  registers: [register],
});

export const mongodbQueryErrorsTotal = new client.Counter({
  name: 'shopai_mongodb_query_errors_total',
  help: 'Total MongoDB query errors',
  labelNames: ['collection', 'operation'],
  registers: [register],
});

// ─── 3. Redis Metrics ───────────────────────────────────────────────────────
export const redisConnectedGauge = new client.Gauge({
  name: 'shopai_redis_connected',
  help: 'Redis connection state (1 connected, 0 disconnected)',
  registers: [register],
});

export const redisCacheHitsTotal = new client.Counter({
  name: 'shopai_redis_cache_hits_total',
  help: 'Total Redis cache hits',
  labelNames: ['cache_name'],
  registers: [register],
});

export const redisCacheMissesTotal = new client.Counter({
  name: 'shopai_redis_cache_misses_total',
  help: 'Total Redis cache misses',
  labelNames: ['cache_name'],
  registers: [register],
});

export const redisOperationDurationSeconds = new client.Histogram({
  name: 'shopai_redis_operation_duration_seconds',
  help: 'Duration of Redis commands in seconds',
  labelNames: ['command'],
  buckets: [0.001, 0.002, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25],
  registers: [register],
});

export const redisErrorsTotal = new client.Counter({
  name: 'shopai_redis_errors_total',
  help: 'Total count of Redis errors or operation failures',
  labelNames: ['command'],
  registers: [register],
});

export const redisInvalidationsTotal = new client.Counter({
  name: 'shopai_redis_invalidations_total',
  help: 'Total cache keys or patterns invalidated',
  labelNames: ['namespace'],
  registers: [register],
});

// ─── 4. BullMQ Queue Metrics ────────────────────────────────────────────────
export const bullmqJobsWaiting = new client.Gauge({
  name: 'shopai_bullmq_jobs_waiting',
  help: 'Number of waiting jobs in queue',
  labelNames: ['queue'],
  registers: [register],
});

export const bullmqJobsActive = new client.Gauge({
  name: 'shopai_bullmq_jobs_active',
  help: 'Number of actively running jobs in queue',
  labelNames: ['queue'],
  registers: [register],
});

export const bullmqJobsCompletedTotal = new client.Counter({
  name: 'shopai_bullmq_jobs_completed_total',
  help: 'Total completed jobs in queue',
  labelNames: ['queue'],
  registers: [register],
});

export const bullmqJobsFailedTotal = new client.Counter({
  name: 'shopai_bullmq_jobs_failed_total',
  help: 'Total failed jobs in queue',
  labelNames: ['queue'],
  registers: [register],
});

export const bullmqJobsRetriedTotal = new client.Counter({
  name: 'shopai_bullmq_jobs_retried_total',
  help: 'Total retried jobs in queue',
  labelNames: ['queue'],
  registers: [register],
});

export const bullmqJobsStalledTotal = new client.Counter({
  name: 'shopai_bullmq_jobs_stalled_total',
  help: 'Total stalled jobs detected in queue',
  labelNames: ['queue'],
  registers: [register],
});

export const bullmqJobDurationSeconds = new client.Histogram({
  name: 'shopai_bullmq_job_duration_seconds',
  help: 'Job execution duration in seconds',
  labelNames: ['queue', 'job_name'],
  buckets: [0.05, 0.1, 0.5, 1, 2, 5, 10, 30, 60],
  registers: [register],
});

// ─── 5. Business Metrics ────────────────────────────────────────────────────
export const businessOrdersCreatedTotal = new client.Counter({
  name: 'shopai_orders_created_total',
  help: 'Total number of orders created',
  labelNames: ['payment_method'],
  registers: [register],
});

export const businessPaymentTransactionsTotal = new client.Counter({
  name: 'shopai_payment_transactions_total',
  help: 'Total payment transactions by outcome',
  labelNames: ['status', 'payment_method'],
  registers: [register],
});

export const businessCartAbandonmentTotal = new client.Counter({
  name: 'shopai_cart_abandonment_events_total',
  help: 'Total carts flagged as abandoned',
  registers: [register],
});

export const businessRecommendationImpressionsTotal = new client.Counter({
  name: 'shopai_recommendation_impressions_total',
  help: 'Total recommendation impressions served',
  labelNames: ['strategy'],
  registers: [register],
});

export const businessRecommendationClicksTotal = new client.Counter({
  name: 'shopai_recommendation_clicks_total',
  help: 'Total recommendation item clicks recorded',
  labelNames: ['strategy'],
  registers: [register],
});

export const businessLowStockEventsTotal = new client.Counter({
  name: 'shopai_low_stock_events_total',
  help: 'Count of low stock threshold breaches',
  registers: [register],
});

export const businessEmailFailuresTotal = new client.Counter({
  name: 'shopai_email_failures_total',
  help: 'Count of email sending failures',
  labelNames: ['template'],
  registers: [register],
});

export { register };
