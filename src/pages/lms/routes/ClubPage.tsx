import { useOutletContext } from 'react-router-dom';
import ClubTab from '../tabs/ClubTab';
import type { StudentLayoutContext } from '../../../components/layout/StudentLayout';

export default function ClubPage() {
  const ctx = useOutletContext<StudentLayoutContext>();
  return <ClubTab enrolledFormations={ctx.enrolledFormations} />;
}
