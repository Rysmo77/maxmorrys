import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage, useLocalizedPath } from '../../contexts/LanguageContext';
import { toCanonicalPath } from '../../i18n/routing';
import LocalizedLink from '../shared/LocalizedLink';
import AnnouncementBanner from '../shared/AnnouncementBanner';
import DsNavHost from './DsNavHost';
import { Icon } from '@ds';
import {
  Button, SideNav, TopBar, Wordmark,
  type SideNavItem, type Territory, type TopBarItem,
} from '../../design-system';

/**
 * LA BARRE HAUTE DU SITE — pilule flottante, et la dernière surface du produit à avoir perdu
 * son verre (AD-26).
 *
 * Elle avait droit au flou pour une raison qui se vérifiait à l'œil : elle ne défile pas, et
 * le contenu passe RÉELLEMENT dessous. Cet argument justifiait le FLOU, jamais le VOILE — et
 * c'est le voile qui tenait la lisibilité une fois le flou retiré : `.dk .glass` vaut blanc à
 * NEUF pour cent. Le chrome, le tiroir, la sous-navigation et le menu de compte sont
 * désormais opaques ; seul le voile derrière le tiroir reste translucide, parce que reculer
 * la page est sa fonction.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI A CHANGÉ, ET POURQUOI
 *
 * 1. LES SIX LIBELLÉS SONT LES SIX VERBES, dans l'ordre du système : Je suis Max-Morrys ·
 *    Je te forme · Je t'informe · Je te transforme · Je te digitalise · Contacte-moi. Chacun
 *    porte le FILET DE SA COULEUR en permanence, pas seulement à l'état actif : c'est ce filet
 *    qui apprend la correspondance entre un verbe et un maillage.
 *
 * 2. L'AGENCE SORT DE LA LISTE. Elle vivait dans la barre comme une pastille teal pleine, au
 *    milieu des verbes. Elle est désormais DERRIÈRE UN SÉPARATEUR, en corail texte : « elle ne
 *    se range pas sous Je te digitalise — c'est une autre promesse et un autre client ». Le
 *    type `Territory` l'empêche d'en gagner un par accident, et le séparateur le dit à l'œil.
 *
 * 3. LE MENU DÉROULANT DE « JE TE TRANSFORME » DEVIENT UNE SOUS-NAVIGATION. Le système a une
 *    primitive pour ça, et une raison commerciale de l'avoir : ce territoire abrite du contenu
 *    GRATUIT ET OUVERT (podcast, vidéos) et du contenu PAYANT ET FERMÉ (le Club). Un menu qui
 *    s'ouvre au survol ne dit pas cette séparation ; une sous-navigation en tête de page, si —
 *    et elle existe aux trois largeurs, là où un survol n'existe pas sur mobile.
 *
 * 4. LE HEADER TRANSPARENT AU-DESSUS D'UN HÉROS A DISPARU. Il existait parce qu'une barre
 *    blanche opaque créait une couture franche sur `/` et `/agence`. Une pilule de verre
 *    détachée des bords n'a pas ce problème : elle flotte sur ce qu'il y a dessous, quel qu'il
 *    soit. Avec lui partent `transparentAccent`, `FOCUS_RING_ON_HERO` et le second anneau de
 *    focus — le système n'en a qu'un, bleu, câblé sur `:focus-visible` dans les jetons.
 *
 * 5. LES TROIS POINTS DE RUPTURE. Sous 1080 px, les six verbes passent dans un TIROIR de
 *    250 px en faux verre (la primitive `SideNav`, ses pastilles de territoire comprises), et
 *    la barre garde son verre, son mot-symbole et ses utilitaires. Au-delà, la barre
 *    supérieure flottante porte les six libellés soulignés.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `data-header-compact` reste publié sur `<html>` : `--header-h` en dépend, et avec elle le
 * bandeau de langue et la sous-nav de la page À propos.
 */

/** Une entrée de la navigation du site. `territory` porte le filet de couleur. */
interface NavEntry {
  /** Clé i18n dans le namespace `nav`. */
  key: string;
  /** Chemin CANONIQUE FR — `useLocalizedPath` le préfixe selon la langue. */
  path: string;
  /**
   * Les quatre territoires, et seulement eux. « Je suis Max-Morrys » est une PERSONNE et
   * « Contacte-moi » une action : ni l'un ni l'autre n'est une ligne de revenu, donc ni l'un
   * ni l'autre ne porte de filet permanent.
   */
  territory?: Territory;
}

