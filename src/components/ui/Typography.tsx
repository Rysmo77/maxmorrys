import { cn } from '../../lib/utils';

type HeadingLevel = 1 | 2 | 3 | 4;

interface HeadingProps {
  level: HeadingLevel;
  children: React.ReactNode;
  className?: string;
}

const headingStyles: Record<HeadingLevel, string> = {
  1: 'text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]',
  2: 'text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1]',
  3: 'text-xl sm:text-2xl font-bold leading-snug',
  4: 'text-lg font-bold leading-snug',
};

export function Heading({ level, children, className }: HeadingProps) {
  const Tag = `h${level}` as const;
  return (
    <Tag className={cn(headingStyles[level], 'text-neutral-900 dark:text-white', className)}>
      {children}
    </Tag>
  );
}

type TextSize = 'lg' | 'md' | 'sm' | 'xs';

interface TextProps {
  size?: TextSize;
  children: React.ReactNode;
  className?: string;
  muted?: boolean;
  as?: 'p' | 'span' | 'div';
}

const textStyles: Record<TextSize, string> = {
  lg: 'text-lg leading-relaxed',
  md: 'text-base leading-relaxed',
  sm: 'text-sm leading-relaxed',
  xs: 'text-xs leading-relaxed',
};

export function Text({ size = 'md', children, className, muted, as: Tag = 'p' }: TextProps) {
  return (
    <Tag className={cn(textStyles[size], muted ? 'text-neutral-500 dark:text-neutral-400' : 'text-neutral-700 dark:text-neutral-300', className)}>
      {children}
    </Tag>
  );
}

export function Caption({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('text-[10px] font-bold tracking-[0.25em] uppercase text-neutral-400 dark:text-neutral-500', className)}>
      {children}
    </span>
  );
}

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('text-xs font-bold tracking-[0.3em] uppercase text-brand-600 dark:text-brand-400', className)}>
      {children}
    </span>
  );
}
