import { Star } from 'lucide-react';
import { clsx } from 'clsx';

export default function StarRating({ rating = 0, count, size = 'sm', interactive = false, onChange }) {
  const stars = [1, 2, 3, 4, 5];
  const sizeMap = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-5 h-5' };

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {stars.map((star) => (
          <button
            key={star}
            type="button"
            onClick={interactive ? () => onChange?.(star) : undefined}
            className={clsx(!interactive && 'pointer-events-none', interactive && 'hover:scale-110 transition-transform')}
          >
            <Star
              className={clsx(
                sizeMap[size],
                star <= rating ? 'fill-gold-400 text-gold-400' : 'fill-obsidian-600 text-obsidian-600'
              )}
            />
          </button>
        ))}
      </div>
      {count !== undefined && (
        <span className="text-xs text-obsidian-400">({count.toLocaleString()})</span>
      )}
    </div>
  );
}
