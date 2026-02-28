import { verifyAccessToken } from '../utils/jwt.js';
import { ApiError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import User from '../models/User.model.js';

// Verify JWT and attach user to request
export const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('No token provided');
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token);

  const user = await User.findById(decoded.id).select('-password -refreshTokens');
  if (!user) throw ApiError.unauthorized('User not found');
  if (!user.isActive) throw ApiError.unauthorized('Account has been deactivated');

  req.user = user;
  next();
});

// Optional auth - doesn't fail if no token
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();

  try {
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).select('-password -refreshTokens');
    if (user?.isActive) req.user = user;
  } catch {
    // ignore auth errors for optional auth
  }
  next();
});

// Role-based authorization
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden(`Role '${req.user.role}' is not authorized for this resource`);
    }
    next();
  };
};
