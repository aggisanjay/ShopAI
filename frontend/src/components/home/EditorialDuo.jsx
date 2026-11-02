import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Reveal } from '../ui/motion.jsx';

const CARDS = [
  { title: 'New arrivals', kicker: '01', sub: 'Fresh drops every week', to: '/products?sort=newest', img: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1000&q=80' },
  { title: 'Best sellers', kicker: '02', sub: 'Most loved by shoppers', to: '/products?sort=popular', img: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1000&q=80' },
];

export default function EditorialDuo() {
  return (
    <section className="container-app">
      <div className="grid gap-4 md:grid-cols-2 lg:gap-5">
        {CARDS.map((c, i) => (
          <Reveal key={c.title} delay={i * 0.1}>
            <Link to={c.to} className="group relative block h-[380px] overflow-hidden rounded-[2.25rem] border border-white/[0.07] bg-obsidian-800 sm:h-[460px]">
              <img src={c.img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.06]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/5" />
              <span className="absolute left-7 top-7 font-mono text-[11px] uppercase tracking-[0.22em] text-white/70">[ {c.kicker} ]</span>
              <div className="absolute inset-x-7 bottom-7 flex items-end justify-between gap-4">
                <div>
                  <h3 className="font-display text-6xl leading-[0.9] tracking-tight text-white sm:text-7xl">{c.title}</h3>
                  <p className="mt-3 text-[15px] text-white/70">{c.sub}</p>
                </div>
                <span className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-full bg-cream text-ink transition-transform duration-500 ease-out group-hover:scale-110"><ArrowUpRight className="h-6 w-6 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
