import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, LogOut, Settings, Shield, Sun, Moon, User as UserIcon, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/utils';
import LocalizedLink from '../shared/LocalizedLink';

interface UserMenuProps {
  compact?: boolean;
}

export default function UserMenu({ compact = false }: UserMenuProps) {
  const { t } = useTranslation('lms');
  const { user, userData, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  const displayName = userData?.displayName || user.displayName || user.email?.split('@')[0] || t('fallbackUser');
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const photoURL = user.photoURL || userData?.photoURL;
  const isStaff = userData?.role === 'admin' || userData?.role === 'support';

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate('/');
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2 rounded-xl transition-colors',
          compact
            ? 'p-0.5 hover:ring-2 hover:ring-brand-200 dark:hover:ring-brand-800'
            : 'px-2 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800',
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center overflow-hidden flex-shrink-0">
          {photoURL ? (
            <img src={photoURL} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{initials}</span>
          )}
        </div>
        {!compact && (
          <>
            <span className="hidden sm:block text-sm font-semibold text-neutral-700 dark:text-neutral-200 max-w-[120px] truncate">
              {displayName}
            </span>
            <ChevronDown className={cn('w-4 h-4 text-neutral-400 transition-transform hidden sm:block', open && 'rotate-180')} />
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden z-50 animate-scale-in"
        >
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
            <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{displayName}</p>
            <p className="text-xs text-neutral-500 truncate">{user.email}</p>
          </div>

          <div className="p-1.5">
            <LocalizedLink
              to="/mon-espace/profil"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <UserIcon className="w-4 h-4 text-neutral-400" />
              {t('userMenu.profile')}
            </LocalizedLink>
            <LocalizedLink
              to="/mon-espace/parametres"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <Settings className="w-4 h-4 text-neutral-400" />
              {t('userMenu.settings')}
            </LocalizedLink>
            <button
              type="button"
              onClick={() => { toggleTheme(); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-neutral-400" /> : <Moon className="w-4 h-4 text-neutral-400" />}
              {theme === 'dark' ? t('userMenu.lightMode') : t('userMenu.darkMode')}
            </button>
            {isStaff && (
              <LocalizedLink
                to="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <Shield className="w-4 h-4 text-neutral-400" />
                {t('userMenu.adminPanel')}
              </LocalizedLink>
            )}
            <LocalizedLink
              to="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-neutral-400" />
              {t('userMenu.backToSite')}
            </LocalizedLink>
          </div>

          <div className="p-1.5 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {t('userMenu.signOut')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
