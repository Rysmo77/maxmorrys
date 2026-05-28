import {
  LayoutDashboard, FileText, GraduationCap, Users, BarChart3, Settings,
  MessageSquare, Tag, Megaphone, HelpCircle,
  Mic, Video, CreditCard, Calendar, Star, Crown, Home,
} from 'lucide-react';
import AppShell from './AppShell';
import { useAuth } from '../../contexts/AuthContext';
import type { AppSidebarItem } from './AppSidebar';

interface AdminNavItem extends AppSidebarItem {
  adminOnly?: boolean;
}

const ALL_NAV_ITEMS: AdminNavItem[] = [
  { to: '/admin',                label: 'Tableau de bord', icon: LayoutDashboard, end: true, adminOnly: true },
  { to: '/admin/articles',       label: 'Articles',        icon: FileText,        adminOnly: true },
  { to: '/admin/formations',     label: 'Formations',      icon: GraduationCap,   adminOnly: true },
  { to: '/admin/podcasts',       label: 'Podcasts',        icon: Mic,             adminOnly: true },
  { to: '/admin/videos',         label: 'Vidéos',          icon: Video,           adminOnly: true },
  { to: '/admin/utilisateurs',   label: 'Utilisateurs',    icon: Users,           adminOnly: true },
  { to: '/admin/transactions',   label: 'Transactions',    icon: CreditCard,      adminOnly: true },
  { to: '/admin/messages',       label: 'Messages',        icon: MessageSquare,   adminOnly: false },
  { to: '/admin/coupons',        label: 'Coupons',         icon: Tag,             adminOnly: true },
  { to: '/admin/annonces',       label: 'Annonces',        icon: Megaphone,       adminOnly: true },
  { to: '/admin/faq',            label: 'FAQ',             icon: HelpCircle,      adminOnly: true },
  { to: '/admin/temoignages',    label: 'Témoignages',     icon: Star,            adminOnly: false },
  { to: '/admin/rendez-vous',    label: 'Rendez-vous',     icon: Calendar,        adminOnly: false },
  { to: '/admin/club-digitos',   label: 'Club des Digitos', icon: Crown,          adminOnly: true, tone: 'club' },
  { to: '/admin/analytics',      label: 'Analytics',       icon: BarChart3,       adminOnly: true },
  { to: '/admin/parametres',     label: 'Paramètres',      icon: Settings,        adminOnly: true },
];

const ADMIN_TITLES: Record<string, string> = {
  '/admin':              'Tableau de bord admin',
  '/admin/articles':     'Articles',
  '/admin/formations':   'Formations',
  '/admin/podcasts':     'Podcasts',
  '/admin/videos':       'Vidéos',
  '/admin/utilisateurs': 'Utilisateurs',
  '/admin/transactions': 'Transactions',
  '/admin/messages':     'Messages',
  '/admin/coupons':      'Coupons',
  '/admin/annonces':     'Annonces',
  '/admin/faq':          'FAQ',
  '/admin/temoignages':  'Témoignages',
  '/admin/rendez-vous':  'Rendez-vous',
  '/admin/club-digitos': 'Club des Digitos',
  '/admin/analytics':    'Analytics',
  '/admin/parametres':   'Paramètres',
};

export default function AdminLayout() {
  const { userData } = useAuth();
  const isAdmin = userData?.role === 'admin';
  const isSupport = userData?.role === 'support';
  const panelLabel = isSupport ? 'Support' : 'Admin';

  const items: AppSidebarItem[] = ALL_NAV_ITEMS
    .filter((item) => !item.adminOnly || isAdmin)
    .map(({ to, label, icon, end, tone, badge, locked }) => ({ to, label, icon, end, tone, badge, locked }));

  return (
    <AppShell
      brand={{ label: panelLabel, href: '/admin', mark: 'MM' }}
      titleMap={ADMIN_TITLES}
      sidebarSections={[
        { title: 'Pilotage',    items: items.filter((i) => ['/admin', '/admin/analytics', '/admin/parametres'].includes(i.to)) },
        { title: 'Contenu',     items: items.filter((i) => ['/admin/articles', '/admin/formations', '/admin/podcasts', '/admin/videos', '/admin/faq', '/admin/temoignages', '/admin/annonces'].includes(i.to)) },
        { title: 'Communauté',  items: items.filter((i) => ['/admin/utilisateurs', '/admin/messages', '/admin/rendez-vous', '/admin/club-digitos'].includes(i.to)) },
        { title: 'Commerce',    items: items.filter((i) => ['/admin/transactions', '/admin/coupons'].includes(i.to)) },
        { title: 'Site',        items: [{ to: '/', label: 'Retour au site', icon: Home, end: true }] },
      ].filter((section) => section.items.length > 0)}
    />
  );
}
