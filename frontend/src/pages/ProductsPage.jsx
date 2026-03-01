
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { productsAPI } from '../api/index.js';
import ProductGrid from '../components/product/ProductGrid.jsx';
import ProductFilters from '../components/product/ProductFilters.jsx';
import Button from '../components/ui/Button.jsx';
import { useDebounce } from '../hooks/useDebounce.js';

function readFiltersFromParams(sp) {
  return {
    category: sp.get('category') || null,
    sort: sp.get('sort') || 'trending',
    minPrice: sp.get('minPrice') || null,
    maxPrice: sp.get('maxPrice') || null,
    rating: sp.get('rating') || null,
    inStock: sp.get('inStock') || null,
    isFeatured: sp.get('isFeatured') || null,
    page: parseInt(sp.get('page')) || 1,
  };
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Derive filters DIRECTLY from URL every render — no useState needed
  // This means navbar link clicks (which change the URL) auto-update filters
  const filters = readFiltersFromParams(searchParams);
  const searchQuery = searchParams.get('q') || '';
  const debouncedSearch = useDebounce(searchQuery, 400);

  const urlKey = searchParams.toString(); // changes whenever URL changes

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = { ...filters };
      Object.keys(params).forEach(k => params[k] == null && delete params[k]);
      const res = debouncedSearch
        ? await productsAPI.search({ q: debouncedSearch, ...params })
        : await productsAPI.getAll(params);
      setProducts(res.data.products || []);
      setPagination(res.data.pagination || null);
    } catch {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [urlKey, debouncedSearch]); // eslint-disable-line

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const applyFilters = (changes) => {
    const next = { ...filters, ...changes };
    if (!changes.page) next.page = 1; // Reset to page 1 ONLY if it's not a page change
    const params = {};
    Object.entries(next).forEach(([k, v]) => { if (v) params[k] = v; });
    if (searchQuery) params.q = searchQuery;
    setSearchParams(params, { replace: true });
  };

  const handleSearchChange = (q) => {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    if (q) params.q = q; else delete params.q;
    params.page = 1;
    setSearchParams(params, { replace: true });
  };

  const handleReset = () => setSearchParams({}, { replace: true });

  const pageTitle = () => {
    if (searchQuery) return `Search: "${searchQuery}"`;
    if (filters.isFeatured === 'true') return '⭐ Featured Products';
    if (filters.sort === 'trending') return '🔥 Trending Products';
    if (filters.sort === 'newest') return '✨ New Arrivals';
    return 'All Products';
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="glass border-b border-obsidian-700/50">
        <div className="container-app py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-display font-bold text-white">{pageTitle()}</h1>
              {pagination && (
                <p className="text-sm text-obsidian-400 mt-0.5">
                  {pagination.total.toLocaleString()} products found
                </p>
              )}
            </div>
            <div className="flex-1 sm:max-w-xs relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                className="input-field pl-10 pr-4 py-2.5 text-sm"
              />
              {searchQuery && (
                <button onClick={() => handleSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-obsidian-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowMobileFilters(true)} className="sm:hidden">
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </Button>
          </div>
        </div>
      </div>

      <div className="container-app py-8">
        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <ProductFilters filters={filters} onFilterChange={applyFilters} onReset={handleReset} />
          </aside>
          <main className="flex-1 min-w-0">
            <ProductGrid
              products={products}
              isLoading={isLoading}
              pagination={pagination}
              onPageChange={(page) => applyFilters({ page })}
            />
          </main>
        </div>
      </div>

      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute right-0 top-0 h-full w-80 glass overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Filters</h3>
              <button onClick={() => setShowMobileFilters(false)}><X className="w-5 h-5 text-obsidian-400" /></button>
            </div>
            <ProductFilters
              filters={filters}
              onFilterChange={(f) => { applyFilters(f); setShowMobileFilters(false); }}
              onReset={() => { handleReset(); setShowMobileFilters(false); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}