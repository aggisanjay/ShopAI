import { PackageOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard.jsx';
import { ProductCardSkeleton } from '../ui/Skeleton.jsx';
import { cn } from '../../lib/utils.js';

const GRID = 'grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4';

export default function ProductGrid({ products, isLoading, pagination, onPageChange, onReset }) {
  if (isLoading) return <div className={GRID}>{Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}</div>;

  if (!products?.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-white/10 py-24 text-center">
        <div className="mb-5 grid h-20 w-20 place-items-center rounded-full border border-white/10"><PackageOpen className="h-8 w-8 text-obsidian-500" /></div>
        <h3 className="font-display text-4xl">Nothing matches</h3>
        <p className="mt-2 text-sm text-obsidian-400">Try removing a filter or searching for something else.</p>
        {onReset && <button onClick={onReset} className="btn-ghost mt-6">Clear all filters</button>}
      </div>
    );
  }

  const pages = pagination?.totalPages || 1;
  const cur = pagination?.page || 1;
  const nums = Array.from({ length: Math.min(7, pages) }, (_, i) => {
    if (pages <= 7 || cur <= 4) return i + 1;
    if (cur >= pages - 3) return pages - 6 + i;
    return cur - 3 + i;
  });

  return (
    <div>
      <div className={GRID}>{products.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}</div>

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-1.5">
          <button disabled={!pagination.hasPrevPage} onClick={() => onPageChange?.(cur - 1)} aria-label="Previous page" className="grid h-11 w-11 place-items-center rounded-full border border-white/10 transition-colors hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"><ChevronLeft className="h-4 w-4" /></button>
          {nums.map((n) => (
            <button key={n} onClick={() => onPageChange?.(n)} aria-current={n === cur ? 'page' : undefined}
              className={cn('tabular grid h-11 min-w-11 place-items-center rounded-full px-3 text-sm font-medium transition-all', n === cur ? 'bg-cream text-ink' : 'text-obsidian-300 hover:bg-white/10 hover:text-white')}>{n}</button>
          ))}
          <button disabled={!pagination.hasNextPage} onClick={() => onPageChange?.(cur + 1)} aria-label="Next page" className="grid h-11 w-11 place-items-center rounded-full border border-white/10 transition-colors hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"><ChevronRight className="h-4 w-4" /></button>
        </nav>
      )}
    </div>
  );
}
