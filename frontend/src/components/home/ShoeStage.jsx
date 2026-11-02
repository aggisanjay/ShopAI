import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils.js';
import { COLORWAYS } from '../../config/site.js';

// The 3D chunk (three + r3f + drei) loads on demand, never blocking first paint.
const ShoeScene = lazy(() => import('../three/ShoeScene.jsx'));

function canUseWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

/** Decide once whether this device should get live WebGL or a still poster. */
function use3DCapability() {
  const reduced = useReducedMotion();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const saveData = navigator.connection?.saveData;
    const weak = (navigator.deviceMemory || 4) <= 1;   // core count is a poor proxy for GPU power, so it isn't used
    setOk(!reduced && !saveData && !weak && canUseWebGL());
  }, [reduced]);
  return { live: ok, reduced: !!reduced };
}

export default function ShoeStage({ variant, accent, scrollRef, onReady, onVariantsLoaded, className }) {
  const { live, reduced } = use3DCapability();
  const wrap = useRef(null);
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // pause rendering when the hero is off-screen
  useEffect(() => {
    const el = wrap.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.01 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // never leave the poster hidden if the model fails to arrive
  useEffect(() => {
    if (!live) return;
    const t = setTimeout(() => !ready && setFailed(true), 25000);
    return () => clearTimeout(t);
  }, [live, ready]);

  const cw = COLORWAYS[variant] || COLORWAYS[0];
  const showCanvas = live && !failed;

  return (
    <div ref={wrap} className={cn('relative', className)} data-stage data-ready={ready}>
      {/* Poster: instant first paint, and the permanent fallback */}
      {COLORWAYS.map((c, i) => (
        <img
          key={c.id}
          src={c.poster}
          alt={i === variant ? `The ${c.name} sneaker, side view` : ''}
          aria-hidden={i !== variant}
          width="1200" height="595"
          fetchpriority={i === 0 ? 'high' : 'low'}
          decoding="async"
          draggable="false"
          className={cn(
            'pointer-events-none absolute inset-0 m-auto h-auto w-[88%] max-w-none object-contain transition-opacity duration-700 ease-out',
            i === variant && !(ready && showCanvas) ? 'opacity-100' : 'opacity-0'
          )}
          style={{ filter: 'drop-shadow(0 40px 40px rgba(0,0,0,.55))' }}
        />
      ))}

      {showCanvas && visible !== undefined && (
        <div className={cn('absolute inset-0 transition-opacity duration-1000 ease-out', ready ? 'opacity-100' : 'opacity-0', 'cursor-grab active:cursor-grabbing')}>
          <Suspense fallback={null}>
            <ShoeScene
              variant={variant}
              accent={cw.accent}
              scrollRef={scrollRef}
              reduced={reduced}
              visible={visible}
              onVariants={onVariantsLoaded}
              onReady={() => { setReady(true); onReady?.(); }}
            />
          </Suspense>
        </div>
      )}

      {/* Loader (only while the 3D model is fetching) */}
      {showCanvas && !ready && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 grid justify-items-center gap-3 font-mono text-[10px] uppercase tracking-[0.25em] text-white/45" role="status">
          <span className="h-px w-32 overflow-hidden bg-white/10"><i className="block h-full w-1/3 animate-[marquee_1.1s_ease-in-out_infinite] bg-white/70" /></span>
          Loading 3D
        </div>
      )}
    </div>
  );
}
