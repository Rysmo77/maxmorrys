import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circle' | 'rect';
}

export default function Skeleton({ className, variant = 'rect' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-neutral-200 dark:bg-neutral-700',
        variant === 'text' && 'h-4 rounded',
        variant === 'circle' && 'rounded-full',
        variant === 'rect' && 'rounded-xl',
        className
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      <Skeleton className="h-48 rounded-none" />
      <div className="p-6 space-y-3">
        <Skeleton variant="text" className="w-1/4 h-3" />
        <Skeleton variant="text" className="w-3/4 h-5" />
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-2/3" />
      </div>
    </div>
  );
}
