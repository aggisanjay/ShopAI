# ShopAI Backend - Production MERN Ecommerce API

## 🏗 Architecture Overview

```
src/
├── config/         # DB, Redis, seed
├── controllers/    # Route handlers (thin layer)
├── services/       # Business logic
├── models/         # Mongoose schemas
├── routes/         # Express routers
├── middlewares/    # Auth, error, validation
├── jobs/           # BullMQ workers
├── utils/          # Logger, response helpers, JWT
└── validators/     # express-validator rules
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env
# Fill in your values

# Start MongoDB & Redis (Docker)
docker compose up mongo redis -d

# Seed database
node src/config/seed.js

# Start dev server
npm run dev
```

## 🐳 Docker

```bash
# Full stack
docker compose up -d

# With Mongo Express (UI)
docker compose --profile dev up -d
```

## 📡 API Endpoints

### Auth
- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/refresh`
- POST `/api/auth/logout`
- POST `/api/auth/forgot-password`
- POST `/api/auth/reset-password/:token`
- GET  `/api/auth/me`

### Products
- GET  `/api/products` — list with filters & pagination
- GET  `/api/products/search?q=...`
- GET  `/api/products/slug/:slug`
- GET  `/api/products/featured`
- GET  `/api/products/trending`
- POST `/api/products` — create (admin/vendor)
- PUT  `/api/products/:id` — update
- DEL  `/api/products/:id` — soft delete

### Cart
- GET    `/api/cart`
- POST   `/api/cart/items`
- PATCH  `/api/cart/items/:id`
- DELETE `/api/cart/items/:id`
- POST   `/api/cart/coupon`

### Orders
- POST  `/api/orders`
- GET   `/api/orders/my`
- GET   `/api/orders/my/:id`
- PATCH `/api/orders/my/:id/cancel`

### Payments (Stripe)
- POST `/api/payments/intent/:orderId`
- POST `/api/payments/webhook`

### Recommendations (AI)
- POST `/api/recommendations/events`
- GET  `/api/recommendations/related/:productId`
- GET  `/api/recommendations/fbt/:productId`
- GET  `/api/recommendations/personalized`
- GET  `/api/recommendations/trending`
- GET  `/api/recommendations/collaborative`

### Reviews
- GET  `/api/reviews/product/:productId`
- POST `/api/reviews/product/:productId`
- PATCH `/api/reviews/:id`
- DELETE `/api/reviews/:id`

### Admin
- GET  `/api/analytics/dashboard`
- GET  `/api/analytics/sales-chart`
- GET  `/api/admin/low-stock`
- GET  `/api/admin/coupons`
- POST `/api/admin/coupons`

## 🔐 Security Features
- JWT with refresh token rotation
- Session invalidation on token reuse (theft detection)
- Helmet security headers
- Rate limiting (global + auth-specific)
- MongoDB injection sanitization
- Input validation with express-validator
- CORS with credentials
- Bcrypt password hashing (12 rounds)

## 🤖 AI Recommendation Engine
- **Content-based**: Cosine similarity on product feature vectors
- **Collaborative filtering**: User-product interaction matrix
- **Hybrid**: Weighted combination (50% content + 30% collab + 20% trending)
- **Affinity scoring**: Event-weighted with exponential time decay
- **Trending score**: Re-computed hourly via BullMQ

## 💾 Caching Strategy (Redis)
| Data | TTL |
|------|-----|
| Product list | 5 min |
| Product detail | 10 min |
| Categories | 60 min |
| Featured products | 30 min |
| Trending | 15 min |
| Personalized reco | 15 min |
| Related products | 60 min |
| Dashboard stats | 5 min |

## Default Admin
Email: `admin@shopai.com`
Password: `Admin@123`
