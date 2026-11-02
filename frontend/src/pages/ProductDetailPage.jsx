import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingBag, Heart, Share2, Star, ShieldCheck, Truck, RotateCcw, ChevronRight, Minus, Plus, Check, Zap, ChevronDown, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { productsAPI, recoAPI, reviewsAPI, usersAPI } from '../api/index.js';
import { addToCart } from '../store/slices/cartSlice.js';
import { toggleWishlistItem, selectWishlist } from '../store/slices/productSlice.js';
import { selectIsAuthenticated } from '../store/slices/authSlice.js';
import { openAuthModal } from '../store/slices/uiSlice.js';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed.js';
import ProductRail from '../components/product/ProductRail.jsx';
import StarRating from '../components/ui/StarRating.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import { SITE } from '../config/site.js';
import { cn, formatINR } from '../lib/utils.js';

/** Image with cursor-following zoom (desktop) */
function ZoomImage({ src, alt }) {
  const [pos, setPos] = useState(null);
  return (
    <div
      className="group relative aspect-[4/5] cursor-zoom-in overflow-hidden rounded-[2rem] border border-white/[0.07] bg-obsidian-800 sm:aspect-square"
      onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }); }}
      onMouseLeave={() => setPos(null)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.img key={src} src={src} alt={alt} initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 h-full w-full object-cover" draggable="false" />
      </AnimatePresence>
      <div className="pointer-events-none absolute inset-0 hidden transition-opacity duration-300 md:block" style={{ opacity: pos ? 1 : 0, backgroundImage: `url(${src})`, backgroundSize: '220%', backgroundPosition: pos ? `${pos.x}% ${pos.y}%` : 'center' }} />
      <span className="glass pointer-events-none absolute bottom-4 right-4 hidden items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-obsidian-200 transition-opacity group-hover:opacity-0 md:flex"><ZoomIn className="h-3 w-3" />Hover to zoom</span>
    </div>
  );
}

