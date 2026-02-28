# ShopAI Frontend — Production React App

## Tech Stack
- **React 18** + **Vite 5**
- **Redux Toolkit** — global state (auth, cart, products, ui)
- **React Router v6** — file-based routing with lazy loading
- **Tailwind CSS** — dark luxury design system
- **Framer Motion** — animations and transitions
- **Axios** — API client with interceptors & token refresh
- **react-hot-toast** — notification toasts
- **Lucide React** — icon library

## 🎨 Design System
- **Theme**: Dark luxury (obsidian backgrounds, gold accents)
- **Fonts**: Playfair Display (headings) + DM Sans (body)
- **Color palette**: `obsidian` + `gold` CSS custom properties

## 🚀 Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

## 📁 Structure

```
src/
├── api/          # Axios instance + all API modules
├── components/
│   ├── auth/     # AuthModal, ProtectedRoute
│   ├── cart/     # CartDrawer
│   ├── layout/   # Navbar, Footer, CartDrawer
│   ├── product/  # ProductCard, ProductGrid, ProductFilters
│   └── ui/       # Button, Input, Modal, Skeleton, Badge, StarRating
├── hooks/        # useDebounce, useProducts
├── pages/
│   ├── admin/    # AdminDashboard, AdminProducts
│   ├── HomePage
│   ├── ProductsPage
│   ├── ProductDetailPage
│   ├── CheckoutPage
│   ├── OrdersPage
│   ├── ProfilePage
│   └── WishlistPage
├── store/
│   └── slices/   # authSlice, cartSlice, productSlice, uiSlice
└── App.jsx       # Routes + layout
```

## 🔑 Key Features

### Authentication
- JWT with refresh token rotation via HTTP-only cookies
- Persistent login (token refresh on app load)
- Role-based route guards (admin, vendor, customer)
- Login/Register modal with tabs

### Shopping
- Product listing with real-time filters (category, price, rating, brand)
- Debounced search with live suggestions
- Product detail with image gallery, ratings, related products
- Optimistic cart updates with Redux
- Cart drawer with quantity controls
- Multi-step checkout with address + payment

### AI Features
- Personalized homepage recommendations (if logged in)
- Related products via cosine similarity
- Frequently bought together
- Trending section
- Event tracking on view/cart/purchase

### Admin Dashboard
- Revenue & orders stats with growth %
- Recent orders table
- Top products by sales
- Low stock alerts
- Product management (publish/unpublish/delete)

## 🎨 CSS Classes

```css
.glass          /* frosted glass card */
.btn-gold       /* primary amber button */
.btn-ghost      /* outlined ghost button */
.input-field    /* dark styled input */
.product-card   /* hover lift card */
.skeleton       /* shimmer loader */
.text-gradient  /* gold gradient text */
.badge-gold     /* amber badge */
.container-app  /* max-w-7xl centered */
```
