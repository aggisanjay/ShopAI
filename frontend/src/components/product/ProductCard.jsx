import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingCart, Heart, Eye, Star, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { addToCart } from '../../store/slices/cartSlice.js';
import { toggleWishlistItem, selectWishlist } from '../../store/slices/productSlice.js';
import { selectIsAuthenticated } from '../../store/slices/authSlice.js';
import { openAuthModal } from '../../store/slices/uiSlice.js';
import { usersAPI } from '../../api/index.js';
import toast from 'react-hot-toast';

export default function ProductCard({ product, index = 0 }) {
  const dispatch = useDispatch();
  const isAuth = useSelector(selectIsAuthenticated);
  const wishlist = useSelector(selectWishlist);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const isWishlisted = wishlist.includes(product._id);
  const discountPct = product.comparePrice > product.price
    ? Math.round((1 - product.price / product.comparePrice) * 100) : 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!isAuth) {
      dispatch(openAuthModal('login'));
      return;
    }
    setIsAddingToCart(true);
    await dispatch(addToCart({ productId: product._id, quantity: 1 }));
    setIsAddingToCart(false);
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!isAuth) {
      dispatch(openAuthModal('login'));
      return;
    }
    dispatch(toggleWishlistItem(product._id));
    try {
      await usersAPI.toggleWishlist(product._id);
    } catch {
      dispatch(toggleWishlistItem(product._id)); // revert
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link to={`/product/${product.slug}`} className="product-card block group">
        {/* Image */}
        <div className="relative overflow-hidden bg-obsidian-800 aspect-[4/3]">
          {!imageLoaded && (
            <div className="absolute inset-0 skeleton" />
          )}
          <img
            src={product.thumbnail || product.images?.[0] || `https://picsum.photos/seed/${product._id}/400/300`}
            alt={product.name}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          />

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {discountPct > 0 && (
              <span className="badge-gold text-[11px]">-{discountPct}%</span>
            )}
            {product.isFeatured && (
              <span className="badge bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px]">
                Featured
              </span>
            )}
            {product.stock === 0 && (
              <span className="badge-red text-[11px]">Out of Stock</span>
            )}
          </div>

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-xl backdrop-blur-sm transition-all duration-200 ${
              isWishlisted
                ? 'bg-red-500 text-white scale-110'
                : 'bg-obsidian-800/70 text-obsidian-400 hover:text-red-400 hover:bg-obsidian-700'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>

          {/* Quick add to cart on hover */}
          <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart || product.stock === 0}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all backdrop-blur-sm
                ${product.stock === 0
                  ? 'bg-obsidian-700/80 text-obsidian-400 cursor-not-allowed'
                  : 'bg-gold-500 hover:bg-gold-400 text-obsidian-900 active:scale-[0.98]'
                }`}
            >
              {isAddingToCart ? (
                <div className="w-4 h-4 border-2 border-obsidian-900/50 border-t-obsidian-900 rounded-full animate-spin" />
              ) : (
                <ShoppingCart className="w-3.5 h-3.5" />
              )}
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 space-y-2">
          <div>
            <p className="text-xs text-obsidian-400 mb-0.5">{product.brand || product.category?.name}</p>
            <h3 className="text-sm font-medium text-white leading-snug line-clamp-2 group-hover:text-gold-300 transition-colors">
              {product.name}
            </h3>
          </div>

          {/* Rating */}
          {product.rating > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {[1,2,3,4,5].map(s => (
                  <Star
                    key={s}
                    className={`w-3 h-3 ${s <= Math.round(product.rating) ? 'fill-gold-400 text-gold-400' : 'fill-obsidian-600 text-obsidian-600'}`}
                  />
                ))}
              </div>
              <span className="text-xs text-obsidian-400">({product.reviewCount || 0})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-gradient">
                ₹{product.price?.toLocaleString()}
              </span>
              {product.comparePrice > product.price && (
                <span className="text-xs text-obsidian-500 line-through">
                  ₹{product.comparePrice?.toLocaleString()}
                </span>
              )}
            </div>
            {product.stock > 0 && product.stock <= 5 && (
              <span className="text-[10px] text-orange-400 font-medium">Only {product.stock} left</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}