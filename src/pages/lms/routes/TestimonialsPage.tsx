import { useOutletContext } from 'react-router-dom';
import TestimonialsTab from '../tabs/TestimonialsTab';
import type { StudentLayoutContext } from '../../../components/layout/StudentLayout';

export default function TestimonialsPage() {
  const ctx = useOutletContext<StudentLayoutContext>();
  return (
    <TestimonialsTab
      userId={ctx.userId}
      displayName={ctx.displayName}
      photoURL={ctx.photoURL}
      enrolledFormations={ctx.enrolledFormations}
      myTestimonials={ctx.myTestimonials}
      setMyTestimonials={ctx.setMyTestimonials}
      loadingTestimonials={ctx.loadingTestimonials}
      addToast={ctx.addToast}
    />
  );
}