function Accordion({ title, defaultOpen = false, children, count }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/[0.08]">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between py-6 text-left">
        <span className="font-display text-3xl tracking-tight">{title}{count !== undefined && <span className="ml-3 font-body text-sm text-obsidian-500">{count}</span>}</span>
        <span className={cn('grid h-10 w-10 place-items-center rounded-full border border-white/10 transition-all duration-500', open && 'rotate-180 bg-cream text-ink')}><ChevronDown className="h-4 w-4" /></span>
      </button>
      <div className={cn('grid transition-all duration-500 ease-out', open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}><div className="overflow-hidden"><div className="pb-8">{children}</div></div></div>
    </div>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuth = useSelector(selectIsAuthenticated);
  const wishlist = useSelector(selectWishlist);
  const { items: recent, push: pushRecent } = useRecentlyViewed();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);
  const [fbt, setFbt] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const ctaRef = useRef(null);
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    setLoading(true); setProduct(null); setActiveImage(0); setQuantity(1); setRelated([]); setFbt([]); setReviews([]);
    window.scrollTo({ top: 0 });
    productsAPI.getBySlug(slug)
      .then((res) => {
        const p = res.data.product;
        setProduct(p); pushRecent(p);
        recoAPI.getRelated(p._id, 8).then((r) => setRelated(r.data.products || [])).catch(() => {});
        recoAPI.getFBT(p._id).then((r) => setFbt(r.data.products || [])).catch(() => {});
        reviewsAPI.getByProduct(p._id, { limit: 6 }).then((r) => setReviews(r.data.reviews || [])).catch(() => {});
        recoAPI.trackEvent({ type: 'view', productId: p._id, metadata: { source: 'detail' } }).catch?.(() => {});
      })
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
  }, [slug]); // eslint-disable-line

  // show a sticky buy bar once the main CTA scrolls out of view
  useEffect(() => {
    const el = ctaRef.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el); return () => io.disconnect();
  }, [product]);

  const isWished = product && wishlist.includes(product._id);
  const stock = product ? Math.max(0, product.stock - (product.reservedStock || 0)) : 0;
  const discount = product?.comparePrice > product?.price ? Math.round((1 - product.price / product.comparePrice) * 100) : 0;

  const add = async () => {
    if (!isAuth) { dispatch(openAuthModal('login')); return false; }
    setAdding(true);
    recoAPI.trackEvent({ type: 'add_to_cart', productId: product._id, metadata: { price: product.price, quantity } });
    const res = await dispatch(addToCart({ productId: product._id, quantity }));
    setAdding(false);
    const ok = res.type.endsWith('fulfilled');
    if (ok) { setAdded(true); setTimeout(() => setAdded(false), 2000); }
    return ok;
  };
  const buyNow = async () => { if (await add()) navigate('/checkout'); };   // client-side nav: keeps Redux state (no full reload)
  const wish = async () => {
    if (!isAuth) return dispatch(openAuthModal('login'));
    dispatch(toggleWishlistItem(product._id));
    try { await usersAPI.toggleWishlist(product._id); } catch { dispatch(toggleWishlistItem(product._id)); toast.error('Could not update wishlist'); }
  };
  const share = async () => {
    try { if (navigator.share) await navigator.share({ title: product.name, url: location.href }); else { await navigator.clipboard.writeText(location.href); toast.success('Link copied'); } } catch { /* user cancelled */ }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-36"><div className="container-app grid gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div className="skeleton aspect-square rounded-[2rem]" />
        <div className="space-y-5">{[40, 90, 60, 30, 100, 100].map((w, i) => <div key={i} className="skeleton h-10 rounded-2xl" style={{ width: `${w}%` }} />)}</div>
      </div></div>
    );
  }
  if (!product) {
    return (
      <div className="grid min-h-screen place-items-center px-6 pt-24 text-center">
        <div><h1 className="font-display text-7xl">Not found</h1><p className="mb-8 mt-3 text-obsidian-400">This product may have been removed.</p><Link to="/products"><Button>Back to shop</Button></Link></div>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [product.thumbnail || `https://picsum.photos/seed/${product._id}/900/900`];
  const freeShip = product.freeShipping || product.price >= SITE.freeShippingThreshold;
  const otherRecent = recent.filter((r) => r._id !== product._id);

  return (
    <div className="min-h-screen pb-24 pt-28 sm:pt-32 lg:pb-8">
      <div className="container-app">
        <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-1.5 text-[13px] text-obsidian-400">
          <Link to="/" className="hover:text-white">Home</Link><ChevronRight className="h-3 w-3" />
          <Link to="/products" className="hover:text-white">Shop</Link><ChevronRight className="h-3 w-3" />
          {product.category && <><Link to={`/products?category=${product.category._id}`} className="hover:text-white">{product.category.name}</Link><ChevronRight className="h-3 w-3" /></>}
          <span className="max-w-[16rem] truncate text-obsidian-200">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          {/* Gallery */}
          <div className="flex flex-col-reverse gap-4 lg:sticky lg:top-28 lg:h-fit lg:flex-row">
            {images.length > 1 && (
              <div className="no-scrollbar flex gap-3 overflow-x-auto lg:max-h-[640px] lg:flex-col lg:overflow-y-auto">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImage(i)} aria-label={`Show image ${i + 1}`} aria-current={i === activeImage}
                    className={cn('h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border-2 transition-all duration-300', i === activeImage ? 'border-cream' : 'border-transparent opacity-50 hover:opacity-100')}>
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="min-w-0 flex-1"><ZoomImage src={images[activeImage]} alt={product.name} /></div>
          </div>

          {/* Info */}
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {product.brand && <Badge variant="gray">{product.brand}</Badge>}
              {discount > 0 && <Badge variant="gold">{discount}% off</Badge>}
              {product.isFeatured && <Badge variant="gray">Featured</Badge>}
              {stock > 0 && stock <= 5 && <Badge variant="red">Only {stock} left</Badge>}
            </div>

            <h1 className="font-display text-5xl leading-[0.98] tracking-[-0.025em] sm:text-6xl">{product.name}</h1>

            <div className="mt-5 flex items-center gap-3">
              <StarRating rating={product.rating} count={product.reviewCount} size="md" />
              {product.viewCount > 0 && <><span className="text-obsidian-600">·</span><span className="text-sm text-obsidian-400">{product.viewCount.toLocaleString()} views</span></>}
            </div>

            <div className="mt-7 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="tabular font-display text-6xl leading-none">{formatINR(product.price)}</span>
              {discount > 0 && <>
                <span className="tabular text-xl text-obsidian-500 line-through">{formatINR(product.comparePrice)}</span>
                <span className="text-sm font-medium text-emerald-300">Save {formatINR(product.comparePrice - product.price)}</span>
              </>}
            </div>
            <p className="mt-1.5 text-xs text-obsidian-500">Inclusive of all taxes</p>

            {product.shortDescription && <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-obsidian-300">{product.shortDescription}</p>}

            <div ref={ctaRef} className="mt-9 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-full border border-white/10 bg-white/[0.03]">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity" className="grid h-14 w-14 place-items-center rounded-full transition-colors hover:bg-white/10"><Minus className="h-4 w-4" /></button>
                  <span className="tabular w-8 text-center text-lg" aria-live="polite">{quantity}</span>
                  <button onClick={() => setQuantity((q) => Math.min(stock || 10, q + 1))} aria-label="Increase quantity" className="grid h-14 w-14 place-items-center rounded-full transition-colors hover:bg-white/10"><Plus className="h-4 w-4" /></button>
                </div>
                <Button fullWidth size="lg" loading={adding} disabled={stock === 0} onClick={add} icon={added ? Check : ShoppingBag} className={added ? '!bg-emerald-300' : ''}>
                  {stock === 0 ? 'Sold out' : added ? 'Added to bag' : 'Add to bag'}
                </Button>
                <button onClick={wish} aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={isWished}
                  className={cn('grid h-14 w-14 flex-shrink-0 place-items-center rounded-full border transition-all duration-300', isWished ? 'border-accent bg-accent text-ink' : 'border-white/10 text-obsidian-200 hover:bg-white/10')}>
                  <Heart className={cn('h-5 w-5', isWished && 'fill-current')} />
                </button>
                <button onClick={share} aria-label="Share" className="hidden h-14 w-14 flex-shrink-0 place-items-center rounded-full border border-white/10 text-obsidian-200 transition-colors hover:bg-white/10 sm:grid"><Share2 className="h-5 w-5" /></button>
              </div>
              {stock > 0 && <Button variant="outline" fullWidth size="lg" onClick={buyNow} icon={Zap}>Buy now</Button>}
              <p className="pt-1 text-center text-[13px] text-obsidian-500">{stock > 0 ? `${stock} available` : 'Currently unavailable'}</p>
            </div>

            <ul className="mt-8 grid gap-px overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-3">
              {[
                { I: Truck, t: freeShip ? 'Free delivery' : `Free over ${formatINR(SITE.freeShippingThreshold)}` },
                { I: ShieldCheck, t: 'Secure payment' },
                { I: RotateCcw, t: '30-day returns' },
              ].map(({ I, t }) => <li key={t} className="flex items-center gap-3 bg-obsidian-900 px-5 py-4 text-sm text-obsidian-200"><I className="h-[18px] w-[18px] flex-shrink-0 text-obsidian-400" strokeWidth={1.6} />{t}</li>)}
            </ul>

            <div className="mt-10 border-t border-white/[0.08]">
              <Accordion title="Description" defaultOpen><p className="max-w-2xl whitespace-pre-line leading-relaxed text-obsidian-300">{product.description}</p></Accordion>
              <Accordion title="Specifications">
                {product.attributes?.length > 0 ? (
                  <dl className="divide-y divide-white/[0.07]">{product.attributes.map((a) => <div key={a.key} className="grid grid-cols-3 gap-4 py-3 text-sm"><dt className="text-obsidian-400">{a.key}</dt><dd className="col-span-2 text-cream">{a.value}</dd></div>)}</dl>
                ) : <p className="text-sm text-obsidian-400">No specifications listed.</p>}
              </Accordion>
              <Accordion title="Reviews" count={product.reviewCount || 0}>
                <div className="space-y-5">
                  {product.reviewCount > 0 && (
                    <div className="flex items-center gap-8 rounded-3xl border border-white/[0.07] bg-white/[0.02] p-6">
                      <div className="text-center"><div className="font-display text-7xl leading-none">{Number(product.rating).toFixed(1)}</div><div className="mt-3"><StarRating rating={product.rating} size="md" /></div></div>
                      <div className="flex-1 space-y-2">
                        {[5, 4, 3, 2, 1].map((r) => (
                          <div key={r} className="flex items-center gap-3 text-xs text-obsidian-400">
                            <span className="flex w-6 items-center gap-0.5">{r}<Star className="h-3 w-3 fill-current" /></span>
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-accent" style={{ width: `${product.reviewCount ? ((product.ratingDistribution?.[r] || 0) / product.reviewCount) * 100 : 0}%` }} /></div>
                            <span className="tabular w-6 text-right">{product.ratingDistribution?.[r] || 0}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {reviews.map((rv) => (
                    <article key={rv._id} className="rounded-3xl border border-white/[0.07] p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-10 w-10 place-items-center rounded-full bg-cream text-sm font-semibold text-ink">{rv.user?.name?.charAt(0)}</span>
                          <div><p className="text-sm font-medium">{rv.user?.name}</p><div className="mt-0.5 flex items-center gap-2"><StarRating rating={rv.rating} />{rv.isVerifiedPurchase && <span className="badge-green"><Check className="h-2.5 w-2.5" />Verified</span>}</div></div>
                        </div>
                        <time className="text-xs text-obsidian-500">{new Date(rv.createdAt).toLocaleDateString()}</time>
                      </div>
                      {rv.title && <p className="mt-4 font-medium">{rv.title}</p>}
                      {rv.body && <p className="mt-1.5 text-sm leading-relaxed text-obsidian-300">{rv.body}</p>}
                    </article>
                  ))}
                  {reviews.length === 0 && <p className="py-4 text-sm text-obsidian-400">No reviews yet. Be the first to share your thoughts.</p>}
                </div>
              </Accordion>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-28 space-y-24">
        <ProductRail eyebrow="Similar taste" title="You might also" accentWord="like" products={related} />
        <ProductRail eyebrow="Complete the set" title="Bought" accentWord="together" products={fbt} />
        {otherRecent.length > 0 && <ProductRail eyebrow="History" title="Recently" accentWord="viewed" products={otherRecent} />}
      </div>

      {/* Mobile / scrolled sticky buy bar */}
      <AnimatePresence>
        {showSticky && stock > 0 && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} transition={{ type: 'spring', damping: 30, stiffness: 340 }}
            className="glass-dark safe-bottom fixed inset-x-0 bottom-0 z-40 border-x-0 border-b-0 px-4 py-3 sm:inset-x-6 sm:bottom-5 sm:rounded-full sm:border sm:py-2.5 sm:pl-3 lg:left-1/2 lg:right-auto lg:w-[640px] lg:-translate-x-1/2">
            <div className="flex items-center gap-3">
              <img src={images[0]} alt="" className="hidden h-12 w-12 rounded-2xl object-cover sm:block sm:rounded-full" />
              <div className="min-w-0 flex-1"><p className="truncate text-sm">{product.name}</p><p className="tabular font-display text-xl leading-none">{formatINR(product.price * quantity)}</p></div>
              <Button loading={adding} onClick={add} icon={ShoppingBag}>Add to bag</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
