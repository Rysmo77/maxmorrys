import type { IconName } from '@ds';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LES ÉCRANS DE LA CONSOLE — LA TABLE, ET RIEN QUE LA TABLE.
 *
 * Elle vivait dans `AdminLayout.tsx`, où elle servait à construire le menu. Deux
 * autres surfaces ont besoin de la MÊME liste, et pour la même raison — dire ce qu'un
 * rôle atteint :
 *
 *   · `AdminLayout` — le menu, groupé en cinq familles avec ses compteurs ;
 *   · `AdminSettings` — le panneau « Rôles et portée » que
 *     `handoff_tableaux_de_bord` § ParametresDesktop met en troisième colonne.
 *
 * `lib/adminAccess.ts` porte déjà la moitié support de cette question, et il écrit
 * pourquoi : « la liste est affichée à deux endroits […] deux déclarations, c'est deux
 * occasions de mentir à la personne sur ce qu'elle a le droit de faire ». Le compte
 * total des écrans avait exactement le même problème — la maquette l'écrit « 19 » et
 * ce nombre n'est vrai que le jour où on l'écrit.
 *
 * ⚠️ CE FICHIER NE DÉCIDE DE RIEN. Il déclare ce qui EXISTE ; qui y a droit reste dans
 * `adminAccess.ts`, qui reste la source unique du périmètre `support`. Un écran ajouté
 * ici sans y être ajouté là-bas est admin-only, et c'est le bon défaut.
 *
 * ⛔ UNE TROISIÈME SURFACE LE COMPTE : la console du support de l'application native
 * (`mobile/contenu/termes.ts`, `ECRANS_CONSOLE`) affiche « 5 écrans sur N ». Le kit natif
 * y écrivait « sur 19 » et « les quatorze autres » — deux nombres que cette table a déjà
 * démentis. ⭐ Le miroir est GARDÉ par `tests/unit/mobile-miroirs.test.ts`, qui le compare à
 * `ADMIN_SCREEN_COUNT`.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
export interface AdminNavItem {
  to: string;
  /** Clé i18n de l'entrée de menu. */
  labelKey: string;
  /** Clé i18n du titre de page, rendu par la barre haute. */
  titleKey: string;
  icon: IconName;
  end?: boolean;
  tone?: 'default' | 'club';
  /**
   * L'espace que l'écran administre, pour le filtre d'espace de la console (kit v3,
   * `mm-cspaces`). Absent = transversal (pilotage, comptes, argent, système).
   */
  space?: AdminSpace;
}

/** Les espaces du filtre de console, dans l'ordre du kit. `all` n'est pas un espace. */
export const ADMIN_SPACES = ['hub', 'edu', 'club', 'conception', 'rysmo'] as const;
export type AdminSpace = typeof ADMIN_SPACES[number];

/** L'espace d'un chemin de console, lu dans la table — jamais redéclaré ailleurs. */
export function adminSpaceOf(path: string): AdminSpace | undefined {
  return ADMIN_NAV.find((i) => i.to === path)?.space;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { to: '/admin',                  labelKey: 'nav.dashboard',      titleKey: 'nav.dashboardTitle', icon: 'dashboard', end: true },
  { to: '/admin/articles',         labelKey: 'nav.articles',       titleKey: 'nav.articles',       icon: 'doc', space: 'hub' },
  { to: '/admin/formations',       labelKey: 'nav.formations',     titleKey: 'nav.formations',     icon: 'graduation', space: 'edu' },
  { to: '/admin/podcasts',         labelKey: 'nav.podcasts',       titleKey: 'nav.podcasts',       icon: 'mic', space: 'hub' },
  { to: '/admin/videos',           labelKey: 'nav.videos',         titleKey: 'nav.videos',         icon: 'video', space: 'hub' },
  { to: '/admin/utilisateurs',     labelKey: 'nav.users',          titleKey: 'nav.users',          icon: 'users' },
  { to: '/admin/transactions',     labelKey: 'nav.transactions',   titleKey: 'nav.transactions',   icon: 'card' },
  { to: '/admin/revenu',           labelKey: 'nav.revenue',        titleKey: 'nav.revenue',        icon: 'layers' },
  { to: '/admin/messages',         labelKey: 'nav.messages',       titleKey: 'nav.messages',       icon: 'comment', space: 'hub' },
  { to: '/admin/coupons',          labelKey: 'nav.coupons',        titleKey: 'nav.coupons',        icon: 'tag' },
  { to: '/admin/annonces',         labelKey: 'nav.announcements',  titleKey: 'nav.announcements',  icon: 'megaphone', space: 'hub' },
  { to: '/admin/notifications',    labelKey: 'nav.notifications',  titleKey: 'nav.notifications',  icon: 'bell' },
  { to: '/admin/faq',              labelKey: 'nav.faq',            titleKey: 'nav.faq',            icon: 'help', space: 'hub' },
  { to: '/admin/temoignages',      labelKey: 'nav.testimonials',   titleKey: 'nav.testimonials',   icon: 'star', space: 'edu' },
  { to: '/admin/rendez-vous',      labelKey: 'nav.appointments',   titleKey: 'nav.appointments',   icon: 'calendar', space: 'hub' },
  { to: '/admin/club-digitos',     labelKey: 'nav.club',           titleKey: 'nav.club',           icon: 'crown', tone: 'club', space: 'club' },
  { to: '/admin/prospects-agence', labelKey: 'nav.agencyLeads',    titleKey: 'nav.agencyLeads',    icon: 'case', space: 'conception' },
  { to: '/admin/projets',          labelKey: 'nav.missions',       titleKey: 'nav.missions',       icon: 'boxes', space: 'conception' },
  { to: '/admin/analytics',        labelKey: 'nav.analytics',      titleKey: 'nav.analytics',      icon: 'bars' },
  { to: '/admin/redirections',     labelKey: 'nav.redirects',      titleKey: 'nav.redirects',      icon: 'route' },
  { to: '/admin/parametres',       labelKey: 'nav.settings',       titleKey: 'nav.settings',       icon: 'settings' },
  /* Passe 2 — les écrans des maquettes sans code ni données à ce jour : route et squelette
     honnête (état vide), remplis par le lot D. Journal d'audit = FR-063 (préalable de la
     console mobile, FR-288) ; Rôles = miroir FR-010/FR-289. */
  { to: '/admin/journal',          labelKey: 'nav.audit',          titleKey: 'nav.audit',          icon: 'shield' },
  { to: '/admin/roles',            labelKey: 'nav.roles',          titleKey: 'nav.roles',          icon: 'lock' },
  { to: '/admin/moderation',       labelKey: 'nav.moderation',     titleKey: 'nav.moderation',     icon: 'flag', tone: 'club', space: 'club' },
  { to: '/admin/quotas',           labelKey: 'nav.quotas',         titleKey: 'nav.quotas',         icon: 'sparkles', space: 'rysmo' },
  { to: '/admin/infrastructure',   labelKey: 'nav.infra',          titleKey: 'nav.infra',          icon: 'monitor' },
];

