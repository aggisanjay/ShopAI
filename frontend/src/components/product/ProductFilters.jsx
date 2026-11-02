import { useState } from 'react';
import { ChevronDown, Star, X } from 'lucide-react';
import { cn } from '../../lib/utils.js';

const PRICE_RANGES = [
  { label: 'Under ₹500', min: 0, max: 500 },
  { label: '₹500 – ₹1,000', min: 500, max: 1000 },
  { label: '₹1,000 – ₹5,000', min: 1000, max: 5000 },
  { label: '₹5,000 – ₹20,000', min: 5000, max: 20000 },
  { label: 'Above ₹20,000', min: 20000, max: null },
];

function Section({ title, open, onToggle, children }) {
  return (
    <div className="border-b border-white/[0.07] py-4 first:pt-0 last:border-0">
      <button onClick={onToggle} aria-expanded={open} className="flex w-full items-center justify-between py-1 text-left text-sm font-medium text-cream">
        {title}<ChevronDown className={cn('h-4 w-4 text-obsidian-400 transition-transform duration-300', open && 'rotate-180')} />
      </button>
      <div className={cn('grid transition-all duration-500 ease-out', open ? 'mt-3 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
        <div className="overflow-hidden"><div className="space-y-1">{children}</div></div>
      </div>
    </div>
  );
}

const row = (on) => cn('flex w-full items-center justify-between gap-2 rounded-2xl px-3.5 py-2.5 text-left text-[13.5px] transition-all duration-300',
  on ? 'bg-cream text-ink' : 'text-obsidian-300 hover:bg-white/[0.06] hover:text-white');

export default function ProductFilters({ filters, onFilterChange, onReset }) {
  const [open, setOpen] = useState({ price: true, rating: true, stock: true });
  const t = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  const active = [filters.minPrice, filters.rating, filters.inStock].filter(Boolean).length;

  return (
    <div className="rounded-[2rem] border border-white/[0.07] bg-obsidian-850 p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-3xl leading-none">Filters</h2>
        {active > 0 && <button onClick={onReset} className="flex items-center gap-1 text-xs text-obsidian-300 underline-offset-4 hover:text-white hover:underline"><X className="h-3 w-3" />Clear</button>}
      </div>

      <Section title="Price" open={open.price} onToggle={() => t('price')}>
        <button onClick={() => onFilterChange({ minPrice: null, maxPrice: null })} className={row(!filters.minPrice && !filters.maxPrice)}>Any price</button>
        {PRICE_RANGES.map((r) => (
          <button key={r.label} onClick={() => onFilterChange({ minPrice: r.min, maxPrice: r.max })} className={row(filters.minPrice == r.min && filters.maxPrice == r.max)}>{r.label}</button>
        ))}
      </Section>

      <Section title="Rating" open={open.rating} onToggle={() => t('rating')}>
        {[4, 3, 2].map((r) => (
          <button key={r} onClick={() => onFilterChange({ rating: filters.rating == r ? null : r })} className={row(filters.rating == r)}>
            <span className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => <Star key={s} className={cn('h-3.5 w-3.5', s <= r ? 'fill-current' : 'opacity-30')} />)}
            </span>
            <span className="text-xs opacity-70">& up</span>
          </button>
        ))}
      </Section>

      <Section title="Availability" open={open.stock} onToggle={() => t('stock')}>
        <button
          role="switch" aria-checked={!!filters.inStock} onClick={() => onFilterChange({ inStock: filters.inStock ? null : 'true' })}
          className="flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-[13.5px] text-obsidian-200 hover:bg-white/[0.06]"
        >
          In stock only
          <span className={cn('relative h-6 w-11 rounded-full transition-colors duration-300', filters.inStock ? 'bg-accent' : 'bg-obsidian-600')}>
            <span className={cn('absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300', filters.inStock && 'translate-x-5')} />
          </span>
        </button>
      </Section>
    </div>
  );
}
