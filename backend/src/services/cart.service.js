import Cart from '../models/Cart.model.js';
import Product from '../models/Product.model.js';
import Coupon from '../models/Coupon.model.js';
import { ApiError } from '../utils/apiResponse.js';

export class CartService {
  async getCart(userId) {
    let cart = await Cart.findOne({ user: userId })
      .populate({
        path: 'items.product',
        select: 'name thumbnail price comparePrice stock reservedStock isActive isPublished brand',
        populate: { path: 'category', select: 'name slug' },
      });

    if (!cart) {
      cart = { items: [], subtotal: 0, totalItems: 0 };
      return cart;
    }

    // Filter out unavailable products and sync prices
    cart.items = cart.items.filter(item =>
      item.product && item.product.isActive && item.product.isPublished
    );

    await cart.save();
    return cart;
  }

  async addItem(userId, { productId, quantity = 1, variantId }) {
    const product = await Product.findOne({ _id: productId, isActive: true, isPublished: true });
    if (!product) throw ApiError.notFound('Product not found');

    const available = product.stock - product.reservedStock;
    if (product.trackInventory && available < quantity) {
      throw ApiError.conflict(`Only ${available} items available`);
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    const existingIndex = cart.items.findIndex(i =>
      i.product.toString() === productId && (!variantId || i.variantId?.toString() === variantId)
    );

    if (existingIndex >= 0) {
      const newQty = cart.items[existingIndex].quantity + quantity;
      if (product.trackInventory && available < newQty) {
        throw ApiError.conflict(`Only ${available} items available`);
      }
      cart.items[existingIndex].quantity = newQty;
      cart.items[existingIndex].price = product.price;
    } else {
      cart.items.push({
        product: productId,
        variantId,
        quantity,
        price: product.price,
      });
    }

    cart.lastActivity = new Date();
    cart.isAbandoned = false;
    await cart.save();

    return this.getCart(userId);
  }

  async updateItem(userId, itemId, quantity) {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw ApiError.notFound('Cart not found');

    const item = cart.items.id(itemId);
    if (!item) throw ApiError.notFound('Cart item not found');

    if (quantity <= 0) {
      item.deleteOne();
    } else {
      const product = await Product.findById(item.product);
      const available = product.stock - product.reservedStock;
      if (product.trackInventory && available < quantity) {
        throw ApiError.conflict(`Only ${available} items available`);
      }
      item.quantity = quantity;
    }

    cart.lastActivity = new Date();
    await cart.save();
    return this.getCart(userId);
  }

  async removeItem(userId, itemId) {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw ApiError.notFound('Cart not found');

    cart.items = cart.items.filter(i => i._id.toString() !== itemId);
    cart.lastActivity = new Date();
    await cart.save();
    return this.getCart(userId);
  }

  async clearCart(userId) {
    await Cart.findOneAndDelete({ user: userId });
  }

  async applyCoupon(userId, couponCode) {
    const cart = await Cart.findOne({ user: userId }).populate('items.product', 'price');
    if (!cart || cart.items.length === 0) throw ApiError.badRequest('Cart is empty');

    const subtotal = cart.items.reduce((s, i) => s + (i.product?.price || 0) * i.quantity, 0);
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (!coupon) throw ApiError.notFound('Coupon not found');

    const validity = coupon.isValid(userId, subtotal);
    if (!validity.valid) throw ApiError.badRequest(validity.reason);

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = Math.min((subtotal * coupon.value) / 100, coupon.maxDiscount || Infinity);
    } else if (coupon.type === 'fixed') {
      discount = Math.min(coupon.value, subtotal);
    }

    cart.couponCode = coupon.code;
    cart.couponDiscount = Math.round(discount * 100) / 100;
    await cart.save();

    return { discount: cart.couponDiscount, couponCode: coupon.code };
  }
}

export default new CartService();
