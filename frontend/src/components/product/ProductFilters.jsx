
import { useEffect, useState } from 'react';
import {
  SlidersHorizontal, ChevronDown, X, Star,
  Flame, Sparkles, ArrowUpFromLine, ArrowDownFromLine, Package,
  Cpu, Shirt, Home, BookOpen, Trophy, ShoppingBag,
} from 'lucide-react';
import { categoriesAPI } from '../../api/index.js';

const SORT_OPTIONS = [
  { value: 'trending',   label: 'Trending',          Icon: Flame          },
  { value: 'newest',     label: 'Newest',             Icon: Sparkles       },
  { value: 'price_asc',  label: 'Price: Low to High', Icon: ArrowUpFromLine  },
  { value: 'price_desc', label: 'Price: High to Low', Icon: ArrowDownFromLine },
  { value: 'rating',     label: 'Top Rated',          Icon: Star           },
  { value: 'popular',    label: 'Most Popular',       Icon: Package        },
];

const PRICE_RANGES = [
  { label: 'Under ₹500',        min: 0,     max: 500   },
  { label: '₹500 – ₹1,000',    min: 500,   max: 1000  },
  { label: '₹1,000 – ₹5,000',  min: 1000,  max: 5000  },
  { label: '₹5,000 – ₹20,000', min: 5000,  max: 20000 },
  { label: 'Above ₹20,000',    min: 20000, max: null  },
];

const CAT_ICONS = {
  electronics:    Cpu,
  fashion:        Shirt,
  'home-kitchen': Home,
  books:          BookOpen,
  sports:         Trophy,
  beauty:         Sparkles,
};

export default function ProductFilters({ filters, onFilterChange, onReset }) {
  const [categories, setCategories] = useState([]);
  const [expanded, setExpanded] = useState({ sort: true, category: true, price: true, rating: false });

  useEffect(() => {
    categoriesAPI.getAll().then(res => setCategories(res.data.categories || []));
  }, []);

  const toggle = (key) => setExpanded(p => ({ ...p, [key]: !p[key] }));

  const Section = ({ id, title, children }) => (
    <div className="border-b border-obsidian-700/50 pb-4">
      <button
        onClick={() => toggle(id)}
        className="w-full flex items-center justify-between py-2 text-sm font-medium text-white hover:text-gold-400 transition-colors"
      >
        {title}
        <ChevronDown className={`w-4 h-4 text-obsidian-400 transition-transform ${expanded[id] ? 'rotate-180' : ''}`} />
      </button>
      {expanded[id] && <div className="mt-3 space-y-1.5">{children}</div>}
    </div>
  );

  const activeCount = [
    filters.category,
    filters.sort !== 'trending' && filters.sort,
    filters.minPrice,
    filters.rating,
    filters.inStock,
    filters.isFeatured,
  ].filter(Boolean).length;

  const on  = 'bg-gold-500/20 text-gold-400 border border-gold-500/30';
  const off = 'text-obsidian-300 hover:bg-obsidian-700/50 hover:text-white border border-transparent';

  return (
    <div className="glass rounded-2xl p-5 space-y-4 sticky top-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gold-400" />
          <span className="font-medium text-white text-sm">Filters</span>
          {activeCount > 0 && <span className="badge-gold text-[10px]">{activeCount}</span>}
        </div>
        {activeCount > 0 && (
          <button onClick={onReset} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
            <X className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      {/* Sort */}
      <Section id="sort" title="Sort By">
        {SORT_OPTIONS.map(({ value, label, Icon }) => (
          <button
            key={value}
            onClick={() => onFilterChange({ sort: value })}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-2.5 ${filters.sort === value ? on : off}`}
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            {label}
          </button>
        ))}
      </Section>

      {/* Categories */}
      <Section id="category" title="Category">
        <button
          onClick={() => onFilterChange({ category: null, isFeatured: null })}
          className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-2.5 ${!filters.category && !filters.isFeatured ? on : off}`}
        >
          <ShoppingBag className="w-3.5 h-3.5 flex-shrink-0" /> All Categories
        </button>
        <button
          onClick={() => onFilterChange({ isFeatured: filters.isFeatured === 'true' ? null : 'true', category: null })}
          className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-2.5 ${filters.isFeatured === 'true' ? on : off}`}
        >
          <Star className="w-3.5 h-3.5 flex-shrink-0" /> Featured
        </button>
        {categories.map(cat => {
          const Icon = CAT_ICONS[cat.slug] || ShoppingBag;
          return (
            <button
              key={cat._id}
              onClick={() => onFilterChange({ category: cat._id, isFeatured: null })}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-2.5 ${filters.category === cat._id ? on : off}`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="flex-1">{cat.name}</span>
            </button>
          );
        })}
      </Section>

      {/* Price Range */}
      <Section id="price" title="Price Range">
        <button
          onClick={() => onFilterChange({ minPrice: null, maxPrice: null })}
          className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all ${!filters.minPrice && !filters.maxPrice ? on : off}`}
        >
          Any Price
        </button>
        {PRICE_RANGES.map(r => (
          <button
            key={r.label}
            onClick={() => onFilterChange({ minPrice: r.min, maxPrice: r.max })}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all ${filters.minPrice == r.min && filters.maxPrice == r.max ? on : off}`}
          >
            {r.label}
          </button>
        ))}
      </Section>

      {/* Rating */}
      <Section id="rating" title="Min Rating">
        {[4, 3, 2, 1].map(r => (
          <button
            key={r}
            onClick={() => onFilterChange({ rating: filters.rating == r ? null : r })}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-1 ${filters.rating == r ? on : off}`}
          >
            {[1,2,3,4,5].map(s => (
              <Star key={s} className={`w-3 h-3 ${s <= r ? 'fill-gold-400 text-gold-400' : 'text-obsidian-600'}`} />
            ))}
            <span className="ml-1">& above</span>
          </button>
        ))}
      </Section>

      {/* In Stock */}
      <div className="flex items-center justify-between py-2">
        <span className="text-xs font-medium text-white">In Stock Only</span>
        <button
          onClick={() => onFilterChange({ inStock: filters.inStock ? null : 'true' })}
          className={`w-11 h-6 rounded-full transition-colors relative ${filters.inStock ? 'bg-gold-500' : 'bg-obsidian-700'}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${filters.inStock ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
        </button>
      </div>
    </div>
  );
}