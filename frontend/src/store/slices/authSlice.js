import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../api/index.js';
import toast from 'react-hot-toast';

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const res = await authAPI.login(credentials);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const registerUser = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await authAPI.register(data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const res = await authAPI.getMe();
    return res.data;
  } catch (err) {
    return rejectWithValue(err);
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async (_, { dispatch }) => {
  try { await authAPI.logout(); } catch {}
  dispatch(logout());
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false,
    error: null,
  },
  reducers: {
    setCredentials: (state, action) => {
      if (action.payload.accessToken) state.accessToken = action.payload.accessToken;
      if (action.payload.user) state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(loginUser.pending, (state) => { state.isLoading = true; state.error = null; });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      toast.success(`Welcome back, ${action.payload.user.name}! 👋`);
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      toast.error(action.payload);
    });

    // Register
    builder.addCase(registerUser.pending, (state) => { state.isLoading = true; state.error = null; });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      toast.success('Account created successfully! 🎉');
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      toast.error(action.payload);
    });

    // FetchMe
    builder.addCase(fetchMe.fulfilled, (state, action) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isInitialized = true;
    });
    builder.addCase(fetchMe.rejected, (state) => {
      state.isInitialized = true;
    });
  },
});

export const { setCredentials, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectIsAdmin = (state) => state.auth.user?.role === 'admin';
export const selectIsVendor = (state) => ['admin', 'vendor'].includes(state.auth.user?.role);
