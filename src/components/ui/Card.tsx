import { cn } from '../../lib/utils';
import type { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({ children, hover, padding = 'md', className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700',
        hover && 'transition-all duration-300 hover:shadow-soft hover:-translate-y-1 hover:border-neutral-300 dark:hover:border-neutral-600',
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
