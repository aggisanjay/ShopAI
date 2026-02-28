import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

const variants = {
  gold: 'btn-gold',
  ghost: 'btn-ghost',
  danger: 'inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 rounded-xl transition-all duration-200 active:scale-[0.98]',
  link: 'inline-flex items-center gap-1 text-gold-400 hover:text-gold-300 underline-offset-4 hover:underline transition-colors',
  icon: 'inline-flex items-center justify-center w-9 h-9 rounded-xl hover:bg-obsidian-700/70 text-obsidian-300 hover:text-white transition-all duration-150 active:scale-95',
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
};

export default function Button({
  children,
  variant = 'gold',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  icon: Icon,
  iconRight: IconRight,
  fullWidth = false,
  ...props
}) {
  const isIcon = variant === 'icon';

  return (
    <button
      className={clsx(
        variants[variant] || variants.gold,
        !isIcon && size !== 'icon' && sizes[size],
        fullWidth && 'w-full',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {!isIcon && children}
      {!loading && IconRight && <IconRight className="w-4 h-4" />}
    </button>
  );
}
