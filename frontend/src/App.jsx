

// import { lazy, Suspense, useEffect } from 'react';
// import { Routes, Route, useLocation } from 'react-router-dom';
// import { useDispatch, useSelector } from 'react-redux';
// import { fetchMe, setCredentials } from './store/slices/authSlice.js';
// import toast from 'react-hot-toast';
// import { fetchCart } from './store/slices/cartSlice.js';
// import { selectIsAuthenticated, selectIsInitialized } from './store/slices/authSlice.js';
// import Navbar from './components/layout/Navbar.jsx';
// import Footer from './components/layout/Footer.jsx';
// import CartDrawer from './components/layout/CartDrawer.jsx';
// import AuthModal from './components/auth/AuthModal.jsx';
// import { ProtectedRoute, AdminRoute } from './components/auth/ProtectedRoute.jsx';

// // Eager load key pages
// import HomePage from './pages/HomePage.jsx';
// import ProductsPage from './pages/ProductsPage.jsx';
// import ProductDetailPage from './pages/ProductDetailPage.jsx';

// // Lazy load the rest
// const CheckoutPage = lazy(() => import('./pages/CheckoutPage.jsx'));
// const OrdersPage = lazy(() => import('./pages/OrdersPage.jsx'));
// const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
// const WishlistPage = lazy(() => import('./pages/WishlistPage.jsx'));
// const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
// const AdminProducts = lazy(() => import('./pages/admin/AdminProducts.jsx'));
// const AdminOrders = lazy(() => import('./pages/admin/AdminOrders.jsx'));
// const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers.jsx'));
// const OrderDetailsPage = lazy(() => import('./pages/OrderDetailsPage.jsx'));

// function PageLoader() {
//   return (
//     <div className="min-h-screen flex items-center justify-center">
//       <div className="flex items-center gap-3 text-obsidian-400">
//         <div className="w-6 h-6 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
//         <span className="text-sm">Loading...</span>
//       </div>
//     </div>
//   );
// }

// function NotFound() {
//   return (
//     <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center">
//       <div className="text-8xl font-display font-bold text-gradient">404</div>
//       <h2 className="text-2xl font-display font-semibold text-white">Page Not Found</h2>
//       <p className="text-obsidian-400">The page you're looking for doesn't exist.</p>
//       <a href="/" className="btn-gold mt-2">Go Home</a>
//     </div>
//   );
// }

// // Scroll to top on route change
// function ScrollToTop() {
//   const location = useLocation();
//   useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
//   return null;
// }

// export default function App() {
//   const dispatch = useDispatch();
//   const location = useLocation();
//   const isAuth = useSelector(selectIsAuthenticated);
//   const isInitialized = useSelector(selectIsInitialized);

//   // Init: check auth & load cart
//   useEffect(() => {
//     dispatch(fetchMe());
//   }, []);

//   useEffect(() => {
//     const params = new URLSearchParams(window.location.search);
//     const token = params.get('token');
//     if (token) {
//       dispatch(setCredentials({ accessToken: token }));
//       const url = new URL(window.location.href);
//       url.searchParams.delete('token');
//       window.history.replaceState({}, document.title, url.pathname + url.search);
//       toast.success('Signed in with Google! 🚀');
//       dispatch(fetchMe()); // Fetch user profile after getting token
//     }
//   }, [dispatch]);

//   useEffect(() => {
//     if (isAuth) dispatch(fetchCart());
//   }, [isAuth]);

//   const isAdminPath = location.pathname.startsWith('/admin');

//   if (!isInitialized) return <PageLoader />;

//   return (
//     <>
//       <ScrollToTop />
//       <Navbar />
//       <CartDrawer />
//       <AuthModal />

//       <main className="pt-0">
//         <Suspense fallback={<PageLoader />}>
//           <Routes>
//             <Route path="/" element={<HomePage />} />
//             <Route path="/products" element={<ProductsPage />} />
//             <Route path="/product/:slug" element={<ProductDetailPage />} />

