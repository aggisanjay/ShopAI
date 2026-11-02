import { useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MousePointer2, Move3d } from 'lucide-react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useReducedMotion } from 'framer-motion';
import ShoeStage from './ShoeStage.jsx';
import Button from '../ui/Button.jsx';
import { CountUp, WordsIn } from '../ui/motion.jsx';
import { COLORWAYS, SITE } from '../../config/site.js';
import { cn } from '../../lib/utils.js';

const hexToTriplet = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

export default function Hero({ isAuth, onRegister }) {
  const ref = useRef(null);
  const scrollRef = useRef(0);
  const reduce = useReducedMotion();
  const [variant, setVariant] = useState(0);
  const [touched, setTouched] = useState(false);
  const cw = COLORWAYS[variant];

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  useMotionValueEvent(scrollYProgress, 'change', (v) => { scrollRef.current = v; });

  const pick = useCallback((i) => { setVariant(i); setTouched(true); }, []);

  return (
    <section
      ref={ref}
      className="relative isolate overflow-hidden"
      style={{ '--accent': hexToTriplet(cw.accent), transition: 'none' }}
      aria-label="Welcome"
    >
      {/* page melts into the next section */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-obsidian-900 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_70%_10%,transparent_40%,rgba(11,11,10,.85)_100%)]" />
      </div>

      <div className="container-app grid min-h-[calc(100dvh-36px)] items-center gap-4 pb-28 pt-32 lg:grid-cols-12 lg:pt-28">
        {/* Copy */}
        <div className="relative z-20 lg:col-span-6 xl:col-span-5">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="glass mb-7 inline-flex items-center gap-3 rounded-full py-1.5 pl-1.5 pr-4 text-[13px]"
          >
            <span className="rounded-full bg-cream px-2.5 py-0.5 text-[11px] font-semibold text-ink">New</span>
            <span className="text-obsidian-100">Fresh drops every week</span>
          </motion.div>

          <h1 className="font-display text-[clamp(3.25rem,7.4vw,7.25rem)] leading-[0.92] tracking-[-0.03em] text-cream">
            <WordsIn text="Shopping," delay={0.2} /><br />
            <WordsIn text="tailored" delay={0.38} className="italic text-obsidian-300" />{' '}
            <WordsIn text="to you." delay={0.54} />
          </h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 max-w-[30rem] text-[17px] leading-relaxed text-obsidian-300"
          >
            A curated marketplace with recommendations that learn your taste. Premium brands, honest prices, delivered fast.
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Link to="/products"><Button size="lg" iconRight={ArrowRight}>Start shopping</Button></Link>
            <Link to="/products?sort=trending"><Button size="lg" variant="ghost">See what&apos;s trending</Button></Link>
            {!isAuth && (
              <button onClick={onRegister} className="ml-1 text-sm text-obsidian-300 underline-offset-4 transition-colors hover:text-white hover:underline">
                or join free
              </button>
            )}
          </motion.div>

          <motion.dl
            initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.25 }}
            className="mt-14 grid max-w-[34rem] grid-cols-4 gap-6 border-t border-white/[0.08] pt-6"
          >
            {SITE.stats.map((s) => (
              <div key={s.label} className="flex flex-col-reverse gap-2">
                <dt className="font-mono text-[10px] uppercase leading-snug tracking-[0.16em] text-obsidian-400">{s.label}</dt>
                <dd className="font-display text-4xl leading-none text-cream">
                  <CountUp to={s.value} decimals={s.decimals || 0} suffix={s.suffix} />
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* 3D stage */}
        <div className="relative lg:col-span-6 xl:col-span-7">
          <div className="relative isolate -mx-5 h-[58vh] min-h-[360px] sm:-mx-8 lg:mx-0 lg:h-[76vh] lg:max-h-[780px] lg:-mr-12 xl:-mr-24">
            {/* Ghost word: the colourway name, BEHIND the product for depth */}
            <div className="pointer-events-none absolute inset-0 -z-10 flex items-start justify-center overflow-visible" aria-hidden="true">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={cw.id}
                  initial={reduce ? false : { opacity: 0, y: '18%' }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: '-14%' }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-[6%] select-none whitespace-nowrap font-display text-[30vw] italic leading-[0.8] tracking-[-0.04em] sm:text-[24vw] lg:mt-[1%] lg:text-[15.5vw]"
                  style={{ color: 'rgb(var(--accent) / 0.07)', WebkitTextStroke: '1px rgb(var(--accent) / 0.24)' }}
                >
                  {cw.name}
                </motion.div>
              </AnimatePresence>
            </div>

            <ShoeStage variant={variant} accent={cw.accent} scrollRef={scrollRef} onVariantsLoaded={() => {}} className="absolute inset-0" />

            {/* spec chip */}
            <div className="glass absolute left-4 top-4 hidden items-center gap-2 rounded-full px-3.5 py-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-obsidian-200 sm:flex lg:left-2 lg:top-10">
              <Move3d className="h-3.5 w-3.5 text-accent" /> Live 3D
            </div>

            {/* colourway switcher */}
            <div className="absolute inset-x-0 bottom-2 z-10 flex flex-col items-center gap-3 lg:bottom-4">
              <div role="radiogroup" aria-label="Colourway" className="glass flex items-center gap-1 rounded-full p-1.5">
                {COLORWAYS.map((c, i) => {
                  const on = i === variant;
                  return (
                    <button
                      key={c.id} role="radio" aria-checked={on} onClick={() => pick(i)}
                      className={cn(
                        'group/sw relative flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-3 text-[13px] font-medium transition-all duration-500 ease-out',
                        on ? 'bg-white/[0.1] text-white' : 'text-obsidian-300 hover:text-white'
                      )}
                    >
                      <span className="relative grid h-6 w-6 place-items-center rounded-full" style={{ background: c.swatch }}>
                        {on && <span className="absolute -inset-[3px] rounded-full border border-white/70" />}
                      </span>
                      <span className={cn('overflow-hidden whitespace-nowrap transition-all duration-500 ease-out', on ? 'max-w-[90px] opacity-100' : 'max-w-0 opacity-0 sm:max-w-[90px] sm:opacity-70')}>{c.name}</span>
                    </button>
                  );
                })}
              </div>
              <p className={cn('flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-obsidian-400 transition-opacity duration-700', touched ? 'opacity-0' : 'opacity-100')}>
                <MousePointer2 className="h-3 w-3" /> Drag to rotate · tap a colour
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
