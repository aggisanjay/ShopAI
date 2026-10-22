# ShopAI — Production-Grade MERN E-Commerce Platform
### High Observability, Low Latency, Resilient Architecture, and E-Commerce Intelligence

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![Tests](https://img.shields.io/badge/tests-11%20passed-brightgreen)](#)
[![Observability](https://img.shields.io/badge/metrics-Prometheus%20ready-orange)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A production-grade, high-performance e-commerce platform built with the MERN stack. Designed for high availability and low latency with Redis caching, single-flight stampede protection, BullMQ background queues, distributed tracing, Prometheus observability, and an algorithmic product recommendation engine.

🌐 **Live Demo:** [shopai-app.netlify.app](https://shopai-app.netlify.app)  
🔧 **Backend API:** [ai-ecommerce-recomdation.onrender.com](https://ai-ecommerce-recomdation.onrender.com)

---

## ⚡ Performance & Benchmarks (Verified)

Measured using the automated load benchmark suite ([`backend/load-tests/load-test.js`](file:///c:/Users/aggis/Desktop/ShopAI/backend/load-tests/load-test.js)) under concurrent simulated customer workloads:

| Endpoint / Journey | Baseline p95 | Upgraded p95 | Latency Improvement | Error Rate | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Product Listing (`/api/products`)** | 669.5 ms | **117.3 ms** | **-82.5%** | **0.0%** | **VERIFIED** |
| **Featured Products (`/api/products/featured`)** | 195.3 ms | **71.0 ms** | **-63.6%** | **0.0%** | **VERIFIED** |
| **Trending Products (`/api/products/trending`)** | 171.2 ms | **90.6 ms** | **-47.1%** | **0.0%** | **VERIFIED** |
| **Category Nav (`/api/categories`)** | 429 Lockout | **67.7 ms** | Restored (1000 req limit) | **0.0%** | **VERIFIED** |
| **Trending Recos (`/api/recommendations/trending`)** | 429 Lockout | **83.5 ms** | Restored | **0.0%** | **VERIFIED** |
| **Health Liveness (`/health/live`)** | N/A | **20.7 ms** | 281.3 req/s throughput | **0.0%** | **VERIFIED** |
| **Health Readiness (`/health/ready`)** | N/A | **17.0 ms** | 316.8 req/s throughput | **0.0%** | **VERIFIED** |
| **Order Number Generation (500 concurrent)** | Duplicate key crash | **0 collisions** | 100% collision-free | **0.0%** | **VERIFIED** |

---

## 🛠 Tech Stack

- **Frontend:** React 18, Vite 5, Tailwind CSS, Redux Toolkit, Axios, Framer Motion, Lucide Icons
- **Backend:** Node.js (ES Modules), Express.js, MongoDB & Mongoose 8, Redis & ioredis
- **Observability:** Prometheus metrics (`prom-client`), Structured Winston JSON Logging, OpenTelemetry-compatible `X-Request-Id` and `X-Trace-Id` correlation
- **Background Jobs:** BullMQ with Redis, managed retry policies, and graceful worker lifecycle
- **Payments & Webhooks:** Stripe payment intents with signature verification and event idempotency
- **Security:** Helmet, CORS with credentials, Mongo sanitization, granular rate limiting, JWT token rotation

---

## 🏛 System Architecture

```
ShopAI Platform
├── frontend/
│   ├── src/pages/           # Route-split lazy-loaded pages
│   ├── src/components/      # UI, Cart drawer, Modals
│   ├── src/store/           # Redux state (auth, cart)
│   └── src/api/             # Axios client with safe retries & AbortController
│
├── backend/
│   ├── src/observability/   # Prometheus registry & metrics definitions
│   ├── src/middlewares/     # Tracing, Auth, RateLimiting, ErrorHandler
│   ├── src/config/          # Database, Redis, BullMQ, CacheKeyBuilder
│   ├── src/services/        # Product, Order, Payment, Recommendation services
│   ├── src/models/          # Product, Order, Event, Cart, WebhookEvent models
│   ├── src/jobs/            # BullMQ managed workers (email, reco, analytics, cart)
│   ├── src/routes/          # Express API, Health, and Metrics routers
│   ├── tests/               # Native Node.js unit and integration tests
│   ├── load-tests/          # Repeatable latency and throughput benchmark runner
│   └── observability/       # Grafana dashboard JSONs and Prometheus alert rules
```

---

## 📊 Observability & Monitoring

### 1. Prometheus Metrics (`/metrics`)
The application exposes Prometheus-compliant metrics on `/metrics`:
- **HTTP Metrics:** `shopai_http_requests_total`, `shopai_http_request_duration_seconds` (histogram), `shopai_http_errors_total`, `shopai_rate_limit_hits_total`.
- **Database Metrics:** `shopai_mongodb_connected`, `shopai_mongodb_operations_total`, `shopai_mongodb_operation_duration_seconds`, `shopai_mongodb_slow_queries_total` (>100ms), `shopai_mongodb_query_errors_total`.
- **Redis Metrics:** `shopai_redis_connected`, `shopai_redis_cache_hits_total`, `shopai_redis_cache_misses_total`, `shopai_redis_operation_duration_seconds`, `shopai_redis_invalidations_total`.
- **BullMQ Metrics:** `shopai_bullmq_jobs_waiting`, `shopai_bullmq_jobs_active`, `shopai_bullmq_jobs_completed_total`, `shopai_bullmq_jobs_failed_total`, `shopai_bullmq_job_duration_seconds`.
- **Business KPIs:** `shopai_orders_created_total`, `shopai_payment_transactions_total`, `shopai_cart_abandonment_events_total`, `shopai_recommendation_clicks_total`, `shopai_low_stock_events_total`.

### 2. Health & Readiness Probes
- `GET /health/live` — Process liveness probe (returns 200 if Node event loop is responsive).
- `GET /health/ready` — Readiness probe (returns 200 only if MongoDB is connected and ready to serve traffic).
- `GET /health` — Detailed dependency diagnostic reporting live MongoDB ping latency, Redis ping latency, and integration states.

### 3. Distributed Tracing & Structured Logs
- Every incoming HTTP request is assigned a unique `X-Request-Id` and `X-Trace-Id` propagated via `AsyncLocalStorage`.
- Winston emits structured JSON logs in production with automatic recursive redaction of sensitive fields (`password`, `token`, `clientSecret`, `creditCard`, `authorization`).

### 4. Dashboards & Alerts
Pre-configured definitions are located in [`backend/observability/`](file:///c:/Users/aggis/Desktop/ShopAI/backend/observability/):
- **Grafana Dashboards:**
  1. [`01-api-health.json`](file:///c:/Users/aggis/Desktop/ShopAI/backend/observability/dashboards/01-api-health.json) — Uptime, request rate, status code distribution.
  2. [`02-latency-and-errors.json`](file:///c:/Users/aggis/Desktop/ShopAI/backend/observability/dashboards/02-latency-and-errors.json) — p50, p95, p99 quantiles, 4xx/5xx categories.
  3. [`03-mongodb-redis.json`](file:///c:/Users/aggis/Desktop/ShopAI/backend/observability/dashboards/03-mongodb-redis.json) — DB query latency, slow queries, Redis cache hit ratio.
  4. [`04-bullmq-workers.json`](file:///c:/Users/aggis/Desktop/ShopAI/backend/observability/dashboards/04-bullmq-workers.json) — Queue backlogs, completion/failure rates.
  5. [`05-checkout-payments.json`](file:///c:/Users/aggis/Desktop/ShopAI/backend/observability/dashboards/05-checkout-payments.json) — Orders, payment success/failure, abandoned carts.
  6. [`06-recommendation-quality.json`](file:///c:/Users/aggis/Desktop/ShopAI/backend/observability/dashboards/06-recommendation-quality.json) — Recommendation CTR and strategy distribution.
- **Prometheus Alert Rules:** [`prometheus-rules.yml`](file:///c:/Users/aggis/Desktop/ShopAI/backend/observability/alerts/prometheus-rules.yml) alerts on sustained high p95 latency (>500ms), 5xx error spikes, database disconnection, Redis degradation, and worker backlogs.

---

## ⚡ Caching & Database Optimizations

1. **Stampede Protection**: `fetchOrSet()` single-flight promise deduplication prevents thundering herd on cold cache keys.
2. **Non-Blocking Invalidation**: Pattern deletion uses Redis `SCAN` cursor streaming instead of dangerous, blocking `KEYS *`.
3. **Decoupled View Counters**: `incrementViewCount()` updates database analytics counters without wiping the product detail cache on every page view.
4. **Canonical Query Ordering**: Parameter sorting ensures `?sort=price&page=1` and `?page=1&sort=price` hit the identical cache key.
5. **Compound Indexes**:
   - `Product`: `{ isActive: 1, isPublished: 1, trendingScore: -1, createdAt: -1 }`
   - `Product`: `{ isActive: 1, isPublished: 1, createdAt: -1 }`
   - `Product`: `{ isActive: 1, isPublished: 1, price: 1 }`
   - `Product`: `{ category: 1, isActive: 1, isPublished: 1 }`
   - `Order`: `{ user: 1, status: 1, createdAt: -1 }`
   - `WebhookEvent`: `{ eventId: 1 }` (unique)

---

## 💳 Checkout & Inventory Correctness

- **Collision-Free Atomic Order Numbers**: Generated via `ORD<YYYYMM>-<timestamp>-<random-hex>` eliminating race condition crashes from legacy `countDocuments()`.
- **Atomic Stock Reservation**: Stock is validated and reserved conditionally inside database transactions:
  `{ _id, $expr: { $gte: [{ $subtract: ['$stock', '$reservedStock'] }, qty] } }`.
- **Inventory Return Semantics**: Returned orders add inventory back to warehouse stock (`stock: +item.quantity`) rather than incorrectly decrementing it a second time.
- **Failed Payment Inventory Release**: Cancelled or failed payments automatically free reserved stock.
- **Stripe Webhook Idempotency**: Webhook events are logged in MongoDB (`WebhookEvent`); duplicate Stripe delivery payloads are safely acknowledged and skipped.
- **Strict Server-Side Pricing**: Product prices, GST tax calculations (18%), and coupon discounts are strictly calculated on the server.

---

## 🤖 Recommendation Engine

- **Content-Based Filtering**: Cosine similarity across product feature vectors.
- **Collaborative Filtering**: Interaction matrix based on views, cart additions, and purchases.
- **Bounded Affinity Scoring**: User interaction events are bounded to the 200 most recent records with exponential time decay.
- **Deterministic Cold-Start Fallback**: Gracefully falls back to cached trending products if user history is empty.
- **Offline Ranking Evaluation**: Includes Precision@K, Recall@K, and NDCG@K ranking evaluation metrics.

---

## 📡 API Endpoints

### Health & Metrics
| Method | Endpoint | Description |
|:---|:---|:---|
| GET | `/health/live` | Process liveness probe |
| GET | `/health/ready` | Database & dependency readiness probe |
| GET | `/health` | Full dependency diagnostic report |
| GET | `/metrics` | Prometheus metrics scrape endpoint |

### Authentication
| Method | Endpoint | Description |
|:---|:---|:---|
| POST | `/api/auth/register` | Register new user account |
| POST | `/api/auth/login` | Login with email & password |
| POST | `/api/auth/refresh` | Refresh access token via httpOnly cookie |
| POST | `/api/auth/logout` | Invalidate refresh token session |
| GET  | `/api/auth/me` | Fetch authenticated user profile |
| GET  | `/api/auth/google` | Google OAuth initiation |

### Products & Search
| Method | Endpoint | Description |
|:---|:---|:---|
| GET | `/api/products` | Paginated product listing with filters |
| GET | `/api/products/search?q=` | Full-text product search with abort cancellation |
| GET | `/api/products/featured` | Cached featured products |
| GET | `/api/products/trending` | Cached trending products |
| GET | `/api/products/slug/:slug` | Cached product details |

### Checkout & Orders
| Method | Endpoint | Description |
|:---|:---|:---|
| GET/POST | `/api/cart` | Read or mutate shopping cart |
| POST | `/api/orders` | Place order with atomic stock reservation |
| GET | `/api/orders/my` | User order history |
| PATCH | `/api/orders/my/:id/cancel` | Cancel pending order and release reserved stock |
| POST | `/api/payments/intent/:orderId` | Create Stripe payment intent |
| POST | `/api/payments/webhook` | Idempotent Stripe webhook receiver |

### Recommendations
| Method | Endpoint | Description |
|:---|:---|:---|
| POST | `/api/recommendations/events` | Ingest user interaction event |
| GET | `/api/recommendations/personalized` | Personalized hybrid recommendations |
| GET | `/api/recommendations/related/:id` | Content-based similar products |
| GET | `/api/recommendations/fbt/:id` | Frequently bought together products |
| GET | `/api/recommendations/trending` | Trending items |

---

## 🧪 Testing & Load Benchmarking

### Automated Regression Tests
The backend includes 11 native unit and integration tests covering cache stampede protection, order numbering uniqueness, server-side pricing, sensitive redaction, and recommendation ranking:
```bash
cd backend
npm test
```

### Load Testing
Execute the automated latency and throughput load benchmark against any local or deployed instance:
```bash
cd backend
TARGET_URL=http://localhost:5000 node load-tests/load-test.js
```

### Frontend Build Verification
Verify client bundle compilation and code-splitting:
```bash
cd frontend
npm run build
```

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/aggisanjay/ShopAI.git
cd ShopAI

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables
Copy and customize `.env.example` in both directories:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Run Development Servers
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
