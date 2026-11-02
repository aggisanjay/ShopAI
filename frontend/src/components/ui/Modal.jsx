import { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils.js';

const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-5xl', full: 'max-w-full mx-4' };

export default function Modal({ isOpen, onClose, title, children, size = 'md', className, bodyClassName }) {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={cn('glass-dark relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[2rem] shadow-2xl sm:rounded-[2rem]', sizes[size], className)}
          >
            {title ? (
              <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-5">
                <h2 className="font-display text-2xl">{title}</h2>
                <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full text-obsidian-300 transition-colors hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/40 text-obsidian-200 backdrop-blur transition-colors hover:bg-white/15 hover:text-white"><X className="h-4 w-4" /></button>
            )}
            <div className={cn('p-6', bodyClassName)}>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
