import { NavLink, Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { ChevronLeft, ChevronRight, Command } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AppSidebarItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  badge?: string | number | null;
  locked?: boolean;
  tone?: 'default' | 'club';
}

export interface AppSidebarSection {
  title?: string;
  items: AppSidebarItem[];
}

interface AppSidebarProps {
  sections: AppSidebarSection[];
  brand: { label: string; href: string };
  collapsed: boolean;
  onToggleCollapsed?: () => void;
  onItemClick?: () => void;
  onOpenCommandPalette?: () => void;
  footer?: React.ReactNode;
  showCollapseButton?: boolean;
}

export default function AppSidebar({
  sections, brand, collapsed, onToggleCollapsed, onItemClick, onOpenCommandPalette, footer, showCollapseButton = true,
}: AppSidebarProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="h-14 px-3 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
        <Link to={brand.href} className="flex items-center gap-2 group min-w-0">
          <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0">
            <img src="/icone-mm.png" alt="Max-Morrys" className="w-full h-full object-cover" />
          </div>
          {!collapsed && (
            <span className="font-bold text-neutral-900 dark:text-white text-sm truncate">{brand.label}</span>
          )}
        </Link>
        {showCollapseButton && onToggleCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="hidden lg:flex p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label={collapsed ? 'Étendre la barre latérale' : 'Réduire la barre latérale'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {onOpenCommandPalette && (
        <div className="px-2 pt-3">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className={cn(
              'w-full flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 px-2.5 py-2 text-sm text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors',
              collapsed && 'justify-center',
            )}
            title="Ouvrir la palette de commandes"
          >
            <Command className="w-4 h-4 flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Recherche & actions</span>
                <kbd className="text-[10px] font-bold tracking-wider text-neutral-400 border border-neutral-200 dark:border-neutral-700 rounded px-1 py-0.5">⌘K</kbd>
              </>
            )}
          </button>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {sections.map((section, sIdx) => (
          <div key={sIdx}>
            {section.title && !collapsed && (
              <p className="px-3 pb-1 text-[10px] font-bold tracking-[0.18em] uppercase text-neutral-400 dark:text-neutral-500">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onItemClick}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group',
                      collapsed && 'justify-center',
                      item.tone === 'club'
                        ? isActive
                          ? 'bg-plum-50 dark:bg-plum-900/30 text-plum-700 dark:text-plum-300'
                          : 'text-plum-600 dark:text-plum-400 hover:bg-plum-50 dark:hover:bg-plum-900/20'
                        : isActive
                          ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white',
                    )
                  }
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      {item.badge != null && (
                        <span className="text-[10px] font-bold bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                      {item.locked && (
                        <span className="text-[10px] font-semibold text-neutral-400">🔒</span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {footer && (
        <div className="p-2 border-t border-neutral-200 dark:border-neutral-800">{footer}</div>
      )}
    </div>
  );
}
