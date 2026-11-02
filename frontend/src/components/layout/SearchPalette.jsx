import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, CornerDownLeft, Search, X, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { productsAPI } from '../../api/index.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { SITE } from '../../config/site.js';
import { cn, formatINR } from '../../lib/utils.js';

export default function SearchPalette({ open, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const debounced = useDebounce(q, 280);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60);
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
    setQ(''); setResults([]); setActive(0);
  }, [open]);

  useEffect(() => {
    if (!debounced.trim()) { setResults([]); return; }
    const c = new AbortController();
    setLoading(true);
    productsAPI.search({ q: debounced, limit: 6 }, c.signal)
      .then((r) => { setResults(r.data.products || []); setActive(0); })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => c.abort();
  }, [debounced]);

  const go = (to) => { onClose(); navigate(to); };
  const items = useMemo(() => results.map((p) => ({ type: 'product', p })), [results]);

  const onKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    if (e.key === 'Enter') {
      if (items[active] && q.trim()) go(`/product/${items[active].p.slug}`);
      else if (q.trim()) go(`/products?q=${encodeURIComponent(q.trim())}`);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search products">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="glass-dark relative w-full max-w-2xl overflow-hidden rounded-[1.75rem] shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-white/[0.07] px-5">
              <Search className="h-5 w-5 text-obsidian-400" />
              <input
                ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKeyDown}
                placeholder="Search products, brands, categories…" aria-label="Search"
                className="h-16 flex-1 bg-transparent text-lg text-cream outline-none placeholder:text-obsidian-500"
              />
              {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-white/70" />}
              <button onClick={onClose} aria-label="Close search" className="grid h-8 w-8 place-items-center rounded-full text-obsidian-400 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
            </div>

            <div className="max-h-[56vh] overflow-y-auto p-2">
              {!q.trim() && (
                <div className="p-4">
                  <p className="eyebrow mb-3 flex items-center gap-2"><Sparkles className="h-3 w-3" /> Popular searches</p>
                  <div className="flex flex-wrap gap-2">
                    {SITE.popularSearches.map((s) => (
                      <button key={s} onClick={() => go(`/products?q=${encodeURIComponent(s)}`)} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-obsidian-100 transition-colors hover:bg-white/10 hover:text-white">{s}</button>
                    ))}
                  </div>
                </div>
              )}

              {q.trim() && !loading && results.length === 0 && (
                <p className="px-4 py-10 text-center text-sm text-obsidian-400">No matches for &ldquo;{q}&rdquo;. Try a brand or category.</p>
              )}

              {items.map(({ p }, i) => (
                <button
                  key={p._id} onClick={() => go(`/product/${p.slug}`)} onMouseEnter={() => setActive(i)}
                  className={cn('flex w-full items-center gap-4 rounded-2xl px-3 py-2.5 text-left transition-colors', i === active ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]')}
                >
                  <img src={p.thumbnail || `https://picsum.photos/seed/${p._id}/80/80`} alt="" className="h-12 w-12 flex-shrink-0 rounded-xl bg-obsidian-800 object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] text-cream">{p.name}</p>
                    <p className="text-xs text-obsidian-400">{p.brand || p.category?.name}</p>
                  </div>
                  <span className="tabular text-sm text-obsidian-200">{formatINR(p.price)}</span>
                  <ArrowUpRight className={cn('h-4 w-4 text-obsidian-500 transition-opacity', i === active ? 'opacity-100' : 'opacity-0')} />
                </button>
              ))}

              {q.trim() && results.length > 0 && (
                <button onClick={() => go(`/products?q=${encodeURIComponent(q.trim())}`)} className="mt-1 flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm text-obsidian-300 transition-colors hover:bg-white/[0.05] hover:text-white">
                  See all results for &ldquo;{q}&rdquo; <ArrowUpRight className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="hidden items-center justify-between border-t border-white/[0.07] px-5 py-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-obsidian-500 sm:flex">
              <span className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><kbd className="rounded border border-white/10 px-1.5 py-0.5">↑↓</kbd> navigate</span>
                <span className="flex items-center gap-1.5"><kbd className="rounded border border-white/10 px-1.5 py-0.5"><CornerDownLeft className="inline h-3 w-3" /></kbd> open</span>
              </span>
              <span className="flex items-center gap-1.5"><kbd className="rounded border border-white/10 px-1.5 py-0.5">esc</kbd> close</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
