import { Star } from 'lucide-react';
import { cn } from '../../lib/utils.js';

const sizeMap = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-5 w-5' };

export default function StarRating({ rating = 0, count, size = 'sm', interactive = false, onChange }) {
  return (
    <div className="flex items-center gap-1.5" role={interactive ? 'radiogroup' : 'img'} aria-label={`${rating} out of 5 stars`}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star} type="button" tabIndex={interactive ? 0 : -1}
            onClick={interactive ? () => onChange?.(star) : undefined}
            className={cn(!interactive && 'pointer-events-none', interactive && 'transition-transform hover:scale-125')}
          >
            <Star className={cn(sizeMap[size], star <= Math.round(rating) ? 'fill-accent text-accent' : 'fill-obsidian-700 text-obsidian-700')} />
          </button>
        ))}
      </div>
      {count !== undefined && <span className="tabular text-xs text-obsidian-400">({Number(count).toLocaleString()})</span>}
    </div>
  );
}
