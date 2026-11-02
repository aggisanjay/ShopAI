import { Link } from 'react-router-dom';
import { ArrowUpRight, Cpu, Shirt, Home, BookOpen, Trophy, Sparkles, ShoppingBag } from 'lucide-react';
import { Reveal } from '../ui/motion.jsx';
import { cn } from '../../lib/utils.js';

const ICONS = { electronics: Cpu, fashion: Shirt, 'home-kitchen': Home, books: BookOpen, sports: Trophy, beauty: Sparkles };
// asymmetric bento: [col, row] spans on lg
const SPANS = ['lg:col-span-2 lg:row-span-2', 'lg:col-span-1', 'lg:col-span-1', 'lg:col-span-2', 'lg:col-span-2', 'lg:col-span-2'];

export default function CategoryBento({ categories }) {
  const loading = categories.length === 0;
  const list = loading ? Array.from({ length: 6 }) : categories.slice(0, 6);
  return (
    <section className="container-app">
      <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3">Browse</p>
          <h2 className="section-title">Shop by <span className="italic text-obsidian-400">category</span></h2>
        </div>
        <Link to="/products" className="group flex items-center gap-1.5 text-sm text-obsidian-300 transition-colors hover:text-white">All products <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>
      </Reveal>

      <div className="grid auto-rows-[200px] grid-cols-2 gap-3 sm:auto-rows-[230px] lg:grid-cols-4 lg:gap-4">
        {list.map((cat, i) => {
          const Icon = ICONS[cat?.slug] || ShoppingBag;
          const big = i === 0;
          return (
            <Reveal key={cat?._id || i} delay={i * 0.06} className={cn('col-span-1', i === 0 && 'col-span-2 row-span-2 sm:col-span-2', i === 5 && 'col-span-2', SPANS[i])}>
              {loading ? <div className="skeleton h-full w-full rounded-[2rem]" /> : (
                <Link to={`/products?category=${cat._id}`} className="group relative block h-full overflow-hidden rounded-[2rem] border border-white/[0.07] bg-obsidian-800">
                  {cat.image
                    ? <img src={cat.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.07]" />
                    : <div className="absolute inset-0 bg-gradient-to-br from-obsidian-700 to-obsidian-850" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10 transition-opacity duration-500 group-hover:from-black/70" />
                  <div className="absolute left-5 top-5 grid h-11 w-11 place-items-center rounded-full glass text-cream"><Icon className="h-[18px] w-[18px]" /></div>
                  <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-3">
                    <div>
                      <h3 className={cn('font-display leading-none tracking-tight text-white', big ? 'text-5xl sm:text-6xl' : 'text-3xl sm:text-4xl')}>{cat.name}</h3>
                      {big && cat.description && <p className="mt-3 line-clamp-2 max-w-xs text-sm text-white/70">{cat.description}</p>}
                    </div>
                    <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-cream text-ink transition-all duration-500 ease-out group-hover:scale-110 group-hover:bg-white"><ArrowUpRight className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
                  </div>
                </Link>
              )}
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
