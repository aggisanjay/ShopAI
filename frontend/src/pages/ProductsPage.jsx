import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Check, ChevronDown, Flame, Sparkles, ArrowUp, ArrowDown, Star, Package } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { productsAPI, categoriesAPI } from '../api/index.js';
import ProductGrid from '../components/product/ProductGrid.jsx';
import ProductFilters from '../components/product/ProductFilters.jsx';
import { useDebounce } from '../hooks/useDebounce.js';
import { cn } from '../lib/utils.js';

const SORTS = [
  { value: 'trending', label: 'Trending', Icon: Flame }, { value: 'newest', label: 'Newest', Icon: Sparkles },
  { value: 'price_asc', label: 'Price: low to high', Icon: ArrowUp }, { value: 'price_desc', label: 'Price: high to low', Icon: ArrowDown },
  { value: 'rating', label: 'Top rated', Icon: Star }, { value: 'popular', label: 'Most popular', Icon: Package },
];

function readFilters(sp) {
  return {
    category: sp.get('category') || null, sort: sp.get('sort') || 'trending',
    minPrice: sp.get('minPrice') || null, maxPrice: sp.get('maxPrice') || null,
    rating: sp.get('rating') || null, inStock: sp.get('inStock') || null,
    isFeatured: sp.get('isFeatured') || null, page: parseInt(sp.get('page')) || 1,
  };
}

