import { useOutletContext } from 'react-router-dom';
import AchievementsTab from '../tabs/AchievementsTab';
import type { StudentLayoutContext } from '../../../components/layout/StudentLayout';

export default function AchievementsPage() {
  const ctx = useOutletContext<StudentLayoutContext>();
  if (!ctx.userId) return null;
  return (
    <AchievementsTab
      userId={ctx.userId}
      certificates={ctx.certificates}
      setCertificates={ctx.setCertificates}
      loadingCerts={ctx.loadingCerts}
      enrolledFormations={ctx.enrolledFormations}
      addToast={ctx.addToast}
    />
  );
}
