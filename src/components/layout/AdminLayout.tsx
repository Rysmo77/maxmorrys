import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, GraduationCap, Users, BarChart3, Settings,
  MessageSquare, Tag, Megaphone, HelpCircle, Menu, X, ChevronLeft,
  Mic, Video, CreditCard, Moon, Sun, LogOut, Calendar, Star
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Tableau de bord', path: '/admin' },
  { icon: FileText, label: 'Articles', path: '/admin/articles' },
  { icon: GraduationCap, label: 'Formations', path: '/admin/formations' },
  { icon: Mic, label: 'Podcasts', path: '/admin/podcasts' },
  { icon: Video, label: 'Videos', path: '/admin/videos' },
  { icon: Users, label: 'Utilisateurs', path: '/admin/utilisateurs' },
  { icon: CreditCard, label: 'Transactions', path: '/admin/transactions' },
  { icon: MessageSquare, label: 'Messages', path: '/admin/messages' },
  { icon: Tag, label: 'Coupons', path: '/admin/coupons' },
  { icon: Megaphone, label: 'Annonces', path: '/admin/annonces' },
  { icon: HelpCircle, label: 'FAQ', path: '/admin/faq' },
  { icon: Star, label: 'Témoignages', path: '/admin/temoignages' },
  { icon: Calendar, label: 'Rendez-vous', path: '/admin/rendez-vous' },
  { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
  { icon: Settings, label: 'Parametres', path: '/admin/parametres' },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-xs">MM</div>
          {!collapsed && <span className="font-bold text-neutral-900 dark:text-white text-sm">Admin</span>}
        </Link>
        <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:block p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400">
          <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
        </button>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 text-neutral-400">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-neutral-200 dark:border-neutral-700 space-y-1">
        <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          {!collapsed && <span>Theme</span>}
        </button>
        <Link to="/" className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
          <ChevronLeft className="w-5 h-5" />
          {!collapsed && <span>Retour au site</span>}
        </Link>
        <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors">
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Deconnexion</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <aside className={cn('fixed left-0 top-0 bottom-0 z-30 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 transition-all hidden lg:block', collapsed ? 'w-16' : 'w-60')}>
        {sidebar}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 animate-slide-down z-50">
            {sidebar}
          </aside>
        </div>
      )}

      <div className={cn('transition-all', collapsed ? 'lg:ml-16' : 'lg:ml-60')}>
        <header className="sticky top-0 z-20 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between px-4 sm:px-6 h-14">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center">
                <span className="text-xs font-bold text-brand-600 dark:text-brand-400">MM</span>
              </div>
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
