import { useQuery } from '@tanstack/react-query';
import { getUserEnrollments, getFormationsByIds } from '../../../lib/firestore';
import { queryKeys } from '../../../lib/queryClient';
import type { Enrollment, Formation } from '../../../types';

export interface EnrolledFormation {
  enrollment: Enrollment;
  formation: Formation | null;
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

  const avgProgress =
    enrolledFormations.length > 0
      ? Math.round(
          enrolledFormations.reduce((a, ef) => a + ef.enrollment.progress, 0) /
            enrolledFormations.length
        )
      : 0;

  const completedCount = enrolledFormations.filter(
    (ef) => ef.enrollment.progress === 100
  ).length;

  return { enrolledFormations, loadingEnrollments, avgProgress, completedCount };
}
