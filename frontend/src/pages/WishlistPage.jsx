import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';
import { usersAPI } from '../api/index.js';
import { setWishlist } from '../store/slices/productSlice.js';
import ProductCard from '../components/product/ProductCard.jsx';
import { ProductCardSkeleton } from '../components/ui/Skeleton.jsx';
import Button from '../components/ui/Button.jsx';

export default function WishlistPage() {
  const dispatch = useDispatch();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersAPI.getWishlist()
      .then((res) => { const items = res.data.wishlist || []; setProducts(items); dispatch(setWishlist(items.map((p) => p._id))); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [dispatch]);

  return (
    <div className="min-h-screen pb-12 pt-32">
      <div className="container-app">
        <p className="eyebrow mb-3">{loading ? 'Saved' : `${products.length} saved`}</p>
        <h1 className="mb-12 font-display text-6xl leading-[0.92] tracking-[-0.03em] sm:text-8xl">Your <span className="italic text-obsidian-400">wishlist</span></h1>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}</div>
        ) : products.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-white/10 py-24 text-center">
            <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full border border-white/10"><Heart className="h-8 w-8 text-obsidian-500" /></div>
            <h2 className="font-display text-4xl">Nothing saved yet</h2>
            <p className="mb-8 mt-2 text-sm text-obsidian-400">Tap the heart on anything you love to keep it here.</p>
            <Link to="/products"><Button iconRight={ArrowRight}>Browse products</Button></Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{products.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}</div>
        )}
      </div>
    </div>
  );
}
