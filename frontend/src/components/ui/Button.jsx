import { cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils.js';

const button = cva(
  'group/btn relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium tracking-tight select-none transition-all duration-300 ease-out active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        gold: 'bg-cream text-ink hover:bg-white hover:shadow-pill',                  // primary (legacy name kept)
        primary: 'bg-cream text-ink hover:bg-white hover:shadow-pill',
        accent: 'bg-accent text-ink hover:brightness-110 hover:shadow-gold',
        ghost: 'border border-white/10 bg-white/[0.03] text-obsidian-100 hover:bg-white/[0.08] hover:border-white/20 hover:text-white',
        outline: 'border border-white/15 text-cream hover:bg-cream hover:text-ink',
        danger: 'bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 hover:text-red-200',
        link: 'rounded-none text-accent underline-offset-4 hover:underline px-0',
        icon: 'h-10 w-10 p-0 text-obsidian-200 hover:bg-white/10 hover:text-white',
      },
      size: { sm: 'h-9 px-4 text-[13px]', md: 'h-11 px-6 text-sm', lg: 'h-14 px-8 text-[15px]' },
    },
    defaultVariants: { variant: 'gold', size: 'md' },
  }
);

export default function Button({
  children, variant = 'gold', size = 'md', loading = false, disabled = false,
  className, icon: Icon, iconRight: IconRight, fullWidth = false, ...props
}) {
  const isIcon = variant === 'icon';
  const solid = variant === 'gold' || variant === 'primary' || variant === 'accent';
  return (
    <button
      className={cn(
        button({ variant, size: isIcon || variant === 'link' ? undefined : size }),
        fullWidth && 'w-full',
        solid && IconRight && (size === 'lg' ? 'pr-2' : 'pr-1.5'),
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      {!isIcon && children}
      {!loading && IconRight && (
        solid ? (
          <span className={cn('ml-1 grid place-items-center rounded-full bg-ink text-cream transition-transform duration-300 ease-out group-hover/btn:translate-x-0.5', size === 'lg' ? 'h-10 w-10' : size === 'sm' ? 'h-6 w-6' : 'h-8 w-8')}>
            <IconRight className={size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
          </span>
        ) : (
          <IconRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-0.5" />
        )
      )}
    </button>
  );
}
