import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowRight, Minus, Plus, ShoppingBag } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import StarRating from '../ui/StarRating.jsx';
import { addToCart } from '../../store/slices/cartSlice.js';
import { selectIsAuthenticated } from '../../store/slices/authSlice.js';
import { openAuthModal } from '../../store/slices/uiSlice.js';
import { cn, formatINR } from '../../lib/utils.js';

export default function QuickView({ product, open, onClose }) {
  const dispatch = useDispatch();
  const isAuth = useSelector(selectIsAuthenticated);
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [busy, setBusy] = useState(false);
  const images = product.images?.length ? product.images : [product.thumbnail];
  const stock = Math.max(0, (product.stock || 0) - (product.reservedStock || 0));
  const discount = product.comparePrice > product.price ? Math.round((1 - product.price / product.comparePrice) * 100) : 0;

  const add = async () => {
    if (!isAuth) { onClose(); return dispatch(openAuthModal('login')); }
    setBusy(true);
    const res = await dispatch(addToCart({ productId: product._id, quantity: qty }));
    setBusy(false);
    if (res.type.endsWith('fulfilled')) onClose();
  };

  return (
    <Modal isOpen={open} onClose={onClose} size="xl" bodyClassName="p-0">
      <div className="grid md:grid-cols-2">
        <div className="relative bg-obsidian-800">
          <div className="aspect-square md:aspect-auto md:h-full md:min-h-[520px]">
            <img src={images[img] || `https://picsum.photos/seed/${product._id}/800/800`} alt={product.name} className="h-full w-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
              {images.slice(0, 5).map((_, i) => <button key={i} onClick={() => setImg(i)} aria-label={`Image ${i + 1}`} className={cn('h-1.5 rounded-full bg-white transition-all duration-300', i === img ? 'w-7' : 'w-1.5 opacity-50')} />)}
            </div>
          )}
        </div>
        <div className="flex flex-col p-7 sm:p-9">
          <p className="eyebrow">{product.brand || product.category?.name}</p>
          <h2 className="mt-3 font-display text-4xl leading-[1] tracking-tight">{product.name}</h2>
          {product.rating > 0 && <div className="mt-4"><StarRating rating={product.rating} count={product.reviewCount || 0} size="md" /></div>}
          <div className="mt-5 flex items-baseline gap-3">
            <span className="tabular font-display text-5xl leading-none">{formatINR(product.price)}</span>
            {discount > 0 && <><span className="tabular text-obsidian-500 line-through">{formatINR(product.comparePrice)}</span><span className="badge-gold">Save {discount}%</span></>}
          </div>
          {product.shortDescription && <p className="mt-5 line-clamp-4 text-[15px] leading-relaxed text-obsidian-300">{product.shortDescription}</p>}

          <div className="mt-auto space-y-3 pt-8">
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-full border border-white/10">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease" className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/10"><Minus className="h-4 w-4" /></button>
                <span className="tabular w-8 text-center">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(stock || 10, q + 1))} aria-label="Increase" className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/10"><Plus className="h-4 w-4" /></button>
              </div>
              <Button fullWidth size="lg" loading={busy} disabled={stock === 0} onClick={add} icon={ShoppingBag}>{stock === 0 ? 'Sold out' : 'Add to bag'}</Button>
            </div>
            <Link to={`/product/${product.slug}`} onClick={onClose} className="flex items-center justify-center gap-2 py-2 text-sm text-obsidian-300 transition-colors hover:text-white">View full details <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}
