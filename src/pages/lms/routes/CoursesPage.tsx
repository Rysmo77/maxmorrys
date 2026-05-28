import { useOutletContext } from 'react-router-dom';
import CoursesTab from '../tabs/CoursesTab';
import type { StudentLayoutContext } from '../../../components/layout/StudentLayout';

export default function CoursesPage() {
  const ctx = useOutletContext<StudentLayoutContext>();
  return (
    <CoursesTab
      enrolledFormations={ctx.enrolledFormations}
      loadingEnrollments={ctx.loadingEnrollments}
      certificates={ctx.certificates}
    />
  );
}
