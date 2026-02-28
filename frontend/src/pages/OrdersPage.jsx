import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, Clock, Check, Truck, X, RefreshCcw } from 'lucide-react';
import { ordersAPI } from '../api/index.js';
import { OrderCardSkeleton } from '../components/ui/Skeleton.jsx';
import Badge from '../components/ui/Badge.jsx';

const STATUS_CONFIG = {
  pending: { label: 'Pending', variant: 'gray', icon: Clock },
  confirmed: { label: 'Confirmed', variant: 'blue', icon: Check },
  processing: { label: 'Processing', variant: 'purple', icon: RefreshCcw },
  shipped: { label: 'Shipped', variant: 'gold', icon: Truck },
  delivered: { label: 'Delivered', variant: 'green', icon: Check },
  cancelled: { label: 'Cancelled', variant: 'red', icon: X },
  refunded: { label: 'Refunded', variant: 'gray', icon: RefreshCcw },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchOrders = async (params = {}) => {
    setLoading(true);
    try {
      const res = await ordersAPI.getMyOrders({ limit: 10, ...params });
      setOrders(res.data.orders || []);
      setPagination(res.data.pagination);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(activeFilter !== 'all' ? { status: activeFilter } : {});
  }, [activeFilter]);

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container-app max-w-3xl py-8">
        <h1 className="text-3xl font-display font-bold text-white mb-8">My Orders</h1>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-1">
          {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-all ${
                activeFilter === f
                  ? 'bg-gold-500 text-obsidian-900'
                  : 'glass text-obsidian-300 hover:text-white border border-obsidian-700 hover:border-obsidian-500'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {loading ? (
            Array(3).fill(null).map((_, i) => <OrderCardSkeleton key={i} />)
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-14 h-14 text-obsidian-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-obsidian-300">No orders found</h3>
              <p className="text-sm text-obsidian-500 mt-1 mb-6">
                {activeFilter === 'all' ? "You haven't placed any orders yet" : `No ${activeFilter} orders`}
              </p>
              <Link to="/products" className="btn-gold inline-flex items-center gap-2 text-sm px-5 py-2.5">
                Start Shopping
              </Link>
            </div>
          ) : orders.map(order => {
            const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const StatusIcon = config.icon;

            return (
              <Link
                key={order._id}
                to={`/orders/${order._id}`}
                className="glass rounded-2xl p-5 block hover:border-obsidian-600 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-mono text-sm font-medium text-white">#{order.orderNumber}</p>
                    <p className="text-xs text-obsidian-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={config.variant}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {config.label}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-obsidian-600 group-hover:text-gold-400 transition-colors" />
                  </div>
                </div>

                {/* Items preview */}
                <div className="flex items-center gap-2 mb-4">
                  {order.items?.slice(0, 3).map(item => (
                    <img
                      key={item._id}
                      src={item.thumbnail || `https://picsum.photos/seed/${item.product}/48/48`}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover border border-obsidian-700"
                    />
                  ))}
                  {order.items?.length > 3 && (
                    <div className="w-12 h-12 rounded-lg bg-obsidian-700 flex items-center justify-center text-xs text-obsidian-400">
                      +{order.items.length - 3}
                    </div>
                  )}
                  <div className="ml-2">
                    <p className="text-sm text-obsidian-300">
                      {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-obsidian-500">{order.items?.[0]?.name}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-obsidian-700/50">
                  <span className="text-sm text-obsidian-400">Total Amount</span>
                  <span className="font-bold text-gradient text-base">₹{order.totalAmount?.toLocaleString()}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
