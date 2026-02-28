import User from '../models/User.model.js';
import { ApiError } from '../utils/apiResponse.js';
import {
  generateTokenPair,
  verifyRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from '../utils/jwt.js';
import { cacheSet, cacheDel } from '../config/redis.js';
import { addEmailJob } from '../jobs/email.job.js';
import crypto from 'crypto';

export class AuthService {
  async register({ name, email, password }) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) throw ApiError.conflict('Email already registered');

    const user = await User.create({ name, email, password });

    // Send welcome email
    await addEmailJob({
      to: email,
      subject: 'Welcome to ShopAI',
      template: 'welcome',
      data: { name },
    });

    const tokens = generateTokenPair(user);
    return { user: user.toSafeObject(), tokens };
  }

  async login({ email, password }) {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshTokens');
    if (!user) throw ApiError.unauthorized('Invalid email or password');
    if (!user.isActive) throw ApiError.unauthorized('Account has been deactivated');

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw ApiError.unauthorized('Invalid email or password');

    // Update last login
    user.lastLogin = new Date();
    const tokens = generateTokenPair(user);

    // Store refresh token (max 5 concurrent sessions)
    user.refreshTokens = [...(user.refreshTokens || []).slice(-4), tokens.refreshToken];
    await user.save({ validateBeforeSave: false });

    return { user: user.toSafeObject(), tokens };
  }

  async refreshTokens(refreshToken) {
    if (!refreshToken) throw ApiError.unauthorized('No refresh token');

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id).select('+refreshTokens');
    if (!user) throw ApiError.unauthorized('User not found');

    if (!user.refreshTokens.includes(refreshToken)) {
      // Potential token theft — invalidate all sessions
      user.refreshTokens = [];
      await user.save({ validateBeforeSave: false });
      throw ApiError.unauthorized('Refresh token reuse detected. All sessions invalidated.');
    }

    // Rotate refresh token
    const tokens = generateTokenPair(user);
    user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
    user.refreshTokens.push(tokens.refreshToken);
    await user.save({ validateBeforeSave: false });

    return tokens;
  }

  async logout(userId, refreshToken, res) {
    const user = await User.findById(userId).select('+refreshTokens');
    if (user && refreshToken) {
      user.refreshTokens = (user.refreshTokens || []).filter(t => t !== refreshToken);
      await user.save({ validateBeforeSave: false });
    }
    clearRefreshTokenCookie(res);
  }

  async forgotPassword(email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    // Always return success to prevent email enumeration
    if (!user) return;

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 min
    await user.save({ validateBeforeSave: false });

    await addEmailJob({
      to: email,
      subject: 'Password Reset Request',
      template: 'resetPassword',
      data: { name: user.name, resetUrl: `${process.env.CLIENT_URL}/reset-password/${resetToken}` },
    });
  }

  async resetPassword(token, newPassword) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+refreshTokens');

    if (!user) throw ApiError.badRequest('Invalid or expired reset token');

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens = []; // invalidate all sessions
    await user.save();
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw ApiError.badRequest('Current password is incorrect');
    user.password = newPassword;
    await user.save();
  }
}

export default new AuthService();
