
import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowRight, Zap, Shield, Truck, Star, Sparkles,
  TrendingUp, ChevronLeft, ChevronRight,
  Cpu, Shirt, Home, BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { selectIsAuthenticated } from '../store/slices/authSlice.js';
import { openAuthModal } from '../store/slices/uiSlice.js';
import { productsAPI, recoAPI, categoriesAPI } from '../api/index.js';
import ProductCard from '../components/product/ProductCard.jsx';
import { ProductCardSkeleton } from '../components/ui/Skeleton.jsx';
import Button from '../components/ui/Button.jsx';

// ─── Hero Carousel Data ────────────────────────────────────────────────────
const HERO_SLIDES = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1600&q=85',
    BadgeIcon: Cpu,
    badge: 'Electronics Sale',
    title: 'Premium Sound,\nZero Compromise',
    subtitle: 'Up to 40% off on Sony, JBL, Apple audio products this week.',
    cta: 'Shop Electronics',
    ctaLink: '/products?category=electronics',
    accent: 'from-blue-600/40 to-purple-600/20',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&q=85',
    BadgeIcon: Shirt,
    badge: 'Fashion Week',
    title: 'Step Into\nYour Style',
    subtitle: 'Nike, Adidas, Levi\'s — curated looks for every occasion.',
    cta: 'Explore Fashion',
    ctaLink: '/products?category=fashion',
    accent: 'from-orange-600/40 to-red-600/20',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1600&q=85',
    BadgeIcon: Home,
    badge: 'Home Refresh',
    title: 'Make Your Space\nYour Own',
    subtitle: 'Dyson, Instant Pot, IKEA — everything to upgrade your home.',
    cta: 'Shop Home',
    ctaLink: '/products?category=home-kitchen',
    accent: 'from-emerald-600/30 to-teal-600/20',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1600&q=85',
    BadgeIcon: BookOpen,
    badge: 'Knowledge Sale',
    title: 'Books That\nChange Lives',
    subtitle: 'Atomic Habits, Rich Dad Poor Dad and 100+ bestsellers.',
    cta: 'Browse Books',
    ctaLink: '/products?category=books',
    accent: 'from-gold-600/30 to-amber-600/20',
  },
];

