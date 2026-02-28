
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Package, Users, ShoppingBag, AlertTriangle,
  BarChart2, Settings, Database, ArrowUpRight, ArrowDownRight, RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { analyticsAPI, adminAPI } from '../../api/index.js';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import Badge from '../../components/ui/Badge.jsx';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending: 'gray', confirmed: 'blue', processing: 'purple',
  shipped: 'gold', delivered: 'green', cancelled: 'red',
};

function StatCard({ title, value, icon: Icon, color, change, loading }) {
  return (
    <div className="stat-card">
      {loading ? (
        <div className="space-y-3"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-32" /></div>
      ) : (
        <>
          <div className="flex items-start justify-between">
            <p className="text-xs text-obsidian-400 font-medium uppercase tracking-wide">{title}</p>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-white mt-2">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-medium mt-1 ${parseFloat(change) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {parseFloat(change) >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {Math.abs(change)}% vs last month
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats]             = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock]       = useState([]);
  const [loading, setLoading]         = useState(true);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      analyticsAPI.getDashboard(),
      analyticsAPI.getRecentOrders(),
      analyticsAPI.getTopProducts(),
      adminAPI.getLowStock(),
    ]).then(([s, o, p, ls]) => {
      setStats(s.data);
      setRecentOrders(o.data.orders?.slice(0, 8) || []);
      setTopProducts(p.data.products?.slice(0, 5) || []);
      setLowStock(ls.data.products?.slice(0, 5) || []);
    }).catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const fmt = v => `₹${(v || 0).toLocaleString('en-IN')}`;

  const statCards = [
    { title: 'Total Revenue',  value: fmt(stats?.revenue?.total),    icon: TrendingUp, color: 'bg-gold-500/20 text-gold-400',     change: stats?.revenue?.growth },
    { title: 'This Month',     value: fmt(stats?.revenue?.thisMonth), icon: BarChart2,  color: 'bg-blue-500/20 text-blue-400'     },
    { title: 'Total Orders',   value: (stats?.orders?.total  || 0).toLocaleString(), icon: ShoppingBag, color: 'bg-purple-500/20 text-purple-400' },
    { title: 'Customers',      value: (stats?.users?.total   || 0).toLocaleString(), icon: Users,       color: 'bg-emerald-500/20 text-emerald-400' },
  ];

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container-app py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Admin Dashboard</h1>
            <p className="text-obsidian-400 text-sm mt-1">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={loadData} className="btn-ghost text-sm flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button onClick={async () => { try { await adminAPI.clearCache(); toast.success('Cache cleared'); loadData(); } catch { toast.error('Failed'); } }} className="btn-ghost text-sm flex items-center gap-2">
              <Database className="w-4 h-4" /> Clear Cache
            </button>
          </div>
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Products',  to: '/admin/products',  icon: Package,    color: 'from-blue-500/20 to-blue-600/20 border-blue-500/20'       },
            { label: 'Orders',    to: '/admin/orders',    icon: ShoppingBag, color: 'from-purple-500/20 to-purple-600/20 border-purple-500/20' },
            { label: 'Customers', to: '/admin/customers', icon: Users,      color: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/20' },
            { label: 'Settings',  to: '/admin/settings',  icon: Settings,   color: 'from-gold-500/20 to-gold-600/20 border-gold-500/20'       },
          ].map(item => (
            <Link key={item.to} to={item.to} className={`glass rounded-xl p-4 flex items-center gap-3 hover:border-obsidian-500 transition-all group bg-gradient-to-br ${item.color}`}>
              <item.icon className="w-5 h-5 text-obsidian-300 group-hover:text-white" />
              <span className="text-sm font-medium text-obsidian-200 group-hover:text-white">{item.label}</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-auto text-obsidian-600 group-hover:text-obsidian-300" />
            </Link>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <StatCard {...card} loading={loading} />
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2 glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-semibold text-white">Recent Orders</h2>
              <Link to="/admin/orders" className="text-xs text-gold-400 hover:text-gold-300 transition-colors">View all →</Link>
            </div>
            <div className="space-y-2.5">
              {loading
                ? Array(5).fill(null).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)
                : recentOrders.length === 0
                  ? <p className="text-obsidian-500 text-sm text-center py-8">No orders yet</p>
                  : recentOrders.map(order => (
                    <div key={order._id} className="flex items-center gap-3 py-2.5 border-b border-obsidian-800/50 last:border-0">
                      <div className="w-8 h-8 rounded-lg bg-obsidian-700 flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="w-3.5 h-3.5 text-obsidian-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono font-medium text-white">#{order.orderNumber}</p>
                        <p className="text-xs text-obsidian-400 truncate">{order.user?.name} · {order.user?.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">₹{order.totalAmount?.toLocaleString()}</p>
                        <Badge variant={STATUS_COLORS[order.status] || 'gray'} className="text-[10px]">{order.status}</Badge>
                      </div>
                    </div>
                  ))
              }
            </div>
          </div>

          <div className="space-y-5">
            {/* Top Products */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-white text-sm">Top Products</h2>
                <Link to="/admin/products" className="text-xs text-gold-400">View all →</Link>
              </div>
              <div className="space-y-3">
                {loading
                  ? Array(4).fill(null).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)
                  : topProducts.length === 0
                    ? <p className="text-obsidian-500 text-xs text-center py-3">No data yet</p>
                    : topProducts.map((p, i) => (
                      <div key={p._id} className="flex items-center gap-2.5">
                        <span className="text-xs text-obsidian-500 w-4 font-mono">{i + 1}</span>
                        <img src={p.thumbnail} alt={p.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0 bg-obsidian-800" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{p.name}</p>
                          <p className="text-xs text-obsidian-500">{p.purchaseCount || 0} sold</p>
                        </div>
                      </div>
                    ))
                }
              </div>
            </div>

            {/* Low Stock */}
            {!loading && lowStock.length > 0 && (
              <div className="glass rounded-2xl p-5 border border-orange-500/20">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <h2 className="font-display font-semibold text-white text-sm">Low Stock Alert</h2>
                </div>
                <div className="space-y-2.5">
                  {lowStock.map(p => (
                    <div key={p._id} className="flex items-center justify-between">
                      <p className="text-xs text-obsidian-200 truncate flex-1">{p.name}</p>
                      <Badge variant="red" className="text-[10px] ml-2">{p.stock} left</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* This Month */}
            {!loading && stats && (
              <div className="glass rounded-2xl p-5">
                <h2 className="font-display font-semibold text-white text-sm mb-4">This Month</h2>
                <div className="space-y-3">
                  {[
                    { label: 'New Orders',    value: stats.orders?.thisMonth   || 0 },
                    { label: 'New Customers', value: stats.users?.newThisMonth  || 0 },
                    { label: 'Low Stock',     value: stats.inventory?.lowStockCount || 0 },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center text-sm">
                      <span className="text-obsidian-400 text-xs">{item.label}</span>
                      <span className="font-semibold text-white">{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}