const SITE_NAV: NavEntry[] = [
  { key: 'about', path: '/a-propos' },
  { key: 'formations', path: '/formations', territory: 'forme' },
  { key: 'blog', path: '/blog', territory: 'informe' },
  { key: 'transform', path: '/podcast-et-videos', territory: 'transforme' },
  { key: 'presence', path: '/presence-digitale', territory: 'digitalise' },
  { key: 'contact', path: '/contact' },
];

/**
 * Les routes qui appartiennent au territoire « Je te transforme » — c'est ce qui allume
 * « Je te transforme » dans la barre haute, y compris sur une fiche d'épisode.
 *
 * ⚠️ LA SOUS-NAVIGATION DES DEUX ÉTAGES N'EST PLUS ICI, et ce n'est pas un oubli.
 * Le chrome en posait une rangée sur les fiches de détail. Elle y était fausse deux fois :
 * `px-[18px]` sur toute la fenêtre la faisait ouvrir à x=18 quand la colonne de la page
 * ouvre à x=120, et, n'ayant aucune surface derrière elle dans un en-tête `fixed`, elle
 * laissait le corps de l'article lui passer au travers au premier défilement.
 *
 * `SubNav` est une primitive de PAGE — « elle est en tête de page, elle défile avec elle »,
 * dit son propre en-tête. Les quatre routes du territoire la posent donc toutes au même
 * endroit, dans leur `PageSite` : `MediaPole`, `ClubDigitos`, `PodcastDetail`, `VideoDetail`.
 */
