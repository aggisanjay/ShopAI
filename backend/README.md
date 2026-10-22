# ShopAI Backend — Production API

Production-grade Express.js & MongoDB e-commerce API with Redis caching, BullMQ queues, Prometheus metrics, and distributed tracing.

---

## 🏗 Architecture Overview

```
src/
├── observability/   # Prometheus metrics registry & KPI definitions
├── middlewares/     # Tracing, Auth, RateLimiting, ErrorHandler
├── config/          # DB, Redis (SCAN & stampede protection), BullMQ
├── controllers/     # Route controllers
├── services/        # Product, Order, Payment, Recommendation logic
├── models/          # Mongoose models & compound indexes
├── routes/          # Express API, Health (/health/live, /health/ready), Metrics (/metrics)
├── jobs/            # BullMQ background workers with retry policies
└── utils/           # Structured JSON logger, Context, JWT
```

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Seed demo products & categories
npm run seed

# 4. Run automated test suite
npm test

# 5. Start development server
npm run dev
```

---

## 🧪 Testing & Benchmarks

### Native Unit & Integration Tests
```bash
npm test
```
Executes 11 test suites covering:
- Cache key canonicalization
- Redis stampede single-flight deduplication
- Concurrent collision-free order numbering (500 iterations)
- Server-side checkout pricing invariants
- Sensitive data log redaction
- Prometheus metric exposure
- Recommendation offline evaluation metrics (Precision@K, Recall@K, NDCG@K)

### Load Benchmark Suite
```bash
TARGET_URL=http://localhost:5000 node load-tests/load-test.js
```
Executes warm-up, normal load (5 concurrency), and peak burst (15 concurrency) measuring p50, p95, p99 latencies, throughput (RPS), and error rates.

---

## 📊 Observability & Monitoring

- **Prometheus Metrics:** `GET /metrics`
- **Liveness Probe:** `GET /health/live`
- **Readiness Probe:** `GET /health/ready`
- **Dependency Diagnostics:** `GET /health` (reports live MongoDB and Redis ping latencies)
- **Grafana Dashboards:** Located in `observability/dashboards/`
- **Alert Rules:** Located in `observability/alerts/prometheus-rules.yml`
- **Distributed Tracing:** Every request emits `X-Request-Id` and `X-Trace-Id` headers.

---

## 🔐 Default Admin Account
```
Email:    admin@shopai.com
Password: Admin@123
```
