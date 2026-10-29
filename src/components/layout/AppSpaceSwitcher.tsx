import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useLocalizedPath } from '../../contexts/LanguageContext';
import { SpaceSwitcher, type SpaceId, type SpaceSwitcherItem } from '@ds';
import DsNavHost from './DsNavHost';

/**
 * LE SÉLECTEUR D'ESPACES, BRANCHÉ — kit v3 (AD-27).
 *
 * Trois hôtes (PRD rév. 6) : maxmorrys.me, edu. et club. Les routes ci-dessous sont des
 * chemins LOGIQUES ; `useLocalizedPath` les place sur leur hôte (`lib/espaces.ts`) et le
 * clic transmet la session (`lib/sessionHandoff.ts`). La console n'apparaît que pour qui y a
 * accès (`admin` ou `support`) — le contrôle client REFLÈTE les règles, il ne les applique pas.
 */
export const SPACE_ROUTES: Record<SpaceId, string> = {
  hub: '/',
  edu: '/mon-espace',
  club: '/mon-espace/club',
  admin: '/admin',
};

export default function AppSpaceSwitcher({ current, className }: { current: SpaceId; className?: string }) {
  const { t } = useTranslation('lms');
  const { userData } = useAuth();
  const localize = useLocalizedPath();
  const staff = userData?.role === 'admin' || userData?.role === 'support';
  const ids: SpaceId[] = staff ? ['hub', 'edu', 'club', 'admin'] : ['hub', 'edu', 'club'];
  const items: SpaceSwitcherItem[] = ids.map((id) => ({
    id,
    label: t(`shell.spaces.${id}`),
    href: localize(SPACE_ROUTES[id]),
  }));
  return (
    <DsNavHost className={className}>
      <SpaceSwitcher items={items} current={current} label={t('shell.spaces.label')} />
    </DsNavHost>
  );
}
