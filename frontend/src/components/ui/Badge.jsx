import { cn } from '../../lib/utils.js';

const variants = {
  gold: 'badge-gold', green: 'badge-green', red: 'badge-red', blue: 'badge-blue',
  gray: 'badge-gray', purple: 'badge bg-violet-500/[0.12] text-violet-300 border border-violet-500/20',
};

export default function Badge({ children, variant = 'gray', className, ...props }) {
  return <span className={cn(variants[variant] || variants.gray, className)} {...props}>{children}</span>;
}
