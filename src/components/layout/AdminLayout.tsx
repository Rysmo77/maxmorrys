import {
  LayoutDashboard, FileText, GraduationCap, Users, BarChart3, Settings,
  MessageSquare, Tag, Megaphone, HelpCircle,
  Mic, Video, CreditCard, Calendar, Star, Crown, Home, Briefcase,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AppShell from './AppShell';
import { useAuth } from '../../contexts/AuthContext';
import type { AppSidebarItem } from './AppSidebar';

interface AdminNavItem extends Omit<AppSidebarItem, 'label'> {
  labelKey: string;
  titleKey: string;
  adminOnly?: boolean;
}

const ALL_NAV_ITEMS: AdminNavItem[] = [
  { to: '/admin',                labelKey: 'nav.dashboard',     titleKey: 'nav.dashboardTitle', icon: LayoutDashboard, end: true, adminOnly: true },
  { to: '/admin/articles',       labelKey: 'nav.articles',     titleKey: 'nav.articles',     icon: FileText,        adminOnly: true },
  { to: '/admin/formations',     labelKey: 'nav.formations',   titleKey: 'nav.formations',   icon: GraduationCap,   adminOnly: true },
  { to: '/admin/podcasts',       labelKey: 'nav.podcasts',     titleKey: 'nav.podcasts',     icon: Mic,             adminOnly: true },
  { to: '/admin/videos',         labelKey: 'nav.videos',       titleKey: 'nav.videos',       icon: Video,           adminOnly: true },
  { to: '/admin/utilisateurs',   labelKey: 'nav.users',        titleKey: 'nav.users',        icon: Users,           adminOnly: true },
  { to: '/admin/transactions',   labelKey: 'nav.transactions', titleKey: 'nav.transactions', icon: CreditCard,      adminOnly: true },
  { to: '/admin/messages',       labelKey: 'nav.messages',     titleKey: 'nav.messages',     icon: MessageSquare,   adminOnly: false },
  { to: '/admin/coupons',        labelKey: 'nav.coupons',      titleKey: 'nav.coupons',      icon: Tag,             adminOnly: true },
  { to: '/admin/annonces',       labelKey: 'nav.announcements',titleKey: 'nav.announcements',icon: Megaphone,       adminOnly: true },
  { to: '/admin/faq',            labelKey: 'nav.faq',          titleKey: 'nav.faq',          icon: HelpCircle,      adminOnly: true },
  { to: '/admin/temoignages',    labelKey: 'nav.testimonials', titleKey: 'nav.testimonials', icon: Star,            adminOnly: false },
  { to: '/admin/rendez-vous',    labelKey: 'nav.appointments', titleKey: 'nav.appointments', icon: Calendar,        adminOnly: false },
  { to: '/admin/club-digitos',   labelKey: 'nav.club',         titleKey: 'nav.club',         icon: Crown,           adminOnly: true, tone: 'club' },
  { to: '/admin/prospects-agence', labelKey: 'nav.agencyLeads', titleKey: 'nav.agencyLeads', icon: Briefcase,       adminOnly: false },
  { to: '/admin/analytics',      labelKey: 'nav.analytics',    titleKey: 'nav.analytics',    icon: BarChart3,       adminOnly: true },
  { to: '/admin/parametres',     labelKey: 'nav.settings',     titleKey: 'nav.settings',     icon: Settings,        adminOnly: true },
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

  const items: AppSidebarItem[] = ALL_NAV_ITEMS
    .filter((item) => !item.adminOnly || isAdmin)
    .map(({ to, labelKey, icon, end, tone, badge, locked }) => ({ to, label: t(labelKey), icon, end, tone, badge, locked }));

  return (
    <AppShell
      brand={{ label: panelLabel, href: '/admin' }}
      titleMap={ADMIN_TITLES}
      sidebarSections={[
        { title: t('nav.sectionPilotage'), items: items.filter((i) => ['/admin', '/admin/analytics', '/admin/parametres'].includes(i.to)) },
        { title: t('nav.sectionContent'),  items: items.filter((i) => ['/admin/articles', '/admin/formations', '/admin/podcasts', '/admin/videos', '/admin/faq', '/admin/temoignages', '/admin/annonces'].includes(i.to)) },
        { title: t('nav.sectionCommunity'),items: items.filter((i) => ['/admin/utilisateurs', '/admin/messages', '/admin/rendez-vous', '/admin/club-digitos'].includes(i.to)) },
        { title: t('nav.sectionCommerce'), items: items.filter((i) => ['/admin/transactions', '/admin/coupons', '/admin/prospects-agence'].includes(i.to)) },
        { title: t('nav.sectionSite'),     items: [{ to: '/', label: t('nav.backToSite'), icon: Home, end: true }] },
      ].filter((section) => section.items.length > 0)}
    />
  );
}