// ─── Hero Carousel ────────────────────────────────────────────────────────
function HeroCarousel({ onShop, isAuth, onRegister }) {
  const [current, setCurrent] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  const next = useCallback(() => setCurrent(c => (c + 1) % HERO_SLIDES.length), []);
  const prev = useCallback(() => setCurrent(c => (c - 1 + HERO_SLIDES.length) % HERO_SLIDES.length), []);

  useEffect(() => {
    if (!autoplay) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [autoplay, next]);

  const slide = HERO_SLIDES[current];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image with smooth crossfade */}
      <AnimatePresence mode="sync">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover object-center"
            fetchpriority="high"
          />
          {/* Overlay gradient */}
          <div className={`absolute inset-0 bg-gradient-to-r from-obsidian-950/95 via-obsidian-950/70 to-transparent`} />
          <div className={`absolute inset-0 bg-gradient-to-br ${slide.accent} opacity-60`} />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="container-app relative z-10 pt-24 pb-16">
        <div className="max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <span className="inline-flex items-center gap-2 badge-gold text-sm py-2 px-4">
                {slide.BadgeIcon && <slide.BadgeIcon className="w-3.5 h-3.5" />}
                {slide.badge}
              </span>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-tight whitespace-pre-line">
                {slide.title.split('\n').map((line, i) => (
                  <span key={i}>
                    {i === 0 ? line : <><br /><span className="text-gradient">{line}</span></>}
                  </span>
                ))}
              </h1>

              <p className="text-lg text-obsidian-300 max-w-lg leading-relaxed">
                {slide.subtitle}
              </p>

              <div className="flex items-center gap-4 pt-2">
                <Link to={slide.ctaLink}>
                  <Button size="lg" iconRight={ArrowRight} className="!text-base !px-8 !py-4">
                    {slide.cta}
                  </Button>
                </Link>
                {!isAuth && (
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={onRegister}
                    className="!text-base !px-8 !py-4"
                  >
                    Join Free
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Carousel Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4">
        {/* Dots */}
        <div className="flex gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrent(i); setAutoplay(false); }}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-8 h-2 bg-gold-400'
                  : 'w-2 h-2 bg-obsidian-500 hover:bg-obsidian-400'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Arrow Controls */}
      <button
        onClick={() => { prev(); setAutoplay(false); }}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center rounded-full glass hover:bg-obsidian-700 transition-all"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => { next(); setAutoplay(false); }}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center rounded-full glass hover:bg-obsidian-700 transition-all"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Slide counter */}
      {/* <div className="absolute top-24 right-8 z-10 text-xs text-obsidian-400 font-mono hidden md:block">
        {String(current + 1).padStart(2, '0')} / {String(HERO_SLIDES.length).padStart(2, '0')}
      </div> */}

      {/* Stats bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="container-app">
          <div className="hidden md:flex items-center divide-x divide-obsidian-700/50 glass rounded-t-2xl overflow-hidden">
            {[
              { value: '30+', label: 'Premium Brands' },
              { value: '1M+', label: 'Happy Customers' },
              { value: '4.8★', label: 'Average Rating' },
              { value: '2hr', label: 'Express Delivery' },
            ].map(stat => (
              <div key={stat.label} className="flex-1 text-center py-4 px-6">
                <div className="text-xl font-display font-bold text-gradient">{stat.value}</div>
                <div className="text-xs text-obsidian-400 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────
function SectionTitle({ badge, badgeColor = 'gold', title, viewAllLink }) {
  const badgeClass = {
    gold: 'badge-gold',
    purple: 'badge bg-purple-500/20 text-purple-400 border border-purple-500/30',
    orange: 'badge bg-orange-500/20 text-orange-400 border border-orange-500/30',
  }[badgeColor] || 'badge-gold';

  return (
    <div className="flex items-end justify-between mb-8">
      <div>
        {badge && <span className={`${badgeClass} mb-2 inline-flex items-center gap-1.5`}>{badge}</span>}
        <h2 className="section-title">{title}</h2>
      </div>
      {viewAllLink && (
        <Link
          to={viewAllLink}
          className="text-sm text-gold-400 hover:text-gold-300 transition-colors flex items-center gap-1"
        >
          See all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

// ─── Product Row ──────────────────────────────────────────────────────────
function ProductRow({ badge, badgeColor, title, viewAllLink, products, loading }) {
  return (
    <section className="container-app">
      <SectionTitle badge={badge} badgeColor={badgeColor} title={title} viewAllLink={viewAllLink} />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {loading
          ? Array(5).fill(null).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.slice(0, 5).map((p, i) => <ProductCard key={p._id} product={p} index={i} />)
        }
      </div>
    </section>
  );
}

// ─── Category Icons ───────────────────────────────────────────────────────
const CAT_ICONS = {
  electronics: '⚡',
  fashion: '👗',
  'home-kitchen': '🏠',
  books: '📚',
  sports: '🏆',
  beauty: '✨',
};

// ─── Promo Banner ─────────────────────────────────────────────────────────
function PromoBanners() {
  const banners = [
    {
      title: 'New Arrivals',
      subtitle: 'Fresh drops every week',
      image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&q=80',
      link: '/products?sort=newest',
      color: 'from-blue-600/80 to-blue-800/80',
    },
    {
      title: 'Best Sellers',
      subtitle: 'Most loved by shoppers',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80',
      link: '/products?sort=popular',
      color: 'from-gold-600/80 to-amber-800/80',
    },
  ];

  return (
    <section className="container-app">
      <div className="grid md:grid-cols-2 gap-5">
        {banners.map((b, i) => (
          <motion.div
            key={b.title}
            initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Link
              to={b.link}
              className="relative rounded-2xl overflow-hidden block h-48 group"
            >
              <img
                src={b.image}
                alt={b.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className={`absolute inset-0 bg-gradient-to-r ${b.color}`} />
              <div className="absolute inset-0 flex flex-col justify-center px-8">
                <h3 className="text-2xl font-display font-bold text-white">{b.title}</h3>
                <p className="text-white/70 text-sm mt-1">{b.subtitle}</p>
                <span className="flex items-center gap-1 text-white text-sm font-medium mt-3 group-hover:gap-2 transition-all">
                  Shop Now <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function HomePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuth = useSelector(selectIsAuthenticated);

  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [personalized, setPersonalized] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingPersonalized, setLoadingPersonalized] = useState(false);

  useEffect(() => {
    productsAPI.getFeatured(10)
      .then(r => setFeatured(r.data.products || []))
      .finally(() => setLoadingFeatured(false));

    productsAPI.getTrending(10)
      .then(r => setTrending(r.data.products || []))
      .finally(() => setLoadingTrending(false));

    categoriesAPI.getAll()
      .then(r => setCategories(r.data.categories?.slice(0, 6) || []));
  }, []);

  useEffect(() => {
    if (!isAuth) return;
    setLoadingPersonalized(true);
    recoAPI.getPersonalized(10)
      .then(r => setPersonalized(r.data.products || []))
      .finally(() => setLoadingPersonalized(false));
  }, [isAuth]);

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Carousel */}
      <HeroCarousel
        onShop={() => navigate('/products')}
        isAuth={isAuth}
        onRegister={() => dispatch(openAuthModal('register'))}
      />

      {/* Categories */}
      <section className="container-app">
        <SectionTitle badge="Browse" title="Shop by Category" />
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {categories.length === 0
            ? Array(6).fill(null).map((_, i) => (
                <div key={i} className="glass rounded-2xl p-4 h-24 skeleton" />
              ))
            : categories.map((cat, i) => (
                <motion.div
                  key={cat._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                >
                  <Link
                    to={`/products?category=${cat._id}`}
                    className="glass rounded-2xl overflow-hidden text-center hover:border-gold-500/30 hover:-translate-y-1 hover:shadow-gold transition-all duration-300 block group"
                  >
                    {cat.image ? (
                      <div className="h-20 overflow-hidden">
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                    ) : (
                      <div className="h-20 flex items-center justify-center text-3xl">
                        {CAT_ICONS[cat.slug] || '🛍️'}
                      </div>
                    )}
                    <p className="text-xs font-medium text-obsidian-200 group-hover:text-gold-400 transition-colors truncate p-3">
                      {cat.name}
                    </p>
                  </Link>
                </motion.div>
              ))
          }
        </div>
      </section>

      {/* Promo Banners */}
      <PromoBanners />

      {/* Personalized (if logged in) */}
      {isAuth && (
        <ProductRow
          badge={<><Sparkles className="w-3 h-3" /> Picks For You</>}
          badgeColor="purple"
          title="Personalized Recommendations"
          viewAllLink="/products"
          products={personalized}
          loading={loadingPersonalized}
        />
      )}

      {/* Featured */}
      <ProductRow
        badge="⭐ Editor's Pick"
        badgeColor="gold"
        title="Featured Products"
        viewAllLink="/products?isFeatured=true"
        products={featured}
        loading={loadingFeatured}
      />

      {/* Full-width featured product spotlight */}
      {!loadingFeatured && featured[0] && (
        <section className="container-app">
          <div className="relative rounded-3xl overflow-hidden min-h-[320px] flex items-center">
            <img
              src={featured[0].thumbnail}
              alt={featured[0].name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-obsidian-950/95 via-obsidian-950/70 to-transparent" />
            <div className="relative z-10 p-10 md:p-16 max-w-lg">
              <span className="badge-gold mb-3 inline-flex">🔥 Deal of the Day</span>
              <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">
                {featured[0].name}
              </h3>
              <p className="text-obsidian-300 text-sm mb-5 line-clamp-2">{featured[0].shortDescription}</p>
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl font-bold text-gradient">₹{featured[0].price?.toLocaleString()}</span>
                {featured[0].comparePrice > featured[0].price && (
                  <span className="text-obsidian-500 line-through text-lg">₹{featured[0].comparePrice?.toLocaleString()}</span>
                )}
              </div>
              <Link to={`/product/${featured[0].slug}`}>
                <Button iconRight={ArrowRight}>Shop Now</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Trending */}
      <ProductRow
        badge={<><TrendingUp className="w-3 h-3" /> Hot Right Now</>}
        badgeColor="orange"
        title="Trending This Week"
        viewAllLink="/products?sort=trending"
        products={trending}
        loading={loadingTrending}
      />

      {/* Value Props */}
      <section className="container-app">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹500', color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { icon: Shield, title: 'Secure Payment', desc: '100% secure checkout', color: 'text-green-400', bg: 'bg-green-500/10' },
            { icon: Zap, title: 'Fast Delivery', desc: '2-hour express option', color: 'text-gold-400', bg: 'bg-gold-500/10' },
            { icon: Star, title: 'Top Rated', desc: 'Curated quality products', color: 'text-purple-400', bg: 'bg-purple-500/10' },
          ].map(({ icon: Icon, title, desc, color, bg }) => (
            <div key={title} className="glass rounded-2xl p-5 text-center space-y-3 hover:border-obsidian-600 transition-colors">
              <div className={`w-10 h-10 ${bg} ${color} rounded-xl flex items-center justify-center mx-auto`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white">{title}</h3>
                <p className="text-xs text-obsidian-400 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      {!isAuth && (
        <section className="container-app">
          <div className="relative glass rounded-3xl overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1400&q=80"
              alt="Shopping"
              className="absolute inset-0 w-full h-full object-cover opacity-10"
            />
            <div className="relative p-10 md:p-14 text-center">
              <span className="badge-gold mb-4 inline-flex items-center gap-1.5 text-sm py-2 px-4">
                <Sparkles className="w-3.5 h-3.5" /> Join ShopAI Today
              </span>
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
                Start Shopping <span className="text-gradient">Smarter</span>
              </h2>
              <p className="text-obsidian-300 mb-8 max-w-lg mx-auto">
                Create your free account and let our AI discover products you'll love.
              </p>
              <Button size="lg" onClick={() => dispatch(openAuthModal('register'))} className="!px-10">
                Get Started — It's Free
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