const TRANSFORME_PATHS = ['/podcast-et-videos', '/podcasts', '/videos', '/club-des-digitos'];

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
const UTIL_TEXT = cn(UTIL, 'px-2.5 text-meta font-bold tracking-wide');

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
  const path = toCanonicalPath(location.pathname);

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

  const isTransforme = TRANSFORME_PATHS.some((p) => path === p || path.startsWith(p + '/'));

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

  const isEntryActive = (entry: NavEntry) =>
    entry.key === 'transform'
      ? isTransforme
      : path === entry.path || path.startsWith(entry.path + '/');

  const activeEntry = SITE_NAV.find(isEntryActive);
  const activeLabel = activeEntry ? t(activeEntry.key) : undefined;

  const navItems: TopBarItem[] = SITE_NAV.map((entry) => ({
    label: t(entry.key),
    href: localize(entry.path),
    territory: entry.territory,
  }));

  /** Le tiroir reprend les six mêmes entrées, pastille de territoire comprise. */
  const drawerItems: SideNavItem[] = SITE_NAV.map((entry) => ({
    label: t(entry.key),
    href: localize(entry.path),
    territory: entry.territory,
  }));

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

  const languageButton = (
    <button
      type="button"
      onClick={toggleLanguage}
      className={UTIL_TEXT}
      aria-label={languageToggleLabel}
      title={languageToggleLabel}
    >
      {language === 'fr' ? 'EN' : 'FR'}
    </button>
  );

  /**
   * La bascule de thème sort de la barre sous 700 px, et se retrouve dans le tiroir.
   *
   * C'est une mesure, pas un goût : à 390 px, la pilule offre 322 px de contenu, et le
   * mot-symbole plus les cinq utilitaires en réclament 356. Le budget de la barre ne dépend
   * pas de la largeur de la fenêtre — la pilule est bornée par ses marges — donc quelque
   * chose doit sortir, et c'est le contrôle qu'on touche le moins souvent.
   */
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

  /**
   * L'ENTRÉE AGENCE — hors des quatre verbes, derrière un séparateur, en corail TEXTE.
   * `--mm-corail` fait 2,70:1 sur blanc : c'est `--mm-corail-t` qui s'écrit, jamais la teinte
   * pleine (AD-20). Elle bascule seule sous `.dk`.
   */
  const agencyLink = (
    <LocalizedLink
      to="/agence"
      aria-current={path === '/agence' ? 'page' : undefined}
      className="mm-touch-extend inline-flex items-center h-9 px-1 text-meta font-semibold text-corail-txt"
    >
      {t('agency')}
    </LocalizedLink>
  );

  const separator = (
    <span aria-hidden="true" className="w-px h-5 bg-[color:var(--border-hair)]" />
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
            <LocalizedLink to="/mon-espace" role="menuitem" className={MENU_ROW}>
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
  ) : (
    <LocalizedLink
      to="/connexion"
      className="mm-touch-extend hidden wide:inline-flex items-center gap-2 h-9 px-4 rounded-pill text-meta font-semibold text-ink-2 border border-[color:var(--line)] hover:text-ink hover:bg-[color:var(--fill-1)] transition-colors duration-ui"
    >
      <Icon name="login" size={16} strokeWidth={2.2} />
      {t('signIn')}
    </LocalizedLink>
  );

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
            className="mm-topbar"
            /* « Hello ! » — le mot-symbole des PAGES WEB, en type pur, pour 0 octet. Le PNG du
               logo pèse 273 Ko en 1254 × 1254 pour un rendu à 42 px ; il ne survit que sur
               pastille blanche.

               IL EST DÉSORMAIS UNE CIBLE (AD-23). Il portait son dégradé en permanence et
               n'était cliquable nulle part : la seule marque du site qui ne ramenait pas à
               l'accueil, alors que celle du pied de page le faisait déjà. Il a maintenant la
               couleur des autres commandes de la barre — `--ink-2` au repos — et rend l'arc
               des cinq teintes, qui se remplit de la gauche vers la droite, au survol.

               UN `<a href>` NU, PAS UN `LocalizedLink` : c'est ce que rendent les six verbes
               de la même barre (AD-6), et `DsNavHost` ci-dessus confie le clic au routeur.
               ⌘-clic, clic milieu et la barre d'état au survol gardent leur comportement.

               `aria-label` plutôt que le texte du lien : « Hello ! » est un nom de marque et
               ne dit pas la destination. */
            brand={
              <a
                href={localize('/')}
                aria-label={t('home')}
                aria-current={path === '/' ? 'page' : undefined}
                className="mm-touch-extend inline-flex items-center h-9 mr-2.5 rounded-pill"
              >
                <Wordmark brand="hello" size={22} />
              </a>
            }
            items={navItems}
            active={activeLabel}
            label={t('menu')}
            /* Le lien de saut est le PREMIER élément focalisable de la barre. Il ne coûte rien
               et il est le seul moyen, au clavier, de ne pas retraverser six entrées de
               navigation à chaque page. Son libellé se traduit : un « Aller au contenu » figé
               s'afficherait tel quel sur le site anglais. */
            skipHref="#main-content"
            skipLabel={t('skipToContent')}
            /* La pilule flotte : ses marges viennent de `.mm-topbar`, qui sait les resserrer
               à l'état compact. Le rembourrage, lui, tient dans le style en ligne. */
            style={{ padding: '10px 16px' }}
            trailing={
              <>
                {searchButton}
                {languageButton}
                {themeButton('hidden stack:inline-flex')}
                {/* Le séparateur, puis l'agence : la frontière est visible avant d'être lue. */}
                <span className="hidden wide:flex items-center gap-3">
                  {separator}
                  {agencyLink}
                </span>
                {accountControl}
                <button
                  ref={burgerRef}
                  onClick={() => setDrawerOpen(!drawerOpen)}
                  aria-expanded={drawerOpen}
                  aria-controls="site-drawer"
                  aria-label={t('menu')}
                  className={cn(UTIL_ICON, 'wide:hidden')}
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
          LE TIROIR — 250 px de faux verre entre 700 et 1080 px, pleine largeur en dessous.
          C'est la primitive `SideNav` : mêmes pastilles de territoire, même `aria-current`,
          une vraie `<ul>` de vrais `<a href>`. Il se cale sous la hauteur RÉELLE du chrome,
          bannière d'annonce et sous-navigation comprises, sans aucun nombre magique.
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
            className="absolute top-full left-0 right-0 stack:right-auto wide:hidden max-h-[calc(100dvh-var(--header-h))] overflow-y-auto mm-drop"
          >
            <DsNavHost>
              <SideNav
                className="mm-drawer"
                items={drawerItems}
                active={activeLabel}
                label={t('menu')}
                footer={
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      {agencyLink}
                      {/* Le thème quitte la barre sous 700 px : il doit rester atteignable
                          ici, sinon un visiteur sur petit écran n'a plus aucun moyen d'en
                          changer. */}
                      <span className="ml-auto stack:hidden">{themeButton('')}</span>
                    </div>
                    {!user && (
                      <Button tone="primary" href={localize('/connexion')}>
                        {t('signIn')}
                      </Button>
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
