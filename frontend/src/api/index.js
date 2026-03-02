import axios from 'axios';
import { getStore } from '../store/storeRef.js';
import { logout, setCredentials } from '../store/slices/authSlice.js';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});


// ─── Request Interceptor ─────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const storeObj = getStore();
    if (storeObj) {
      const token = storeObj.getState().auth.accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Attach session ID for anonymous event tracking
    const sessionId = sessionStorage.getItem('sessionId') || crypto.randomUUID();
    sessionStorage.setItem('sessionId', sessionId);
    config.headers['x-session-id'] = sessionId;

    // ✅ FIX 2: Show wakeup toast if server takes more than 4s (Render cold start)
    const wakeupTimer = setTimeout(() => {
      toast.loading('⏳ Server is waking up, please wait...', { id: 'wakeup' });
    }, 4000);
    config._wakeupTimer = wakeupTimer;

    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

// ─── Response Interceptor ────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => {
    // ✅ FIX 3: Clear wakeup toast on success
    clearTimeout(response.config._wakeupTimer);
    toast.dismiss('wakeup');
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // ✅ FIX 3: Always clear wakeup toast on error too
    clearTimeout(originalRequest?._wakeupTimer);
    toast.dismiss('wakeup');

    // ✅ FIX 4: Handle timeout — retry ONCE, never logout
    // ECONNABORTED = Render cold start, not an auth failure
    if (error.code === 'ECONNABORTED' && !originalRequest._retried) {
      originalRequest._retried = true;
      originalRequest.timeout = 60000;

      try {
        toast.loading('Retrying request...', { id: 'retry' });
        const result = await api(originalRequest);
        toast.dismiss('retry');
        return result;
      } catch (retryError) {
        toast.dismiss('retry');
        toast.error('Server is slow to respond. Please try again shortly.');
        return Promise.reject(retryError);
      }
    }

    // ✅ FIX 5: Network error (no response) — never logout
    if (!error.response) {
      toast.error('Network error. Check your connection and try again.');
      return Promise.reject({ ...error, message: 'Network error' });
    }

    // ─── 401 Handler — Token Refresh ────────────────────────────────────────
    if (error.response?.status === 401 && !originalRequest._retry) {
      // ✅ FIX 6: Skip refresh for /auth/me and /auth/refresh themselves
      // These endpoints are expected to 401 on fresh/unauthenticated visits
      const silentUrls = ['/auth/me', '/auth/refresh'];
      const isSilentUrl = silentUrls.some(url => originalRequest?.url?.includes(url));

      if (isSilentUrl) {
        // ✅ FIX 7: Only logout if user actually had a session
        // A fresh phone visitor has no token — don't show "Session expired"
        const storeObj = getStore();
        if (storeObj) {
          const wasLoggedIn = !!storeObj.getState().auth.accessToken;
          storeObj.dispatch(logout());
          if (wasLoggedIn) {
            toast.error('Session expired. Please log in again.');
          }
          // No toast for fresh visitors — they were never logged in
        }
        return Promise.reject({ ...error, message: 'Unauthorized' });
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const { accessToken } = res.data;

        const storeObj = getStore();
        if (storeObj) {
          storeObj.dispatch(setCredentials({ accessToken }));
        }

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // ✅ FIX 8: Only logout + toast if refresh failed with real 401/403
        // (not a timeout or network error during refresh)
        if (
          refreshError.response?.status === 401 ||
          refreshError.response?.status === 403
        ) {
          const storeObj = getStore();
          if (storeObj) {
            const wasLoggedIn = !!storeObj.getState().auth.accessToken;
            storeObj.dispatch(logout());
            if (wasLoggedIn) {
              toast.error('Session expired. Please log in again.');
            }
          }
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ─── Surface Error Message ───────────────────────────────────────────────
    const message = error.response?.data?.message || 'Something went wrong';
    return Promise.reject({ ...error, message });
  }
);

export default api;
export default api;

// API modules
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  changePassword: (data) => api.post('/auth/change-password', data),
};

export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getBySlug: (slug, params) => api.get(`/products/slug/${slug}`, { params }),
  search: (params) => api.get('/products/search', { params }),
  getFeatured: (limit) => api.get('/products/featured', { params: { limit } }),
  getTrending: (limit) => api.get('/products/trending', { params: { limit } }),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getTree: () => api.get('/categories/tree'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
};

export const cartAPI = {
  get: () => api.get('/cart'),
  addItem: (data) => api.post('/cart/items', data),
  updateItem: (itemId, quantity) => api.patch(`/cart/items/${itemId}`, { quantity }),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}`),
  clear: () => api.delete('/cart'),
  applyCoupon: (couponCode) => api.post('/cart/coupon', { couponCode }),
};

export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getMyOrders: (params) => api.get('/orders/my', { params }),
  getById: (id) => api.get(`/orders/my/${id}`),
  cancel: (id) => api.patch(`/orders/my/${id}/cancel`),
  getAll: (params) => api.get('/orders', { params }),
  updateStatus: (id, data) => api.patch(`/orders/${id}/status`, data),
};

export const paymentsAPI = {
  createIntent: (orderId) => api.post(`/payments/intent/${orderId}`),
  verify: (orderId) => api.post(`/payments/verify/${orderId}`),
  refund: (orderId) => api.post(`/payments/refund/${orderId}`),
};

export const recoAPI = {
  trackEvent: (data) => api.post('/recommendations/events', data),
  getRelated: (productId, limit) => api.get(`/recommendations/related/${productId}`, { params: { limit } }),
  getFBT: (productId) => api.get(`/recommendations/fbt/${productId}`),
  getPersonalized: (limit) => api.get('/recommendations/personalized', { params: { limit } }),
  getTrending: (limit) => api.get('/recommendations/trending', { params: { limit } }),
};

export const reviewsAPI = {
  getByProduct: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
  create: (productId, data) => api.post(`/reviews/product/${productId}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
  voteHelpful: (id) => api.post(`/reviews/${id}/helpful`),
};

export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.patch('/users/profile', data),
  getWishlist: () => api.get('/users/wishlist'),
  toggleWishlist: (productId) => api.post(`/users/wishlist/${productId}`),
  addAddress: (data) => api.post('/users/addresses', data),
  updateAddress: (id, data) => api.patch(`/users/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/users/addresses/${id}`),
  getAll: (params) => api.get('/users', { params }),
  toggleStatus: (id) => api.patch(`/users/${id}/toggle-status`),
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getSalesChart: (period) => api.get('/analytics/sales-chart', { params: { period } }),
  getTopProducts: () => api.get('/analytics/top-products'),
  getRecentOrders: () => api.get('/analytics/recent-orders'),
};

export const adminAPI = {
  getLowStock: () => api.get('/admin/low-stock'),
  getCoupons: () => api.get('/admin/coupons'),
  createCoupon: (data) => api.post('/admin/coupons', data),
  clearCache: () => api.post('/admin/cache/clear'),
};

export const uploadsAPI = {
  uploadImage: (formData) => api.post('/uploads/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};