/** Combien d'écrans la console porte. Compté, jamais écrit à la main. */
export const ADMIN_SCREEN_COUNT = ADMIN_NAV.length;

/**
 * Les cinq familles du menu, dans leur ordre d'affichage.
 *
 * Elles vivaient inline dans `AdminLayout`, chacune re-filtrant la liste complète par un
 * `includes` — donc cinq tableaux de chemins écrits une seconde fois, sans qu'aucune porte
 * ne signale un écran oublié par les cinq. Ici, un écran absent de toutes les familles
 * devient visible : `ADMIN_UNGROUPED` le nomme.
 */
export const ADMIN_SECTIONS: { titleKey: string; paths: string[] }[] = [
  /*
    LES CINQ FAMILLES DU KIT V3 — Pilotage · Personnes · Argent · Espaces · Système
    (`03-console-superadmin`). Elles remplacent Pilotage · Contenu · Communauté · Commerce.

    ⚠️ `/admin/notifications` y avait été oublié une fois (trouvé par
    `tests/unit/console-nav.test.ts`) : aucune famille ne le réclamait, l'entrée n'était
    rendue nulle part. `ADMIN_UNGROUPED` et le test tiennent toujours cette porte.

    « Espaces » suit l'ordre du filtre : Edu, Club, Conception, puis les contenus du Hub.
    « Journal d'audit » et « Rôles et accès » de la maquette n'y sont PAS : ces fonctions
    n'ont ni code ni données (rôles écrits par le serveur, journal disparu — FR-267).
  */
  {
    titleKey: 'nav.sectionPilotage',
    paths: ['/admin', '/admin/journal', '/admin/analytics'],
  },
  {
    titleKey: 'nav.sectionPeople',
    paths: ['/admin/utilisateurs', '/admin/roles', '/admin/rendez-vous'],
  },
  {
    titleKey: 'nav.sectionMoney',
    paths: ['/admin/transactions', '/admin/revenu', '/admin/coupons'],
  },
  {
    titleKey: 'nav.sectionSpaces',
    paths: [
      '/admin/formations', '/admin/temoignages',
      '/admin/club-digitos', '/admin/moderation',
      '/admin/prospects-agence', '/admin/projets',
      '/admin/articles', '/admin/podcasts', '/admin/videos', '/admin/faq', '/admin/annonces',
      '/admin/quotas',
    ],
  },
  {
    titleKey: 'nav.sectionSystem',
    paths: ['/admin/messages', '/admin/infrastructure', '/admin/notifications', '/admin/redirections', '/admin/parametres'],
  },
];

/** Les écrans qu'aucune famille ne réclame. Vide aujourd'hui, et une porte de test le tient. */
export const ADMIN_UNGROUPED = ADMIN_NAV
  .map((i) => i.to)
  .filter((to) => !ADMIN_SECTIONS.some((s) => s.paths.includes(to)));

/**
 * La barre d'onglets mobile de la console (kit v3, `mm-cm__tabs`).
 *
 * L'ordre est celui de la maquette (`Console-*-mobile.dc.html`) : Bloque · Modération · Edu ·
 * Journal · Plus. « Bloque » est la file de ce qui attend (la vue d'ensemble) ; « Plus »
 * n'est pas une adresse, il ouvre le tiroir qui porte TOUS les autres écrans — d'où
 * `more: true` et l'absence de `to`.
 * Chaque autre entrée DOIT exister dans `ADMIN_NAV`, et l'accès reste filtré par `adminAccess`.
 */
export interface AdminBottomNavItem extends Pick<AdminNavItem, 'labelKey' | 'icon' | 'end'> {
  to?: string;
  more?: boolean;
}

export const ADMIN_BOTTOM_NAV: AdminBottomNavItem[] = [
  { to: '/admin',            labelKey: 'nav.bottomQueue',      icon: 'dashboard', end: true },
  { to: '/admin/moderation', labelKey: 'nav.bottomModeration', icon: 'flag' },
  { to: '/admin/formations', labelKey: 'nav.bottomEdu',        icon: 'graduation' },
  { to: '/admin/journal',    labelKey: 'nav.bottomAudit',      icon: 'shield' },
  { more: true,              labelKey: 'nav.bottomMore',       icon: 'menu' },
];
