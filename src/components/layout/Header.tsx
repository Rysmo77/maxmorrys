import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage, useLocalizedPath } from '../../contexts/LanguageContext';
import { accueilConnecte, accueilPublic, espaceCourant, toLogicalPath } from '../../lib/hosts';
import LocalizedLink from '../shared/LocalizedLink';
import AnnouncementBanner from '../shared/AnnouncementBanner';
import DsNavHost from './DsNavHost';
import { Icon } from '@ds';
import {
  Button, SideNav, TopBar, Wordmark,
  type SideNavItem, type TopBarItem,
} from '../../design-system';

/**
 * LA BARRE HAUTE DES PAGES PUBLIQUES — pilule flottante opaque (AD-26), gabarit `mm-topbar`
 * du kit v3 (passe 2, maquettes du 29/10/2026).
 *
 * · Marque : le verrouillage « Max-Morrys » des maquettes (`Wordmark brand="kit"`), avec
 *   l'étiquette d'espace sur Edu ; le Club écrit « Club des Digitos ». « Hello ! » n'est plus
 *   posé ici (décision levée par le PRD rév. 6 + maquettes).
 * · Entrées : celles de l'espace public courant (`NAV_BY_SPACE`), en contrôle segmenté avec
 *   pouce. Aucun menu au survol.
 * · Droite : FR · EN, thème (le bouton reste), recherche, puis l'action de l'espace —
 *   « Réserver un appel » (→ `/contact?rdv=1`, la prise de rendez-vous existante) pour une
 *   personne non connectée sur le site ; avatar et menu de compte une fois connecté.
 * · Entre 900 et 1080 px : marque, entrées, action courte, bouton de menu (audit du 29/10, #6).
 * · Sous 900 px : marque, action courte (« Appel »), bouton de menu ; les entrées passent
 *   dans le tiroir (`SideNav`), avec la langue et le thème.
 *
 * `data-header-compact` reste publié sur `<html>` : `--header-h` en dépend.
 */

/** Une entrée de la navigation d'un espace public. */
interface NavEntry {
  /** Clé i18n dans le namespace `nav` (sous `v3.`). */
  key: string;
  /** Chemin CANONIQUE FR — `useLocalizedPath` le préfixe selon la langue. */
  path: string;
  /** Les chemins qui allument cette entrée, en plus du sien (préfixes). */
  owns?: readonly string[];
  /** Ne s'allume que sur son chemin exact (l'accueil). */
  exact?: boolean;
}

/**
 * PASSE 2 — LES TROIS BARRES PUBLIQUES DES MAQUETTES.
 *
 * Le PRD rév. 6 et les maquettes font foi : la barre « quatre entrées neutres » (CDC du
 * 14/09) est LEVÉE. Le site (hub) porte les six entrées de `Main.dc.html` ; les pages
 * publiques de l'espace Edu et du Club portent leur propre barre (`Edu-Accueil`,
 * `Club-Accueil`). L'espace est celui de l'HÔTE (`lib/espaces.ts`) : maxmorrys.me, edu., club.
 *
 * Aucune URL publique ne change : « Mon parcours » mène à `/a-propos`, « Services » à
 * `/conception`, « Contenus » au blog — les adresses référencées restent les mêmes.
 * L'entrée active est celle dont le préfixe est le PLUS LONG (Réalisations vit sous
 * `/conception`, et doit gagner sur Services).
 */
type PublicSpace = 'hub' | 'edu' | 'club';

const HUB_NAV: NavEntry[] = [
  { key: 'v3.home', path: '/', exact: true },
  { key: 'v3.journey', path: '/a-propos' },
  { key: 'v3.services', path: '/conception', owns: ['/conception', '/agence', '/presence-digitale'] },
  { key: 'v3.work', path: '/conception/realisations' },
  { key: 'v3.contents', path: '/blog', owns: ['/blog', '/podcast-et-videos', '/podcasts', '/videos', '/faq'] },
  { key: 'v3.contact', path: '/contact' },
];

const EDU_NAV: NavEntry[] = [
  { key: 'v3.eduCourses', path: '/formations' },
  { key: 'v3.eduMethod', path: '/apprendre/methode' },
  { key: 'v3.eduAssistant', path: '/apprendre/assistant' },
  { key: 'v3.eduVerify', path: '/verifier' },
];

