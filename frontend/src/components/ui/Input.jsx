import { clsx } from 'clsx';
import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, icon: Icon, iconRight, hint, className, wrapperClassName, ...props }, ref) => {
  return (
    <div className={clsx('space-y-1.5', wrapperClassName)}>
      {label && (
        <label className="block text-sm font-medium text-obsidian-200">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-obsidian-400 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          className={clsx(
            'input-field',
            Icon && 'pl-10',
            iconRight && 'pr-10',
            error && 'border-red-500/60 focus:border-red-500/80 focus:ring-red-500/10',
            className
          )}
          {...props}
        />
        {iconRight && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-obsidian-400">
            {iconRight}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-400 flex items-center gap-1">{error}</p>}
      {hint && !error && <p className="text-xs text-obsidian-400">{hint}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
