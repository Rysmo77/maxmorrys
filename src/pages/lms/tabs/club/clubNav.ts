import type { IconName } from '@ds';
import { CLUB_TAB_BY_SEGMENT, CLUB_TAB_SEGMENTS, type ClubTabSegment } from '../../../../lib/club/tabs';
import { toCanonicalPath } from '../../../../i18n/routing';
import type { ClubSubTab } from '../../hooks/useClubData';

/**
 * L'ONGLET DU CLUB EST DANS L'ADRESSE — kit v3, FR-031.
 *
 * Avant la refonte, l'onglet vivait dans un `useState` : un lien partagé vers « les
 * opportunités » ouvrait le fil, le bouton Retour sortait du Club, et un rechargement perdait
 * l'endroit. Les huit routes sont posées par les Fondations (`lib/club/tabs.ts`) ; ce module
 * en est la LECTURE, et rien d'autre : aucune seconde table de segments n'est écrite ici.
 *
 * `/mon-espace/club` sans segment reste le fil — c'est l'adresse que le reste du site cite.
 */

const BASE = '/mon-espace/club';

/** Les deux anciens sous-onglets fusionnés dans l'agenda n'ont pas d'adresse propre. */
const ALIAS: Partial<Record<ClubSubTab, ClubSubTab>> = { events: 'agenda', sessions: 'agenda' };

/** L'onglet que l'adresse désigne ; le fil par défaut, y compris sur un segment inconnu. */
export function clubTabFromPath(pathname: string): ClubSubTab {
  const segment = toCanonicalPath(pathname).split('/').filter(Boolean)[2];
  if (segment && (CLUB_TAB_SEGMENTS as readonly string[]).includes(segment)) {
    return CLUB_TAB_BY_SEGMENT[segment as ClubTabSegment] as ClubSubTab;
  }
  return 'feed';
}

/** Le chemin canonique (FR, sans préfixe de langue) d'un onglet — à passer par `useLocalizedPath`. */
export function clubTabPath(tab: ClubSubTab): string {
  const id = ALIAS[tab] ?? tab;
  const segment = CLUB_TAB_SEGMENTS.find((s) => CLUB_TAB_BY_SEGMENT[s] === id);
  return segment ? `${BASE}/${segment}` : BASE;
}

/** Les huit onglets, dans l'ordre des routes, avec leur glyphe du jeu unique. */
export const CLUB_NAV: { id: ClubSubTab; icon: IconName }[] = [
  { id: 'feed', icon: 'list' },
  { id: 'discussions', icon: 'chat' },
  { id: 'agenda', icon: 'calendar' },
  { id: 'members', icon: 'users' },
  { id: 'leaderboard', icon: 'trophy' },
  { id: 'opportunities', icon: 'case' },
  { id: 'infos', icon: 'bell' },
  { id: 'referral', icon: 'gift' },
];
