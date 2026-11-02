import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Tag, Truck, Check, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  selectCartItems, selectCartSubtotal, selectCartOpen, closeCart, updateCartItem, removeCartItem, applyCoupon,
} from '../../store/slices/cartSlice.js';
import { selectIsAuthenticated } from '../../store/slices/authSlice.js';
import { openAuthModal } from '../../store/slices/uiSlice.js';
import Button from '../ui/Button.jsx';
import { SITE } from '../../config/site.js';
import { formatINR } from '../../lib/utils.js';

export default function CartDrawer() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isOpen = useSelector(selectCartOpen);
  const items = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const couponCode = useSelector((s) => s.cart.couponCode);
  const couponDiscount = useSelector((s) => s.cart.couponDiscount);
  const isAuth = useSelector(selectIsAuthenticated);
  const [coupon, setCoupon] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && dispatch(closeCart());
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [isOpen, dispatch]);

  const threshold = SITE.freeShippingThreshold;
  const shipping = subtotal >= threshold ? 0 : SITE.shippingFee;
  const total = Math.max(0, subtotal - (couponDiscount || 0)) + shipping;
  const progress = Math.min(100, (subtotal / threshold) * 100);
  const remaining = Math.max(0, threshold - subtotal);

  const handleCheckout = () => {
    dispatch(closeCart());
    if (!isAuth) { dispatch(openAuthModal('login')); return; }
    navigate('/checkout');
  };

  const handleCoupon = async (e) => {
    e.preventDefault();
    if (!coupon.trim()) return;
    if (!isAuth) { dispatch(closeCart()); dispatch(openAuthModal('login')); return; }
    setApplying(true);
    const res = await dispatch(applyCoupon(coupon.trim()));
    setApplying(false);
    if (res.type.endsWith('fulfilled')) setCoupon('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Shopping cart">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={() => dispatch(closeCart())}
          />
          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="glass-dark absolute right-0 top-0 flex h-full w-full max-w-[460px] flex-col sm:m-3 sm:h-[calc(100%-1.5rem)] sm:rounded-[2rem]"
          >
            <header className="flex items-center justify-between px-6 pb-4 pt-6">
              <div>
                <h2 className="font-display text-3xl leading-none">Your bag</h2>
                <p className="eyebrow mt-2">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
              </div>
              <button onClick={() => dispatch(closeCart())} aria-label="Close cart" className="grid h-10 w-10 place-items-center rounded-full text-obsidian-300 transition-colors hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
            </header>

            {/* Free-shipping progress */}
            {items.length > 0 && (
              <div className="mx-6 mb-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
                <div className="mb-2.5 flex items-center gap-2 text-[13px]">
                  {remaining === 0 ? <Check className="h-4 w-4 text-emerald-300" /> : <Truck className="h-4 w-4 text-accent" />}
                  <span className="text-obsidian-100">
                    {remaining === 0 ? 'You’ve unlocked free shipping' : <>Add <b className="font-semibold text-white">{formatINR(remaining)}</b> for free shipping</>}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <motion.div initial={false} animate={{ width: `${progress}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className={`h-full rounded-full ${remaining === 0 ? 'bg-emerald-400' : 'bg-accent'}`} />
                </div>
              </div>
            )}

            <div className="flex-1 space-y-3 overflow-y-auto px-6 pb-4">
              {items.length === 0 ? (
                <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
                  <div className="mb-5 grid h-20 w-20 place-items-center rounded-full border border-white/10 bg-white/[0.03]"><ShoppingBag className="h-8 w-8 text-obsidian-400" /></div>
                  <p className="font-display text-3xl">Nothing here yet</p>
                  <p className="mt-2 max-w-[16rem] text-sm text-obsidian-400">Find something you love and it will wait for you here.</p>
                  <Link to="/products" onClick={() => dispatch(closeCart())} className="mt-6"><Button iconRight={ArrowRight}>Browse products</Button></Link>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map((item) => {
                    const product = item.product || item;
                    const price = item.price || product?.price || 0;
                    const name = product?.name || item.name;
                    const thumb = product?.thumbnail || item.thumbnail;
                    const itemId = item._id;
                    return (
                      <motion.div
                        key={itemId} layout
                        initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="flex gap-4 rounded-3xl border border-white/[0.06] bg-white/[0.025] p-3"
                      >
                        <Link to={product?.slug ? `/product/${product.slug}` : '#'} onClick={() => dispatch(closeCart())} className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-obsidian-800">
                          <img src={thumb || `https://picsum.photos/seed/${itemId}/160/160`} alt={name} className="h-full w-full object-cover" />
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <p className="line-clamp-2 text-[14px] leading-snug text-cream">{name}</p>
                            <button onClick={() => dispatch(removeCartItem(itemId))} aria-label={`Remove ${name}`} className="-mr-1 -mt-1 grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-obsidian-500 transition-colors hover:bg-red-500/10 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                          {item.variantName && <p className="mt-0.5 text-xs text-obsidian-400">{item.variantName}</p>}
                          <div className="mt-auto flex items-center justify-between pt-2">
                            <div className="flex items-center rounded-full border border-white/10 bg-white/[0.03]">
                              <button onClick={() => dispatch(updateCartItem({ itemId, quantity: item.quantity - 1 }))} disabled={item.quantity <= 1} aria-label="Decrease quantity" className="grid h-8 w-8 place-items-center rounded-full text-obsidian-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"><Minus className="h-3 w-3" /></button>
                              <span className="tabular w-6 text-center text-sm">{item.quantity}</span>
                              <button onClick={() => dispatch(updateCartItem({ itemId, quantity: item.quantity + 1 }))} aria-label="Increase quantity" className="grid h-8 w-8 place-items-center rounded-full text-obsidian-300 transition-colors hover:bg-white/10 hover:text-white"><Plus className="h-3 w-3" /></button>
                            </div>
                            <span className="tabular text-[15px] font-medium text-cream">{formatINR(price * item.quantity)}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {items.length > 0 && (
              <footer className="space-y-4 border-t border-white/[0.07] px-6 pb-6 pt-5">
                <form onSubmit={handleCoupon} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Tag className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-obsidian-500" />
                    <input
                      value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                      placeholder={couponCode ? `Applied: ${couponCode}` : 'Promo code'} aria-label="Promo code"
                      className="h-11 w-full rounded-full border border-white/10 bg-white/[0.03] pl-10 pr-4 text-sm uppercase tracking-wider text-cream outline-none transition-colors placeholder:normal-case placeholder:tracking-normal placeholder:text-obsidian-500 focus:border-accent/60"
                    />
                  </div>
                  <Button type="submit" variant="ghost" size="md" loading={applying} disabled={!coupon.trim()}>Apply</Button>
                </form>

                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between text-obsidian-300"><dt>Subtotal</dt><dd className="tabular">{formatINR(subtotal)}</dd></div>
                  {couponDiscount > 0 && <div className="flex justify-between text-emerald-300"><dt>Discount {couponCode && `(${couponCode})`}</dt><dd className="tabular">−{formatINR(couponDiscount)}</dd></div>}
                  <div className="flex justify-between text-obsidian-300"><dt>Shipping</dt><dd className={shipping === 0 ? 'text-emerald-300' : 'tabular'}>{shipping === 0 ? 'Free' : formatINR(shipping)}</dd></div>
                  <div className="flex items-baseline justify-between border-t border-white/[0.07] pt-3">
                    <dt className="text-base text-cream">Total</dt>
                    <dd className="tabular font-display text-3xl leading-none">{formatINR(total)}</dd>
                  </div>
                </dl>

                <Button fullWidth size="lg" onClick={handleCheckout} iconRight={ArrowRight}>Checkout</Button>
                <p className="flex items-center justify-center gap-1.5 text-center text-xs text-obsidian-500"><Lock className="h-3 w-3" /> Secure checkout, powered by Stripe</p>
              </footer>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
