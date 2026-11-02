import { useCallback, useEffect, useState } from 'react';

const KEY = 'shopai:recent';
const MAX = 10;
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };

/** Recently viewed products, persisted in localStorage. */
export function useRecentlyViewed() {
  const [items, setItems] = useState(read);
  useEffect(() => {
    const sync = () => setItems(read());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  const push = useCallback((p) => {
    if (!p?._id) return;
    const slim = { _id: p._id, slug: p.slug, name: p.name, price: p.price, comparePrice: p.comparePrice, thumbnail: p.thumbnail || p.images?.[0], images: p.images?.slice(0, 2), brand: p.brand, rating: p.rating, reviewCount: p.reviewCount, stock: p.stock, category: p.category && { _id: p.category._id, name: p.category.name } };
    const next = [slim, ...read().filter((x) => x._id !== p._id)].slice(0, MAX);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage full or blocked */ }
    setItems(next);
  }, []);
  return { items, push };
}
