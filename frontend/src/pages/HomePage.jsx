import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Sparkles, TrendingUp, Clock } from 'lucide-react';
import { selectIsAuthenticated } from '../store/slices/authSlice.js';
import { openAuthModal } from '../store/slices/uiSlice.js';
import { productsAPI, recoAPI, categoriesAPI } from '../api/index.js';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed.js';
import Hero from '../components/home/Hero.jsx';
import BrandMarquee from '../components/home/BrandMarquee.jsx';
import CategoryBento from '../components/home/CategoryBento.jsx';
import DealOfTheDay from '../components/home/DealOfTheDay.jsx';
import EditorialDuo from '../components/home/EditorialDuo.jsx';
import PerksGrid from '../components/home/PerksGrid.jsx';
import JoinCTA from '../components/home/JoinCTA.jsx';
import ProductRail from '../components/product/ProductRail.jsx';

export default function HomePage() {
  const dispatch = useDispatch();
  const isAuth = useSelector(selectIsAuthenticated);
  const { items: recent } = useRecentlyViewed();

  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [personalized, setPersonalized] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingPersonal, setLoadingPersonal] = useState(false);

  useEffect(() => {
    productsAPI.getFeatured(10).then((r) => setFeatured(r.data.products || [])).catch(() => {}).finally(() => setLoadingFeatured(false));
    productsAPI.getTrending(10).then((r) => setTrending(r.data.products || [])).catch(() => {}).finally(() => setLoadingTrending(false));
    categoriesAPI.getAll().then((r) => setCategories(r.data.categories || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isAuth) return;
    setLoadingPersonal(true);
    recoAPI.getPersonalized(10).then((r) => setPersonalized(r.data.products || [])).catch(() => {}).finally(() => setLoadingPersonal(false));
  }, [isAuth]);

  const openRegister = () => dispatch(openAuthModal('register'));

  return (
    <div className="pb-8">
      <Hero isAuth={isAuth} onRegister={openRegister} />
      <BrandMarquee />

      <div className="space-y-28 pt-24 sm:space-y-36 sm:pt-32">
        <CategoryBento categories={categories} />

        {isAuth && (
          <ProductRail
            eyebrow={<><Sparkles className="h-3 w-3" /> Picked for you</>} title="Recommended" accentWord="for you"
            viewAllLink="/products" products={personalized} loading={loadingPersonal}
          />
        )}

        <ProductRail eyebrow="Editor's pick" title="Featured" accentWord="products" viewAllLink="/products?isFeatured=true" products={featured} loading={loadingFeatured} />

        {!loadingFeatured && <DealOfTheDay product={featured[0]} />}

        <ProductRail
          eyebrow={<><TrendingUp className="h-3 w-3" /> Hot right now</>} title="Trending" accentWord="this week"
          viewAllLink="/products?sort=trending" products={trending} loading={loadingTrending}
        />

        <EditorialDuo />

        {recent.length > 1 && (
          <ProductRail eyebrow={<><Clock className="h-3 w-3" /> Pick up where you left off</>} title="Recently" accentWord="viewed" products={recent} />
        )}

        <PerksGrid />
        {!isAuth && <JoinCTA onJoin={openRegister} />}
      </div>
    </div>
  );
}
