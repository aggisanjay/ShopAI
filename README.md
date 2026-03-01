# ShopAI — Full Stack MERN Ecommerce Platform

A production-ready ecommerce web application built with the MERN stack, featuring a smart product recommendation engine, Google OAuth, Stripe payments, background job processing, and Redis caching.

🌐 **Live Demo:** [shopai-app.netlify.app](https://shopai-app.netlify.app)  
🔧 **Backend API:** [ai-ecommerce-recomdation.onrender.com](https://ai-ecommerce-recomdation.onrender.com)

---

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS, Zustand, Axios  
**Backend:** Node.js, Express.js, MongoDB (Mongoose), Redis (ioredis)  
**Auth:** JWT (access + refresh tokens), Google OAuth 2.0  
**Payments:** Stripe  
**Jobs:** BullMQ (background workers)  
**Deployment:** Netlify (frontend), Render (backend)

---

## Features

- 🔐 **Authentication** — Register/login with email+password or Google OAuth. JWT-based auth with refresh token rotation and session theft detection
- 🛒 **Cart & Orders** — Full cart management with coupon support, order placement and cancellation
- 💳 **Payments** — Stripe payment intents with webhook support
- 🔍 **Product Discovery** — Search, filter, pagination, featured and trending product feeds
- 📦 **Recommendations** — Algorithm-based product recommendations using cosine similarity (content-based), user interaction history (collaborative filtering), and trending scores
- ⭐ **Reviews** — Product reviews with CRUD operations
- 🛠 **Admin Panel** — Dashboard with sales analytics, low-stock alerts, coupon management
- 📧 **Email Jobs** — Welcome emails, password reset, and abandoned cart reminders via BullMQ + Nodemailer
- 💾 **Redis Caching** — Multi-layer caching for products, categories, recommendations, and dashboard stats

---

## Architecture

```
backend/
├── src/
│   ├── config/         # DB, Redis, Google OAuth, seed
│   ├── controllers/    # Route handlers
│   ├── services/       # Business logic
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Express routers
│   ├── middlewares/    # Auth, error handling, validation
│   ├── jobs/           # BullMQ workers (email, analytics, recommendations, cart)
│   ├── utils/          # Logger, JWT helpers, API response helpers
│   └── validators/     # express-validator schemas
frontend/
├── src/
│   ├── pages/          # Route-level components
│   ├── components/     # Reusable UI components
│   ├── store/          # Zustand state management
│   ├── api/            # Axios instance + service modules
│   └── hooks/          # Custom React hooks
```

---

## Recommendation Engine

Products are recommended using three algorithmic approaches — no external AI/ML service is used:

- **Content-based filtering** — Cosine similarity between product feature vectors (category, tags, price range)
- **Collaborative filtering** — User-product interaction matrix built from events (views, cart adds, purchases, wishlists, reviews)
- **Hybrid score** — Weighted combination: 50% content similarity + 30% collaborative + 20% trending
- **Trending score** — Recomputed hourly by a BullMQ background worker based on recent event activity
- **Affinity scoring** — Events are weighted by type and time-decayed exponentially

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register with email/password |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/refresh` | Refresh access token via cookie |
| POST | `/api/auth/logout` | Logout and invalidate session |
| POST | `/api/auth/forgot-password` | Send password reset email |
| POST | `/api/auth/reset-password/:token` | Reset password |
| GET  | `/api/auth/me` | Get current user |
| GET  | `/api/auth/google` | Initiate Google OAuth |
| GET  | `/api/auth/google/callback` | Google OAuth callback |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List with filters & pagination |
| GET | `/api/products/search?q=` | Full-text search |
| GET | `/api/products/featured` | Featured products |
| GET | `/api/products/trending` | Trending products |
| GET | `/api/products/slug/:slug` | Product detail by slug |
| POST | `/api/products` | Create product (admin/vendor) |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Soft delete product |

### Cart, Orders, Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/cart` | Get or add to cart |
| PATCH/DELETE | `/api/cart/items/:id` | Update or remove item |
| POST | `/api/cart/coupon` | Apply coupon |
| POST | `/api/orders` | Place an order |
| GET | `/api/orders/my` | Get user's orders |
| PATCH | `/api/orders/my/:id/cancel` | Cancel an order |
| POST | `/api/payments/intent/:orderId` | Create Stripe payment intent |
| POST | `/api/payments/webhook` | Stripe webhook handler |

### Recommendations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/recommendations/events` | Track user event |
| GET | `/api/recommendations/related/:productId` | Related products |
| GET | `/api/recommendations/fbt/:productId` | Frequently bought together |
| GET | `/api/recommendations/personalized` | Personalized feed |
| GET | `/api/recommendations/trending` | Trending products |
| GET | `/api/recommendations/collaborative` | Collaborative picks |

### Admin & Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Dashboard stats |
| GET | `/api/analytics/sales-chart` | Sales over time |
| GET | `/api/admin/low-stock` | Low stock alerts |
| GET/POST | `/api/admin/coupons` | Manage coupons |

---

## Security

- JWT with refresh token rotation (max 5 concurrent sessions)
- Token reuse detection — all sessions invalidated on suspected theft
- Helmet security headers
- Rate limiting — global (100 req/15min) and strict auth limits (20 req/15min)
- MongoDB injection sanitization via `express-mongo-sanitize`
- Input validation with `express-validator`
- CORS with credentials for cross-origin frontend/backend setup
- Bcrypt password hashing (12 rounds)

---

## Redis Caching

| Data | TTL |
|------|-----|
| Product list | 5 min |
| Product detail | 10 min |
| Categories | 60 min |
| Featured products | 30 min |
| Trending | 15 min |
| Personalized recommendations | 15 min |
| Related products | 60 min |
| Dashboard stats | 5 min |

---

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB
- Redis

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/your-username/your-repo.git

# 2. Install backend dependencies
cd backend
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in your values (see Environment Variables below)

# 4. Seed the database
node src/config/seed.js

# 5. Start the backend
npm run dev

# 6. Install and start the frontend
cd ../frontend
npm install
npm run dev
```

---

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000
BACKEND_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173

# Database
MONGO_URI=mongodb://localhost:27017/shopai

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

## Default Admin Account

```
Email:    admin@shopai.com
Password: Admin@123
```

---

## License

MIT
