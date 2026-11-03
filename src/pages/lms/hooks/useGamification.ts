import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getGamificationProfile, updateStreak, addXP, syncBadges } from '../../../lib/gamification';
import { XP_REWARDS } from '../../../types/gamification';
import type { GamificationProfile } from '../../../types/gamification';
import { captureError } from '../../../lib/sentry';
import type { EnrolledFormation } from './useStudentData';

/** Clé de cache partagée : tableau de bord et Succès lisent LE MÊME profil. */
const gamificationKey = (userId: string) => ['gamification', userId] as const;

/**
 * LE PROFIL DE JEU (XP, niveau, série, badges) — une seule lecture pour tout l'espace Edu.
 *
 * ⚠️ POURQUOI CE CROCHET (audit 03/11/2026, E4). Le tableau de bord n'affichait le profil
 * qu'APRÈS une chaîne d'écritures — série, XP du jour, badges — et un échec n'importe où dans
 * la chaîne (une règle Firestore qui refuse un badge) le laissait sur « — XP » pour toujours,
 * pendant que Succès, qui lisait directement, affichait « niveau 2, 165 XP, série 4 j ».
 * Désormais la LECTURE vient d'abord et seule ; les écritures (`touch`) passent ensuite, sans
 * pouvoir masquer le profil, et le rafraîchissent quand elles aboutissent.
 *
 * `profile` vaut `undefined` pendant la première lecture (squelette), `null` si la personne
 * n'a encore aucun profil, l'objet sinon.
 */
export function useGamification(
  userId: string | undefined,
  touch?: { enrolledFormations: EnrolledFormation[]; ready: boolean },
): { profile: GamificationProfile | null | undefined; loading: boolean } {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: gamificationKey(userId ?? ''),
    enabled: !!userId,
    queryFn: () => getGamificationProfile(userId!),
    staleTime: 60 * 1000,
  });

  const shouldTouch = !!touch && touch.ready;
  const formations = touch?.enrolledFormations;

  // La série se met à jour à l'ouverture du tableau de bord, et les badges s'y décrochent.
  useEffect(() => {
    if (!userId || !shouldTouch || !formations) return;
    let alive = true;
    (async () => {
      const { currentStreak, isNew } = await updateStreak(userId);
      if (isNew && currentStreak > 0) await addXP(userId, XP_REWARDS.dailyStreak);
      const stats = formations.reduce(
        (acc, { enrollment }) => ({
          lessons: acc.lessons + (enrollment.completedLessons?.length ?? 0),
          certificates: acc.certificates + (enrollment.certificateIssued ? 1 : 0),
          formations: acc.formations + 1,
          streak: acc.streak,
        }),
        { lessons: 0, certificates: 0, formations: 0, streak: currentStreak },
      );
      // Un badge refusé ne doit pas empêcher d'afficher le profil relu.
      await syncBadges(userId, stats).catch((error: unknown) => captureError(error, { context: 'Gamification badge sync failed' }));
      const fresh = await getGamificationProfile(userId);
      if (alive) queryClient.setQueryData(gamificationKey(userId), fresh);
    })().catch((error: unknown) => captureError(error, { context: 'Gamification streak update failed' }));
    return () => { alive = false; };
  }, [userId, shouldTouch, formations, queryClient]);

  return { profile: userId ? data : undefined, loading: !!userId && isLoading };
}
