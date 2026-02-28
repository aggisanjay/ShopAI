import { useState, useEffect, useCallback } from 'react';
import { Users, Search, RefreshCw, Eye, X, ChevronLeft, ChevronRight, ShoppingBag, Calendar, ToggleLeft, ToggleRight } from 'lucide-react';
import { usersAPI, ordersAPI } from '../../api/index.js';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import Badge from '../../components/ui/Badge.jsx';
import toast from 'react-hot-toast';

function CustomerModal({ customer, onClose }) {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch this customer's orders via admin endpoint filtered by user
    ordersAPI.getAll({ limit: 10 })
      .then(res => {
        const mine = (res.data.orders || []).filter(o => o.user?._id === customer._id || o.user === customer._id);
        setOrders(mine.slice(0, 8));
      })
      .finally(() => setLoading(false));
  }, [customer._id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-semibold text-white text-lg">Customer Profile</h2>
          <button onClick={onClose} className="text-obsidian-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Avatar + info */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-obsidian-900 text-xl font-bold flex-shrink-0">
            {customer.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="text-white font-semibold">{customer.name}</p>
            <p className="text-obsidian-400 text-sm">{customer.email}</p>
            {customer.phone && <p className="text-obsidian-500 text-xs mt-0.5">{customer.phone}</p>}
          </div>
          <div className="ml-auto text-right">
            <Badge variant={customer.isActive ? 'green' : 'red'} className="text-[10px]">
              {customer.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <p className="text-xs text-obsidian-500 mt-1 flex items-center gap-1 justify-end">
              <Calendar className="w-3 h-3" />
              Joined {new Date(customer.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Orders',   value: orders.length },
            { label: 'Wishlist', value: customer.wishlist?.length || 0 },
            { label: 'Addresses',value: customer.addresses?.length || 0 },
          ].map(s => (
            <div key={s.label} className="glass rounded-xl p-3 text-center">
              <p className="text-lg font-display font-bold text-white">{s.value}</p>
              <p className="text-xs text-obsidian-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Recent orders */}
        <div className="glass rounded-xl p-4">
          <p className="text-[10px] text-obsidian-400 uppercase font-medium tracking-wide mb-3">Recent Orders</p>
          {loading
            ? Array(3).fill(null).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg mb-2" />)
            : orders.length === 0
              ? <p className="text-obsidian-500 text-xs text-center py-4">No orders yet</p>
              : orders.map(o => (
                <div key={o._id} className="flex items-center justify-between py-2 border-b border-obsidian-800/50 last:border-0">
                  <div>
                    <p className="text-xs font-mono text-white">#{o.orderNumber}</p>
                    <p className="text-xs text-obsidian-500">{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">₹{o.totalAmount?.toLocaleString()}</p>
                    <Badge variant={{ pending:'gray', delivered:'green', cancelled:'red', shipped:'gold' }[o.status] || 'blue'} className="text-[10px] capitalize">
                      {o.status}
                    </Badge>
                  </div>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}

export default function AdminCustomers() {
  const [customers, setCustomers]   = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [selected, setSelected]     = useState(null);
  const [toggling, setToggling]     = useState(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, role: 'customer' };
      if (search.trim()) params.search = search.trim();
      const res = await usersAPI.getAll(params);
      setCustomers(res.data.users || []);
      setPagination({ total: res.data.total, totalPages: Math.ceil(res.data.total / 20), page });
    } catch { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  }, [page, search]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { fetchCustomers(); }, 400);
    return () => clearTimeout(t);
  }, [fetchCustomers]);

  useEffect(() => { setPage(1); }, [search]);

  const toggleStatus = async (customer) => {
    setToggling(customer._id);
    try {
      const res = await usersAPI.toggleStatus(customer._id);
      setCustomers(prev => prev.map(c => c._id === customer._id ? { ...c, isActive: res.data.isActive } : c));
      toast.success(`Customer ${res.data.isActive ? 'activated' : 'deactivated'}`);
    } catch { toast.error('Failed to update status'); }
    finally { setToggling(null); }
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container-app py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Customers</h1>
            {pagination && <p className="text-sm text-obsidian-400 mt-1">{pagination.total?.toLocaleString()} registered customers</p>}
          </div>
          <button onClick={fetchCustomers} className="btn-ghost text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-400" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="input-field pl-9 py-2.5 text-sm w-full"
          />
        </div>

        {/* Table */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-obsidian-700/50">
                  {['Customer', 'Email', 'Joined', 'Wishlist', 'Addresses', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-obsidian-400 font-medium uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array(8).fill(null).map((_, i) => (
                      <tr key={i} className="border-b border-obsidian-800/50">
                        {Array(7).fill(null).map((_, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full rounded" /></td>)}
                      </tr>
                    ))
                  : customers.length === 0
                    ? (
                      <tr>
                        <td colSpan={7} className="text-center py-16 text-obsidian-500">
                          <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                          <p>No customers found</p>
                        </td>
                      </tr>
                    )
                    : customers.map(c => (
                      <tr key={c._id} className="border-b border-obsidian-800/50 hover:bg-obsidian-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400/60 to-gold-600/60 flex items-center justify-center text-obsidian-900 text-xs font-bold flex-shrink-0">
                              {c.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <span className="text-white font-medium">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-obsidian-300 text-xs truncate max-w-[180px]">{c.email}</td>
                        <td className="px-4 py-3 text-obsidian-400 text-xs whitespace-nowrap">
                          {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </td>
                        <td className="px-4 py-3 text-obsidian-300 text-sm text-center">{c.wishlist?.length || 0}</td>
                        <td className="px-4 py-3 text-obsidian-300 text-sm text-center">{c.addresses?.length || 0}</td>
                        <td className="px-4 py-3">
                          <Badge variant={c.isActive ? 'green' : 'red'} className="text-[10px]">
                            {c.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelected(c)}
                              className="p-1.5 rounded-lg hover:bg-obsidian-700 text-obsidian-400 hover:text-white transition-all"
                              title="View profile"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleStatus(c)}
                              disabled={toggling === c._id}
                              className="p-1.5 rounded-lg hover:bg-obsidian-700 text-obsidian-400 hover:text-white transition-all"
                              title={c.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {c.isActive
                                ? <ToggleRight className="w-4 h-4 text-emerald-400" />
                                : <ToggleLeft className="w-4 h-4 text-red-400" />
                              }
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-obsidian-700/50">
              <p className="text-xs text-obsidian-400">Page {page} of {pagination.totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="btn-ghost text-xs disabled:opacity-40 flex items-center gap-1">
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages} className="btn-ghost text-xs disabled:opacity-40 flex items-center gap-1">
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selected && <CustomerModal customer={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}