import { useOutletContext } from 'react-router-dom';
import DashboardTab from '../tabs/DashboardTab';
import type { StudentLayoutContext } from '../../../components/layout/StudentLayout';

export default function DashboardPage() {
  const ctx = useOutletContext<StudentLayoutContext>();
  return (
    <DashboardTab
      displayName={ctx.displayName}
      userId={ctx.userId}
      enrolledFormations={ctx.enrolledFormations}
      loadingEnrollments={ctx.loadingEnrollments}
      avgProgress={ctx.avgProgress}
      completedCount={ctx.completedCount}
    />
  );
}