const CLUB_NAV: NavEntry[] = [
  { key: 'v3.clubHome', path: '/club-des-digitos', exact: true },
  { key: 'v3.clubSessions', path: '/club-des-digitos/sessions' },
  { key: 'v3.clubPricing', path: '/club-des-digitos/adhesion' },
  { key: 'v3.clubPerson', path: '/', exact: true },
];

const NAV_BY_SPACE: Record<PublicSpace, NavEntry[]> = { hub: HUB_NAV, edu: EDU_NAV, club: CLUB_NAV };

/** Sélecteur des éléments focusables, pour le piège de focus du tiroir. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Un utilitaire de la barre : 36 px de dessin, 44 px de cible par `.mm-touch-extend`. On
 * n'épaissit pas une barre de navigation pour satisfaire une règle, on étend ce qui se touche.
 *
 * AD-18 : au repos, `--ink-2`. L'encre tertiaire ne porte jamais de texte — 2,61:1 sur blanc
 * pur, et aucun voile ne la sauve.
 */
const UTIL =
  'mm-touch-extend inline-flex items-center justify-center h-9 rounded-pill text-ink-2 ' +
  'hover:text-ink hover:bg-[color:var(--fill-1)] transition-colors duration-ui';
const UTIL_ICON = cn(UTIL, 'w-9');

/** Une ligne du menu de compte. */
const MENU_ROW =
  'flex items-center gap-2.5 w-full px-4 py-2.5 text-meta text-ink-2 ' +
  'hover:text-ink hover:bg-[color:var(--fill-1)] transition-colors duration-ui';

interface HeaderProps {
  onSearchOpen: () => void;
}

