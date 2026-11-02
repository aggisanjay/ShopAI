import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard.jsx';
import { ProductCardSkeleton } from '../ui/Skeleton.jsx';
import { Reveal } from '../ui/motion.jsx';
import { cn } from '../../lib/utils.js';

/** Horizontal scroll-snap product slider with arrows and edge state. */
export default function ProductRail({ eyebrow, title, accentWord, viewAllLink, products = [], loading, className, max = 10 }) {
  const ref = useRef(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = ref.current; if (!el) return;
    setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  }, []);

  useEffect(() => {
    update();
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(update); ro.observe(el);
    return () => ro.disconnect();
  }, [update, products.length, loading]);

  const by = (dir) => { const el = ref.current; el?.scrollBy({ left: dir * el.clientWidth * 0.82, behavior: 'smooth' }); };
  if (!loading && products.length === 0) return null;

  return (
    <section className={cn('container-app', className)}>
      <Reveal className="mb-8 flex items-end justify-between gap-6">
        <div>
          {eyebrow && <p className="eyebrow mb-3 flex items-center gap-2">{eyebrow}</p>}
          <h2 className="section-title">
            {accentWord ? <>{title} <span className="italic text-obsidian-400">{accentWord}</span></> : title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {viewAllLink && (
            <Link to={viewAllLink} className="group mr-2 hidden items-center gap-1.5 text-sm text-obsidian-300 transition-colors hover:text-white sm:flex">
              View all <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          )}
          <button onClick={() => by(-1)} disabled={edge.start} aria-label="Scroll left" className="grid h-11 w-11 place-items-center rounded-full border border-white/10 transition-all hover:bg-white/10 disabled:opacity-25 disabled:hover:bg-transparent"><ChevronLeft className="h-5 w-5" /></button>
          <button onClick={() => by(1)} disabled={edge.end} aria-label="Scroll right" className="grid h-11 w-11 place-items-center rounded-full border border-white/10 transition-all hover:bg-white/10 disabled:opacity-25 disabled:hover:bg-transparent"><ChevronRight className="h-5 w-5" /></button>
        </div>
      </Reveal>

      <div
        ref={ref} onScroll={update} tabIndex={0} role="region" aria-label={`${title} products`}
        className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-5 pb-2 scroll-pl-5 sm:-mx-8 sm:scroll-pl-8 sm:px-8 lg:-mx-12 lg:scroll-pl-12 lg:gap-5 lg:px-12"
      >
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="w-[68vw] flex-shrink-0 sm:w-[300px]"><ProductCardSkeleton /></div>)
          : products.slice(0, max).map((p, i) => (
              <div key={p._id} className="w-[68vw] flex-shrink-0 snap-start sm:w-[300px] xl:w-[316px]"><ProductCard product={p} index={i} /></div>
            ))}
      </div>
    </section>
  );
}
