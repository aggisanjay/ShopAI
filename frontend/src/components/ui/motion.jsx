import { useEffect, useRef } from 'react';
import { motion, useInView, useReducedMotion, animate } from 'framer-motion';
import { cn } from '../../lib/utils.js';

/** Viewport-triggered blur-rise. Always ends visible; honours reduced motion. */
export function Reveal({ children, delay = 0, y = 28, className, as = 'div', once = true, amount = 0.2 }) {
  const reduce = useReducedMotion();
  const Comp = motion[as] || motion.div;
  return (
    <Comp
      className={className}
      initial={reduce ? false : { opacity: 0, y, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once, amount }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Comp>
  );
}

/** Count-up number that starts when scrolled into view. */
export function CountUp({ to, decimals = 0, suffix = '', duration = 1.6, className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!inView || !ref.current) return;
    if (reduce) { ref.current.textContent = to.toFixed(decimals) + suffix; return; }
    const c = animate(0, to, {
      duration, ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => { if (ref.current) ref.current.textContent = v.toFixed(decimals) + suffix; },
    });
    return () => c.stop();
  }, [inView, to, decimals, suffix, duration, reduce]);
  return <span ref={ref} className={cn('tabular', className)}>{(0).toFixed(decimals)}{suffix}</span>;
}

/** Seamless infinite marquee (duplicates its children once). */
export function Marquee({ children, reverse = false, className, speed }) {
  return (
    <div className={cn('group/marquee flex overflow-hidden mask-x', className)}>
      <div
        className={cn('flex min-w-max shrink-0 items-center will-change-transform group-hover/marquee:[animation-play-state:paused]', reverse ? 'animate-marquee-rev' : 'animate-marquee')}
        style={speed ? { animationDuration: `${speed}s` } : undefined}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">{children}</div>
      </div>
    </div>
  );
}

/** Staggered word-by-word blur-in for headlines. */
export function WordsIn({ text, className, delay = 0, stagger = 0.08, italicWords = [] }) {
  const reduce = useReducedMotion();
  const words = text.split(' ');
  return (
    <span className={className} aria-label={text}>
      {words.map((w, i) => (
        <motion.span
          key={i} aria-hidden="true"
          className={cn('inline-block', italicWords.includes(w.replace(/[.,]/g, '')) && 'italic text-obsidian-300')}
          initial={reduce ? false : { opacity: 0, y: 22, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.9, delay: delay + i * stagger, ease: [0.22, 1, 0.36, 1] }}
        >
          {w}{i < words.length - 1 ? '\u00A0' : ''}
        </motion.span>
      ))}
    </span>
  );
}
