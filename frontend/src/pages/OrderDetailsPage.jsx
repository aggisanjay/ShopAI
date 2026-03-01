import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Package, MapPin, CreditCard, ChevronLeft,
    Clock, Check, Truck, X, RefreshCcw, ExternalLink,
    ShieldCheck, AlertCircle
} from 'lucide-react';
import { ordersAPI, paymentsAPI } from '../api/index.js';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
    pending: { label: 'Pending', variant: 'gray', icon: Clock, desc: 'Your order is placed and awaiting processing.' },
    confirmed: { label: 'Confirmed', variant: 'blue', icon: Check, desc: 'Your order has been confirmed and is being prepared.' },
    processing: { label: 'Processing', variant: 'purple', icon: RefreshCcw, desc: 'We are currently processing your items.' },
    shipped: { label: 'Shipped', variant: 'gold', icon: Truck, desc: 'Your package is on the way!' },
    delivered: { label: 'Delivered', variant: 'green', icon: Check, desc: 'Order has been successfully delivered.' },
    cancelled: { label: 'Cancelled', variant: 'red', icon: X, desc: 'This order has been cancelled.' },
    refunded: { label: 'Refunded', variant: 'gray', icon: RefreshCcw, desc: 'Payment has been refunded.' },
};

const STEPS = [
    { id: 'placed', label: 'Placed', icon: Package, statuses: ['pending', 'confirmed', 'processing', 'shipped', 'delivered'] },
    { id: 'confirmed', label: 'Confirmed', icon: ShieldCheck, statuses: ['confirmed', 'processing', 'shipped', 'delivered'] },
    { id: 'shipped', label: 'Shipped', icon: Truck, statuses: ['shipped', 'delivered'] },
    { id: 'delivered', label: 'Delivered', icon: Check, statuses: ['delivered'] },
];

