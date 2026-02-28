import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ShoppingCart, Heart, Share2, Star, Shield, Truck, RotateCcw,
  ChevronRight, Minus, Plus, Check, Zap, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { productsAPI, recoAPI, reviewsAPI } from '../api/index.js';
import { addToCart } from '../store/slices/cartSlice.js';
import { toggleWishlistItem, selectWishlist } from '../store/slices/productSlice.js';
import { selectIsAuthenticated } from '../store/slices/authSlice.js';
import { openAuthModal } from '../store/slices/uiSlice.js';
import ProductCard from '../components/product/ProductCard.jsx';
import { ProductCardSkeleton } from '../components/ui/Skeleton.jsx';
import StarRating from '../components/ui/StarRating.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import { usersAPI } from '../api/index.js';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const isAuth = useSelector(selectIsAuthenticated);
  const wishlist = useSelector(selectWishlist);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);
  const [fbt, setFbt] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    setLoading(true);
    setProduct(null);
    productsAPI.getBySlug(slug)
      .then(res => {
        const p = res.data.product;
        setProduct(p);
        // Load related and reviews
        recoAPI.getRelated(p._id, 5).then(r => setRelated(r.data.products || []));
        recoAPI.getFBT(p._id).then(r => setFbt(r.data.products || []));
        reviewsAPI.getByProduct(p._id, { limit: 6 }).then(r => setReviews(r.data.reviews || []));
        // Track view
        recoAPI.trackEvent({ type: 'view', productId: p._id, metadata: { source: 'detail' } });
      })
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  const isWishlisted = product && wishlist.includes(product._id);
  const availableStock = product ? Math.max(0, product.stock - (product.reservedStock || 0)) : 0;

  const handleAddToCart = async () => {
    if (!isAuth) { dispatch(openAuthModal('login')); return; }
    if (!product) return;
    setAddingToCart(true);
    recoAPI.trackEvent({ type: 'add_to_cart', productId: product._id, metadata: { price: product.price, quantity } });
    await dispatch(addToCart({ productId: product._id, quantity }));
    setAddingToCart(false);
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    // Navigate to checkout
    window.location.href = '/checkout';
  };

  const handleWishlist = async () => {
    if (!isAuth) { dispatch(openAuthModal('login')); return; }
    dispatch(toggleWishlistItem(product._id));
    await usersAPI.toggleWishlist(product._id);
  };

  const discountPct = product?.comparePrice > product?.price
    ? Math.round((1 - product.price / product.comparePrice) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen pt-20">
        <div className="container-app py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="skeleton aspect-square rounded-2xl" />
            <div className="space-y-4">
              {Array(6).fill(null).map((_, i) => (
                <div key={i} className="skeleton h-8 rounded-xl" style={{ width: `${70 + Math.random() * 30}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return (
    <div className="min-h-screen pt-20 flex items-center justify-center text-obsidian-400">
      Product not found
    </div>
  );

  const images = product.images?.length > 0 ? product.images : [product.thumbnail || `https://picsum.photos/seed/${product._id}/600/600`];

  return (
    <div className="min-h-screen pt-20">
      <div className="container-app py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-obsidian-400 mb-8">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/products" className="hover:text-white transition-colors">Products</Link>
          <ChevronRight className="w-3 h-3" />
          {product.category && (
            <>
              <Link to={`/products?category=${product.category._id}`} className="hover:text-white transition-colors">
                {product.category.name}
              </Link>
              <ChevronRight className="w-3 h-3" />
            </>
          )}
          <span className="text-obsidian-300 truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square glass rounded-2xl overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  src={images[activeImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto no-scrollbar">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      i === activeImage ? 'border-gold-500' : 'border-obsidian-700 hover:border-obsidian-500'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Brand & badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {product.brand && <Badge variant="gray">{product.brand}</Badge>}
              {discountPct > 0 && <Badge variant="gold">{discountPct}% OFF</Badge>}
              {product.isFeatured && <Badge variant="purple">Featured</Badge>}
              {availableStock <= 5 && availableStock > 0 && (
                <Badge variant="red">Only {availableStock} left</Badge>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-display font-bold text-white leading-snug">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <StarRating rating={product.rating} count={product.reviewCount} size="md" />
              <span className="text-sm text-obsidian-400">•</span>
              <span className="text-sm text-obsidian-400">{product.viewCount?.toLocaleString() || 0} views</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-display font-bold text-gradient">
                ₹{product.price?.toLocaleString()}
              </span>
              {product.comparePrice > product.price && (
                <span className="text-lg text-obsidian-500 line-through">
                  ₹{product.comparePrice?.toLocaleString()}
                </span>
              )}
              {discountPct > 0 && (
                <span className="text-base text-emerald-400 font-medium">
                  Save ₹{(product.comparePrice - product.price).toLocaleString()}
                </span>
              )}
            </div>

            {/* Short description */}
            {product.shortDescription && (
              <p className="text-obsidian-300 leading-relaxed">{product.shortDescription}</p>
            )}

            {/* Quantity */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-obsidian-200">Quantity</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center glass rounded-xl p-1">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-obsidian-700 text-obsidian-300 hover:text-white transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-bold text-white text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(availableStock || 10, q + 1))}
                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-obsidian-700 text-obsidian-300 hover:text-white transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm text-obsidian-400">
                  {availableStock > 0 ? `${availableStock} available` : 'Out of Stock'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                fullWidth
                size="lg"
                loading={addingToCart}
                disabled={availableStock === 0}
                onClick={handleAddToCart}
                icon={ShoppingCart}
              >
                {availableStock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
              <button
                onClick={handleWishlist}
                className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl border transition-all ${
                  isWishlisted
                    ? 'bg-red-500/20 border-red-500/40 text-red-400'
                    : 'border-obsidian-600 hover:border-obsidian-500 text-obsidian-400 hover:text-white'
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={() => navigator.clipboard?.writeText(window.location.href) && toast.success('Link copied!')}
                className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl border border-obsidian-600 hover:border-obsidian-500 text-obsidian-400 hover:text-white transition-all"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {availableStock > 0 && (
              <Button variant="ghost" fullWidth size="lg" onClick={handleBuyNow}>
                <Zap className="w-4 h-4" /> Buy Now
              </Button>
            )}

            {/* Guarantees */}
            <div className="glass rounded-xl p-4 space-y-3">
              {[
                { icon: Truck, text: 'Free delivery on orders above ₹500', color: 'text-blue-400' },
                { icon: Shield, text: '100% Secure & Safe Payment', color: 'text-green-400' },
                { icon: RotateCcw, text: '30-day hassle-free returns', color: 'text-purple-400' },
              ].map(({ icon: Icon, text, color }) => (
                <div key={text} className="flex items-center gap-3 text-sm text-obsidian-300">
                  <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs: description, reviews */}
        <div className="mb-12">
          <div className="flex border-b border-obsidian-700/50 mb-6 gap-1">
            {['description', 'reviews', 'specifications'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium capitalize border-b-2 transition-all ${
                  activeTab === tab
                    ? 'border-gold-500 text-gold-400'
                    : 'border-transparent text-obsidian-400 hover:text-white'
                }`}
              >
                {tab} {tab === 'reviews' && `(${product.reviewCount || 0})`}
              </button>
            ))}
          </div>

          {activeTab === 'description' && (
            <div className="max-w-3xl">
              <p className="text-obsidian-300 leading-relaxed">{product.description}</p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="max-w-3xl space-y-4">
              {/* Summary */}
              <div className="glass rounded-2xl p-6 flex items-center gap-8">
                <div className="text-center">
                  <div className="text-5xl font-display font-bold text-gradient">{product.rating}</div>
                  <StarRating rating={product.rating} size="md" />
                  <p className="text-xs text-obsidian-400 mt-1">{product.reviewCount} reviews</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[5,4,3,2,1].map(r => (
                    <div key={r} className="flex items-center gap-2">
                      <span className="text-xs text-obsidian-400 w-4">{r}</span>
                      <Star className="w-3 h-3 fill-gold-400 text-gold-400" />
                      <div className="flex-1 h-1.5 bg-obsidian-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gold-500 rounded-full"
                          style={{ width: `${product.reviewCount ? (product.ratingDistribution?.[r] || 0) / product.reviewCount * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-obsidian-500 w-6">{product.ratingDistribution?.[r] || 0}</span>
                    </div>
                  ))}
                </div>
              </div>

              {reviews.map(review => (
                <div key={review._id} className="glass rounded-xl p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-obsidian-900 text-xs font-bold">
                        {review.user?.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{review.user?.name}</p>
                        <div className="flex items-center gap-2">
                          <StarRating rating={review.rating} size="sm" />
                          {review.isVerifiedPurchase && (
                            <span className="badge-green text-[10px]">
                              <Check className="w-2.5 h-2.5" /> Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-obsidian-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.title && <p className="text-sm font-medium text-white">{review.title}</p>}
                  {review.body && <p className="text-sm text-obsidian-300">{review.body}</p>}
                </div>
              ))}

              {reviews.length === 0 && (
                <p className="text-obsidian-400 text-sm text-center py-8">No reviews yet. Be the first to review!</p>
              )}
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="max-w-2xl">
              {product.attributes?.length > 0 ? (
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-obsidian-700/50">
                    {product.attributes.map(attr => (
                      <tr key={attr.key} className="glass">
                        <td className="py-3 px-4 text-obsidian-400 font-medium w-1/3">{attr.key}</td>
                        <td className="py-3 px-4 text-white">{attr.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-obsidian-400 text-sm">No specifications available</p>
              )}
            </div>
          )}
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section>
            <h2 className="section-title mb-6">You Might Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {related.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
            </div>
          </section>
        )}

        {/* Frequently bought together */}
        {fbt.length > 0 && (
          <section className="mt-12">
            <h2 className="section-title mb-6">Frequently Bought Together</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {fbt.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
