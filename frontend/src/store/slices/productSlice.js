import { createSlice } from '@reduxjs/toolkit';

const productSlice = createSlice({
  name: 'products',
  initialState: {
    searchQuery: '',
    filters: {
      category: null,
      brand: null,
      minPrice: null,
      maxPrice: null,
      rating: null,
      sort: 'trending',
      inStock: null,
    },
    wishlist: [],
  },
  reducers: {
    setSearchQuery: (state, action) => { state.searchQuery = action.payload; },
    setFilter: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = { category: null, brand: null, minPrice: null, maxPrice: null, rating: null, sort: 'trending', inStock: null };
    },
    setWishlist: (state, action) => { state.wishlist = action.payload; },
    toggleWishlistItem: (state, action) => {
      const id = action.payload;
      const idx = state.wishlist.indexOf(id);
      if (idx >= 0) state.wishlist.splice(idx, 1);
      else state.wishlist.push(id);
    },
  },
});

export const { setSearchQuery, setFilter, resetFilters, setWishlist, toggleWishlistItem } = productSlice.actions;
export default productSlice.reducer;

export const selectFilters = (state) => state.products.filters;
export const selectWishlist = (state) => state.products.wishlist;
