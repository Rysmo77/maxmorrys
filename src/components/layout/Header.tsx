import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, Search, Sun, Moon, LogOut, LayoutDashboard, GraduationCap, ChevronDown, Headphones, Youtube, LogIn, Languages } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { toCanonicalPath } from '../../i18n/routing';
import LocalizedLink from '../shared/LocalizedLink';
import AnnouncementBanner from '../shared/AnnouncementBanner';

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

/**
 * Routes dont le hero occupe le haut de l'écran : le header s'y superpose en transparence
 * tant qu'on n'a pas défilé. Chemins CANONIQUES FR — `toCanonicalPath` ramène `/en/...` ici.
 *
 * `/agence` en fait partie depuis le repositionnement : son hero est `bg-neutral-950`, et un
 * header blanc opaque au-dessus créait une couture franche.
 */
const OVERLAY_ROUTES = ['/', '/agence'];

/** Anneau de focus clavier — appliqué à CHAQUE cible du header, sans exception. */
const FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950';
/** Même chose au-dessus d'un hero : l'anneau de marque y serait invisible. */
const FOCUS_RING_ON_HERO =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent';

/** Sélecteur des éléments focusables, pour le piège de focus du menu mobile. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

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
  const dropdownBtnRef = useRef<HTMLButtonElement>(null);
  const dropdownPanelRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileBtnRef = useRef<HTMLButtonElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  /** Temporisation de fermeture au survol : évite le clignotement en traversant le vide. */
  const hoverCloseTimer = useRef<number | null>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  /**
   * Publie l'état compact sur <html> : `--header-h` en dépend, et avec elle le panneau
   * mobile, le bandeau de langue et la sous-nav de la page À propos.
   */
  useEffect(() => {
    const root = document.documentElement;
    if (scrolled) root.setAttribute('data-header-compact', '');
    else root.removeAttribute('data-header-compact');
    return () => root.removeAttribute('data-header-compact');
  }, [scrolled]);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
    setDropdownOpen(false);
    setMobileTransformerOpen(false);
  }, [location]);

  // Cmd+K / Ctrl+K to open search — `toLowerCase` pour ne pas rater ⇧⌘K (cf. AppShell).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
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

  /**
   * Échap ferme le calque ouvert le plus intérieur et REND LE FOCUS à son déclencheur —
   * sans quoi le focus retombe sur <body> et la navigation clavier repart de zéro.
   */
  useEffect(() => {
    if (!dropdownOpen && !profileOpen && !mobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (dropdownOpen) {
        setDropdownOpen(false);
        dropdownBtnRef.current?.focus();
      } else if (profileOpen) {
        setProfileOpen(false);
        profileBtnRef.current?.focus();
      } else if (mobileOpen) {
        setMobileOpen(false);
        burgerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [dropdownOpen, profileOpen, mobileOpen]);

  /** Verrou du défilement de la page tant que le menu mobile est ouvert. */
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [mobileOpen]);

  /** Piège de focus du menu mobile : la tabulation ne doit pas s'en échapper. */
  useEffect(() => {
    if (!mobileOpen) return;
    const panel = mobilePanelRef.current;
    if (!panel) return;
    panel.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [mobileOpen]);

  /** Flèches ↑↓ dans le menu « Je te transforme », comme un vrai menu. */
  const handleMenuKeys = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = Array.from(
      dropdownPanelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
    if (items.length === 0) return;
    const current = items.indexOf(document.activeElement as HTMLElement);
    const next = e.key === 'ArrowDown'
      ? (current + 1) % items.length
      : (current - 1 + items.length) % items.length;
    items[next].focus();
  }, []);

  const openDropdownOnHover = () => {
    if (hoverCloseTimer.current) window.clearTimeout(hoverCloseTimer.current);
    setDropdownOpen(true);
  };
  const closeDropdownOnHover = () => {
    hoverCloseTimer.current = window.setTimeout(() => setDropdownOpen(false), 120);
  };

  const isTransformerActive = path.startsWith('/podcasts') || path.startsWith('/videos');

  // Header transparent par-dessus un hero plein écran (haut de page, menu fermé).
  const transparent = OVERLAY_ROUTES.includes(path) && !scrolled && !mobileOpen;

  const transformerAccent = transparent ? transparentAccent : navAccents.accent;
  const focusRing = transparent ? FOCUS_RING_ON_HERO : FOCUS_RING;

  const userInitials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'U';

  const languageToggleLabel = language === 'fr' ? tc('switchToEnglish') : tc('switchToFrench');
  const themeToggleLabel = t('toggleTheme');

  /**
   * Densité. La nav desktop n'apparaît qu'à partir de `xl` (1280) : à `lg` (1024), les
   * cinq libellés français longs plus la pastille Connexion réclamaient ~1109 px pour 960 px
   * disponibles. Sous `xl`, c'est le menu burger — le cas type étant une tablette en paysage.
   *
   * ⚠️ Depuis l'ajout de « Je te digitalise », la barre compte SIX libellés FR longs et le
   * budget est SERRÉ : ~1208 px requis pour 1216 px disponibles.
   *
   * Ce budget ne dépend PAS de la largeur de l'écran. Le conteneur est plafonné à `max-w-7xl`
   * (1280 px moins 2×32 px de gouttière = 1216 px) : une fenêtre de 1920 px n'offre pas un
   * pixel de plus qu'une de 1280 px. Les anciennes montées en `2xl` (padding `px-3.5`,
   * gouttière `gap-5`, rappel `⌘K`) partaient donc d'une prémisse fausse et faisaient passer
   * les six libellés sur DEUX LIGNES à partir de 1536 px. La configuration est désormais
   * unique au-delà de `xl`.
   *
   * `whitespace-nowrap` est un garde-fou délibéré : si un futur libellé fait déborder la
   * barre, le débordement sera VISIBLE au lieu de se replier silencieusement sur deux lignes.
   * Tout septième libellé impose de libérer de la place ailleurs — et de re-mesurer.
   */
  const navItemCls = 'relative px-2.5 py-2 text-[0.8125rem] font-semibold whitespace-nowrap transition-colors duration-150 rounded-lg group';
  /**
   * Bouton du bloc utilitaire segmenté. Les arrondis vivent sur le conteneur
   * (`overflow-hidden`) et non sur les enfants : langue et thème sont masqués sous `sm`,
   * un `last:rounded-r-full` viserait alors un élément invisible et laisserait un bord carré.
   */
  const utilityCls = cn(
    'flex items-center justify-center gap-1.5 h-10 px-2.5 sm:px-3 transition-colors',
    transparent
      ? 'text-white/85 hover:text-white hover:bg-white/10'
      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800',
    focusRing,
  );

  return (
    <>
      {/*
        La bannière d'annonce vit DANS le header fixe. Auparavant elle était dans le flux en
        `z-50` alors que le header est `fixed z-40` : les deux occupaient la même bande et la
        bannière peignait par-dessus le logo.
      */}
      <header className="fixed top-0 left-0 right-0 z-40">
        <AnnouncementBanner />

        <div
          className={cn(
            'relative transition-colors duration-300',
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
            <div className="flex items-center gap-2 sm:gap-3 xl:gap-4 h-[var(--header-h)] transition-[height] duration-300">

              {/* Logo */}
              <LocalizedLink
                to="/"
                className={cn('group shrink-0 flex items-center rounded-lg', focusRing)}
              >
                <span className={cn(
                  'font-black text-[1.35rem] tracking-tight transition-colors duration-200 drop-shadow-sm',
                  transparent
                    ? 'text-white group-hover:text-brand-200'
                    : 'text-neutral-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400'
                )}>
                  Hellooo<span className="text-brand-500">!</span>
                </span>
              </LocalizedLink>

              {/*
                Nav collée au logo. Elle portait `ml-auto` alors que le bloc d'actions en
                portait un aussi : elle se retrouvait plaquée à droite, avec un grand vide
                au milieu et aucune séparation d'avec les utilitaires.
              */}
              <nav className="hidden xl:flex items-center" aria-label={t('menu')}>
                {navLinks.map((link) => {
                  const isActive = path === link.path || path.startsWith(link.path + '/');
                  const accent = transparent ? transparentAccent : navAccents[link.accent];
                  return (
                    <LocalizedLink
                      key={link.path}
                      to={link.path}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(navItemCls, focusRing, isActive ? accent.active : accent.idle)}
                    >
                      {t(link.key)}
                      <span className={cn(
                        'absolute bottom-1 left-2.5 right-2.5 h-[1.5px] rounded-full transition-transform duration-200 origin-left',
                        accent.bar,
                        isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                      )} />
                    </LocalizedLink>
                  );
                })}

                {/* Menu « Je te transforme » */}
                <div
                  className="relative"
                  ref={dropdownRef}
                  onMouseEnter={openDropdownOnHover}
                  onMouseLeave={closeDropdownOnHover}
                >
                  <button
                    ref={dropdownBtnRef}
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown' && !dropdownOpen) {
                        e.preventDefault();
                        setDropdownOpen(true);
                      }
                    }}
                    aria-expanded={dropdownOpen}
                    aria-haspopup="menu"
                    aria-controls="nav-transformer-menu"
                    aria-label={t('transformAria')}
                    className={cn(
                      navItemCls,
                      focusRing,
                      'flex items-center gap-1',
                      isTransformerActive || dropdownOpen ? transformerAccent.active : transformerAccent.idle
                    )}
                  >
                    {t('transform')}
                    <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', dropdownOpen && 'rotate-180')} aria-hidden="true" />
                    <span className={cn(
                      /* right-6 = px-2.5 + la largeur du chevron et sa gouttière. */
                      'absolute bottom-1 left-2.5 right-6 h-[1.5px] rounded-full transition-transform duration-200 origin-left',
                      transformerAccent.bar,
                      isTransformerActive || dropdownOpen ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    )} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-80 pt-2.5">
                      <div
                        id="nav-transformer-menu"
                        role="menu"
                        aria-label={t('transformAria')}
                        ref={dropdownPanelRef}
                        onKeyDown={handleMenuKeys}
                        className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl shadow-neutral-900/10 dark:shadow-black/40 border border-neutral-100 dark:border-neutral-800 py-2 animate-slide-down"
                      >
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
                              role="menuitem"
                              aria-current={isActive ? 'page' : undefined}
                              className={cn('flex items-center gap-3 px-4 py-3 transition-colors group/item', rowCls, FOCUS_RING)}
                            >
                              <div className={`w-9 h-9 rounded-xl ${iconBoxCls} flex items-center justify-center shrink-0`}>
                                <item.icon className={`w-4 h-4 ${iconCls}`} aria-hidden="true" />
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

                {/*
                  Je te digitalise — offre Présence Digitale (commerces de proximité).

                  ⚠️ Sa POSITION est un choix, pas un hasard. Un lien texte lagoon jouxtant
                  la pastille lagoon a déjà été supprimé une fois : les deux menaient à
                  /agence « à trois centimètres l'un de l'autre ». Ici les destinations
                  diffèrent (/presence-digitale vs /agence) et les libellés ne partagent
                  aucun mot, mais la séparation physique reste nécessaire : « Contacte-moi »,
                  le bloc utilitaire segmenté, le séparateur et Connexion s'intercalent.
                  Ne pas déplacer cette entrée vers la droite.

                  Elle rejoint en revanche la famille « Je te… » — l'actif de marque du site
                  (docs/UX-AUDIT.md §2). Le libellé a existé en nav par le passé mais pointait
                  alors vers /agence, qui hébergeait l'offre TPE ; sa destination est
                  désormais la bonne.
                */}
                <LocalizedLink
                  to="/presence-digitale"
                  aria-current={path === '/presence-digitale' ? 'page' : undefined}
                  className={cn(
                    navItemCls,
                    focusRing,
                    path === '/presence-digitale'
                      ? (transparent ? transparentAccent.active : navAccents.lagoon.active)
                      : (transparent ? transparentAccent.idle : navAccents.lagoon.idle)
                  )}
                >
                  {t('presence')}
                  <span className={cn(
                    'absolute bottom-1 left-2.5 right-2.5 h-[1.5px] rounded-full transition-transform duration-200 origin-left',
                    transparent ? transparentAccent.bar : navAccents.lagoon.bar,
                    path === '/presence-digitale' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  )} />
                </LocalizedLink>

                {/* Contacte-moi */}
                <LocalizedLink
                  to="/contact"
                  aria-current={path === '/contact' ? 'page' : undefined}
                  className={cn(
                    navItemCls,
                    focusRing,
                    transparent
                      ? 'text-white hover:bg-white/10'
                      : path === '/contact'
                        ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20'
                        : 'text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20'
                  )}
                >
                  {t('contact')}
                  <span className={cn(
                    'absolute bottom-1 left-2.5 right-2.5 h-[1.5px] bg-brand-500 rounded-full transition-transform duration-200 origin-left',
                    path === '/contact' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  )} />
                </LocalizedLink>
              </nav>

              {/* ── Zone droite : utilitaires · identité · CTA ────────────────────── */}
              <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">

                {/*
                  Recherche + langue + thème réunis en UN objet segmenté. Trois icônes
                  isolées se lisaient comme trois cibles distinctes ; regroupées, elles
                  n'en pèsent plus qu'une dans la densité perçue.
                */}
                <div
                  className={cn(
                    'flex items-center rounded-full border divide-x overflow-hidden',
                    transparent
                      ? 'border-white/25 divide-white/20'
                      : 'border-neutral-200 dark:border-neutral-700 divide-neutral-200 dark:divide-neutral-700'
                  )}
                >
                  {/*
                    Le rappel visuel « ⌘K » a été retiré de l'en-tête : avec six libellés de
                    nav, ses ~23 px faisaient déborder la barre. Le raccourci lui-même reste
                    actif à toutes les tailles, et le rappel subsiste dans l'espace membre,
                    dont l'en-tête est bien moins chargé.
                  */}
                  <button onClick={onSearchOpen} className={utilityCls} aria-label={t('search')}>
                    <Search className="w-5 h-5" aria-hidden="true" />
                  </button>

                  {/*
                    Bascule de langue en TEXTE seul. L'icône `Languages` doublait le code de
                    langue — deux signes pour une seule affordance — et coûtait ~26 px que la
                    barre à six libellés n'a plus. Le code (« EN » / « FR ») dit à lui seul ce
                    que fait le bouton ; `aria-label` et `title` portent la phrase complète.
                  */}
                  <button
                    onClick={toggleLanguage}
                    className={cn(utilityCls, 'hidden sm:flex text-xs font-bold tracking-wide')}
                    aria-label={languageToggleLabel}
                    title={languageToggleLabel}
                  >
                    {language === 'fr' ? 'EN' : 'FR'}
                  </button>

                  <button
                    onClick={toggleTheme}
                    className={cn(utilityCls, 'hidden sm:flex')}
                    aria-label={themeToggleLabel}
                    aria-pressed={theme === 'dark'}
                    title={themeToggleLabel}
                  >
                    {theme === 'dark'
                      ? <Sun className="w-5 h-5" aria-hidden="true" />
                      : <Moon className="w-5 h-5" aria-hidden="true" />}
                  </button>
                </div>

                {/* Séparateur : navigation/utilitaires d'un côté, identité de l'autre. */}
                <span
                  className={cn(
                    'hidden xl:block w-px h-6',
                    transparent ? 'bg-white/20' : 'bg-neutral-200 dark:bg-neutral-700'
                  )}
                  aria-hidden="true"
                />

                {user ? (
                  <div className="relative" ref={profileRef}>
                    <button
                      ref={profileBtnRef}
                      onClick={() => setProfileOpen(!profileOpen)}
                      aria-expanded={profileOpen}
                      aria-haspopup="menu"
                      aria-controls="nav-account-menu"
                      aria-label={t('accountMenu', { name: user.displayName || user.email })}
                      className={cn(
                        'flex items-center gap-2 pl-1.5 pr-2.5 h-10 rounded-full border transition-all duration-200',
                        focusRing,
                        transparent
                          ? 'border-white/30 hover:border-white/50 hover:bg-white/10'
                          : 'border-neutral-200/80 dark:border-neutral-700/80 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                      )}
                    >
                      <span className="w-7 h-7 rounded-full bg-brand-600 dark:bg-brand-500 flex items-center justify-center text-white text-xs font-bold">
                        {userInitials}
                      </span>
                      {/*
                        `max-w-[64px]` et non 80 : c'est l'état CONNECTÉ qui dimensionne la
                        barre. Ce bouton (avatar + prénom + chevron) est plus large que la
                        pastille « Connexion » de l'état déconnecté, donc c'est lui qui décide
                        si les six libellés de nav tiennent. Ne pas élargir sans re-mesurer.
                      */}
                      <span className={cn(
                        'hidden xl:block text-xs font-semibold max-w-[64px] truncate',
                        transparent ? 'text-white/90' : 'text-neutral-700 dark:text-neutral-300'
                      )}>
                        {user.displayName?.split(' ')[0] || t('myAccount')}
                      </span>
                      <ChevronDown className={cn('w-3 h-3 transition-transform duration-200', transparent ? 'text-white/70' : 'text-neutral-400', profileOpen && 'rotate-180')} aria-hidden="true" />
                    </button>

                    {profileOpen && (
                      <div
                        id="nav-account-menu"
                        role="menu"
                        className="absolute right-0 top-full mt-2.5 w-60 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl shadow-neutral-900/10 dark:shadow-black/40 border border-neutral-100 dark:border-neutral-800 py-1.5 animate-slide-down"
                      >
                        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                          <p className="text-sm font-bold text-neutral-900 dark:text-white">{user.displayName || t('learner')}</p>
                          <p className="text-xs text-neutral-400 mt-0.5 truncate">{user.email}</p>
                        </div>
                        <div className="py-1">
                          <LocalizedLink
                            to="/mon-espace"
                            role="menuitem"
                            className={cn('flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors', navAccents.brand.idle, FOCUS_RING)}
                          >
                            <GraduationCap className="w-4 h-4" aria-hidden="true" />
                            {t('studentSpace')}
                          </LocalizedLink>
                          {userData?.role === 'admin' && (
                            <LocalizedLink
                              to="/admin"
                              role="menuitem"
                              className={cn('flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors', navAccents.plum.idle, FOCUS_RING)}
                            >
                              <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
                              {t('admin')}
                            </LocalizedLink>
                          )}
                        </div>
                        <div className="pt-1 border-t border-neutral-100 dark:border-neutral-800">
                          <button
                            onClick={() => { signOut(); setProfileOpen(false); }}
                            role="menuitem"
                            className={cn('flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 w-full transition-colors', FOCUS_RING)}
                          >
                            <LogOut className="w-4 h-4" aria-hidden="true" />
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
                      'hidden xl:inline-flex items-center gap-2 px-4 h-10 text-[0.8125rem] font-semibold border rounded-full transition-all duration-200',
                      focusRing,
                      transparent
                        ? 'text-white border-white/30 hover:border-white/50 hover:bg-white/10'
                        : 'text-neutral-700 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700 hover:border-brand-400 hover:text-brand-600 dark:hover:border-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/10'
                    )}
                  >
                    <LogIn className="w-4 h-4" aria-hidden="true" />
                    {t('signIn')}
                  </LocalizedLink>
                )}

                {/*
                  Entrée AGENCE — unique, et seul CTA plein du header. Un lien texte et un
                  bouton « Travaillons ensemble » menaient tous deux ici, à trois centimètres
                  l'un de l'autre : une nav liste des destinations, le bouton porte donc le
                  nom de la destination. La clé `nav.workWithMe` qui portait l'ancien libellé
                  a été supprimée (plus aucun usage) ; les pages gardent leurs propres clés.

                  C'est cette pastille qui distingue les deux offres commerciales du site :
                  bouton plein au nom d'entité pour Max-Morrys Agency, lien texte tutoyant
                  (« Je te digitalise ») pour Présence Digitale. Ne pas donner de pastille
                  pleine à la seconde — la différence de forme fait tout le travail.

                  ⚠️ Sur fond sombre, `bg-lagoon-500 text-neutral-900` — l'aplat signature
                  documenté à 8,1:1. Ne JAMAIS utiliser lagoon-500 en texte sur fond clair.
                */}
                <LocalizedLink
                  to="/agence"
                  aria-current={path === '/agence' ? 'page' : undefined}
                  className={cn(
                    'hidden sm:inline-flex items-center px-4 h-10 text-[0.8125rem] font-semibold rounded-full transition-colors shrink-0',
                    focusRing,
                    transparent
                      ? 'bg-lagoon-500 text-neutral-900 hover:bg-lagoon-400'
                      : 'bg-lagoon-700 text-white hover:bg-lagoon-800'
                  )}
                >
                  {t('agency')}
                </LocalizedLink>

                <button
                  ref={burgerRef}
                  onClick={() => setMobileOpen(!mobileOpen)}
                  aria-expanded={mobileOpen}
                  aria-controls="mobile-menu"
                  aria-label={t('menu')}
                  className={cn(
                    'xl:hidden flex items-center justify-center w-10 h-10 transition-colors rounded-lg',
                    focusRing,
                    transparent
                      ? 'text-white hover:bg-white/10'
                      : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  )}
                >
                  {mobileOpen
                    ? <X className="w-5 h-5" aria-hidden="true" />
                    : <Menu className="w-5 h-5" aria-hidden="true" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/*
          Panneau mobile — enfant du header en `top-full` : il se cale sous la hauteur RÉELLE,
          bannière d'annonce comprise, sans aucun nombre magique.
        */}
        {mobileOpen && (
          <div
            id="mobile-menu"
            ref={mobilePanelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('menu')}
            className="absolute top-full left-0 right-0 xl:hidden bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 shadow-xl animate-slide-down max-h-[calc(100dvh-var(--header-h))] overflow-y-auto"
          >
            <nav className="py-3 px-3 space-y-0.5" aria-label={t('menu')}>
              {navLinks.map((link) => {
                const isActive = path === link.path || path.startsWith(link.path + '/');
                return (
                  <LocalizedLink
                    key={link.path}
                    to={link.path}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'block px-4 py-3 text-sm font-medium transition-colors rounded-xl',
                      FOCUS_RING,
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
                    FOCUS_RING,
                    isTransformerActive || mobileTransformerOpen
                      ? cn('font-semibold', navAccents.accent.active)
                      : navAccents.accent.idle
                  )}
                >
                  {t('transform')}
                  <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', mobileTransformerOpen && 'rotate-180')} aria-hidden="true" />
                </button>
                {/*
                  `hidden` quand replié, et pas seulement `max-h-0` : sinon les liens restent
                  atteignables à la tabulation alors qu'ils sont invisibles.
                */}
                <div
                  id="mobile-transformer-menu"
                  hidden={!mobileTransformerOpen}
                  className="ml-3 mt-0.5 space-y-0.5"
                >
                  {transformerLinks.map((item) => {
                    const isActive = path.startsWith(item.path);
                    const accent = navAccents[item.accent];
                    return (
                      <LocalizedLink
                        key={item.path}
                        to={item.path}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors rounded-xl',
                          FOCUS_RING,
                          isActive ? cn('font-semibold', accent.active) : accent.idle
                        )}
                      >
                        <item.icon className="w-4 h-4" aria-hidden="true" />
                        {t(item.key)}
                      </LocalizedLink>
                    );
                  })}
                </div>
              </div>

              {/* Mobile: Je te digitalise — même ordre qu'en desktop. */}
              <LocalizedLink
                to="/presence-digitale"
                aria-current={path === '/presence-digitale' ? 'page' : undefined}
                className={cn(
                  'block px-4 py-3 text-sm font-semibold transition-colors rounded-xl',
                  FOCUS_RING,
                  path === '/presence-digitale'
                    ? navAccents.lagoon.active
                    : navAccents.lagoon.idle
                )}
              >
                {t('presence')}
              </LocalizedLink>

              {/* Mobile: Contacte-moi */}
              <LocalizedLink
                to="/contact"
                aria-current={path === '/contact' ? 'page' : undefined}
                className={cn(
                  'block px-4 py-3 text-sm font-semibold transition-colors rounded-xl',
                  FOCUS_RING,
                  path === '/contact'
                    ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20'
                    : 'text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20'
                )}
              >
                {t('contact')}
              </LocalizedLink>

              {/* Mobile: Agence — une seule entrée, comme en desktop. */}
              <LocalizedLink
                to="/agence"
                aria-current={path === '/agence' ? 'page' : undefined}
                className={cn(
                  'block px-4 py-3 text-sm font-semibold text-center rounded-xl bg-lagoon-700 text-white hover:bg-lagoon-800 transition-colors',
                  FOCUS_RING
                )}
              >
                {t('agency')}
              </LocalizedLink>

              {/*
                Langue et thème : masqués de la barre sous `sm` faute de place, ils doivent
                donc rester atteignables ici — sinon un visiteur sur petit écran n'a plus
                aucun moyen de changer de langue.
              */}
              <button
                onClick={toggleLanguage}
                className={cn('w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 rounded-xl', FOCUS_RING)}
                aria-label={languageToggleLabel}
              >
                <Languages className="w-4 h-4" aria-hidden="true" />
                {languageToggleLabel}
              </button>

              <button
                onClick={toggleTheme}
                aria-pressed={theme === 'dark'}
                className={cn('w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 rounded-xl', FOCUS_RING)}
              >
                {theme === 'dark'
                  ? <Sun className="w-4 h-4" aria-hidden="true" />
                  : <Moon className="w-4 h-4" aria-hidden="true" />}
                {themeToggleLabel}
              </button>

              <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />

              {user ? (
                <div className="space-y-0.5">
                  <LocalizedLink
                    to="/mon-espace"
                    className={cn('flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors', navAccents.brand.idle, FOCUS_RING)}
                  >
                    <GraduationCap className="w-4 h-4" aria-hidden="true" />
                    {t('studentSpace')}
                  </LocalizedLink>
                  <button
                    onClick={() => { signOut(); }}
                    className={cn('flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl w-full', FOCUS_RING)}
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    {t('signOut')}
                  </button>
                </div>
              ) : (
                <LocalizedLink
                  to="/connexion"
                  className={cn('flex items-center justify-center gap-2 px-4 py-3 mt-1 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors', FOCUS_RING)}
                >
                  <LogIn className="w-4 h-4" aria-hidden="true" />
                  {t('signIn')}
                </LocalizedLink>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Fond semi-opaque — frère du header, pour rester sous lui dans l'empilement. */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 xl:hidden bg-black/20 dark:bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
