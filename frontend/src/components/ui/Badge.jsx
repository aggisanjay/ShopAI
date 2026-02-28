import { clsx } from 'clsx';

const variants = {
  gold: 'badge-gold',
  green: 'badge-green',
  red: 'badge-red',
  blue: 'badge-blue',
  gray: 'badge bg-obsidian-700 text-obsidian-300 border border-obsidian-600',
  purple: 'badge bg-purple-500/15 text-purple-400 border border-purple-500/20',
};

export default function Badge({ children, variant = 'gray', className, ...props }) {
  return (
    <span className={clsx(variants[variant], className)} {...props}>
      {children}
    </span>
  );
}
