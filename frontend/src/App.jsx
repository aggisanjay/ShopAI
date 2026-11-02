import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  initAuth,
  fetchMe,
  setCredentials,
} from './store/slices/authSlice.js';
import toast from 'react-hot-toast';
import { fetchCart } from './store/slices/cartSlice.js';
import { selectIsAuthenticated, selectIsInitialized } from './store/slices/authSlice.js';
import Navbar from './components/layout/Navbar.jsx';
import AnnouncementBar from './components/layout/AnnouncementBar.jsx';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Footer from './components/layout/Footer.jsx';
import CartDrawer from './components/layout/CartDrawer.jsx';
import AuthModal from './components/auth/AuthModal.jsx';
import { ProtectedRoute, AdminRoute } from './components/auth/ProtectedRoute.jsx';

// Eager load key landing pages
import HomePage from './pages/HomePage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';

// Lazy load non-critical routes for code splitting
const CheckoutPage = lazy(() => import('./pages/CheckoutPage.jsx'));
const OrdersPage = lazy(() => import('./pages/OrdersPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
const WishlistPage = lazy(() => import('./pages/WishlistPage.jsx'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts.jsx'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders.jsx'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers.jsx'));
const AdminObservability = lazy(() => import('./pages/admin/AdminObservability.jsx'));
const OrderDetailsPage = lazy(() => import('./pages/OrderDetailsPage.jsx'));

function PageLoader() {
  return (
    <div className="grid min-h-screen place-items-center" role="status" aria-label="Loading">
      <div className="flex flex-col items-center gap-5">
        <div className="relative h-10 w-10">
          <span className="absolute inset-0 animate-ping2 rounded-full bg-cream/30" />
          <span className="absolute inset-2 rounded-full bg-cream" />
        </div>
        <span className="eyebrow">Loading</span>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 pt-20 text-center">
      <p className="eyebrow mb-6">Error 404</p>
      <h1 className="font-display text-[28vw] leading-[0.8] tracking-[-0.05em] sm:text-[18rem]" style={{ color: 'transparent', WebkitTextStroke: '1.5px rgba(255,255,255,0.25)' }}>404</h1>
      <h2 className="mt-8 font-display text-4xl sm:text-5xl">This page <span className="italic text-obsidian-400">wandered off.</span></h2>
      <p className="mt-4 max-w-sm text-obsidian-400">The link may be broken, or the page may have moved.</p>
      <Link to="/" className="btn-primary mt-9 h-14 px-8 text-base">Back to home <ArrowRight className="h-4 w-4" /></Link>
    </div>
  );
}

function ScrollToTop() {
  const location = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  return null;
}

export default function App() {
  const dispatch = useDispatch();
  const location = useLocation();
  const isAuth = useSelector(selectIsAuthenticated);
  const isInitialized = useSelector(selectIsInitialized);

  // Initialize auth state silently on boot
  useEffect(() => {
    dispatch(initAuth());
  }, [dispatch]);

  // Handle Google OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      dispatch(setCredentials({ accessToken: token }));
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      window.history.replaceState({}, document.title, url.pathname + url.search);
      dispatch(fetchMe());
      toast.success('Signed in with Google');
    }
  }, [dispatch]);

  // Load cart only when authenticated
  useEffect(() => {
    if (isAuth) dispatch(fetchCart());
  }, [isAuth, dispatch]);

  const isAdminPath = location.pathname.startsWith('/admin');

  if (!isInitialized) return <PageLoader />;

  return (
    <>
      <ScrollToTop />
      <AnnouncementBar />
      <Navbar />
      <CartDrawer />
      <AuthModal />

      <main>
        <Suspense fallback={<PageLoader />}>
          <motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/product/:slug" element={<ProductDetailPage />} />

            <Route path="/checkout" element={
              <ProtectedRoute><CheckoutPage /></ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute><OrdersPage /></ProtectedRoute>
            } />
            <Route path="/orders/:id" element={
              <ProtectedRoute><OrderDetailsPage /></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><ProfilePage /></ProtectedRoute>
            } />
            <Route path="/wishlist" element={
              <ProtectedRoute><WishlistPage /></ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="/admin" element={
              <AdminRoute><AdminDashboard /></AdminRoute>
            } />
            <Route path="/admin/products" element={
              <AdminRoute><AdminProducts /></AdminRoute>
            } />
            <Route path="/admin/orders" element={
              <AdminRoute><AdminOrders /></AdminRoute>
            } />
            <Route path="/admin/customers" element={
              <AdminRoute><AdminCustomers /></AdminRoute>
            } />
            <Route path="/admin/observability" element={
              <AdminRoute><AdminObservability /></AdminRoute>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
          </motion.div>
        </Suspense>
      </main>

      {!isAdminPath && <Footer />}
    </>
  );
}
