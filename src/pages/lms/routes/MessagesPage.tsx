import { useOutletContext } from 'react-router-dom';
import MessagesTab from '../tabs/MessagesTab';
import type { StudentLayoutContext } from '../../../components/layout/StudentLayout';

export default function MessagesPage() {
  const ctx = useOutletContext<StudentLayoutContext>();
  if (!ctx.userId) return null;
  return (
    <MessagesTab
      userId={ctx.userId}
      userEmail={ctx.userEmail}
      displayName={ctx.displayName}
      sentMessages={ctx.sentMessages}
      setSentMessages={ctx.setSentMessages}
      loadingMessages={ctx.loadingMessages}
      addToast={ctx.addToast}
    />
  );
}