export default function Header({ onSearchOpen }: HeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, userData, signOut } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const { t } = useTranslation('nav');
  const { t: tc } = useTranslation('common');
  const location = useLocation();
  const localize = useLocalizedPath();
  const path = toLogicalPath(location.pathname);

  const profileRef = useRef<HTMLDivElement>(null);
  const profileBtnRef = useRef<HTMLButtonElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const announceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  /**
   * Publie l'état compact sur <html> : `--header-h` en dépend, et avec elle le bandeau de
   * langue et la sous-nav de la page À propos.
   */
  useEffect(() => {
    const root = document.documentElement;
    if (scrolled) root.setAttribute('data-header-compact', '');
    else root.removeAttribute('data-header-compact');
    return () => root.removeAttribute('data-header-compact');
  }, [scrolled]);

  /**
   * PUBLIE LA HAUTEUR DE LA BANNIÈRE D'ANNONCE SUR <html>.
   *
   * `AnnouncementBanner` vit DANS ce `<header>` fixe, et elle pousse la pilule vers le bas.
   * `--header-h` ne la comptait pas : la première ligne du corps passait dessous. Le défaut
   * se devinait à travers le verre ; depuis AD-26 le chrome est opaque et la coupe est nette.
   *
   * Mesurée, jamais estimée : la bannière fait une ou deux lignes selon la longueur du texte
   * et la largeur de l'écran, et elle apparaît APRÈS le premier rendu (ses annonces sont
   * chargées à la demande). Un `ResizeObserver` couvre les trois cas — apparition, repli sur
   * deux lignes, fermeture — là où une mesure unique au montage n'en couvrirait aucun.
   */
  useEffect(() => {
    const el = announceRef.current;
    const root = document.documentElement;
    if (!el) return;
    const publier = () => root.style.setProperty('--announce-h', `${el.offsetHeight}px`);
    publier();
    const ro = new ResizeObserver(publier);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty('--announce-h');
    };
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
    setProfileOpen(false);
  }, [location]);

  // Cmd+K / Ctrl+K ouvre la recherche — `toLowerCase` pour ne pas rater ⇧⌘K (cf. AppShell).
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
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Échap ferme le calque ouvert le plus intérieur et REND LE FOCUS à son déclencheur — sans
   * quoi le focus retombe sur <body> et la navigation clavier repart de zéro.
   */
  useEffect(() => {
    if (!profileOpen && !drawerOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (profileOpen) {
        setProfileOpen(false);
        profileBtnRef.current?.focus();
      } else if (drawerOpen) {
        setDrawerOpen(false);
        burgerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [profileOpen, drawerOpen]);

  /** Verrou du défilement de la page tant que le tiroir est ouvert. */
  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [drawerOpen]);

  /** Piège de focus du tiroir : la tabulation ne doit pas s'en échapper. */
  useEffect(() => {
    if (!drawerOpen) return;
    const panel = drawerRef.current;
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
  }, [drawerOpen]);

  /** Une entrée est active sur son chemin et sur tout ce que sa piste possède. */
  const space: PublicSpace = espaceCourant();
  const nav = NAV_BY_SPACE[space];
  const matchLen = (entry: NavEntry): number => {
    if (entry.exact) return path === entry.path ? entry.path.length + 1 : -1;
    const hits = (entry.owns ?? [entry.path]).filter((p) => path === p || path.startsWith(p + '/'));
    return hits.length ? Math.max(...hits.map((p) => p.length)) : -1;
  };
  const best = nav.reduce<{ e?: NavEntry; n: number }>((acc, e) => {
    const n = matchLen(e);
    return n > acc.n ? { e, n } : acc;
  }, { n: -1 });
  const activeLabel = best.e ? t(best.e.key) : undefined;

  const navItems: TopBarItem[] = nav.map((entry) => ({ label: t(entry.key), href: localize(entry.path) }));
  const drawerItems: SideNavItem[] = nav.map((entry) => ({ label: t(entry.key), href: localize(entry.path) }));

  /* L'action de l'espace, et sa forme courte sous 1080 px. */
  const cta = space === 'edu'
    ? { label: t('v3.eduStart'), short: t('v3.eduStart'), href: localize('/formations') }
    : space === 'club'
      ? { label: t('v3.clubJoin'), short: t('v3.clubJoinShort'), href: localize('/club-des-digitos/adhesion') }
      : { label: t('v3.bookCall'), short: t('v3.bookCallShort'), href: localize('/contact?rdv=1') };

  const userInitials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'U';

  const languageToggleLabel = language === 'fr' ? tc('switchToEnglish') : tc('switchToFrench');
  const themeToggleLabel = t('toggleTheme');

  /* ── Utilitaires de la barre, repris à l'identique dans le tiroir ────────────── */

  const searchButton = (
    <button type="button" onClick={onSearchOpen} className={UTIL_ICON} aria-label={t('search')}>
      <Icon name="search" size={18} strokeWidth={2.2} />
    </button>
  );

  /* FR · EN des maquettes : la langue courante en gras, le tout est la commande. */
  const languageButton = (
    <button
      type="button"
      onClick={toggleLanguage}
      className="mm-lang mm-touch-extend"
      aria-label={languageToggleLabel}
      title={languageToggleLabel}
    >
      {language === 'fr' ? <><b>FR</b> · EN</> : <>FR · <b>EN</b></>}
    </button>
  );

  const themeButton = (className: string) => (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(UTIL_ICON, className)}
      aria-label={themeToggleLabel}
      aria-pressed={theme === 'dark'}
      title={themeToggleLabel}
    >
      {theme === 'dark'
        ? <Icon name="sun" size={18} strokeWidth={2.2} />
        : <Icon name="moon" size={18} strokeWidth={2.2} />}
    </button>
  );

  const accountControl = user ? (
    <div className="relative" ref={profileRef}>
      <button
        ref={profileBtnRef}
        onClick={() => setProfileOpen(!profileOpen)}
        aria-expanded={profileOpen}
        aria-haspopup="menu"
        aria-controls="nav-account-menu"
        aria-label={t('accountMenu', { name: user.displayName || user.email })}
        className="mm-touch-extend flex items-center gap-2 h-9 pl-1 pr-2 rounded-pill hover:bg-[color:var(--fill-1)] transition-colors duration-ui"
      >
        <span className="w-7 h-7 rounded-pill bg-[image:var(--action-forme)] text-[color:var(--paper-fixed)] flex items-center justify-center text-small font-bold">
          {userInitials}
        </span>
        <span className="hidden wide:block text-meta-2 font-semibold text-ink-2 max-w-[64px] truncate">
          {user.displayName?.split(' ')[0] || t('myAccount')}
        </span>
        <Icon name="chevron" className={cn('w-3 h-3 text-ink-2 transition-transform duration-ui', profileOpen && 'rotate-180')}
          strokeWidth={2.4} />
      </button>

      {profileOpen && (
        <div
          id="nav-account-menu"
          role="menu"
          /* OPAQUE (AD-26). Le raisonnement d'avant s'arrêtait au flou : « rien ne passe
             dessous, donc pas de flou ». Mais le panneau, lui, passe sur QUELQUE CHOSE — la
             page — et à 78 % de blanc (7 % en nuit) elle se lisait au travers. */
          className="mm-menu absolute right-0 top-full mt-2.5 w-60 py-1.5 mm-drop"
        >
          <div className="px-4 py-3 border-b border-[color:var(--border-hair)]">
            <p className="text-meta font-bold text-ink">{user.displayName || t('learner')}</p>
            <p className="text-small text-ink-2 mt-0.5 truncate">{user.email}</p>
          </div>
          <div className="py-1">
            <LocalizedLink to="/compte" role="menuitem" className={MENU_ROW}>
              <Icon name="user" size={16} strokeWidth={2.2} />
              {t('v3.account')}
            </LocalizedLink>
            <LocalizedLink to={accueilConnecte(space)} role="menuitem" className={MENU_ROW}>
              <Icon name="graduation" size={16} strokeWidth={2.2} />
              {t('studentSpace')}
            </LocalizedLink>
            {userData?.role === 'admin' && (
              <LocalizedLink to="/admin" role="menuitem" className={MENU_ROW}>
                <Icon name="dashboard" size={16} strokeWidth={2.2} />
                {t('admin')}
              </LocalizedLink>
            )}
          </div>
          <div className="pt-1 border-t border-[color:var(--border-hair)]">
            <button
              onClick={() => { signOut(); setProfileOpen(false); }}
              role="menuitem"
              className={cn(MENU_ROW, 'text-stop hover:text-stop')}
            >
              <Icon name="logout" size={16} strokeWidth={2.2} />
              {t('signOut')}
            </button>
          </div>
        </div>
      )}
    </div>
  ) : null;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40">
        {/*
          La bannière d'annonce vit DANS le header fixe. Auparavant elle était dans le flux en
          `z-50` alors que le header est `fixed z-40` : les deux occupaient la même bande et la
          bannière peignait par-dessus le logo.
        */}
        {/* Enveloppe MESURÉE, pas décorative : `AnnouncementBanner` rend `null` quand il n'y a
            rien à dire, et un conteneur vide fait alors 0 px — ce qui est exactement la valeur
            que `--announce-h` doit prendre dans ce cas. */}
        <div ref={announceRef}>
          <AnnouncementBanner />
        </div>

        {/*
          ── LA PILULE SUIT LA MESURE DU SITE ──────────────────────────────────────────
          Sa gouttière de 22 px est un CHOIX du kit, expliqué dans `index.css` : la barre
          est délibérément 18 px plus large que la colonne de texte de chaque côté, et c'est
          ce débord qui la fait lire comme du chrome flottant AU-DESSUS de la page plutôt
          que comme l'en-tête d'une colonne.

          Or un débord ne se mesure que contre quelque chose. Sans plafond, la pilule
          suivait la fenêtre : à 2560 px elle faisait plus du double de la colonne qu'elle
          est censée dépasser de 18 px, et la relation que le kit dessine — celle qui porte
          tout l'effet — n'existait plus qu'à 1280 px exactement.

          Le plafond est le même jeton que celui du corps et du pied. À 1280 la pilule
          retombe donc sur 1236 px, soit très exactement la colonne plus ses deux débords.

          ⚠️ IL NE COIFFE QUE LA PILULE, pas la bannière d'annonce au-dessus : une bannière
          qui ne touche pas les deux bords se lit comme une carte oubliée en haut de page.
        */}
        <div
          style={{
            maxWidth: 'calc(var(--site-measure, 1200px) + 2 * var(--site-gutter, 40px))',
            marginInline: 'auto',
          }}
        >
        <DsNavHost>
          <TopBar
            /* La marque : un `<a href>` nu (AD-6, `DsNavHost` confie le clic au routeur),
               `aria-label` parce que le nom ne dit pas la destination. Sur le Club, le
               verrouillage reste celui de la personne : « Club des Digitos » est écrit à côté. */
            brand={
              <a
                href={localize(accueilPublic(space))}
                aria-label={t('home')}
                aria-current={path === accueilPublic(space) ? 'page' : undefined}
                className="mm-topbar__logo mm-touch-extend no-underline"
              >
                <Wordmark brand="kit" size={19} badge={space === 'edu' ? 'EDU' : space === 'club' ? 'CLUB' : undefined} />
                {space === 'club' && <span className="sr-only">{t('v3.clubBrand')}</span>}
              </a>
            }
            items={navItems}
            active={activeLabel}
            label={t('menu')}
            /* Le lien de saut est le PREMIER élément focalisable de la barre. */
            skipHref="#main-content"
            skipLabel={t('skipToContent')}
            trailing={
              <>
                <span className="mm-only-wide inline-flex items-center gap-1">
                  {languageButton}
                  {searchButton}
                  {themeButton('')}
                </span>
                {user ? (
                  accountControl
                ) : (
                  <>
                    {space !== 'hub' && (
                      <LocalizedLink
                        to="/connexion"
                        className="mm-only-wide mm-touch-extend inline-flex items-center h-9 px-4 rounded-pill text-meta font-semibold text-ink border border-[color:var(--line)] hover:bg-[color:var(--fill-1)] transition-colors duration-ui no-underline"
                      >
                        {space === 'club' ? t('v3.clubSignIn') : t('signIn')}
                      </LocalizedLink>
                    )}
                    <Button tone="primary" size="sm" arrow href={cta.href} className="mm-only-wide">
                      {cta.label}
                    </Button>
                    {/* Sous 420 px, sur Edu et le Club, l'étiquette d'espace + l'action courte +
                        le menu dépassaient la pilule (audit 29/10, #12) : l'action passe alors
                        dans le tiroir, qui la reprend en tête de son pied. */}
                    <Button tone="transforme" size="sm" href={cta.href} className={cn('mm-only-narrow', space !== 'hub' && 'mm-cta-narrow-optional')}>
                      {cta.short}
                    </Button>
                  </>
                )}
                <button
                  ref={burgerRef}
                  onClick={() => setDrawerOpen(!drawerOpen)}
                  aria-expanded={drawerOpen}
                  aria-controls="site-drawer"
                  aria-label={t('menu')}
                  className={cn(UTIL_ICON, 'mm-only-narrow w-11 h-11 border border-[color:var(--line)]')}
                >
                  {drawerOpen
                    ? <Icon name="close" size={20} strokeWidth={2.2} />
                    : <Icon name="menu" size={20} strokeWidth={2.2} />}
                </button>
              </>
            }
          />
        </DsNavHost>
        </div>

        {/*
          LE TIROIR — 250 px opaques entre 700 et 1080 px, pleine largeur en dessous.
          C'est la primitive `SideNav` : mêmes pastilles de territoire, même `aria-current`,
          une vraie `<ul>` de vrais `<a href>`. Il se cale sous la hauteur RÉELLE du chrome,
          bannière d'annonce et sous-navigation comprises, sans aucun nombre magique.

          OPAQUE ET PLEINE HAUTEUR (AD-26, audit du 29/10/2026 #6) : `h-` et non `max-h-`,
          pour que `.mm-drawer { min-height: 100% }` ait une hauteur à remplir — sinon la
          colonne s'arrêtait sous le dernier lien et le pied de page se lisait au-dessous,
          sous le seul voile à 38 %. Entrée `mm-drop-solid` : un menu glisse, il ne se
          dévoile pas en fondu (le fondu le rendait translucide pendant 380 ms).
        */}
        {drawerOpen && (
          <div
            id="site-drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('menu')}
            /* `right-0` sous 700 px pour que la colonne puisse faire 100 % de large ;
               `right-auto` au-delà, pour qu'elle se ferme sur ses 250 px. */
            className="absolute top-full left-0 right-0 stack:right-auto wide:hidden h-[calc(100dvh-var(--header-h))] overflow-y-auto mm-drop-solid"
          >
            <DsNavHost>
              <SideNav
                className="mm-drawer"
                items={drawerItems}
                active={activeLabel}
                label={t('menu')}
                footer={
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      {languageButton}
                      {searchButton}
                      <span className="ml-auto">{themeButton('')}</span>
                    </div>
                    {!user && (
                      <>
                        <Button tone="primary" href={cta.href}>
                          {cta.label}
                        </Button>
                        <Button tone="ghost" href={localize('/connexion')}>
                          {t('signIn')}
                        </Button>
                      </>
                    )}
                  </div>
                }
              />
            </DsNavHost>
          </div>
        )}
      </header>

      {/* Fond semi-opaque — frère du header, pour rester sous lui dans l'empilement.
          AUCUN FLOU : le budget est déjà tenu par la barre haute, et un voile d'encre
          suffit à reculer la page. */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 wide:hidden bg-[color-mix(in_srgb,var(--ink-fixed)_38%,transparent)]"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
