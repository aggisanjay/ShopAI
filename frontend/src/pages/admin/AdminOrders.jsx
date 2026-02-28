import { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Search, RefreshCw, Eye, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ordersAPI } from '../../api/index.js';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import toast from 'react-hot-toast';

const STATUS_LIST   = ['all','pending','confirmed','processing','shipped','delivered','cancelled'];
const STATUS_COLORS = { pending:'gray', confirmed:'blue', processing:'purple', shipped:'gold', delivered:'green', cancelled:'red' };
const NEXT_STATUS   = {
  pending:    ['confirmed','cancelled'],
  confirmed:  ['processing','cancelled'],
  processing: ['shipped','cancelled'],
  shipped:    ['delivered'],
  delivered:  [], cancelled: [],
};

function OrderModal({ order, onClose, onUpdated }) {
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote]           = useState('');
  const [saving, setSaving]       = useState(false);
  const next = NEXT_STATUS[order.status] || [];

  const save = async () => {
    if (!newStatus) return;
    setSaving(true);
    try {
      await ordersAPI.updateStatus(order._id, { status: newStatus, note });
      toast.success(`Status updated to "${newStatus}"`);
      onUpdated();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-semibold text-white text-lg">Order #{order.orderNumber}</h2>
          <button onClick={onClose} className="text-obsidian-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Status + date */}
        <div className="flex items-center gap-3 mb-5">
          <Badge variant={STATUS_COLORS[order.status] || 'gray'} className="capitalize">{order.status}</Badge>
          <span className="text-xs text-obsidian-400">{new Date(order.createdAt).toLocaleString('en-IN')}</span>
          <Badge variant={order.paymentStatus === 'paid' ? 'green' : 'gray'} className="capitalize ml-auto">{order.paymentStatus}</Badge>
        </div>

        {/* Customer */}
        <div className="glass rounded-xl p-4 mb-4">
          <p className="text-[10px] text-obsidian-400 uppercase font-medium tracking-wide mb-2">Customer</p>
          <p className="text-sm text-white font-semibold">{order.user?.name}</p>
          <p className="text-xs text-obsidian-400">{order.user?.email}</p>
          <p className="text-xs text-obsidian-400 mt-1">{order.shippingAddress?.phone}</p>
        </div>

        {/* Items */}
        <div className="glass rounded-xl p-4 mb-4">
          <p className="text-[10px] text-obsidian-400 uppercase font-medium tracking-wide mb-3">Items ({order.items?.length})</p>
          <div className="space-y-2.5">
            {order.items?.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <img src={item.thumbnail} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-obsidian-800 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{item.name}</p>
                  <p className="text-xs text-obsidian-400">Qty: {item.quantity} × ₹{item.price?.toLocaleString()}</p>
                </div>
                <p className="text-sm font-semibold text-white">₹{item.totalPrice?.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="glass rounded-xl p-4 mb-4 space-y-1.5 text-xs">
          <div className="flex justify-between text-obsidian-300"><span>Subtotal</span><span>₹{order.subtotal?.toLocaleString()}</span></div>
          <div className="flex justify-between text-obsidian-300"><span>Shipping</span><span>₹{order.shippingCost?.toLocaleString() || '0'}</span></div>
          <div className="flex justify-between text-obsidian-300"><span>Tax (GST)</span><span>₹{order.taxAmount?.toLocaleString()}</span></div>
          {order.discountAmount > 0 && <div className="flex justify-between text-emerald-400"><span>Discount</span><span>-₹{order.discountAmount?.toLocaleString()}</span></div>}
          <div className="flex justify-between font-bold text-white text-sm pt-2 border-t border-obsidian-700/50 mt-2">
            <span>Total</span><span className="text-gradient">₹{order.totalAmount?.toLocaleString()}</span>
          </div>
        </div>

        {/* Shipping address */}
        <div className="glass rounded-xl p-4 mb-5">
          <p className="text-[10px] text-obsidian-400 uppercase font-medium tracking-wide mb-2">Ship To</p>
          <p className="text-sm text-white">{order.shippingAddress?.fullName}</p>
          <p className="text-xs text-obsidian-400 mt-0.5">
            {order.shippingAddress?.addressLine1}{order.shippingAddress?.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}<br />
            {order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.postalCode}
          </p>
        </div>

        {/* Status update */}
        {next.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs text-obsidian-400 uppercase font-medium tracking-wide">Update Status</p>
            <div className="flex gap-2 flex-wrap">
              {next.map(s => (
                <button
                  key={s}
                  onClick={() => setNewStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-all ${
                    newStatus === s ? 'border-gold-500/60 bg-gold-500/20 text-gold-400' : 'border-obsidian-600 text-obsidian-300 hover:border-obsidian-400 hover:text-white'
                  }`}
                >
                  → {s}
                </button>
              ))}
            </div>
            <input
              type="text" value={note} onChange={e => setNote(e.target.value)}
              placeholder="Add a note (optional)"
              className="input-field w-full text-sm"
            />
            <Button fullWidth loading={saving} onClick={save} disabled={!newStatus}>
              Update to "{newStatus || '...'}"
            </Button>
          </div>
        ) : (
          <p className="text-xs text-obsidian-500 text-center">No further status transitions available</p>
        )}
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders]         = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('all');
  const [page, setPage]             = useState(1);
  const [selected, setSelected]     = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await ordersAPI.getAll(params);
      setOrders(res.data.orders || []);
      setPagination(res.data.pagination || null);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  const visible = search
    ? orders.filter(o =>
        String(o.orderNumber).includes(search) ||
        o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        o.user?.email?.toLowerCase().includes(search.toLowerCase()))
    : orders;

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container-app py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Orders</h1>
            {pagination && <p className="text-sm text-obsidian-400 mt-1">{pagination.total?.toLocaleString()} total orders</p>}
          </div>
          <button onClick={fetchOrders} className="btn-ghost text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-400" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search order # or customer…"
              className="input-field pl-9 py-2.5 text-sm w-full"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUS_LIST.map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all border ${
                  statusFilter === s
                    ? 'border-gold-500/60 bg-gold-500/20 text-gold-400'
                    : 'border-obsidian-700 text-obsidian-300 hover:border-obsidian-500 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-obsidian-700/50">
                  {['Order #', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-obsidian-400 font-medium uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array(8).fill(null).map((_, i) => (
                      <tr key={i} className="border-b border-obsidian-800/50">
                        {Array(8).fill(null).map((_, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full rounded" /></td>)}
                      </tr>
                    ))
                  : visible.length === 0
                    ? (
                      <tr>
                        <td colSpan={8} className="text-center py-16 text-obsidian-500">
                          <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-20" />
                          <p>No orders found</p>
                        </td>
                      </tr>
                    )
                    : visible.map(order => (
                      <tr key={order._id} className="border-b border-obsidian-800/50 hover:bg-obsidian-800/30 transition-colors cursor-pointer" onClick={() => setSelected(order)}>
                        <td className="px-4 py-3 font-mono text-white font-semibold">#{order.orderNumber}</td>
                        <td className="px-4 py-3">
                          <p className="text-white text-sm font-medium">{order.user?.name}</p>
                          <p className="text-xs text-obsidian-500 truncate max-w-[150px]">{order.user?.email}</p>
                        </td>
                        <td className="px-4 py-3 text-obsidian-300 text-sm">{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</td>
                        <td className="px-4 py-3 text-white font-semibold">₹{order.totalAmount?.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <Badge variant={order.paymentStatus === 'paid' ? 'green' : 'gray'} className="text-[10px] capitalize">{order.paymentStatus}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={STATUS_COLORS[order.status] || 'gray'} className="text-[10px] capitalize">{order.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-obsidian-400 text-xs whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={e => { e.stopPropagation(); setSelected(order); }} className="p-1.5 rounded-lg hover:bg-obsidian-700 text-obsidian-400 hover:text-white transition-all">
                            <Eye className="w-4 h-4" />
                          </button>
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

      {selected && <OrderModal order={selected} onClose={() => setSelected(null)} onUpdated={fetchOrders} />}
    </div>
  );
}