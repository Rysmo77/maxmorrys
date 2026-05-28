import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface BottomNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  badge?: number | null;
}

interface AppBottomNavProps {
  items: BottomNavItem[];
}

export default function AppBottomNav({ items }: AppBottomNavProps) {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur border-t border-neutral-200 dark:border-neutral-800"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navigation principale"
    >
      <div className="grid grid-cols-5 h-16">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors active:scale-95 transform-gpu',
                isActive
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-neutral-500 dark:text-neutral-400',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full transition-opacity',
                    isActive ? 'bg-brand-500 opacity-100' : 'opacity-0',
                  )}
                  aria-hidden="true"
                />
                <div className="relative">
                  <item.icon className="w-5 h-5" />
                  {item.badge != null && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-error-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="leading-none">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
