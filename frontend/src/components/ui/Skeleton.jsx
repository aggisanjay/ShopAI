import { cn } from '../../lib/utils.js';

export function Skeleton({ className, ...props }) {
  return <div className={cn('skeleton', className)} {...props} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/[0.06] bg-obsidian-850">
      <Skeleton className="aspect-[4/5] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-4/5" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="panel space-y-4 p-5">
      <div className="flex items-center justify-between"><Skeleton className="h-5 w-40" /><Skeleton className="h-6 w-20 rounded-full" /></div>
      <Skeleton className="h-px w-full" />
      <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="flex-1 space-y-2"><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-32" /></div>
      </div>
      <Skeleton className="h-px w-full" />
      {Array(3).fill(null).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-2xl" />)}
    </div>
  );
}
