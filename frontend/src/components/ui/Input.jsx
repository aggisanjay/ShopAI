import { forwardRef } from 'react';
import { cn } from '../../lib/utils.js';

const Input = forwardRef(({ label, error, icon: Icon, iconRight, hint, className, wrapperClassName, ...props }, ref) => (
  <div className={cn('space-y-1.5', wrapperClassName)}>
    {label && <label className="block text-[13px] font-medium text-obsidian-200">{label}</label>}
    <div className="relative">
      {Icon && <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-obsidian-400"><Icon className="h-4 w-4" /></div>}
      <input
        ref={ref}
        className={cn('input-field', Icon && 'pl-11', iconRight && 'pr-11',
          error && 'border-red-500/60 focus:border-red-500/80 focus:ring-red-500/10', className)}
        {...props}
      />
      {iconRight && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-obsidian-400">{iconRight}</div>}
    </div>
    {error && <p className="text-xs text-red-400">{error}</p>}
    {hint && !error && <p className="text-xs text-obsidian-400">{hint}</p>}
  </div>
));
Input.displayName = 'Input';
export default Input;