export default function OrderDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const res = await ordersAPI.getById(id);
            setOrder(res.data.order);
        } catch (err) {
            toast.error('Failed to load order details');
            navigate('/orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const handleCancelOrder = async () => {
        if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) return;

        try {
            setLoading(true);
            await ordersAPI.cancel(id);
            toast.success('Order cancelled successfully');
            await fetchOrderDetails();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to cancel order');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-obsidian-800 rounded-full" />
                    <div className="h-4 w-32 bg-obsidian-800 rounded" />
                </div>
            </div>
        );
    }

    if (!order) return null;

    const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
    const StatusIcon = config.icon;

    const currentStepIndex = STEPS.findLastIndex(step => step.statuses.includes(order.status));
    const isCancelled = order.status === 'cancelled' || order.status === 'refunded';

    return (
        <div className="min-h-screen pt-20 pb-12">
            <div className="container-app max-w-4xl py-8">
                <button
                    onClick={() => navigate('/orders')}
                    className="flex items-center gap-2 text-obsidian-400 hover:text-white mb-6 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" /> Back to My Orders
                </button>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main info */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="glass rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 blur-3xl rounded-full -mr-16 -mt-16" />

                            <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                                <div>
                                    <h1 className="text-2xl font-display font-bold text-white">Order Details</h1>
                                    <p className="font-mono text-sm text-obsidian-400 mt-1">#{order.orderNumber}</p>
                                </div>
                                <Badge variant={config.variant} size="lg">
                                    <StatusIcon className="w-4 h-4 mr-2" />
                                    {config.label}
                                </Badge>
                            </div>

                            {!isCancelled && (
                                <div className="mb-8 mt-2 px-2">
                                    <div className="relative flex justify-between">
                                        <div className="absolute top-5 left-0 w-full h-0.5 bg-obsidian-800 -z-0" />
                                        <div
                                            className="absolute top-5 left-0 h-0.5 bg-gold-500 transition-all duration-500 -z-0"
                                            style={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
                                        />

                                        {STEPS.map((step, idx) => {
                                            const Icon = step.icon;
                                            const isActive = idx <= currentStepIndex;
                                            const isCurrent = idx === currentStepIndex;

                                            return (
                                                <div key={step.id} className="relative z-10 flex flex-col items-center group">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isCurrent ? 'bg-gold-500 border-gold-500 text-obsidian-900 shadow-[0_0_15px_rgba(234,179,8,0.3)]' :
                                                        isActive ? 'bg-obsidian-900 border-gold-500 text-gold-400' :
                                                            'bg-obsidian-900 border-obsidian-800 text-obsidian-600'
                                                        }`}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <span className={`text-[10px] sm:text-xs font-medium mt-2 transition-colors ${isActive ? 'text-white' : 'text-obsidian-500'
                                                        }`}>
                                                        {step.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-4 p-4 rounded-xl bg-obsidian-900/50 border border-obsidian-800">
                                <div className={`p-3 rounded-xl bg-${config.variant}-500/10 text-${config.variant}-400`}>
                                    <StatusIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">{config.label}</p>
                                    <p className="text-sm text-obsidian-400">{config.desc}</p>
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="glass rounded-2xl p-6">
                            <h3 className="text-lg font-display font-semibold text-white mb-4 flex items-center gap-2">
                                <Package className="w-5 h-5 text-gold-400" /> Items Summary
                            </h3>
                            <div className="divide-y divide-obsidian-800">
                                {order.items.map((item) => (
                                    <div key={item._id} className="py-4 flex gap-4 first:pt-0 last:pb-0">
                                        <img
                                            src={item.thumbnail || `https://picsum.photos/seed/${item.product}/64/64`}
                                            alt={item.name}
                                            className="w-16 h-16 rounded-xl object-cover border border-obsidian-800 bg-obsidian-900"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <Link to={`/product/${item.product?.slug}`} className="text-white font-medium hover:text-gold-400 transition-colors truncate block">
                                                {item.name}
                                            </Link>
                                            <p className="text-sm text-obsidian-400 mt-1">
                                                ₹{item.price.toLocaleString()} × {item.quantity}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-white font-semibold">₹{item.totalPrice.toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* History */}
                        <div className="glass rounded-2xl p-6">
                            <h3 className="text-lg font-display font-semibold text-white mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-gold-400" /> Order History
                            </h3>
                            <div className="space-y-0">
                                {[...order.statusHistory].reverse().map((h, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="flex flex-col items-center flex-shrink-0 w-5">
                                            <div className={`w-2.5 h-2.5 rounded-full z-10 flex-shrink-0 ${i === 0 ? 'bg-gold-500 shadow-[0_0_10px_rgba(234,179,8,0.6)]' : 'bg-obsidian-700'}`} />
                                            {i !== order.statusHistory.length - 1 && (
                                                <div className="w-0.5 flex-1 bg-obsidian-800" />
                                            )}
                                        </div>
                                        <div className="pb-6 last:pb-0">
                                            <p className={`text-sm font-semibold capitalize ${i === 0 ? 'text-white' : 'text-obsidian-400'}`}>
                                                {h.status}
                                            </p>
                                            <p className="text-[11px] text-obsidian-500 mt-0.5">
                                                {new Date(h.timestamp || order.createdAt).toLocaleString()}
                                            </p>
                                            {h.note && <p className="text-xs text-obsidian-400 mt-1 italic">"{h.note}"</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Status-specific Action */}
                        {order.status === 'pending' && order.paymentMethod === 'stripe' && (
                            <div className="glass rounded-2xl p-6 bg-gold-500/5 border border-gold-500/20">
                                <div className="flex items-center gap-2 text-gold-400 mb-3 text-sm font-semibold uppercase tracking-wider">
                                    <AlertCircle className="w-4 h-4" /> Action Required
                                </div>
                                <p className="text-sm text-obsidian-300 mb-4">
                                    Payment for this order is pending. Completing payment will confirm your order.
                                </p>
                                <Button
                                    fullWidth
                                    onClick={() => navigate('/checkout', { state: { resumeOrderId: order._id } })}
                                >
                                    Complete Payment
                                </Button>
                            </div>
                        )}

                        {['pending', 'confirmed'].includes(order.status) && (
                            <div className="glass rounded-2xl p-6 border-red-500/10">
                                <h3 className="text-sm font-semibold text-white mb-2">Need to cancel?</h3>
                                <p className="text-xs text-obsidian-400 mb-4">
                                    You can cancel your order as long as it hasn't been processed yet.
                                </p>
                                <Button
                                    fullWidth
                                    variant="ghost"
                                    onClick={handleCancelOrder}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/20"
                                >
                                    <X className="w-4 h-4" /> Cancel Order
                                </Button>
                            </div>
                        )}


                        {/* Price breakdown */}
                        <div className="glass rounded-2xl p-6 space-y-3">
                            <h3 className="font-display font-semibold text-white mb-2">Payment Summary</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-obsidian-400">
                                    <span>Subtotal</span>
                                    <span className="text-white">₹{order.subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-obsidian-400">
                                    <span>Shipping</span>
                                    <span className={order.shippingCost === 0 ? 'text-emerald-400 font-medium' : 'text-white'}>
                                        {order.shippingCost === 0 ? 'FREE' : `₹${order.shippingCost}`}
                                    </span>
                                </div>
                                <div className="flex justify-between text-obsidian-400">
                                    <span>Tax (GST 18%)</span>
                                    <span className="text-white">₹{order.taxAmount.toLocaleString()}</span>
                                </div>
                                {order.discountAmount > 0 && (
                                    <div className="flex justify-between text-emerald-400">
                                        <span>Discount</span>
                                        <span>-₹{order.discountAmount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="h-px bg-obsidian-800 my-2" />
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-white text-base">Total</span>
                                    <span className="text-xl font-bold text-gradient">₹{order.totalAmount.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-4 text-xs text-obsidian-500">
                                <ShieldCheck className="w-3 h-3" />
                                Payment Status: {order.paymentStatus === 'paid' ? 'Successful' : 'Pending'}
                            </div>
                        </div>

                        {/* Shipping details */}
                        <div className="glass rounded-2xl p-6 space-y-4">
                            <div>
                                <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gold-400" /> Shipping Address
                                </h4>
                                <div className="text-sm text-obsidian-400 space-y-1">
                                    <p className="text-white font-medium">{order.shippingAddress.fullName}</p>
                                    <p>{order.shippingAddress.addressLine1}</p>
                                    {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                                    <p>Phone: {order.shippingAddress.phone}</p>
                                </div>
                            </div>

                            <div className="h-px bg-obsidian-800" />

                            <div>
                                <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-gold-400" /> Payment Method
                                </h4>
                                <p className="text-sm text-obsidian-400 capitalize">
                                    {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment (Stripe)'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
