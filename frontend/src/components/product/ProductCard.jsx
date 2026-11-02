import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, Eye, Check, Plus, Truck } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import toast from 'react-hot-toast';
import { addToCart } from '../../store/slices/cartSlice.js';
import { toggleWishlistItem, selectWishlist } from '../../store/slices/productSlice.js';
import { selectIsAuthenticated } from '../../store/slices/authSlice.js';
import { openAuthModal } from '../../store/slices/uiSlice.js';
import { usersAPI } from '../../api/index.js';
import StarRating from '../ui/StarRating.jsx';
import QuickView from './QuickView.jsx';
import { cn, formatINR } from '../../lib/utils.js';
import { SITE } from '../../config/site.js';

export default function ProductCard({ product, index = 0, className }) {
  const dispatch = useDispatch();
  const reduce = useReducedMotion();
  const isAuth = useSelector(selectIsAuthenticated);
  const wishlist = useSelector(selectWishlist);
  const [loaded, setLoaded] = useState(false);
  const [state, setState] = useState('idle'); // idle | adding | added
  const [quick, setQuick] = useState(false);
  const imgRef = useRef(null);
  // cached images can finish loading before React attaches onLoad
  useEffect(() => { if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) setLoaded(true); }, []);

  const main = product.thumbnail || product.images?.[0] || `https://picsum.photos/seed/${product._id}/600/750`;
  const alt = product.images?.[1];
  const wished = wishlist.includes(product._id);
  const out = product.stock === 0;
  const discount = product.comparePrice > product.price ? Math.round((1 - product.price / product.comparePrice) * 100) : 0;
  const freeShip = product.freeShipping || product.price >= SITE.freeShippingThreshold;

  const add = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuth) return dispatch(openAuthModal('login'));
    if (out || state !== 'idle') return;
    setState('adding');
    const res = await dispatch(addToCart({ productId: product._id, quantity: 1 }));
    setState(res.type.endsWith('fulfilled') ? 'added' : 'idle');
    setTimeout(() => setState('idle'), 1800);
  };

  const wish = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuth) return dispatch(openAuthModal('login'));
    dispatch(toggleWishlistItem(product._id));
    try { await usersAPI.toggleWishlist(product._id); }
    catch { dispatch(toggleWishlistItem(product._id)); toast.error('Could not update wishlist'); }
  };

  return (
    <>
      <motion.article
        initial={reduce ? false : { opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.7, delay: Math.min(index, 8) * 0.05, ease: [0.22, 1, 0.36, 1] }}
        className={cn('group/card', className)}
      >
        <Link to={`/product/${product.slug}`} className="product-card block" aria-label={product.name}>
          <div className="relative aspect-[4/5] overflow-hidden bg-obsidian-800">
            {!loaded && <div className="skeleton absolute inset-0 rounded-none" />}
            <img
              ref={imgRef} src={main} alt={product.name} loading="lazy" decoding="async" onLoad={() => setLoaded(true)}
              className={cn('absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out', loaded ? 'opacity-100' : 'opacity-0',
                alt ? 'group-hover/card:opacity-0' : 'group-hover/card:scale-[1.06]')}
            />
            {alt && <img src={alt} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full scale-105 object-cover opacity-0 transition-all duration-700 ease-out group-hover/card:scale-100 group-hover/card:opacity-100" />}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-500 group-hover/card:opacity-100" />

            <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
              {discount > 0 && <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-ink">−{discount}%</span>}
              {product.isFeatured && <span className="glass rounded-full px-2.5 py-1 text-[11px] font-medium text-cream">Featured</span>}
              {out && <span className="rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-obsidian-200 backdrop-blur">Sold out</span>}
            </div>

            <div className="absolute right-3 top-3 flex flex-col gap-2">
              <motion.button
                onClick={wish} aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={wished} whileTap={{ scale: 0.8 }}
                className={cn('grid h-10 w-10 place-items-center rounded-full backdrop-blur-md transition-colors duration-300', wished ? 'bg-accent text-ink' : 'bg-black/35 text-white hover:bg-black/60')}
              >
                <Heart className={cn('h-4 w-4 transition-transform duration-300', wished && 'scale-110 fill-current')} />
              </motion.button>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuick(true); }} aria-label="Quick view"
                className="grid h-10 w-10 translate-x-2 place-items-center rounded-full bg-black/35 text-white opacity-0 backdrop-blur-md transition-all duration-300 hover:bg-black/60 group-hover/card:translate-x-0 group-hover/card:opacity-100 focus-visible:translate-x-0 focus-visible:opacity-100"
              ><Eye className="h-4 w-4" /></button>
            </div>

            <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-500 ease-out group-hover/card:translate-y-0 group-hover/card:opacity-100 focus-within:translate-y-0 focus-within:opacity-100 max-md:hidden">
              <button
                onClick={add} disabled={out}
                className={cn('flex h-11 w-full items-center justify-center gap-2 rounded-full text-[13.5px] font-medium backdrop-blur-md transition-all duration-300 active:scale-[0.97]',
                  out ? 'cursor-not-allowed bg-black/60 text-obsidian-400' : state === 'added' ? 'bg-emerald-400 text-ink' : 'bg-cream text-ink hover:bg-white')}
              >
                {state === 'adding' ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/25 border-t-ink" />
                  : state === 'added' ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {out ? 'Sold out' : state === 'added' ? 'Added to bag' : 'Add to bag'}
              </button>
            </div>
          </div>

          <div className="space-y-2 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-mono text-[10.5px] uppercase tracking-[0.18em] text-obsidian-400">{product.brand || product.category?.name}</p>
              {freeShip && <span className="flex flex-shrink-0 items-center gap-1 text-[11px] text-obsidian-400"><Truck className="h-3 w-3" />Free</span>}
            </div>
            <h3 className="line-clamp-2 min-h-[2.6em] font-body text-[15px] font-normal leading-[1.3] tracking-tight text-cream">{product.name}</h3>
            {product.rating > 0 && <StarRating rating={product.rating} count={product.reviewCount || 0} />}
            <div className="flex flex-wrap items-end justify-between gap-x-2 gap-y-1 pt-1">
              <div className="flex items-baseline gap-2">
                <span className="tabular font-display text-[26px] leading-none text-cream">{formatINR(product.price)}</span>
                {discount > 0 && <span className="tabular text-xs text-obsidian-500 line-through">{formatINR(product.comparePrice)}</span>}
              </div>
              {!out && product.stock > 0 && product.stock <= 5 && <span className="whitespace-nowrap text-[11px] font-medium text-accent">Only {product.stock} left</span>}
            </div>
            {/* touch devices have no hover: always show a compact add button */}
            <button onClick={add} disabled={out} className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-full border border-white/10 text-[13px] font-medium text-cream transition-colors active:bg-white/10 disabled:opacity-40 md:hidden">
              {state === 'added' ? <><Check className="h-4 w-4" />Added</> : <><Plus className="h-4 w-4" />{out ? 'Sold out' : 'Add to bag'}</>}
            </button>
          </div>
        </Link>
      </motion.article>
      <QuickView product={product} open={quick} onClose={() => setQuick(false)} />
    </>
  );
}
