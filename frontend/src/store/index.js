import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import cartReducer from './slices/cartSlice.js';
import productReducer from './slices/productSlice.js';
import uiReducer from './slices/uiSlice.js';
import { setStore } from './storeRef.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    products: productReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

// Register store reference so api/index.js can access it
// without causing a circular import at module evaluation time
setStore(store);