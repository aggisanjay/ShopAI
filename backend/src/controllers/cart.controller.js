import cartService from '../services/cart.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user._id);
  ApiResponse.success(res, { cart });
});

export const addToCart = asyncHandler(async (req, res) => {
  const cart = await cartService.addItem(req.user._id, req.body);
  ApiResponse.success(res, { cart }, 'Item added to cart');
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const cart = await cartService.updateItem(req.user._id, req.params.itemId, req.body.quantity);
  ApiResponse.success(res, { cart }, 'Cart updated');
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await cartService.removeItem(req.user._id, req.params.itemId);
  ApiResponse.success(res, { cart }, 'Item removed');
});

export const clearCart = asyncHandler(async (req, res) => {
  await cartService.clearCart(req.user._id);
  ApiResponse.success(res, {}, 'Cart cleared');
});

export const applyCoupon = asyncHandler(async (req, res) => {
  const result = await cartService.applyCoupon(req.user._id, req.body.couponCode);
  ApiResponse.success(res, result, 'Coupon applied');
});
