
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { CreditCard, MapPin, CheckCircle, Package, ChevronRight, Lock, Truck } from 'lucide-react';
import { selectCartItems, selectCartSubtotal, clearCart } from '../store/slices/cartSlice.js';
import { selectUser } from '../store/slices/authSlice.js';
import { ordersAPI, paymentsAPI } from '../api/index.js';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 'address', label: 'Address', icon: MapPin },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'confirm', label: 'Confirm', icon: CheckCircle },
];

// ── Stripe Card Element (uses Stripe.js via NPM package) ─────────────────────
function StripeCardInput({ onReady, onError }) {
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    let localCard = null;

    const initStripe = async () => {
      const pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      if (!pk) {
        onReady(null, null);
        return;
      }

      try {
        const { loadStripe } = await import('@stripe/stripe-js');
        const stripe = await loadStripe(pk);
        if (!stripe) {
          onReady(null, null);
          return;
        }

        const elements = stripe.elements();
        localCard = elements.create('card', {
          style: {
            base: {
              color: '#e2e8f0',
              fontFamily: 'Inter, sans-serif',
              fontSize: '15px',
              '::placeholder': { color: '#64748b' },
              iconColor: '#94a3b8',
            },
            invalid: { color: '#f87171', iconColor: '#f87171' },
          },
          hidePostalCode: true,
        });

        localCard.mount('#stripe-card-element');
        localCard.on('change', e => onError(e.error?.message || ''));
        onReady(stripe, localCard);
      } catch (err) {
        console.error('Failed to load Stripe:', err);
        onReady(null, null);
      }
    };

    initStripe();

    return () => {
      if (localCard) {
        try { localCard.unmount(); } catch { }
      }
    };
  }, []); // eslint-disable-line

  return (
    <div
      id="stripe-card-element"
      className="input-field px-4 py-3.5 min-h-[46px] text-sm"
    />
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const items = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const user = useSelector(selectUser);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [paymentMethod, setPayMethod] = useState('stripe');
  const [couponCode, setCoupon] = useState('');
  const [cardError, setCardError] = useState('');
  const stripeRef = useRef({ stripe: null, card: null });

  const shipping = subtotal >= 500 ? 0 : 49;
  const tax = Math.round(subtotal * 0.18 * 100) / 100;
  const total = subtotal + shipping + tax;

  const [address, setAddress] = useState({
    fullName: user?.name || '', phone: user?.phone || '',
    addressLine1: '', addressLine2: '',
    city: '', state: '', postalCode: '', country: 'IN',
  });

  useEffect(() => {
    const resumeOrderId = location.state?.resumeOrderId;

    if (resumeOrderId) {
      const fetchPendingOrder = async () => {
        try {
          setLoading(true);
          const res = await ordersAPI.getById(resumeOrderId);
          const pendingOrder = res.data.order;

          if (pendingOrder.status === 'pending' && pendingOrder.paymentMethod === 'stripe') {
            setOrder(pendingOrder);
            setStep(1);
            setAddress(pendingOrder.shippingAddress);
            setPayMethod('stripe');
          } else {
            toast.error('This order cannot be paid at this time');
            navigate('/orders');
          }
        } catch (err) {
          toast.error('Failed to load order');
          navigate('/orders');
        } finally {
          setLoading(false);
        }
      };
      fetchPendingOrder();
    } else if (step < 2 && (!items || items.length === 0)) {
      navigate('/products');
    }
  }, [items, navigate, step, location.state]);

  const handleAddressNext = () => {
    const { fullName, phone, addressLine1, city, state, postalCode } = address;
    if (!fullName || !phone || !addressLine1 || !city || !state || !postalCode) {
      toast.error('Please fill all required fields');
      return;
    }
    setStep(1);
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    setCardError('');
    try {
      let newOrder = order;

      // 1. Create order if not already resuming one
      if (!newOrder) {
        const orderRes = await ordersAPI.create({
          shippingAddress: address,
          paymentMethod,
          couponCode: couponCode || undefined,
        });
        newOrder = orderRes.data.order;
        setOrder(newOrder);
      }

      // 2. COD — no payment, just clear cart and done
      if (paymentMethod === 'cod') {
        setStep(2);
        await dispatch(clearCart());
        toast.success('Order placed! 🎉');
        return;
      }

      // 3. Stripe — get client secret
      const intentRes = await paymentsAPI.createIntent(newOrder._id);
      const clientSecret = intentRes.data.clientSecret;

      const { stripe, card } = stripeRef.current;

      if (!stripe) {
        toast.error('Stripe was not initialized properly. Please check your network connection or API keys.');
        setLoading(false);
        try { await ordersAPI.cancel(newOrder._id); } catch { }
        return;
      }

      if (!card) {
        toast.error('Card input is not fully loaded. Please refresh and try again.');
        setLoading(false);
        return;
      }

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: card,
          billing_details: { name: address.fullName },
        },
      });

      if (result.error) {
        setCardError(result.error.message);
        toast.error(result.error.message);
        // Roll back order
        try { await ordersAPI.cancel(newOrder._id); } catch { }
        return;
      }

      // 6. Success — clear cart
      await paymentsAPI.verify(newOrder._id);

      setStep(2);
      await dispatch(clearCart());
      toast.success('Payment successful! 🎉');

    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  // ── Order Success ────────────────────────────────────────────────────────
  if (step === 2 && order) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Order Placed! 🎉</h1>
          <p className="text-obsidian-300 mb-6">We'll notify you once your order is confirmed.</p>

          <div className="glass rounded-2xl p-5 mb-6 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-obsidian-400">Order Number</span>
              <span className="text-white font-mono font-semibold">#{order.orderNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-obsidian-400">Amount</span>
              <span className="text-gradient font-bold">₹{order.totalAmount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-obsidian-400">Payment</span>
              <span className="text-white capitalize">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-obsidian-400">Delivery to</span>
              <span className="text-white">{address.city}, {address.state}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button fullWidth onClick={() => navigate(`/orders/${order._id}`)}>
              <Package className="w-4 h-4" /> Track Order
            </Button>
            <Button variant="ghost" fullWidth onClick={() => navigate('/products')}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container-app py-8">
        <h1 className="text-3xl font-display font-bold text-white mb-8">Checkout</h1>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 ${i <= step ? 'text-gold-400' : 'text-obsidian-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${i < step ? 'bg-gold-500 border-gold-500 text-obsidian-900' :
                  i === step ? 'border-gold-500 text-gold-400' :
                    'border-obsidian-600 text-obsidian-500'
                  }`}>
                  {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className="text-sm font-medium hidden sm:block">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-obsidian-600 mx-1" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">

            {/* Step 0: Address */}
            {step === 0 && (
              <div className="glass rounded-2xl p-6 space-y-5">
                <h2 className="text-lg font-display font-semibold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gold-400" /> Shipping Address
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Full Name *" value={address.fullName} onChange={e => setAddress(p => ({ ...p, fullName: e.target.value }))} placeholder="John Doe" />
                  <Input label="Phone *" value={address.phone} onChange={e => setAddress(p => ({ ...p, phone: e.target.value }))} placeholder="9876543210" type="tel" />
                </div>
                <Input label="Address Line 1 *" value={address.addressLine1} onChange={e => setAddress(p => ({ ...p, addressLine1: e.target.value }))} placeholder="House no, Street name" />
                <Input label="Address Line 2" value={address.addressLine2} onChange={e => setAddress(p => ({ ...p, addressLine2: e.target.value }))} placeholder="Apartment, locality (optional)" />
                <div className="grid grid-cols-3 gap-4">
                  <Input label="City *" value={address.city} onChange={e => setAddress(p => ({ ...p, city: e.target.value }))} placeholder="Mumbai" />
                  <Input label="State *" value={address.state} onChange={e => setAddress(p => ({ ...p, state: e.target.value }))} placeholder="Maharashtra" />
                  <Input label="PIN Code *" value={address.postalCode} onChange={e => setAddress(p => ({ ...p, postalCode: e.target.value }))} placeholder="400001" maxLength={6} />
                </div>
                <Button fullWidth size="lg" onClick={handleAddressNext}>
                  Continue to Payment <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Step 1: Payment */}
            {step === 1 && (
              <div className="glass rounded-2xl p-6 space-y-5">
                <h2 className="text-lg font-display font-semibold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gold-400" /> Payment Method
                </h2>

                <div className="space-y-3">
                  {[
                    { id: 'stripe', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay — powered by Stripe', Icon: CreditCard },
                    { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive your order', Icon: Truck },
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setPayMethod(m.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${paymentMethod === m.id ? 'border-gold-500/60 bg-gold-500/10' : 'border-obsidian-700 hover:border-obsidian-500'
                        }`}
                    >
                      <m.Icon className={`w-5 h-5 flex-shrink-0 ${paymentMethod === m.id ? 'text-gold-400' : 'text-obsidian-400'}`} />
                      <div className="flex-1">
                        <p className="font-medium text-white text-sm">{m.label}</p>
                        <p className="text-xs text-obsidian-400 mt-0.5">{m.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${paymentMethod === m.id ? 'border-gold-500' : 'border-obsidian-600'}`}>
                        {paymentMethod === m.id && <div className="w-2.5 h-2.5 bg-gold-500 rounded-full" />}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Stripe card form */}
                {paymentMethod === 'stripe' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-obsidian-200 block">Card Details</label>
                    <StripeCardInput
                      onReady={(stripe, card) => { stripeRef.current = { stripe, card }; }}
                      onError={setCardError}
                    />
                    {cardError && <p className="text-xs text-red-400">{cardError}</p>}
                    <p className="text-xs text-obsidian-500 flex items-center gap-1.5">
                      <Lock className="w-3 h-3" /> Encrypted via Stripe — we never store card details
                    </p>
                  </div>
                )}

                {/* Coupon */}
                <div>
                  <label className="text-sm font-medium text-obsidian-200 block mb-1.5">Coupon Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={e => setCoupon(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="input-field flex-1 uppercase tracking-widest text-sm"
                    />
                    <Button variant="ghost" size="sm">Apply</Button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={() => setStep(0)}>← Back</Button>
                  <Button fullWidth size="lg" onClick={handlePlaceOrder} loading={loading}>
                    <Lock className="w-4 h-4" />
                    {paymentMethod === 'cod' ? `Place Order • ₹${total.toLocaleString()}` : `Pay ₹${total.toLocaleString()}`}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div>
            <div className="glass rounded-2xl p-5 space-y-4 sticky top-24">
              <h3 className="font-display font-semibold text-white">Order Summary</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {items.map(item => {
                  const product = item.product || item;
                  const price = item.price || product?.price || 0;
                  return (
                    <div key={item._id} className="flex items-center gap-3">
                      <img
                        src={product?.thumbnail || `https://picsum.photos/seed/${item._id}/50/50`}
                        alt={product?.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-obsidian-800"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{product?.name}</p>
                        <p className="text-xs text-obsidian-400">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-sm font-medium text-white whitespace-nowrap">
                        ₹{(price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="h-px bg-obsidian-700/50" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-obsidian-300">
                  <span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-obsidian-300">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'text-emerald-400 font-medium' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                </div>
                <div className="flex justify-between text-obsidian-300">
                  <span>Tax (18% GST)</span><span>₹{tax.toLocaleString()}</span>
                </div>
                <div className="h-px bg-obsidian-700/50 my-1" />
                <div className="flex justify-between font-bold text-white text-base">
                  <span>Total</span>
                  <span className="text-gradient text-lg">₹{total.toLocaleString()}</span>
                </div>
              </div>

              {subtotal > 0 && subtotal < 500 && (
                <p className="text-xs text-gold-400 bg-gold-500/10 border border-gold-500/20 rounded-xl px-3 py-2">
                  Add ₹{(500 - subtotal).toLocaleString()} more for FREE shipping!
                </p>
              )}

              <div className="flex items-center gap-1.5 text-xs text-obsidian-400">
                <Lock className="w-3 h-3" /> Secure checkout powered by Stripe
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}