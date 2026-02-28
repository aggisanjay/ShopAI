import User from '../models/User.model.js';
import { ApiError, ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getProfile = asyncHandler(async (req, res) => {
  ApiResponse.success(res, { user: req.user.toSafeObject() });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'avatar'];
  const updates = {};
  allowed.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  ApiResponse.success(res, { user: user.toSafeObject() }, 'Profile updated');
});

export const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user.addresses.length >= 10) throw ApiError.badRequest('Maximum 10 addresses allowed');

  if (req.body.isDefault) {
    user.addresses.forEach(addr => { addr.isDefault = false; });
  }

  user.addresses.push(req.body);
  await user.save();
  ApiResponse.success(res, { addresses: user.addresses }, 'Address added');
});

export const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const addr = user.addresses.id(req.params.addressId);
  if (!addr) throw ApiError.notFound('Address not found');

  if (req.body.isDefault) {
    user.addresses.forEach(a => { a.isDefault = false; });
  }

  Object.assign(addr, req.body);
  await user.save();
  ApiResponse.success(res, { addresses: user.addresses }, 'Address updated');
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.addressId);
  await user.save();
  ApiResponse.success(res, { addresses: user.addresses }, 'Address deleted');
});

export const toggleWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const productId = req.params.productId;
  const idx = user.wishlist.findIndex(id => id.toString() === productId);

  if (idx >= 0) {
    user.wishlist.splice(idx, 1);
  } else {
    user.wishlist.push(productId);
  }

  await user.save();
  ApiResponse.success(res, { wishlist: user.wishlist, added: idx < 0 });
});

export const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'wishlist',
    select: 'name thumbnail price comparePrice rating reviewCount isActive',
    match: { isActive: true },
  });
  ApiResponse.success(res, { wishlist: user.wishlist });
});

// Admin
export const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) filter.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
    User.countDocuments(filter),
  ]);

  ApiResponse.success(res, { users, total });
});

export const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  user.isActive = !user.isActive;
  await user.save();
  ApiResponse.success(res, { isActive: user.isActive }, `User ${user.isActive ? 'activated' : 'deactivated'}`);
});
