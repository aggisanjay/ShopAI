import { cn } from '../../lib/utils.js';

export function LogoMark({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('h-8 w-8', className)} aria-hidden="true">
      <rect width="24" height="24" rx="8" fill="currentColor" />
      <path d="M12 4.5c.65 4.4 2.95 6.85 7.5 7.5-4.55.65-6.85 3.1-7.5 7.5-.65-4.4-2.95-6.85-7.5-7.5 4.55-.65 6.85-3.1 7.5-7.5Z" fill="#0b0b0a" />
    </svg>
  );
}

export default function Logo({ className, markClassName }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 text-cream', className)}>
      <LogoMark className={markClassName} />
      <span className="font-display text-[26px] leading-none tracking-[-0.03em]">ShopAI</span>
    </span>
  );
}
