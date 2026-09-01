import { cn } from '../../lib/utils';
import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export default function Input({ label, error, icon, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const errorId = error ? `${inputId}-error` : undefined;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-2">{icon}</div>}
        <input
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={errorId}
          className={cn(
            'w-full rounded-xl border border-[color:var(--line)] bg-surface-sheet px-4 py-2.5 text-sm text-ink transition-colors',
            'focus:border-forme focus:ring-2 focus:outline-none',
            'dark:border-[color:var(--border-hair)] dark:focus:border-forme',
            !!icon && 'pl-10',
            error && 'border-stop focus:border-stop',
            className
          )}
          {...props}
        />
      </div>
      {error && <p id={errorId} role="alert" className="text-sm text-stop">{error}</p>}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const errorId = error ? `${inputId}-error` : undefined;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink-2">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={errorId}
        className={cn(
          'w-full rounded-xl border border-[color:var(--line)] bg-surface-sheet px-4 py-2.5 text-sm text-ink transition-colors resize-y min-h-[100px]',
          'focus:border-forme focus:ring-2 focus:outline-none',
          'dark:border-[color:var(--border-hair)] dark:focus:border-forme',
          error && 'border-stop focus:border-stop',
          className
        )}
        {...props}
      />
      {error && <p id={errorId} role="alert" className="text-sm text-stop">{error}</p>}
    </div>
  );
}
