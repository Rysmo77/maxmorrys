import { useTranslation } from 'react-i18next';
import AppShell from './AppShell';
import { useAuth } from '../../contexts/AuthContext';
import type { AppSidebarItem } from './AppSidebar';
import { isSupportAllowedPath } from '../../lib/adminAccess';

interface AdminNavItem extends Omit<AppSidebarItem, 'label'> {
  labelKey: string;
  titleKey: string;
}

const ALL_NAV_ITEMS: AdminNavItem[] = [
  { to: '/admin',                labelKey: 'nav.dashboard',     titleKey: 'nav.dashboardTitle', icon: 'dashboard', end: true },
  { to: '/admin/articles',       labelKey: 'nav.articles',     titleKey: 'nav.articles',     icon: 'doc' },
  { to: '/admin/formations',     labelKey: 'nav.formations',   titleKey: 'nav.formations',   icon: 'graduation' },
  { to: '/admin/podcasts',       labelKey: 'nav.podcasts',     titleKey: 'nav.podcasts',     icon: 'mic' },
  { to: '/admin/videos',         labelKey: 'nav.videos',       titleKey: 'nav.videos',       icon: 'video' },
  { to: '/admin/utilisateurs',   labelKey: 'nav.users',        titleKey: 'nav.users',        icon: 'users' },
  { to: '/admin/transactions',   labelKey: 'nav.transactions', titleKey: 'nav.transactions', icon: 'card' },
  { to: '/admin/messages',       labelKey: 'nav.messages',     titleKey: 'nav.messages',     icon: 'comment' },
  { to: '/admin/coupons',        labelKey: 'nav.coupons',      titleKey: 'nav.coupons',      icon: 'tag' },
  { to: '/admin/annonces',       labelKey: 'nav.announcements',titleKey: 'nav.announcements',icon: 'megaphone' },
  { to: '/admin/faq',            labelKey: 'nav.faq',          titleKey: 'nav.faq',          icon: 'help' },
  { to: '/admin/temoignages',    labelKey: 'nav.testimonials', titleKey: 'nav.testimonials', icon: 'star' },
  { to: '/admin/rendez-vous',    labelKey: 'nav.appointments', titleKey: 'nav.appointments', icon: 'calendar' },
  { to: '/admin/club-digitos',   labelKey: 'nav.club',         titleKey: 'nav.club',         icon: 'crown', tone: 'club' },
  { to: '/admin/prospects-agence', labelKey: 'nav.agencyLeads', titleKey: 'nav.agencyLeads', icon: 'case' },
  { to: '/admin/projets',        labelKey: 'nav.missions',     titleKey: 'nav.missions',     icon: 'boxes' },
  { to: '/admin/analytics',      labelKey: 'nav.analytics',    titleKey: 'nav.analytics',    icon: 'bars' },
  { to: '/admin/redirections',   labelKey: 'nav.redirects',    titleKey: 'nav.redirects',    icon: 'route' },
  { to: '/admin/parametres',     labelKey: 'nav.settings',     titleKey: 'nav.settings',     icon: 'settings' },
];

export default function AdminLayout() {
  const { t } = useTranslation('admin');
  const { userData } = useAuth();
  const isAdmin = userData?.role === 'admin';
  const isSupport = userData?.role === 'support';
  const panelLabel = isSupport ? t('nav.panelSupport') : t('nav.panelAdmin');

  const ADMIN_TITLES: Record<string, string> = Object.fromEntries(
    ALL_NAV_ITEMS.map((item) => [item.to, t(item.titleKey)]),
  );

  // Le menu et le garde de route (`AdminRoute`) lisent la MÊME table — `lib/adminAccess`.
  // Il n'y a volontairement plus de drapeau `adminOnly` ici : c'était un second endroit où
  // déclarer le périmètre du rôle support, et un écran pouvait devenir visible sans être
  // atteignable. Une seule table, deux lecteurs.
  const items: AppSidebarItem[] = ALL_NAV_ITEMS
    .filter((item) => isAdmin || isSupportAllowedPath(item.to))
    .map(({ to, labelKey, icon, end, tone, badge, locked }) => ({ to, label: t(labelKey), icon, end, tone, badge, locked }));

  return (
    <AppShell
      brand={{ label: panelLabel, href: '/admin' }}
      /*
        LA CONSOLE PREND LE MAILLAGE NUIT, DANS LES DEUX MODES. `nuit` est un TERRITOIRE — le
        cinquième maillage du kit, sur #0A0D11 — et il dit ce que dit une console : tu n'es
        plus sur le site, tu es dans la salle des machines. Les dix-neuf écrans le prennent
        d'un coup.
      */
      territory="nuit"
      /*
        ── ET IL FAUT LA PORTÉE `.dk` AVEC, SANS QUOI LA CONSOLE EST ILLISIBLE ────────────
        La version précédente de ce commentaire soutenait le contraire : « ce n'est pas une
        prop de thème (AD-3) et ça n'en tiendrait pas lieu ; `.dk` reste la portée du mode
        sombre, posée sur <html> ». Le raisonnement confondait deux choses.

        AD-3 interdit de passer le THÈME EN PROP de composant. Il n'interdit pas la portée
        CSS — c'est même le mécanisme qu'il prescrit, et le dépôt l'emploie déjà deux fois en
        local : `Forbidden403` (« le seul écran sombre du produit ») et le pied de page.

        Le défaut que ça laissait est mesurable. `AppShell` ne peint aucun fond sur son
        `<main>` : le contenu de la console est posé DIRECTEMENT sur le maillage nuit. En
        mode clair, les jetons restaient clairs — `--ink` foncé sur #0A0D11. Encre foncée sur
        fond foncé, sur les dix-neuf écrans, pour qui n'avait pas choisi le mode sombre.

        `dk` ici fait basculer les 78 jetons concernés en même temps que le maillage, et rend
        cohérent le `territory="nuit"` déjà décidé au-dessus.
        ────────────────────────────────────────────────────────────────────────────────
      */
      contentClassName="dk p-4 stack:p-pane"
      /*
        « Max-Morrys » ne survit que comme PERSONNE (AD-12) : la page « Je suis Max-Morrys »,
        la signature d'article, les mentions légales, « Max-Morrys Agency ». La console est
        l'outil de cette personne — d'où la signature, et non « Rysmo », qui est le nom de
        l'application apprenante.
      */
      wordmark="signature"
      titleMap={ADMIN_TITLES}
      sidebarSections={[
        { title: t('nav.sectionPilotage'), items: items.filter((i) => ['/admin', '/admin/analytics', '/admin/redirections', '/admin/parametres'].includes(i.to)) },
        { title: t('nav.sectionContent'),  items: items.filter((i) => ['/admin/articles', '/admin/formations', '/admin/podcasts', '/admin/videos', '/admin/faq', '/admin/temoignages', '/admin/annonces'].includes(i.to)) },
        { title: t('nav.sectionCommunity'),items: items.filter((i) => ['/admin/utilisateurs', '/admin/messages', '/admin/rendez-vous', '/admin/club-digitos'].includes(i.to)) },
        { title: t('nav.sectionCommerce'), items: items.filter((i) => ['/admin/transactions', '/admin/coupons', '/admin/projets', '/admin/prospects-agence'].includes(i.to)) },
        { title: t('nav.sectionSite'),     items: [{ to: '/', label: t('nav.backToSite'), icon: 'home', end: true }] },
      ].filter((section) => section.items.length > 0)}
    />
  );
}
