import { useOutletContext } from 'react-router-dom';
import ProfileTab from '../tabs/ProfileTab';
import type { StudentLayoutContext } from '../../../components/layout/StudentLayout';

export default function ProfilePage() {
  const ctx = useOutletContext<StudentLayoutContext>();
  return (
    <ProfileTab
      enrolledFormations={ctx.enrolledFormations}
      completedCount={ctx.completedCount}
    />
  );
}
