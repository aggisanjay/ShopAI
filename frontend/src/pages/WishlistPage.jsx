import { useEffect, useState } from 'react';
import { usersAPI } from '../api/index.js';
import { useDispatch } from 'react-redux';
import { setWishlist } from '../store/slices/productSlice.js';
import ProductCard from '../components/product/ProductCard.jsx';
import { ProductCardSkeleton } from '../components/ui/Skeleton.jsx';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WishlistPage() {
  const dispatch = useDispatch();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersAPI.getWishlist()
      .then(res => {
        const items = res.data.wishlist || [];
        setProducts(items);
        dispatch(setWishlist(items.map(p => p._id)));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container-app py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-6 h-6 text-gold-400 fill-gold-400" />
          <h1 className="text-3xl font-display font-bold text-white">Wishlist</h1>
          <span className="badge-gold ml-1">{products.length}</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array(5).fill(null).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-obsidian-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-obsidian-300">Your wishlist is empty</h3>
            <p className="text-sm text-obsidian-500 mt-1 mb-6">Save items you love to revisit later</p>
            <Link to="/products" className="btn-gold inline-flex">Browse Products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map((product, i) => <ProductCard key={product._id} product={product} index={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}
