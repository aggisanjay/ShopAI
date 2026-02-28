import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, PackageOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { selectCartItems, selectCartSubtotal, selectCartOpen, closeCart, updateCartItem, removeCartItem } from '../../store/slices/cartSlice.js';
import { selectIsAuthenticated } from '../../store/slices/authSlice.js';
import { openAuthModal } from '../../store/slices/uiSlice.js';
import Button from '../ui/Button.jsx';

export default function CartDrawer() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isOpen = useSelector(selectCartOpen);
  const items = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const isAuth = useSelector(selectIsAuthenticated);

  const handleCheckout = () => {
    if (!isAuth) {
      dispatch(closeCart());
      dispatch(openAuthModal('login'));
      return;
    }
    dispatch(closeCart());
    navigate('/checkout');
  };

  const shipping = subtotal >= 500 ? 0 : 49;
  const total = subtotal + shipping;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => dispatch(closeCart())}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md z-50 flex flex-col glass border-l border-obsidian-700/50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-obsidian-700/50">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-gold-400" />
                <h2 className="font-display text-lg font-semibold">
                  Cart <span className="text-obsidian-400 text-sm font-body font-normal">({items.length} items)</span>
                </h2>
              </div>
              <button
                onClick={() => dispatch(closeCart())}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-obsidian-700 text-obsidian-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <AnimatePresence>
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <PackageOpen className="w-16 h-16 text-obsidian-600 mb-4" />
                    <p className="text-obsidian-300 font-medium">Your cart is empty</p>
                    <p className="text-sm text-obsidian-500 mt-1">Add items to get started</p>
                    <Link
                      to="/products"
                      onClick={() => dispatch(closeCart())}
                      className="mt-4 text-sm text-gold-400 hover:text-gold-300 underline transition-colors"
                    >
                      Browse products
                    </Link>
                  </div>
                ) : (
                  items.map((item) => {
                    const product = item.product || item;
                    const price = item.price || product?.price || 0;
                    const name = product?.name || item.name;
                    const thumbnail = product?.thumbnail || item.thumbnail;
                    const itemId = item._id;

                    return (
                      <motion.div
                        key={itemId}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0 }}
                        className="flex gap-3 glass rounded-xl p-3"
                      >
                        <img
                          src={thumbnail || `https://picsum.photos/seed/${itemId}/80/80`}
                          alt={name}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{name}</p>
                          {item.variantName && (
                            <p className="text-xs text-obsidian-400">{item.variantName}</p>
                          )}
                          <p className="text-sm font-bold text-gold-400 mt-0.5">
                            ₹{(price * item.quantity).toLocaleString()}
                          </p>

                          {/* Qty controls */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1.5 glass rounded-lg p-0.5">
                              <button
                                onClick={() => dispatch(updateCartItem({ itemId, quantity: item.quantity - 1 }))}
                                className="w-6 h-6 flex items-center justify-center rounded hover:bg-obsidian-600 text-obsidian-300 hover:text-white transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                              <button
                                onClick={() => dispatch(updateCartItem({ itemId, quantity: item.quantity + 1 }))}
                                className="w-6 h-6 flex items-center justify-center rounded hover:bg-obsidian-600 text-obsidian-300 hover:text-white transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <button
                              onClick={() => dispatch(removeCartItem(itemId))}
                              className="w-6 h-6 flex items-center justify-center text-obsidian-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-obsidian-700/50 px-6 py-5 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-obsidian-300">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-obsidian-300">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? 'text-emerald-400' : ''}>
                      {shipping === 0 ? 'FREE' : `₹${shipping}`}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-xs text-obsidian-500">Add ₹{(500 - subtotal).toLocaleString()} more for free shipping</p>
                  )}
                  <div className="flex justify-between font-bold text-white text-base pt-1 border-t border-obsidian-700/50">
                    <span>Total</span>
                    <span className="text-gradient">₹{total.toLocaleString()}</span>
                  </div>
                </div>

                <Button fullWidth onClick={handleCheckout} iconRight={ArrowRight}>
                  Proceed to Checkout
                </Button>

                <Link
                  to="/products"
                  onClick={() => dispatch(closeCart())}
                  className="block text-center text-sm text-obsidian-400 hover:text-white transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
