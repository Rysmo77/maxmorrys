import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, Search, Sun, Moon, LogOut, LayoutDashboard, GraduationCap, ChevronDown, Headphones, Youtube, LogIn, Languages } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { toCanonicalPath } from '../../i18n/routing';
import LocalizedLink from '../shared/LocalizedLink';

/**
 * Surbrillance par entrée de menu : chaque item s'allume dans la couleur de son univers
 * (cf. `src/lib/sectionThemes.ts`), au survol comme à l'état actif.
 *
 * IMPORTANT : chaînes statiques complètes — Tailwind ne détecte pas les noms de classes
 * construits dynamiquement (purge du build).
 *
 * `accent` (orange) est réservé au parent « Je te transforme » : ce menu n'est pas un
 * univers, et ses voisins immédiats (`morrys` pour À propos, `plum` pour Podcasts) sont
 * deux violets indiscernables — il lui faut une teinte qui ne collisionne avec aucun.
 *
 * ⚠️ CONTRASTE : `lagoon` et `accent` plafonnent sous 4,5:1 en `-600` sur blanc, d'où le
 * `-700` en mode clair. Ne pas « corriger » vers `-600`.
 */
type AccentKey = 'brand' | 'coral' | 'morrys' | 'plum' | 'red' | 'lagoon' | 'accent';

interface NavAccent {
  /** item actif : texte coloré + aplat doux */
  active: string;
  /** item au repos, avec surbrillance colorée au survol */
  idle: string;
  /** barre de soulignement (nav desktop) */
  bar: string;
}

const navAccents: Record<AccentKey, NavAccent> = {
  brand: {
    active: 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20',
    idle: 'text-neutral-700 dark:text-neutral-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20',
    bar: 'bg-brand-500',
  },
  coral: {
    active: 'text-coral-600 dark:text-coral-400 bg-coral-50 dark:bg-coral-900/20',
    idle: 'text-neutral-700 dark:text-neutral-300 hover:text-coral-600 dark:hover:text-coral-400 hover:bg-coral-50 dark:hover:bg-coral-900/20',
    bar: 'bg-coral-500',
  },
  morrys: {
    active: 'text-morrys-600 dark:text-morrys-400 bg-morrys-50 dark:bg-morrys-900/20',
    idle: 'text-neutral-700 dark:text-neutral-300 hover:text-morrys-600 dark:hover:text-morrys-400 hover:bg-morrys-50 dark:hover:bg-morrys-900/20',
    bar: 'bg-morrys-500',
  },
  plum: {
    active: 'text-plum-600 dark:text-plum-400 bg-plum-50 dark:bg-plum-900/20',
    idle: 'text-neutral-700 dark:text-neutral-300 hover:text-plum-600 dark:hover:text-plum-400 hover:bg-plum-50 dark:hover:bg-plum-900/20',
    bar: 'bg-plum-500',
  },
  red: {
    active: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
    idle: 'text-neutral-700 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
    bar: 'bg-red-500',
  },
  lagoon: {
    active: 'text-lagoon-700 dark:text-lagoon-400 bg-lagoon-50 dark:bg-lagoon-900/20',
    idle: 'text-neutral-700 dark:text-neutral-300 hover:text-lagoon-700 dark:hover:text-lagoon-400 hover:bg-lagoon-50 dark:hover:bg-lagoon-900/20',
    bar: 'bg-lagoon-500',
  },
  accent: {
    active: 'text-accent-700 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/20',
    idle: 'text-neutral-700 dark:text-neutral-300 hover:text-accent-700 dark:hover:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/20',
    bar: 'bg-accent-500',
  },
};

/** Surbrillance des items au-dessus du hero : la couleur d'univers y serait illisible. */
const transparentAccent: NavAccent = {
  active: 'text-white bg-white/15',
  idle: 'text-white/85 hover:text-white hover:bg-white/10',
  bar: 'bg-white',
};

