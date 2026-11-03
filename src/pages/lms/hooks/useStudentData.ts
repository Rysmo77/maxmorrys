import { useQuery } from '@tanstack/react-query';
import { getUserEnrollments, getFormationsByIds } from '../../../lib/firestore';
import { queryKeys } from '../../../lib/queryClient';
import { estAVenir } from '../../../types/formationRelease';
import type { Enrollment, Formation } from '../../../types';

export interface EnrolledFormation {
  enrollment: Enrollment;
  formation: Formation | null;
}

/**
 * L'ÉTAT D'UNE FORMATION SUIVIE — LA seule définition de l'espace Edu (audit 03/11/2026, E4).
 *
 * Le tableau de bord, « Mes formations » et « Succès » comptaient chacun à leur façon : une
 * précommande « Bientôt » était « 1 formation en cours » sur Succès et « En cours · 0 » sur
 * Mes formations, et « terminée » valait `=== 100` ici, `>= 100` là. Tous passent désormais
 * par cette fonction, et par les comptes que ce crochet en dérive.
 *   · `soon`    — formation à venir (précommande) : aucune leçon à ouvrir ;
 *   · `done`    — progression à 100 % ;
 *   · `ongoing` — tout le reste, y compris une formation ouverte jamais commencée.
 */
export type EtatFormation = 'soon' | 'done' | 'ongoing';

export function etatFormation(ef: EnrolledFormation): EtatFormation {
  if (estAVenir(ef.formation)) return 'soon';
  return ef.enrollment.progress >= 100 ? 'done' : 'ongoing';
}

export function useStudentData(userId: string | undefined) {
  const { data: enrolledFormations = [], isLoading } = useQuery({
    queryKey: queryKeys.studentData(userId ?? ''),
    enabled: !!userId,
    queryFn: async (): Promise<EnrolledFormation[]> => {
      const enrollments = await getUserEnrollments(userId!);
      const ids = enrollments.map((e) => e.formationId);
      const formations = await getFormationsByIds(ids).catch(() => [] as Formation[]);
      const formationMap = new Map(formations.map((f) => [f.id, f]));
      return enrollments.map((enrollment) => ({
        enrollment,
        formation: formationMap.get(enrollment.formationId) ?? null,
      }));
    },
  });

  // Spinner uniquement pendant la première lecture réelle (utilisateur connu).
  const loadingEnrollments = !!userId && isLoading;

  /* Une précommande n'a pas de progression : elle n'entre pas dans la moyenne. */
  const ouvertes = enrolledFormations.filter((ef) => etatFormation(ef) !== 'soon');
  const avgProgress =
    ouvertes.length > 0
      ? Math.round(ouvertes.reduce((a, ef) => a + ef.enrollment.progress, 0) / ouvertes.length)
      : 0;

  const completedCount = enrolledFormations.filter((ef) => etatFormation(ef) === 'done').length;
  const ongoingCount = enrolledFormations.filter((ef) => etatFormation(ef) === 'ongoing').length;

  return { enrolledFormations, loadingEnrollments, avgProgress, completedCount, ongoingCount };
}
