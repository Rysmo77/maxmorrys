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
}

export const ADMIN_NAV: AdminNavItem[] = [
  { to: '/admin',                  labelKey: 'nav.dashboard',      titleKey: 'nav.dashboardTitle', icon: 'dashboard', end: true },
  { to: '/admin/articles',         labelKey: 'nav.articles',       titleKey: 'nav.articles',       icon: 'doc' },
  { to: '/admin/formations',       labelKey: 'nav.formations',     titleKey: 'nav.formations',     icon: 'graduation' },
  { to: '/admin/podcasts',         labelKey: 'nav.podcasts',       titleKey: 'nav.podcasts',       icon: 'mic' },
  { to: '/admin/videos',           labelKey: 'nav.videos',         titleKey: 'nav.videos',         icon: 'video' },
  { to: '/admin/utilisateurs',     labelKey: 'nav.users',          titleKey: 'nav.users',          icon: 'users' },
  { to: '/admin/transactions',     labelKey: 'nav.transactions',   titleKey: 'nav.transactions',   icon: 'card' },
  { to: '/admin/messages',         labelKey: 'nav.messages',       titleKey: 'nav.messages',       icon: 'comment' },
  { to: '/admin/coupons',          labelKey: 'nav.coupons',        titleKey: 'nav.coupons',        icon: 'tag' },
  { to: '/admin/annonces',         labelKey: 'nav.announcements',  titleKey: 'nav.announcements',  icon: 'megaphone' },
  { to: '/admin/notifications',    labelKey: 'nav.notifications',  titleKey: 'nav.notifications',  icon: 'bell' },
  { to: '/admin/faq',              labelKey: 'nav.faq',            titleKey: 'nav.faq',            icon: 'help' },
  { to: '/admin/temoignages',      labelKey: 'nav.testimonials',   titleKey: 'nav.testimonials',   icon: 'star' },
  { to: '/admin/rendez-vous',      labelKey: 'nav.appointments',   titleKey: 'nav.appointments',   icon: 'calendar' },
  { to: '/admin/club-digitos',     labelKey: 'nav.club',           titleKey: 'nav.club',           icon: 'crown', tone: 'club' },
  { to: '/admin/prospects-agence', labelKey: 'nav.agencyLeads',    titleKey: 'nav.agencyLeads',    icon: 'case' },
  { to: '/admin/projets',          labelKey: 'nav.missions',       titleKey: 'nav.missions',       icon: 'boxes' },
  { to: '/admin/analytics',        labelKey: 'nav.analytics',      titleKey: 'nav.analytics',      icon: 'bars' },
  { to: '/admin/redirections',     labelKey: 'nav.redirects',      titleKey: 'nav.redirects',      icon: 'route' },
  { to: '/admin/parametres',       labelKey: 'nav.settings',       titleKey: 'nav.settings',       icon: 'settings' },
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
  {
    /*
      ⚠️ `/admin/notifications` A ÉTÉ AJOUTÉ ICI, ET IL N'Y ÉTAIT PAS.

      Trouvé par `tests/unit/console-nav.test.ts` en écrivant la porte : l'écran était
      déclaré dans la table de navigation, sa route répondait, sa page existait — et
      AUCUNE des cinq familles ne le réclamait. Le menu se construisant par filtrage
      famille par famille, l'entrée n'était rendue nulle part. Le seul chemin vers cet
      écran était de taper son URL.

      C'est le défaut le plus silencieux que cette table puisse produire : rien ne casse,
      rien n'avertit, l'écran disparaît simplement. `ADMIN_UNGROUPED` le rend visible et
      le test le tient — c'est pour ça que la constante existe.

      Il rejoint « Pilotage », avec les redirections et les paramètres :
      `handoff_tableaux_de_bord` le range dans sa famille « Réglages », et c'est la
      famille de ce dépôt qui en tient lieu.
    */
    titleKey: 'nav.sectionPilotage',
    paths: ['/admin', '/admin/analytics', '/admin/redirections', '/admin/notifications', '/admin/parametres'],
  },
  {
    titleKey: 'nav.sectionContent',
    paths: ['/admin/articles', '/admin/formations', '/admin/podcasts', '/admin/videos', '/admin/faq', '/admin/temoignages', '/admin/annonces'],
  },
  {
    titleKey: 'nav.sectionCommunity',
    paths: ['/admin/utilisateurs', '/admin/messages', '/admin/rendez-vous', '/admin/club-digitos'],
  },
  {
    titleKey: 'nav.sectionCommerce',
    paths: ['/admin/transactions', '/admin/coupons', '/admin/projets', '/admin/prospects-agence'],
  },
];

/** Les écrans qu'aucune famille ne réclame. Vide aujourd'hui, et une porte de test le tient. */
export const ADMIN_UNGROUPED = ADMIN_NAV
  .map((i) => i.to)
  .filter((to) => !ADMIN_SECTIONS.some((s) => s.paths.includes(to)));
