import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/utils';
import LocalizedLink from '../shared/LocalizedLink';
import { Icon } from '@ds';

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
            ? 'mm-touch-extend p-0.5 hover:bg-[color:var(--fill-1)]'
            : 'mm-touch-extend px-2 py-1.5 hover:bg-[color:var(--fill-1)]',
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="w-8 h-8 rounded-full bg-[color-mix(in_srgb,var(--mm-bleu)_5%,transparent)] flex items-center justify-center overflow-hidden flex-shrink-0">
          {photoURL ? (
            <img src={photoURL} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-forme">{initials}</span>
          )}
        </div>
        {!compact && (
          <>
            <span className="hidden stack:block text-sm font-semibold text-ink-2 max-w-[120px] truncate">
              {displayName}
            </span>
            <Icon name="chevron" className={cn('w-4 h-4 text-ink-2 transition-transform hidden stack:block', open && 'rotate-180')} />
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          /* AD-26 : opaque. Un menu qui se superpose au contenu doit le MASQUER — c'est la
             différence entre un menu et un voile. La cloche voisine était déjà opaque et ce
             panneau-ci était en verre à 78 % : deux traitements dans la même barre. */
          className="mm-menu absolute right-0 top-full mt-2 w-64 overflow-hidden z-50 mm-drop"
        >
          <div className="px-4 py-3 border-b border-[color:var(--line)]">
            <p className="text-sm font-semibold text-ink truncate">{displayName}</p>
            <p className="text-xs text-ink-2 truncate">{user.email}</p>
          </div>

          <div className="p-1.5">
            <LocalizedLink
              to="/mon-espace/profil"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-ink-2 hover:text-ink hover:bg-[color:var(--fill-1)] transition-colors duration-ui"
            >
              <Icon name="user" size={16} className="text-ink-2" />
              {t('userMenu.profile')}
            </LocalizedLink>
            <LocalizedLink
              to="/mon-espace/parametres"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-ink-2 hover:text-ink hover:bg-[color:var(--fill-1)] transition-colors duration-ui"
            >
              <Icon name="settings" size={16} className="text-ink-2" />
              {t('userMenu.settings')}
            </LocalizedLink>
            <button
              type="button"
              onClick={() => { toggleTheme(); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-ink-2 hover:text-ink hover:bg-[color:var(--fill-1)] transition-colors duration-ui"
            >
              {theme === 'dark' ? <Icon name="sun" size={16} className="text-ink-2" /> : <Icon name="moon" size={16} className="text-ink-2" />}
              {theme === 'dark' ? t('userMenu.lightMode') : t('userMenu.darkMode')}
            </button>
            {isStaff && (
              <LocalizedLink
                to="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-ink-2 hover:text-ink hover:bg-[color:var(--fill-1)] transition-colors duration-ui"
              >
                <Icon name="shield" size={16} className="text-ink-2" />
                {t('userMenu.adminPanel')}
              </LocalizedLink>
            )}
            <LocalizedLink
              to="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-ink-2 hover:text-ink hover:bg-[color:var(--fill-1)] transition-colors duration-ui"
            >
              <Icon name="external" size={16} className="text-ink-2" />
              {t('userMenu.backToSite')}
            </LocalizedLink>
          </div>

          <div className="p-1.5 border-t border-[color:var(--line)]">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-stop hover:bg-[color-mix(in_srgb,var(--stop)_8%,transparent)] transition-colors duration-ui"
            >
              <Icon name="logout" size={16} />
              {t('userMenu.signOut')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
