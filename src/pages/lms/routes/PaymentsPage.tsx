import { useOutletContext } from 'react-router-dom';
import PaymentsTab from '../tabs/PaymentsTab';
import type { StudentLayoutContext } from '../../../components/layout/StudentLayout';

export default function PaymentsPage() {
  const ctx = useOutletContext<StudentLayoutContext>();
  if (!ctx.userId) return null;
  return <PaymentsTab userId={ctx.userId} />;
}