function SortMenu({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const cur = SORTS.find((s) => s.value === value) || SORTS[0];
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open}
        className="flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] pl-4 pr-3 text-sm text-cream transition-colors hover:bg-white/[0.08]">
        <span className="hidden text-obsidian-400 sm:inline">Sort</span>{cur.label}<ChevronDown className={cn('h-4 w-4 text-obsidian-400 transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
            <motion.ul role="listbox" initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.97 }} transition={{ duration: 0.18 }}
              className="glass-dark absolute right-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-3xl p-2 shadow-2xl">
              {SORTS.map(({ value: v, label, Icon }) => (
                <li key={v}><button role="option" aria-selected={v === value} onClick={() => { onChange(v); setOpen(false); }}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-obsidian-200 transition-colors hover:bg-white/[0.07] hover:text-white">
                  <Icon className="h-4 w-4 text-obsidian-400" />{label}{v === value && <Check className="ml-auto h-4 w-4 text-accent" />}
                </button></li>
              ))}
            </motion.ul>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [drawer, setDrawer] = useState(false);

  // Filters are derived straight from the URL, so nav links and chips just work
  const filters = readFilters(searchParams);
  const searchQuery = searchParams.get('q') || '';
  const debouncedSearch = useDebounce(searchQuery, 400);
  const urlKey = searchParams.toString();
  const topRef = useRef(null);

  useEffect(() => { categoriesAPI.getAll().then((r) => setCategories(r.data.categories || [])).catch(() => {}); }, []);

  const fetchProducts = useCallback(async (signal) => {
    setIsLoading(true);
    try {
      const params = { ...filters };
      Object.keys(params).forEach((k) => params[k] == null && delete params[k]);
      const res = debouncedSearch ? await productsAPI.search({ q: debouncedSearch, ...params }, signal) : await productsAPI.getAll(params, signal);
      setProducts(res.data.products || []); setPagination(res.data.pagination || null);
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      setProducts([]);
    } finally { setIsLoading(false); }
  }, [urlKey, debouncedSearch]); // eslint-disable-line

  useEffect(() => { const c = new AbortController(); fetchProducts(c.signal); return () => c.abort(); }, [fetchProducts]);

  const applyFilters = (changes) => {
    const next = { ...filters, ...changes };
    if (!changes.page) next.page = 1;
    const params = {};
    Object.entries(next).forEach(([k, v]) => { if (v) params[k] = v; });
    if (searchQuery) params.q = searchQuery;
    setSearchParams(params, { replace: true });
    if (changes.page) topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const handleSearch = (q) => {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    if (q) params.q = q; else delete params.q;
    params.page = 1;
    setSearchParams(params, { replace: true });
  };
  const reset = () => setSearchParams({}, { replace: true });

  const title = searchQuery ? <>Results for <span className="italic text-obsidian-400">“{searchQuery}”</span></>
    : filters.isFeatured === 'true' ? <>Featured <span className="italic text-obsidian-400">picks</span></>
      : searchParams.get('sort') === 'trending' && !filters.category ? <>Trending <span className="italic text-obsidian-400">now</span></>
      : searchParams.get('sort') === 'newest' ? <>New <span className="italic text-obsidian-400">arrivals</span></>
    : <>All <span className="italic text-obsidian-400">products</span></>;

  const activeCat = categories.find((c) => c._id === filters.category);
  const pills = [
    activeCat && { k: 'category', label: activeCat.name, clear: { category: null } },
    filters.minPrice != null && { k: 'price', label: `₹${Number(filters.minPrice).toLocaleString()}${filters.maxPrice ? ` – ₹${Number(filters.maxPrice).toLocaleString()}` : '+'}`, clear: { minPrice: null, maxPrice: null } },
    filters.rating && { k: 'rating', label: `${filters.rating}★ & up`, clear: { rating: null } },
    filters.inStock && { k: 'stock', label: 'In stock', clear: { inStock: null } },
  ].filter(Boolean);
  const activeFilterCount = [filters.minPrice, filters.rating, filters.inStock].filter(Boolean).length;

  return (
    <div className="min-h-screen pt-28 sm:pt-32">
      <div className="container-app" ref={topRef}>
        <header className="flex flex-wrap items-end justify-between gap-6 pb-8">
          <div>
            <p className="eyebrow mb-3">{pagination ? `${pagination.total.toLocaleString()} products` : 'Shop'}</p>
            <h1 className="font-display text-6xl leading-[0.92] tracking-[-0.03em] sm:text-8xl">{title}</h1>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-obsidian-500" />
            <input type="search" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} placeholder="Search products" aria-label="Search products"
              className="h-12 w-full rounded-full border border-white/10 bg-white/[0.03] pl-11 pr-10 text-sm outline-none transition-colors placeholder:text-obsidian-500 focus:border-accent/60 [&::-webkit-search-cancel-button]:hidden" />
            {searchQuery && <button onClick={() => handleSearch('')} aria-label="Clear search" className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-obsidian-400 hover:bg-white/10 hover:text-white"><X className="h-3.5 w-3.5" /></button>}
          </div>
        </header>

        {/* sticky toolbar: category chips + sort + filters */}
        <div className="sticky top-[68px] z-30 -mx-5 border-y border-white/[0.07] bg-obsidian-900/80 px-5 py-3 backdrop-blur-xl sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
          <div className="flex items-center gap-3">
            <div className="no-scrollbar flex flex-1 items-center gap-2 overflow-x-auto">
              {[{ _id: null, name: 'All' }, ...categories].map((c) => {
                const on = (c._id || null) === filters.category && !filters.isFeatured;
                return (
                  <button key={c._id || 'all'} onClick={() => applyFilters({ category: c._id, isFeatured: null })} aria-pressed={on}
                    className={cn('h-11 flex-shrink-0 rounded-full border px-5 text-sm font-medium transition-all duration-300', on ? 'border-cream bg-cream text-ink' : 'border-white/10 text-obsidian-300 hover:border-white/25 hover:text-white')}>{c.name}</button>
                );
              })}
            </div>
            <SortMenu value={filters.sort} onChange={(v) => applyFilters({ sort: v })} />
            <button onClick={() => setDrawer(true)} className="relative flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm transition-colors hover:bg-white/[0.08] lg:hidden">
              <SlidersHorizontal className="h-4 w-4" /><span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-ink">{activeFilterCount}</span>}
            </button>
          </div>
        </div>

        {pills.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-5">
            {pills.map((p) => (
              <button key={p.k} onClick={() => applyFilters(p.clear)} className="group flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] pl-4 pr-3 text-[13px] text-cream transition-colors hover:border-red-400/40">
                {p.label}<X className="h-3.5 w-3.5 text-obsidian-400 group-hover:text-red-300" />
              </button>
            ))}
            <button onClick={reset} className="px-2 text-[13px] text-obsidian-400 underline-offset-4 hover:text-white hover:underline">Clear all</button>
          </div>
        )}

        <div className="flex gap-10 py-8">
          <aside className="hidden w-72 flex-shrink-0 lg:block"><div className="sticky top-[148px]"><ProductFilters filters={filters} onFilterChange={applyFilters} onReset={() => applyFilters({ minPrice: null, maxPrice: null, rating: null, inStock: null })} /></div></aside>
          <main className="min-w-0 flex-1">
            <ProductGrid products={products} isLoading={isLoading} pagination={pagination} onPageChange={(page) => applyFilters({ page })} onReset={reset} />
          </main>
        </div>
      </div>

      <AnimatePresence>
        {drawer && (
          <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDrawer(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 34, stiffness: 340 }}
              className="glass-dark absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-[2rem] p-4 pb-8">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
              <button onClick={() => setDrawer(false)} aria-label="Close filters" className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full hover:bg-white/10"><X className="h-4 w-4" /></button>
              <ProductFilters filters={filters} onFilterChange={applyFilters} onReset={() => applyFilters({ minPrice: null, maxPrice: null, rating: null, inStock: null })} />
              <button onClick={() => setDrawer(false)} className="btn-primary mt-4 h-12 w-full">Show {pagination ? pagination.total.toLocaleString() : ''} results</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
