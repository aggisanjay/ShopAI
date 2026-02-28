import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Eye, EyeOff, Star } from 'lucide-react';
import { productsAPI } from '../../api/index.js';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productsAPI.getAll({
        page, limit: 20, isActive: true,
        ...(search ? {} : {}),
      });
      setProducts(res.data.products || []);
      setPagination(res.data.pagination);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [page]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await productsAPI.delete(id);
      setProducts(p => p.filter(pr => pr._id !== id));
      toast.success('Product deleted');
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const handleTogglePublish = async (product) => {
    try {
      await productsAPI.update(product._id, { isPublished: !product.isPublished });
      setProducts(prev => prev.map(p =>
        p._id === product._id ? { ...p, isPublished: !p.isPublished } : p
      ));
      toast.success(product.isPublished ? 'Product unpublished' : 'Product published');
    } catch {
      toast.error('Failed to update product');
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container-app py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Products</h1>
            <p className="text-obsidian-400 text-sm mt-1">
              {pagination?.total || 0} total products
            </p>
          </div>
          <Button>
            <Plus className="w-4 h-4" /> Add Product
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="input-field pl-10 text-sm"
          />
        </div>

        {/* Table */}
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-obsidian-700/50">
              <tr className="text-left">
                {['Product', 'Category', 'Price', 'Stock', 'Rating', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-xs font-semibold text-obsidian-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-800/50">
              {loading ? (
                Array(8).fill(null).map((_, i) => (
                  <tr key={i}>
                    {Array(7).fill(null).map((_, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : products.map(product => (
                <tr key={product._id} className="hover:bg-obsidian-800/30 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.thumbnail || `https://picsum.photos/seed/${product._id}/40/40`}
                        alt={product.name}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate max-w-[180px]">{product.name}</p>
                        <p className="text-xs text-obsidian-500 font-mono">{product.sku || product._id.slice(-8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-obsidian-300">{product.category?.name || '—'}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-medium text-white">₹{product.price?.toLocaleString()}</span>
                    {product.comparePrice > product.price && (
                      <p className="text-xs text-obsidian-500 line-through">₹{product.comparePrice?.toLocaleString()}</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-sm font-medium ${product.stock <= (product.lowStockThreshold || 5) ? 'text-orange-400' : 'text-white'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-gold-400 text-gold-400" />
                      <span className="text-sm text-white">{product.rating?.toFixed(1)}</span>
                      <span className="text-xs text-obsidian-500">({product.reviewCount || 0})</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-1">
                      <Badge variant={product.isPublished ? 'green' : 'gray'} className="text-[10px]">
                        {product.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                      {product.isFeatured && (
                        <Badge variant="gold" className="text-[10px]">Featured</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleTogglePublish(product)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-obsidian-700 text-obsidian-400 hover:text-white transition-colors"
                        title={product.isPublished ? 'Unpublish' : 'Publish'}
                      >
                        {product.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-obsidian-700 text-obsidian-400 hover:text-blue-400 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-obsidian-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && products.length === 0 && (
            <div className="text-center py-12 text-obsidian-400">No products found</div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button variant="ghost" size="sm" disabled={!pagination.hasPrevPage} onClick={() => setPage(p => p - 1)}>← Prev</Button>
            <span className="flex items-center text-sm text-obsidian-300 px-4">Page {page} of {pagination.totalPages}</span>
            <Button variant="ghost" size="sm" disabled={!pagination.hasNextPage} onClick={() => setPage(p => p + 1)}>Next →</Button>
          </div>
        )}
      </div>
    </div>
  );
}
