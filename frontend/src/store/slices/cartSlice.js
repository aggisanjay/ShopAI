import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartAPI } from '../../api/index.js';
import toast from 'react-hot-toast';

export const fetchCart = createAsyncThunk('cart/fetch', async () => {
  const res = await cartAPI.get();
  return res.data.cart;
});

export const addToCart = createAsyncThunk('cart/addItem', async (data, { rejectWithValue }) => {
  try {
    const res = await cartAPI.addItem(data);
    return res.data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to add item');
  }
});

export const updateCartItem = createAsyncThunk('cart/updateItem', async ({ itemId, quantity }) => {
  const res = await cartAPI.updateItem(itemId, quantity);
  return res.data.cart;
});

export const removeCartItem = createAsyncThunk('cart/removeItem', async (itemId) => {
  const res = await cartAPI.removeItem(itemId);
  return res.data.cart;
});

export const clearCart = createAsyncThunk('cart/clear', async () => {
  await cartAPI.clear();
  return null;
});

export const applyCoupon = createAsyncThunk('cart/applyCoupon', async (couponCode, { rejectWithValue }) => {
  try {
    const res = await cartAPI.applyCoupon(couponCode);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Invalid coupon');
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    couponCode: null,
    couponDiscount: 0,
    isLoading: false,
    isOpen: false,
  },
  reducers: {
    toggleCart: (state) => { state.isOpen = !state.isOpen; },
    openCart: (state) => { state.isOpen = true; },
    closeCart: (state) => { state.isOpen = false; },
    setCart: (state, action) => {
      if (action.payload) {
        state.items = action.payload.items || [];
        state.couponCode = action.payload.couponCode || null;
        state.couponDiscount = action.payload.couponDiscount || 0;
      }
    },
  },
  extraReducers: (builder) => {
    const setCartData = (state, action) => {
      state.isLoading = false;
      if (action.payload) {
        state.items = action.payload.items || [];
        state.couponCode = action.payload.couponCode || null;
        state.couponDiscount = action.payload.couponDiscount || 0;
      }
    };

    builder.addCase(fetchCart.fulfilled, setCartData);
    builder.addCase(addToCart.pending, (state) => { state.isLoading = true; });
    builder.addCase(addToCart.fulfilled, (state, action) => {
      setCartData(state, action);
      toast.success('Added to cart! 🛒');
    });
    builder.addCase(addToCart.rejected, (state, action) => {
      state.isLoading = false;
      toast.error(action.payload);
    });
    builder.addCase(updateCartItem.fulfilled, setCartData);
    builder.addCase(removeCartItem.fulfilled, setCartData);
    builder.addCase(clearCart.fulfilled, (state) => {
      state.items = [];
      state.couponCode = null;
      state.couponDiscount = 0;
    });
    builder.addCase(applyCoupon.fulfilled, (state, action) => {
      state.couponCode = action.payload.couponCode;
      state.couponDiscount = action.payload.discount;
      toast.success(`Coupon applied! Saved ₹${action.payload.discount}`);
    });
    builder.addCase(applyCoupon.rejected, (state, action) => {
      toast.error(action.payload);
    });
  },
});

export const { toggleCart, openCart, closeCart, setCart } = cartSlice.actions;
export default cartSlice.reducer;

export const selectCartItems = (state) => state.cart.items;
export const selectCartCount = (state) => state.cart.items.reduce((s, i) => s + i.quantity, 0);
export const selectCartSubtotal = (state) =>
  state.cart.items.reduce((s, i) => s + (i.price || i.product?.price || 0) * i.quantity, 0);
export const selectCartOpen = (state) => state.cart.isOpen;
export const selectCartLoading = (state) => state.cart.isLoading;
