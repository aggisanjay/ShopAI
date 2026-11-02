import { Marquee } from '../ui/motion.jsx';
import { SITE } from '../../config/site.js';

export default function BrandMarquee() {
  return (
    <section aria-label="Brands we carry" className="border-y border-white/[0.07] py-7">
      <Marquee speed={55}>
        {SITE.brands.map((b) => (
          <span key={b} className="flex items-center">
            <span className="px-9 font-display text-[34px] leading-none tracking-tight text-obsidian-500 transition-colors duration-500 hover:text-cream sm:px-12 sm:text-[42px]">{b}</span>
            <span className="h-1 w-1 rounded-full bg-obsidian-600" />
          </span>
        ))}
      </Marquee>
    </section>
  );
}
