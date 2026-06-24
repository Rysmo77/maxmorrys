import { useEffect, useState, type ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toCanonicalPath } from '../../i18n/routing';
import AppSidebar, { type AppSidebarSection } from './AppSidebar';
import AppBottomNav, { type BottomNavItem } from './AppBottomNav';
import UserMenu from './UserMenu';
import NotificationDropdown from '../ui/NotificationDropdown';
import SearchOverlay from '../shared/SearchOverlay';

const COLLAPSED_KEY = 'app:sidebar:collapsed';

export interface AppShellProps {
  brand: { label: string; href: string };
  sidebarSections: AppSidebarSection[];
  bottomNavItems?: BottomNavItem[];
  /** Map pathname → human title (used in mobile topbar). Optional. */
  titleMap?: Record<string, string>;
  /** Optional content injected before <Outlet/> (e.g. onboarding overlay). */
  beforeOutlet?: ReactNode;
  /** Optional Outlet context value (forwarded to nested routes). */
  outletContext?: unknown;
  /** Override the main content max-width container. */
  contentClassName?: string;
}

export default function AppShell({
  brand, sidebarSections, bottomNavItems, titleMap, beforeOutlet, outletContext, contentClassName,
}: AppShellProps) {
  const { t } = useTranslation('lms');
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem(COLLAPSED_KEY) === '1'; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    try { localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0'); } catch { /* ignore */ }
  }, [collapsed]);

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const canonicalPath = toCanonicalPath(location.pathname);
  const pageTitle = titleMap?.[canonicalPath] ?? deriveTitleFromPath(canonicalPath);

  const hasBottomNav = bottomNavItems && bottomNavItems.length > 0;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 overflow-x-clip">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-30 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 transition-all hidden md:block',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <AppSidebar
          sections={sidebarSections}
          brand={brand}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((v) => !v)}
          onOpenCommandPalette={() => setSearchOpen(true)}
        />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 animate-slide-down z-50">
            <AppSidebar
              sections={sidebarSections}
              brand={brand}
              collapsed={false}
              showCollapseButton={false}
              onItemClick={() => setMobileOpen(false)}
              onOpenCommandPalette={() => { setSearchOpen(true); setMobileOpen(false); }}
            />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className={cn('transition-all', collapsed ? 'md:ml-16' : 'md:ml-60')}>
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white/95 dark:bg-neutral-900/95 backdrop-blur border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2 px-3 sm:px-6 h-12 md:h-14">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 -ml-1 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              aria-label={t('shell.openMenu')}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile: centered title (iOS-style). Desktop: page title left-aligned */}
            <div className="flex-1 min-w-0 text-center md:text-left">
              <h1 className="text-sm md:text-base font-bold text-neutral-900 dark:text-white truncate">
                {pageTitle}
              </h1>
            </div>

            {/* Desktop search trigger */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 h-9 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label={t('shell.searchShortcut')}
            >
              <Search className="w-4 h-4" />
              <span className="hidden lg:inline">{t('shell.searchPlaceholder')}</span>
              <kbd className="hidden lg:inline text-[10px] font-bold tracking-wider text-neutral-400 border border-neutral-200 dark:border-neutral-700 rounded px-1 py-0.5">⌘K</kbd>
            </button>

            {/* Mobile search icon */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="md:hidden p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              aria-label={t('shell.search')}
            >
              <Search className="w-5 h-5" />
            </button>

            <NotificationDropdown />
            <UserMenu compact />
          </div>
        </header>

        <main
          className={cn(
            'min-w-0',
            contentClassName ?? 'p-4 sm:p-6 lg:p-8',
            hasBottomNav && 'pb-24 md:pb-8',
          )}
          style={{ overscrollBehavior: 'contain' }}
        >
          {beforeOutlet}
          <Outlet context={outletContext} />
        </main>
      </div>

      {hasBottomNav && <AppBottomNav items={bottomNavItems!} />}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

function deriveTitleFromPath(pathname: string): string {
  const segs = pathname.split('/').filter(Boolean);
  const last = segs[segs.length - 1] ?? '';
  return last
    .replace(/-/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());
}
