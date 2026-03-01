import authService from '../services/auth.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { setRefreshTokenCookie } from '../utils/jwt.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const { user, tokens } = await authService.register({ name, email, password });

  setRefreshTokenCookie(res, tokens.refreshToken);

  ApiResponse.created(res, {
    user,
    accessToken: tokens.accessToken,
  }, 'Account created successfully');
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, tokens } = await authService.login({ email, password });

  setRefreshTokenCookie(res, tokens.refreshToken);

  ApiResponse.success(res, {
    user,
    accessToken: tokens.accessToken,
  }, 'Login successful');
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  const tokens = await authService.refreshTokens(refreshToken);

  setRefreshTokenCookie(res, tokens.refreshToken);

  ApiResponse.success(res, { accessToken: tokens.accessToken }, 'Token refreshed');
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  await authService.logout(req.user.id, refreshToken, res);
  ApiResponse.success(res, {}, 'Logged out successfully');
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  ApiResponse.success(res, {}, 'If the email exists, a reset link has been sent');
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.params.token, req.body.password);
  ApiResponse.success(res, {}, 'Password reset successfully');
});

export const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  ApiResponse.success(res, {}, 'Password changed successfully');
});

export const getMe = asyncHandler(async (req, res) => {
  ApiResponse.success(res, { user: req.user.toSafeObject() });
});

// Google OAuth
export const googleLogin = asyncHandler(async (req, res) => {
  const { getGoogleAuthUrl } = await import('../config/googleAuth.config.js');
  const url = getGoogleAuthUrl();
  res.redirect(url);
});

export const googleCallback = asyncHandler(async (req, res) => {
  const { code } = req.query;
  const { getGoogleTokens, getGoogleUser } = await import('../config/googleAuth.config.js');
  
  const { id_token, access_token } = await getGoogleTokens(code);
  const profile = await getGoogleUser({ id_token, access_token });

  const { user, tokens } = await authService.googleLogin(profile);

  setRefreshTokenCookie(res, tokens.refreshToken);

  // Redirect back to frontend with accessToken in URL
  res.redirect(`${process.env.CLIENT_URL}/?token=${tokens.accessToken}`);
});
