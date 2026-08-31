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
        'bg-paper rounded-2xl border border-[color:var(--line)]',
        hover && 'transition duration-300 hover:shadow-soft hover:-translate-y-1 hover:border-[color:var(--line)] dark:hover:border-[color:var(--border-hair)]',
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