const navLinks: { key: string; path: string; accent: AccentKey }[] = [
  { key: 'about', path: '/a-propos', accent: 'morrys' },
  { key: 'formations', path: '/formations', accent: 'brand' },
  { key: 'blog', path: '/blog', accent: 'coral' },
];

const transformerLinks: { key: string; path: string; icon: typeof Headphones; accent: AccentKey }[] = [
  { key: 'podcast', path: '/podcasts', icon: Headphones, accent: 'plum' },
  { key: 'videos', path: '/videos', icon: Youtube, accent: 'red' },
];

interface HeaderProps {
  onSearchOpen: () => void;
}

export default function Header({ onSearchOpen }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileTransformerOpen, setMobileTransformerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, userData, signOut } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const { t } = useTranslation('nav');
  const { t: tc } = useTranslation('common');
  const location = useLocation();
  const path = toCanonicalPath(location.pathname);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
    setDropdownOpen(false);
    setMobileTransformerOpen(false);
  }, [location]);

  // Cmd+K / Ctrl+K to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onSearchOpen();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSearchOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isTransformerActive = path.startsWith('/podcasts') || path.startsWith('/videos');

  // Header transparent par-dessus le hero (accueil, haut de page, menu fermé).
  const transparent = path === '/' && !scrolled && !mobileOpen;

  const transformerAccent = transparent ? transparentAccent : navAccents.accent;
  const agencyAccent = transparent ? transparentAccent : navAccents.lagoon;

  const userInitials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'U';

  const languageToggleLabel = language === 'fr' ? tc('switchToEnglish') : tc('switchToFrench');

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
          transparent
            ? 'bg-transparent'
            : scrolled
              ? 'bg-white dark:bg-neutral-900 shadow-[0_1px_0_0_rgba(0,0,0,0.08)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.06)]'
              : 'bg-white dark:bg-neutral-950 border-b border-neutral-200/50 dark:border-neutral-800/50'
        )}
      >
        {/* Brand accent stripe */}
        <div className={cn(
          'absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-500 via-brand-600 to-brand-400 transition-opacity duration-300',
          scrolled ? 'opacity-100' : 'opacity-0'
        )} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 lg:h-[68px]">

            {/* Logo */}
            <LocalizedLink to="/" className="group shrink-0 flex items-center gap-2">
              <div className="relative">
                <span className={cn(
                  'font-black text-[1.35rem] tracking-tight transition-colors duration-200 drop-shadow-sm',
                  transparent
                    ? 'text-white group-hover:text-brand-200'
                    : 'text-neutral-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400'
                )}>
                  Hellooo<span className="text-brand-500">!</span>
                </span>
              </div>
            </LocalizedLink>

            {/* Nav desktop */}
            <nav className="hidden lg:flex items-center gap-0.5 ml-auto">
              {navLinks.map((link) => {
                const isActive = path === link.path || path.startsWith(link.path + '/');
                const accent = transparent ? transparentAccent : navAccents[link.accent];
                return (
                  <LocalizedLink
                    key={link.path}
                    to={link.path}
                    className={cn(
                      'relative px-3.5 py-2 text-[0.8125rem] font-semibold transition-colors duration-150 rounded-lg group',
                      isActive ? accent.active : accent.idle
                    )}
                  >
                    {t(link.key)}
                    <span className={cn(
                      'absolute bottom-1 left-3.5 right-3.5 h-[1.5px] rounded-full transition-transform duration-200 origin-left',
                      accent.bar,
                      isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    )} />
                  </LocalizedLink>
                );
              })}

              {/* Dropdown "Je te transforme" */}
              <div
                className="relative"
                ref={dropdownRef}
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  aria-label={t('transformAria')}
                  className={cn(
                    'relative flex items-center gap-1 px-3.5 py-2 text-[0.8125rem] font-semibold transition-colors duration-150 rounded-lg group',
                    isTransformerActive || dropdownOpen ? transformerAccent.active : transformerAccent.idle
                  )}
                >
                  {t('transform')}
                  <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', dropdownOpen && 'rotate-180')} aria-hidden="true" />
                  <span className={cn(
                    'absolute bottom-1 left-3.5 right-8 h-[1.5px] rounded-full transition-transform duration-200 origin-left',
                    transformerAccent.bar,
                    isTransformerActive || dropdownOpen ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  )} />
                </button>

                {dropdownOpen && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-80 z-50 pt-2.5">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl shadow-neutral-900/10 dark:shadow-black/40 border border-neutral-100 dark:border-neutral-800 py-2 animate-slide-down">
                      <div className="px-4 pb-2 pt-1 mb-1 border-b border-neutral-100 dark:border-neutral-800">
                        <p className="text-[0.625rem] font-bold tracking-[0.2em] uppercase text-accent-700 dark:text-accent-400">
                          {t('freeContent')}
                        </p>
                      </div>
                      {transformerLinks.map((item) => {
                        const isVideos = item.accent === 'red';
                        const isActive = path.startsWith(item.path);
                        const iconBoxCls = isVideos
                          ? 'bg-red-50 dark:bg-red-900/30'
                          : 'bg-plum-50 dark:bg-plum-900/30';
                        const iconCls = isVideos
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-plum-600 dark:text-plum-400';
                        const rowCls = isVideos
                          ? cn('hover:bg-red-50 dark:hover:bg-red-900/20', isActive && 'bg-red-50 dark:bg-red-900/20')
                          : cn('hover:bg-plum-50 dark:hover:bg-plum-900/20', isActive && 'bg-plum-50 dark:bg-plum-900/20');
                        const labelCls = isVideos
                          ? cn(
                              'group-hover/item:text-red-600 dark:group-hover/item:text-red-400',
                              isActive ? 'text-red-600 dark:text-red-400' : 'text-neutral-800 dark:text-neutral-200'
                            )
                          : cn(
                              'group-hover/item:text-plum-600 dark:group-hover/item:text-plum-400',
                              isActive ? 'text-plum-600 dark:text-plum-400' : 'text-neutral-800 dark:text-neutral-200'
                            );
                        return (
                        <LocalizedLink
                          key={item.path}
                          to={item.path}
                          className={cn('flex items-center gap-3 px-4 py-3 transition-colors group/item', rowCls)}
                        >
                          <div className={`w-9 h-9 rounded-xl ${iconBoxCls} flex items-center justify-center shrink-0`}>
                            <item.icon className={`w-4 h-4 ${iconCls}`} />
                          </div>
                          <p className={cn('text-sm font-semibold leading-snug transition-colors', labelCls)}>
                            {t(item.key)}
                          </p>
                        </LocalizedLink>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Je te digitalise — offre agence pour commerces */}
              <LocalizedLink
                to="/agence"
                className={cn(
                  'relative px-3.5 py-2 text-[0.8125rem] font-semibold transition-all duration-150 rounded-lg group',
                  path === '/agence' ? agencyAccent.active : agencyAccent.idle
                )}
              >
                {t('agency')}
                <span className={cn(
                  'absolute bottom-1 left-3.5 right-3.5 h-[1.5px] rounded-full transition-transform duration-200 origin-left',
                  agencyAccent.bar,
                  path === '/agence' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                )} />
              </LocalizedLink>

              {/* Contacte-moi */}
              <LocalizedLink
                to="/contact"
                className={cn(
                  'relative px-3.5 py-2 text-[0.8125rem] font-semibold transition-all duration-150 rounded-lg group',
                  transparent
                    ? 'text-white hover:bg-white/10'
                    : path === '/contact'
                      ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20'
                      : 'text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20'
                )}
              >
                {t('contact')}
                <span className={cn(
                  'absolute bottom-1 left-3.5 right-3.5 h-[1.5px] bg-brand-500 rounded-full transition-transform duration-200 origin-left',
                  path === '/contact' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                )} />
              </LocalizedLink>

            </nav>

            {/* Actions droite */}
            <div className="flex items-center gap-0.5 ml-auto lg:ml-0">
              <button
                onClick={onSearchOpen}
                className={cn(
                  'p-2 transition-colors rounded-lg',
                  transparent
                    ? 'text-white/80 hover:text-white hover:bg-white/10'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
                )}
                aria-label={t('search')}
              >
                <Search className="w-[18px] h-[18px]" />
              </button>

              <button
                onClick={toggleLanguage}
                className={cn(
                  'flex items-center gap-1 px-2 py-2 transition-colors rounded-lg text-[0.7rem] font-bold tracking-wide',
                  transparent
                    ? 'text-white/80 hover:text-white hover:bg-white/10'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
                )}
                aria-label={languageToggleLabel}
                title={languageToggleLabel}
              >
                <Languages className="w-[18px] h-[18px]" aria-hidden="true" />
                <span>{language === 'fr' ? 'EN' : 'FR'}</span>
              </button>

              <button
                onClick={toggleTheme}
                className={cn(
                  'p-2 transition-colors rounded-lg',
                  transparent
                    ? 'text-white/80 hover:text-white hover:bg-white/10'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
                )}
                aria-label={t('toggleTheme')}
              >
                {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
              </button>

              {user ? (
                <div className="relative ml-1" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    aria-expanded={profileOpen}
                    aria-haspopup="true"
                    aria-label={t('accountMenu', { name: user.displayName || user.email })}
                    className={cn(
                      'flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-full border transition-all duration-200',
                      transparent
                        ? 'border-white/30 hover:border-white/50 hover:bg-white/10'
                        : 'border-neutral-200/80 dark:border-neutral-700/80 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                    )}
                  >
                    <div className="w-7 h-7 rounded-full bg-brand-600 dark:bg-brand-500 flex items-center justify-center text-white text-xs font-bold">
                      {userInitials}
                    </div>
                    <span className={cn(
                      'hidden sm:block text-xs font-semibold max-w-[80px] truncate',
                      transparent ? 'text-white/90' : 'text-neutral-700 dark:text-neutral-300'
                    )}>
                      {user.displayName?.split(' ')[0] || t('myAccount')}
                    </span>
                    <ChevronDown className={cn('w-3 h-3 transition-transform duration-200', transparent ? 'text-white/70' : 'text-neutral-400', profileOpen && 'rotate-180')} />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2.5 w-60 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl shadow-neutral-900/10 dark:shadow-black/40 border border-neutral-100 dark:border-neutral-800 py-1.5 animate-slide-down">
                      <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                        <p className="text-sm font-bold text-neutral-900 dark:text-white">{user.displayName || t('learner')}</p>
                        <p className="text-xs text-neutral-400 mt-0.5 truncate">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <LocalizedLink
                          to="/mon-espace"
                          className={cn('flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors', navAccents.brand.idle)}
                        >
                          <GraduationCap className="w-4 h-4" />
                          {t('studentSpace')}
                        </LocalizedLink>
                        {userData?.role === 'admin' && (
                          <LocalizedLink
                            to="/admin"
                            className={cn('flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors', navAccents.plum.idle)}
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            {t('admin')}
                          </LocalizedLink>
                        )}
                      </div>
                      <div className="pt-1 border-t border-neutral-100 dark:border-neutral-800">
                        <button
                          onClick={() => { signOut(); setProfileOpen(false); }}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 w-full transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          {t('signOut')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <LocalizedLink
                  to="/connexion"
                  className={cn(
                    'hidden sm:inline-flex items-center gap-2 px-4 py-2 ml-1.5 text-[0.8125rem] font-semibold border rounded-full transition-all duration-200',
                    transparent
                      ? 'text-white border-white/30 hover:border-white/50 hover:bg-white/10'
                      : 'text-neutral-700 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700 hover:border-brand-400 hover:text-brand-600 dark:hover:border-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/10'
                  )}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  {t('signIn')}
                </LocalizedLink>
              )}

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className={cn(
                  'lg:hidden ml-1 p-2 transition-colors rounded-lg',
                  transparent
                    ? 'text-white hover:bg-white/10'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/60 dark:hover:bg-neutral-800/50'
                )}
                aria-label={t('menu')}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Menu mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div
            className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed top-16 left-0 right-0 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 shadow-xl animate-slide-down max-h-[calc(100vh-4rem)] overflow-y-auto">
            <nav className="py-3 px-3 space-y-0.5">
              {navLinks.map((link) => {
                const isActive = path === link.path || path.startsWith(link.path + '/');
                return (
                  <LocalizedLink
                    key={link.path}
                    to={link.path}
                    className={cn(
                      'block px-4 py-3 text-sm font-medium transition-colors rounded-xl',
                      isActive
                        ? cn('font-semibold', navAccents[link.accent].active)
                        : navAccents[link.accent].idle
                    )}
                  >
                    {t(link.key)}
                  </LocalizedLink>
                );
              })}

              {/* Mobile: Je te transforme */}
              <div>
                <button
                  onClick={() => setMobileTransformerOpen(!mobileTransformerOpen)}
                  aria-expanded={mobileTransformerOpen}
                  aria-controls="mobile-transformer-menu"
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors rounded-xl',
                    isTransformerActive || mobileTransformerOpen
                      ? cn('font-semibold', navAccents.accent.active)
                      : navAccents.accent.idle
                  )}
                >
                  {t('transform')}
                  <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', mobileTransformerOpen && 'rotate-180')} aria-hidden="true" />
                </button>
                <div
                  id="mobile-transformer-menu"
                  className={cn(
                    'ml-3 space-y-0.5 overflow-hidden transition-all duration-200',
                    mobileTransformerOpen ? 'max-h-40 mt-0.5 opacity-100' : 'max-h-0 opacity-0'
                  )}
                >
                    {transformerLinks.map((item) => {
                      const isActive = path.startsWith(item.path);
                      const accent = navAccents[item.accent];
                      return (
                      <LocalizedLink
                        key={item.path}
                        to={item.path}
                        className={cn(
                          'flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors rounded-xl',
                          isActive ? cn('font-semibold', accent.active) : accent.idle
                        )}
                      >
                        <item.icon className="w-4 h-4" />
                        {t(item.key)}
                      </LocalizedLink>
                      );
                    })}
                </div>
              </div>

              {/* Mobile: Je te digitalise */}
              <LocalizedLink
                to="/agence"
                className={cn(
                  'block px-4 py-3 text-sm font-semibold transition-colors rounded-xl',
                  path === '/agence' ? navAccents.lagoon.active : navAccents.lagoon.idle
                )}
              >
                {t('agency')}
              </LocalizedLink>

              {/* Mobile: Contacte-moi */}
              <LocalizedLink
                to="/contact"
                className={cn(
                  'block px-4 py-3 text-sm font-semibold transition-colors rounded-xl',
                  path === '/contact'
                    ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20'
                    : 'text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20'
                )}
              >
                {t('contact')}
              </LocalizedLink>

              {/* Mobile: langue */}
              <button
                onClick={toggleLanguage}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 rounded-xl"
                aria-label={languageToggleLabel}
              >
                <Languages className="w-4 h-4" aria-hidden="true" />
                {languageToggleLabel}
              </button>

              <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />

              {user ? (
                <div className="space-y-0.5">
                  <LocalizedLink
                    to="/mon-espace"
                    className={cn('flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors', navAccents.brand.idle)}
                  >
                    <GraduationCap className="w-4 h-4" />
                    {t('studentSpace')}
                  </LocalizedLink>
                  <button
                    onClick={() => { signOut(); }}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('signOut')}
                  </button>
                </div>
              ) : (
                <LocalizedLink
                  to="/connexion"
                  className="flex items-center justify-center gap-2 px-4 py-3 mt-1 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  {t('signIn')}
                </LocalizedLink>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
