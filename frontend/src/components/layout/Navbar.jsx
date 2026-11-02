import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingBag, Search, Heart, Menu, X, LogOut, Package, Settings, User, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { selectIsAuthenticated, selectUser, logoutUser } from '../../store/slices/authSlice.js';
import { selectCartCount, toggleCart } from '../../store/slices/cartSlice.js';
import { openAuthModal } from '../../store/slices/uiSlice.js';
import Logo from '../ui/Logo.jsx';
import SearchPalette from './SearchPalette.jsx';
import { SITE } from '../../config/site.js';
import { cn } from '../../lib/utils.js';

const iconBtn = 'relative grid h-10 w-10 place-items-center rounded-full text-obsidian-200 transition-colors hover:bg-white/10 hover:text-white';

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectUser);
  const isAuth = useSelector(selectIsAuthenticated);
  const cartCount = useSelector(selectCartCount);

  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 36);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  // ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen((o) => !o); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => { setMenuOpen(false); setUserOpen(false); setSearchOpen(false); }, [location.pathname, location.search]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [menuOpen]);

  const isActive = (to) => {
    const [path, qs] = to.split('?');
    if (location.pathname !== path) return false;
    return qs ? location.search.includes(qs) : !location.search;
  };

  return (
    <>
      <header
        className={cn('fixed inset-x-0 z-40 flex justify-center px-3 transition-[top] duration-500 ease-out sm:px-5', scrolled ? 'top-3' : 'top-[46px]')}
      >
        <nav
          aria-label="Primary"
          className={cn(
            'flex h-14 w-full max-w-[1200px] items-center justify-between rounded-full pl-4 pr-2 transition-all duration-500 ease-out sm:pl-5',
            scrolled ? 'glass-dark shadow-pill' : 'glass'
          )}
        >
          <Link to="/" aria-label="ShopAI home" className="shrink-0"><Logo markClassName="h-7 w-7" /></Link>

          <ul className="hidden items-center gap-1 md:flex">
            {SITE.navLinks.map((l) => {
              const on = isActive(l.to);
              return (
                <li key={l.to} className="relative">
                  <Link
                    to={l.to}
                    className={cn('relative block rounded-full px-4 py-2 text-[13.5px] font-medium transition-colors', on ? 'text-white' : 'text-obsidian-300 hover:text-white')}
                  >
                    {on && <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-full bg-white/[0.09]" transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />}
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setSearchOpen(true)} aria-label="Search"
              className="mr-1 hidden h-10 items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] pl-3.5 pr-2 text-[13px] text-obsidian-300 transition-colors hover:bg-white/[0.08] hover:text-white lg:flex"
            >
              <Search className="h-4 w-4" /> Search
              <kbd className="rounded-md border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-obsidian-400">⌘K</kbd>
            </button>
            <button onClick={() => setSearchOpen(true)} aria-label="Search" className={cn(iconBtn, 'lg:hidden')}><Search className="h-[18px] w-[18px]" /></button>

            {isAuth && <Link to="/wishlist" aria-label="Wishlist" className={cn(iconBtn, 'hidden sm:grid')}><Heart className="h-[18px] w-[18px]" /></Link>}

            <button onClick={() => dispatch(toggleCart())} aria-label={`Cart, ${cartCount} items`} className={iconBtn}>
              <ShoppingBag className="h-[18px] w-[18px]" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    className="absolute right-0.5 top-0.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-ink"
                  >{cartCount > 99 ? '99+' : cartCount}</motion.span>
                )}
              </AnimatePresence>
            </button>

            {isAuth ? (
              <div className="relative ml-1">
                <button onClick={() => setUserOpen((o) => !o)} aria-label="Account menu" aria-expanded={userOpen}
                  className="grid h-10 w-10 place-items-center rounded-full bg-cream text-[13px] font-semibold text-ink transition-transform hover:scale-105">
                  {user?.name?.charAt(0).toUpperCase()}
                </button>
                <AnimatePresence>
                  {userOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="glass-dark absolute right-0 top-full z-20 mt-3 w-60 overflow-hidden rounded-3xl shadow-2xl"
                      >
                        <div className="border-b border-white/[0.07] p-4">
                          <p className="truncate text-sm font-medium text-cream">{user?.name}</p>
                          <p className="truncate text-xs text-obsidian-400">{user?.email}</p>
                        </div>
                        <div className="space-y-0.5 p-2">
                          {[
                            { to: '/profile', icon: User, label: 'My profile' },
                            { to: '/orders', icon: Package, label: 'My orders' },
                            { to: '/wishlist', icon: Heart, label: 'Wishlist' },
                          ].map(({ to, icon: I, label }) => (
                            <Link key={to} to={to} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-obsidian-200 transition-colors hover:bg-white/[0.07] hover:text-white"><I className="h-4 w-4" />{label}</Link>
                          ))}
                          {user?.role === 'admin' && (
                            <Link to="/admin" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-accent transition-colors hover:bg-accent/10"><Settings className="h-4 w-4" />Admin panel</Link>
                          )}
                          <button onClick={() => { dispatch(logoutUser()); navigate('/'); }} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-red-300 transition-colors hover:bg-red-500/10">
                            <LogOut className="h-4 w-4" />Sign out
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button onClick={() => dispatch(openAuthModal('login'))}
                className="ml-1 hidden h-10 items-center rounded-full bg-cream px-5 text-[13.5px] font-medium text-ink transition-all hover:bg-white hover:shadow-pill active:scale-[0.97] sm:inline-flex">
                Sign in
              </button>
            )}

            <button onClick={() => setMenuOpen((o) => !o)} aria-label="Menu" aria-expanded={menuOpen} className={cn(iconBtn, 'md:hidden')}>
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile overlay menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[39] bg-obsidian-900/95 px-6 pb-10 pt-32 backdrop-blur-2xl md:hidden"
          >
            <ul className="space-y-1">
              {SITE.navLinks.map((l, i) => (
                <motion.li key={l.to} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                  <Link to={l.to} className="flex items-center justify-between border-b border-white/[0.07] py-4 font-display text-5xl tracking-tight text-cream">
                    {l.label}<ArrowUpRight className="h-6 w-6 text-obsidian-500" />
                  </Link>
                </motion.li>
              ))}
            </ul>
            <div className="mt-10 flex flex-col gap-3">
              {!isAuth ? (
                <button onClick={() => { setMenuOpen(false); dispatch(openAuthModal('login')); }} className="btn-primary h-14 text-base">Sign in</button>
              ) : (
                <>
                  <Link to="/orders" className="btn-ghost h-14 text-base">My orders</Link>
                  <Link to="/wishlist" className="btn-ghost h-14 text-base">Wishlist</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
