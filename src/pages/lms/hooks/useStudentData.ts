import { useState, useEffect } from 'react';
import { getUserEnrollments, getFormationsByIds } from '../../../lib/firestore';
import type { Enrollment, Formation } from '../../../types';

export interface EnrolledFormation {
  enrollment: Enrollment;
  formation: Formation | null;
}

export function useStudentData(userId: string | undefined) {
  const [enrolledFormations, setEnrolledFormations] = useState<EnrolledFormation[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoadingEnrollments(true);
    getUserEnrollments(userId)
      .then(async (enrollments) => {
        const ids = enrollments.map((e) => e.formationId);
        const formations = await getFormationsByIds(ids).catch(() => [] as Formation[]);
        const formationMap = new Map(formations.map((f) => [f.id, f]));
        setEnrolledFormations(
          enrollments.map((enrollment) => ({
            enrollment,
            formation: formationMap.get(enrollment.formationId) ?? null,
          }))
        );
        setLoadingEnrollments(false);
      })
      .catch(() => {
        setLoadingEnrollments(false);
      });
  }, [userId]);

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
