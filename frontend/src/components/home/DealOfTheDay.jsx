import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowRight, Flame } from 'lucide-react';
import { addToCart } from '../../store/slices/cartSlice.js';
import { selectIsAuthenticated } from '../../store/slices/authSlice.js';
import { openAuthModal } from '../../store/slices/uiSlice.js';
import Button from '../ui/Button.jsx';
import { Reveal } from '../ui/motion.jsx';
import { formatINR } from '../../lib/utils.js';

function useCountdownToMidnight() {
  const calc = () => { const n = new Date(), e = new Date(n); e.setHours(24, 0, 0, 0); return Math.max(0, Math.floor((e - n) / 1000)); };
  const [s, setS] = useState(calc);
  useEffect(() => { const id = setInterval(() => setS(calc()), 1000); return () => clearInterval(id); }, []);
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60];
}

export default function DealOfTheDay({ product }) {
  const dispatch = useDispatch();
  const isAuth = useSelector(selectIsAuthenticated);
  const [h, m, s] = useCountdownToMidnight();
  const [busy, setBusy] = useState(false);
  if (!product) return null;
  const discount = product.comparePrice > product.price ? Math.round((1 - product.price / product.comparePrice) * 100) : 0;
  const img = product.thumbnail || product.images?.[0];

  const add = async () => {
    if (!isAuth) return dispatch(openAuthModal('login'));
    setBusy(true); await dispatch(addToCart({ productId: product._id, quantity: 1 })); setBusy(false);
  };

  return (
    <section className="container-app">
      <Reveal>
        <div className="relative grid overflow-hidden rounded-[2.5rem] border border-white/[0.08] bg-obsidian-850 lg:grid-cols-2">
          <Link to={`/product/${product.slug}`} className="group relative block min-h-[360px] overflow-hidden bg-obsidian-800 lg:min-h-[560px]" aria-label={product.name}>
            {img && <img src={img} alt={product.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105" />}
            {discount > 0 && (
              <span className="absolute left-6 top-6 grid h-24 w-24 -rotate-6 place-items-center rounded-full bg-accent font-display text-4xl leading-none text-ink shadow-gold-lg"><span className="flex items-baseline">−{discount}<span className="text-xl">%</span></span></span>
            )}
          </Link>
          <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
            <p className="eyebrow mb-5 flex items-center gap-2 !text-accent"><Flame className="h-3.5 w-3.5" /> Deal of the day</p>
            <h2 className="font-display text-5xl leading-[0.98] tracking-tight sm:text-6xl">{product.name}</h2>
            {product.shortDescription && <p className="mt-5 line-clamp-3 max-w-md text-base leading-relaxed text-obsidian-300">{product.shortDescription}</p>}

            <div className="mt-7 flex items-baseline gap-4">
              <span className="tabular font-display text-6xl leading-none">{formatINR(product.price)}</span>
              {discount > 0 && <span className="tabular text-xl text-obsidian-500 line-through">{formatINR(product.comparePrice)}</span>}
            </div>

            <div className="mt-8" role="timer" aria-label="Time left on today's deal">
              <p className="eyebrow mb-3">Resets in</p>
              <div className="flex items-center gap-2.5">
                {[['Hours', h], ['Min', m], ['Sec', s]].map(([l, v], i) => (
                  <div key={l} className="flex items-center gap-2.5">
                    <div className="grid h-[72px] w-[72px] place-items-center rounded-2xl border border-white/10 bg-white/[0.03]">
                      <div className="text-center"><div className="tabular font-display text-4xl leading-none">{String(v).padStart(2, '0')}</div><div className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-obsidian-500">{l}</div></div>
                    </div>
                    {i < 2 && <span className="font-display text-3xl text-obsidian-600">:</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Button size="lg" onClick={add} loading={busy} iconRight={ArrowRight} disabled={product.stock === 0}>Add to bag</Button>
              <Link to={`/product/${product.slug}`}><Button size="lg" variant="ghost">View details</Button></Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
