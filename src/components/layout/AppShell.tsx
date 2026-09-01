import { useEffect, useState, type ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { toCanonicalPath } from '../../i18n/routing';
import AppSidebar, { type AppSidebarSection } from './AppSidebar';
import AppBottomNav, { type BottomNavItem } from './AppBottomNav';
import UserMenu from './UserMenu';
import NotificationDropdown from '../ui/NotificationDropdown';
import SearchOverlay from '../shared/SearchOverlay';
import { Mesh, type Territory, type WordmarkProps } from '../../design-system';
import { Icon } from '@ds';

const COLLAPSED_KEY = 'app:sidebar:collapsed';

/**
 * LA COQUILLE DE L'APPLICATION — espace apprenant et console d'administration.
 *
 * LE MAILLAGE EST LE FOND, ET IL PÈSE ZÉRO OCTET. Le fond était un aplat
 * (`bg-[color:var(--fill-1)] dark:bg-[color:var(--night-2)]`) : une troisième couleur de
 * surface, que le système interdit — « maximum deux fonds par écran : le maillage, et le
 * verre ». La console prend le maillage NUIT, sur #0A0D11 ; l'espace apprenant prend celui de
 * son territoire d'entrée.
 *
 * LES TROIS POINTS DE RUPTURE, aux valeurs du système et non à celles de Tailwind :
 *   · sous 700 px  — barre d'onglets basse de 80 px, la seconde des deux surfaces floutées ;
 *   · au-delà      — navigation latérale de 250 px en faux verre.
 * Le seuil était `md` (768 px). Entre 700 et 768 vivent les tablettes en portrait, qui
 * recevaient une barre d'onglets là où le système prévoit la colonne.
 *
 * PLUS DE FLOU SUR LA BARRE DU HAUT. `bg-[color-mix(in_srgb,var(--paper)_95%,transparent)] backdrop-blur` en faisait une troisième
 * surface floutée, alors que le budget — deux — est déjà pris par la barre haute du site et
 * la barre d'onglets. C'est `.glass-flat` : voile à 78 %, aucun flou, gratuit à faire défiler.
 *
 * PLUS DE TRANSITION SUR UNE MARGE. Le repli de la colonne animait `margin-left` et `width` :
 * AD-16 ne l'autorise pas, et sur le profil d'appareil visé — 2 Go, 4 cœurs — c'est un
 * reflow par image. Le repli est instantané ; personne ne l'a jamais regardé se faire.
 */
export interface AppShellProps {
  brand: { label: string; href: string };
  /**
   * Le maillage du fond. `nuit` est celui de la console. Ce n'est PAS une prop de thème
   * (AD-3) : le mode clair/sombre reste la portée `.dk`, et un maillage nuit s'affiche dans
   * les deux modes — c'est un territoire, pas un thème.
   */
  territory?: Territory | 'nuit';
  /**
   * LE MAILLAGE CHANGE AVEC L'ÉCRAN, PAS AVEC L'APPLICATION.
   *
   * `territory` seul figeait tout l'espace apprenant sur un maillage unique — `forme`, la
   * valeur par défaut, parce que `StudentLayout` ne passait rien. Or le kit en change à
   * chaque écran : `ScreensSpace.js` monte l'accueil, le répétiteur et le Club sur
   * « transforme », le lecteur et les notes sur « forme », et `ScreensCompte.js` fait pareil
   * pour les préférences.
   *
   * Ce n'est pas une variation décorative. Le maillage est LE SEUL repère de territoire
   * continu du produit — la planche des transitions lui consacre son point 3 : « le maillage
   * fond d'une teinte à l'autre pendant que le contenu glisse. C'est le seul repère de
   * territoire du produit, et il doit se voir. » Un maillage unique le supprime purement et
   * simplement : la personne ne sait plus, au fond de l'écran, si elle est dans son cours ou
   * dans le Club.
   *
   * Même forme que `titleMap` : une table par chemin canonique, pour que ce soit la couche
   * qui CONNAÎT les routes qui décide, et non la coquille.
   */
  territoryMap?: Record<string, Territory | 'nuit'>;
  /** Le mot-symbole de la colonne — `rysmo` pour l'application, `signature` pour la console. */
  wordmark?: WordmarkProps['brand'];
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
  brand, territory = 'forme', territoryMap, wordmark = 'rysmo', sidebarSections, bottomNavItems,
  titleMap, beforeOutlet, outletContext, contentClassName,
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
  /*
   * La correspondance est PAR PRÉFIXE, pas exacte. `/mon-espace/cours/:slug` (le lecteur) et
   * `/mon-espace/club/fil` doivent hériter du maillage de leur section : une table de chemins
   * exacts obligerait à réénumérer chaque sous-route, et la première oubliée retomberait en
   * silence sur le territoire par défaut — exactement le défaut qu'on corrige ici.
   * Le préfixe le plus long gagne, pour qu'une entrée plus précise puisse trancher.
   */
  const meshTerritory = territoryMap
    ? (Object.entries(territoryMap)
        .filter(([prefix]) => canonicalPath === prefix || canonicalPath.startsWith(`${prefix}/`))
        .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? territory)
    : territory;

  const hasBottomNav = bottomNavItems && bottomNavItems.length > 0;

  return (
    <div className="min-h-screen relative isolate overflow-x-clip">
      {/* Le fond du produit : trois lobes flous en dérive, animés en `transform` seulement,
          fixés à la fenêtre pour que le voile de lisibilité garde la géométrie sur laquelle
          AD-18 a été mesuré. Poids : 0 octet. */}
      <Mesh territory={meshTerritory} style={{ position: 'fixed', zIndex: 0 }} />

      {/* Colonne latérale — 250 px, à partir de 700 px */}
      <aside
        className={cn(
          'glass-flat fixed left-0 top-0 bottom-0 z-30 rounded-none border-0 border-r border-[color:var(--nav-brd)] hidden stack:block',
          collapsed ? 'w-16' : 'w-[250px]',
        )}
      >
        <AppSidebar
          sections={sidebarSections}
          brand={brand}
          wordmark={wordmark}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((v) => !v)}
          onOpenCommandPalette={() => setSearchOpen(true)}
        />
      </aside>

      {/* Tiroir, sous 700 px */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 stack:hidden">
          {/* Aucun flou sur le voile : le budget est déjà tenu par la barre d'onglets, et
              une teinte d'encre fixe suffit à reculer la page. */}
          <div
            className="fixed inset-0 bg-[color-mix(in_srgb,var(--ink-fixed)_38%,transparent)] mm-drop"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="glass-flat fixed left-0 top-0 bottom-0 w-[250px] max-w-[85vw] rounded-none border-0 border-r border-[color:var(--nav-brd)] z-50 mm-drop">
            <AppSidebar
              sections={sidebarSections}
              brand={brand}
              wordmark={wordmark}
              collapsed={false}
              showCollapseButton={false}
              onItemClick={() => setMobileOpen(false)}
              onOpenCommandPalette={() => { setSearchOpen(true); setMobileOpen(false); }}
            />
          </aside>
        </div>
      )}

      {/* Colonne principale */}
      <div className={cn('relative z-[1]', collapsed ? 'stack:ml-16' : 'stack:ml-[250px]')}>
        {/* Barre du haut — faux verre, aucun flou. Elle est collante, mais elle n'est pas la
            surface sous laquelle le contenu passe : la barre haute du site et la barre
            d'onglets prennent déjà les deux places du budget. */}
        <header className="glass-flat sticky top-0 z-20 rounded-none border-0 border-b border-[color:var(--nav-brd)]">
          <div className="flex items-center gap-2 px-3 stack:px-pane h-12 stack:h-14">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="mm-touch-extend stack:hidden p-2 -ml-1 rounded-xs text-ink-2 hover:text-ink hover:bg-[color:var(--fill-1)] transition-colors duration-ui"
              aria-label={t('shell.openMenu')}
            >
              <Icon name="menu" size={20} strokeWidth={2.2} />
            </button>

            {/* Mobile : titre centré. Écran large : titre à gauche. */}
            <div className="flex-1 min-w-0 text-center stack:text-left">
              {/* Fraunces 900, jamais sous 22 px — `text-dsp-xs` vaut 23. */}
              <h1 className="font-display text-dsp-xs text-ink truncate">
                {pageTitle}
              </h1>
            </div>

            {/* Déclencheur de recherche, écran large */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="mm-touch-extend hidden stack:flex items-center gap-2 px-3 h-9 rounded-m border border-[color:var(--line)] bg-[color:var(--ctl-off-bg)] text-meta text-ink-2 hover:text-ink hover:bg-[color:var(--fill-1)] transition-colors duration-ui"
              aria-label={t('shell.searchShortcut')}
            >
              <Icon name="search" size={16} strokeWidth={2.2} />
              <span className="hidden wide:inline">{t('shell.searchPlaceholder')}</span>
              <kbd className="hidden wide:inline text-small font-bold tracking-wider text-ink-2 border border-[color:var(--line)] rounded-xs px-1 py-0.5">⌘K</kbd>
            </button>

            {/* Recherche, petit écran */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="mm-touch-extend stack:hidden p-2 rounded-xs text-ink-2 hover:text-ink hover:bg-[color:var(--fill-1)] transition-colors duration-ui"
              aria-label={t('shell.search')}
            >
              <Icon name="search" size={20} strokeWidth={2.2} />
            </button>

            <NotificationDropdown />
            <UserMenu compact />
          </div>
        </header>

        <main
          className={cn(
            'min-w-0',
            contentClassName ?? 'p-4 stack:p-pane',
            // La barre d'onglets recouvre 80 px : le dernier bloc de la page doit pouvoir
            // remonter au-dessus d'elle, zone sûre comprise.
            hasBottomNav && 'pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+1rem)] stack:pb-8',
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
