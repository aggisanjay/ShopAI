import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: 'dark',
    authModalOpen: false,
    authModalTab: 'login',
    searchOpen: false,
    mobileMenuOpen: false,
  },
  reducers: {
    openAuthModal: (state, action) => {
      state.authModalOpen = true;
      state.authModalTab = action.payload || 'login';
    },
    closeAuthModal: (state) => { state.authModalOpen = false; },
    setAuthTab: (state, action) => { state.authModalTab = action.payload; },
    toggleSearch: (state) => { state.searchOpen = !state.searchOpen; },
    closeSearch: (state) => { state.searchOpen = false; },
    toggleMobileMenu: (state) => { state.mobileMenuOpen = !state.mobileMenuOpen; },
    closeMobileMenu: (state) => { state.mobileMenuOpen = false; },
  },
});

export const {
  openAuthModal, closeAuthModal, setAuthTab,
  toggleSearch, closeSearch,
  toggleMobileMenu, closeMobileMenu,
} = uiSlice.actions;
export default uiSlice.reducer;

export const selectAuthModalOpen = (state) => state.ui.authModalOpen;
export const selectAuthModalTab = (state) => state.ui.authModalTab;
export const selectSearchOpen = (state) => state.ui.searchOpen;