//             <Route path="/checkout" element={
//               <ProtectedRoute><CheckoutPage /></ProtectedRoute>
//             } />
//             <Route path="/orders" element={
//               <ProtectedRoute><OrdersPage /></ProtectedRoute>
//             } />
//             <Route path="/orders/:id" element={
//               <ProtectedRoute><OrderDetailsPage /></ProtectedRoute>
//             } />
//             <Route path="/profile" element={
//               <ProtectedRoute><ProfilePage /></ProtectedRoute>
//             } />
//             <Route path="/wishlist" element={
//               <ProtectedRoute><WishlistPage /></ProtectedRoute>
//             } />

//             {/* Admin routes */}
//             <Route path="/admin" element={
//               <AdminRoute><AdminDashboard /></AdminRoute>
//             } />
//             <Route path="/admin/products" element={
//               <AdminRoute><AdminProducts /></AdminRoute>
//             } />
//             <Route path="/admin/orders" element={
//               <AdminRoute><AdminOrders /></AdminRoute>
//             } />
//             <Route path="/admin/customers" element={
//               <AdminRoute><AdminCustomers /></AdminRoute>
//             } />

//             <Route path="*" element={<NotFound />} />
//           </Routes>
//         </Suspense>
//       </main>

//       {!isAdminPath && <Footer />}
//     </>
//   );
// }


import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  initAuth,         // ✅ use this instead of fetchMe on load
  fetchMe,
  setCredentials,
} from './store/slices/authSlice.js';
import toast from 'react-hot-toast';
import { fetchCart } from './store/slices/cartSlice.js';
import { selectIsAuthenticated, selectIsInitialized } from './store/slices/authSlice.js';
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import CartDrawer from './components/layout/CartDrawer.jsx';
import AuthModal from './components/auth/AuthModal.jsx';
import { ProtectedRoute, AdminRoute } from './components/auth/ProtectedRoute.jsx';

// Eager load key pages
import HomePage from './pages/HomePage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';

// Lazy load the rest
const CheckoutPage    = lazy(() => import('./pages/CheckoutPage.jsx'));
const OrdersPage      = lazy(() => import('./pages/OrdersPage.jsx'));
const ProfilePage     = lazy(() => import('./pages/ProfilePage.jsx'));
const WishlistPage    = lazy(() => import('./pages/WishlistPage.jsx'));
const AdminDashboard  = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const AdminProducts   = lazy(() => import('./pages/admin/AdminProducts.jsx'));
const AdminOrders     = lazy(() => import('./pages/admin/AdminOrders.jsx'));
const AdminCustomers  = lazy(() => import('./pages/admin/AdminCustomers.jsx'));
const OrderDetailsPage = lazy(() => import('./pages/OrderDetailsPage.jsx'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-3 text-obsidian-400">
        <div className="w-6 h-6 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center">
      <div className="text-8xl font-display font-bold text-gradient">404</div>
      <h2 className="text-2xl font-display font-semibold text-white">Page Not Found</h2>
      <p className="text-obsidian-400">The page you're looking for doesn't exist.</p>
      <a href="/" className="btn-gold mt-2">Go Home</a>
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

  // ✅ FIX: Use initAuth instead of fetchMe
  // initAuth tries refresh cookie first — if no cookie (fresh visitor / logged out),
  // it silently fails and marks app as initialized WITHOUT any toast
  useEffect(() => {
    dispatch(initAuth());
  }, [dispatch]);

  // ✅ Handle Google OAuth callback — token comes back in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      dispatch(setCredentials({ accessToken: token }));

      // Clean token from URL immediately
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      window.history.replaceState({}, document.title, url.pathname + url.search);

      // Fetch full user profile now that we have the token
      dispatch(fetchMe());
      toast.success('Signed in with Google! 🚀');
    }
  }, [dispatch]);

  // Load cart only when user is authenticated
  useEffect(() => {
    if (isAuth) dispatch(fetchCart());
  }, [isAuth, dispatch]);

  const isAdminPath = location.pathname.startsWith('/admin');

  // Show loader until initAuth completes (success or fail)
  if (!isInitialized) return <PageLoader />;

  return (
    <>
      <ScrollToTop />
      <Navbar />
      <CartDrawer />
      <AuthModal />

      <main className="pt-0">
        <Suspense fallback={<PageLoader />}>
          <Routes>
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

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      {!isAdminPath && <Footer />}
    </>
  );
}
