import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ShoppingBag, Search, User, Heart, Menu, X, Zap,
  LogOut, Package, Settings, ChevronDown, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { selectIsAuthenticated, selectUser, logoutUser } from '../../store/slices/authSlice.js';
import { selectCartCount, toggleCart } from '../../store/slices/cartSlice.js';
import { openAuthModal } from '../../store/slices/uiSlice.js';
import { productsAPI } from '../../api/index.js';
import { useDebounce } from '../../hooks/useDebounce.js';

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectUser);
  const isAuth = useSelector(selectIsAuthenticated);
  const cartCount = useSelector(selectCartCount);

  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const debouncedSearch = useDebounce(searchQuery, 350);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!debouncedSearch.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    productsAPI.search({ q: debouncedSearch, limit: 6 })
      .then(res => setSearchResults(res.data.products || []))
      .catch(() => setSearchResults([]))
      .finally(() => setSearchLoading(false));
  }, [debouncedSearch]);

  useEffect(() => {
    setSearchOpen(false);
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/');
  };

  const navLinks = [
    { to: '/products', label: 'Shop' },
    { to: '/products?sort=trending', label: 'Trending' },
    { to: '/products?isFeatured=true', label: 'Featured' },
  ];

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled ? 'glass shadow-2xl' : 'bg-transparent'
      }`}>
        <div className="container-app">
          <div className="flex items-center justify-between h-16 md:h-18">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-gold group-hover:scale-110 transition-transform">
                <Sparkles className="w-4 h-4 text-obsidian-900" />
              </div>
              <span className="font-display text-xl font-bold">
                Shop<span className="text-gradient">AI</span>
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === link.to.split('?')[0]
                      ? 'text-gold-400 bg-gold-500/10'
                      : 'text-obsidian-300 hover:text-white hover:bg-obsidian-700/50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button
                onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 100); }}
                className="btn-ghost !px-3 !py-2 hidden sm:flex"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Wishlist */}
              {isAuth && (
                <Link to="/wishlist" className="hidden sm:flex btn-ghost !px-3 !py-2">
                  <Heart className="w-4 h-4" />
                </Link>
              )}

              {/* Cart */}
              <button
                onClick={() => dispatch(toggleCart())}
                className="relative btn-ghost !px-3 !py-2"
              >
                <ShoppingBag className="w-4 h-4" />
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4.5 h-4.5 min-w-[18px] px-0.5 rounded-full bg-gold-500 text-obsidian-900 text-[10px] font-bold flex items-center justify-center"
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </motion.span>
                )}
              </button>

              {/* User */}
              {isAuth ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-obsidian-700/50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-obsidian-900 text-xs font-bold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-obsidian-400 transition-transform hidden sm:block ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-52 glass rounded-2xl shadow-2xl overflow-hidden"
                      >
                        <div className="p-3 border-b border-obsidian-700/50">
                          <p className="font-medium text-sm text-white truncate">{user?.name}</p>
                          <p className="text-xs text-obsidian-400 truncate">{user?.email}</p>
                        </div>
                        <div className="p-2 space-y-0.5">
                          <Link to="/profile" className="flex items-center gap-2.5 px-3 py-2 text-sm text-obsidian-200 hover:text-white hover:bg-obsidian-700/50 rounded-xl transition-colors">
                            <User className="w-3.5 h-3.5" /> My Profile
                          </Link>
                          <Link to="/orders" className="flex items-center gap-2.5 px-3 py-2 text-sm text-obsidian-200 hover:text-white hover:bg-obsidian-700/50 rounded-xl transition-colors">
                            <Package className="w-3.5 h-3.5" /> My Orders
                          </Link>
                          {user?.role === 'admin' && (
                            <Link to="/admin" className="flex items-center gap-2.5 px-3 py-2 text-sm text-gold-400 hover:text-gold-300 hover:bg-gold-500/10 rounded-xl transition-colors">
                              <Settings className="w-3.5 h-3.5" /> Admin Panel
                            </Link>
                          )}
                          <hr className="border-obsidian-700/50 my-1" />
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
                          >
                            <LogOut className="w-3.5 h-3.5" /> Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={() => dispatch(openAuthModal('login'))}
                  className="btn-gold !py-2 !px-4 text-sm hidden sm:flex"
                >
                  Sign In
                </button>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="btn-ghost !px-2.5 !py-2 md:hidden"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass border-t border-obsidian-700/50 md:hidden overflow-hidden"
            >
              <div className="container-app py-4 space-y-1">
                {navLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="block px-4 py-3 text-sm text-obsidian-200 hover:text-white hover:bg-obsidian-700/50 rounded-xl"
                  >
                    {link.label}
                  </Link>
                ))}
                {!isAuth && (
                  <button
                    onClick={() => { dispatch(openAuthModal('login')); setMobileMenuOpen(false); }}
                    className="w-full mt-2 btn-gold"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
          >
            <motion.div
              initial={{ opacity: 0, y: -40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ type: 'spring', bounce: 0.2 }}
              className="container-app pt-20"
              onClick={e => e.stopPropagation()}
            >
              <div className="glass rounded-2xl p-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-obsidian-400" />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search products, brands..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        navigate(`/products?q=${encodeURIComponent(searchQuery)}`);
                        setSearchOpen(false);
                      }
                      if (e.key === 'Escape') setSearchOpen(false);
                    }}
                    className="w-full bg-transparent text-lg text-white placeholder-obsidian-500 outline-none pl-12 pr-4 py-2"
                  />
                </div>

                {/* Search results */}
                {searchResults.length > 0 && (
                  <div className="mt-3 border-t border-obsidian-700/50 pt-3 space-y-1">
                    {searchResults.map(product => (
                      <button
                        key={product._id}
                        onClick={() => {
                          navigate(`/product/${product.slug}`);
                          setSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-obsidian-700/50 rounded-xl text-left transition-colors group"
                      >
                        <img
                          src={product.thumbnail || `https://picsum.photos/seed/${product._id}/60/60`}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate group-hover:text-gold-400 transition-colors">
                            {product.name}
                          </p>
                          <p className="text-xs text-obsidian-400">₹{product.price?.toLocaleString()}</p>
                        </div>
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        navigate(`/products?q=${encodeURIComponent(searchQuery)}`);
                        setSearchOpen(false);
                      }}
                      className="w-full text-center text-sm text-gold-400 hover:text-gold-300 py-2 transition-colors"
                    >
                      See all results →
                    </button>
                  </div>
                )}

                {searchLoading && (
                  <div className="mt-3 pt-3 border-t border-obsidian-700/50 text-center text-sm text-obsidian-400 py-2">
                    Searching...
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close user menu */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
      )}
    </>
  );
}
