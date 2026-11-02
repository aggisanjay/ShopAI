import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SITE } from '../../config/site.js';

export default function AnnouncementBar() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % SITE.announcements.length), 4200);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="relative z-[41] flex h-9 items-center justify-center border-b border-white/[0.06] bg-obsidian-850 px-4 text-[12.5px] text-obsidian-200" role="status" aria-live="polite">
      <div className="relative h-5 w-[min(80vw,360px)] overflow-hidden text-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={i}
            initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex items-center justify-center gap-2.5 truncate leading-5"
          >
            <span className="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />{SITE.announcements[i]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
