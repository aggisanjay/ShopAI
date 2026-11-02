import { Truck, ShieldCheck, Zap, RotateCcw } from 'lucide-react';
import { Reveal } from '../ui/motion.jsx';
import { SITE } from '../../config/site.js';

const ICON = { Truck, ShieldCheck, Zap, RotateCcw };

export default function PerksGrid() {
  return (
    <section className="container-app" aria-label="Why shop with us">
      <div className="grid grid-cols-2 overflow-hidden rounded-[2rem] border border-white/[0.08] bg-white/[0.07] [gap:1px] lg:grid-cols-4">
        {SITE.perks.map((p, i) => {
          const I = ICON[p.icon];
          return (
            <Reveal key={p.title} delay={i * 0.07} className="bg-obsidian-900">
              <div className="group h-full p-6 transition-colors duration-500 hover:bg-obsidian-850 sm:p-8">
                <I className="mb-8 h-6 w-6 text-obsidian-400 transition-colors duration-500 group-hover:text-accent" strokeWidth={1.5} />
                <h3 className="font-display text-3xl leading-none">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-obsidian-400">{p.desc}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
