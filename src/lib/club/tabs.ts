/**
 * LES HUIT ONGLETS DU CLUB, UNE ADRESSE CHACUN — kit v3, FR-031 (AD-27, lot Fondations).
 *
 * Segments FR canoniques ; leur traduction anglaise vit dans `src/i18n/segments.ts`
 * (`fil → feed`, `membres → members`, `classement → leaderboard`, `opportunites →
 * opportunities`, `infos → info`, `parrainage → referral`). Les routes
 * `/mon-espace/club/<segment>` sont déclarées dans `App.tsx` et servies par `ClubPage`.
 *
 * `CLUB_TAB_BY_SEGMENT` relie chaque segment à l'identifiant d'onglet de `ClubTab`.
 */
export const CLUB_TAB_SEGMENTS = ['fil', 'discussions', 'agenda', 'membres', 'classement', 'opportunites', 'infos', 'parrainage'] as const;
export type ClubTabSegment = (typeof CLUB_TAB_SEGMENTS)[number];

export const CLUB_TAB_BY_SEGMENT: Record<ClubTabSegment, string> = {
  fil: 'feed',
  discussions: 'discussions',
  agenda: 'agenda',
  membres: 'members',
  classement: 'leaderboard',
  opportunites: 'opportunities',
  infos: 'infos',
  parrainage: 'referral',
};
