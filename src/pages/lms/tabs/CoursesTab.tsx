import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Loader2, GraduationCap, ArrowRight } from 'lucide-react';
import LocalizedLink from '../../../components/shared/LocalizedLink';
import Button from '../../../components/ui/Button';
import FormationCard from '../../../components/formations/FormationCard';
import type { EnrolledFormation } from '../hooks/useStudentData';
import type { Certificate } from '../../../types';
import { staggerContainer, staggerItem } from '../../../lib/animations';

interface CoursesTabProps {
  enrolledFormations: EnrolledFormation[];
  loadingEnrollments: boolean;
  certificates?: Certificate[];
}

export default function CoursesTab({ enrolledFormations, loadingEnrollments, certificates = [] }: CoursesTabProps) {
  const { t } = useTranslation('lmsTabs');
  const certByFormation = new Map(certificates.map((c) => [c.formationId, c]));
  return (
    <div className="space-y-4">
      {loadingEnrollments ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
      ) : enrolledFormations.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 dark:from-brand-900/40 dark:to-brand-900/20 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-brand-500" />
          </div>
          <h4 className="font-bold text-neutral-900 dark:text-white mb-1">{t('courses.emptyTitle')}</h4>
          <p className="text-sm text-neutral-500 mb-4 max-w-sm mx-auto">
            {t('courses.emptyText')}
          </p>
          <LocalizedLink to="/formations"><Button icon={<ArrowRight className="w-4 h-4" />}>{t('courses.explore')}</Button></LocalizedLink>
        </div>
      ) : (
        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {enrolledFormations.map(({ enrollment, formation }) => (
            <motion.div key={enrollment.id} variants={staggerItem}>
              {formation ? (
                <FormationCard
                  formation={formation}
                  variant="progress"
                  enrollment={enrollment}
                  certificate={certByFormation.get(enrollment.formationId)}
                />
              ) : (
                <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4">
                  <p className="font-bold text-neutral-900 dark:text-white text-sm mb-2">{t('courses.unavailableTitle')}</p>
                  <p className="text-xs text-neutral-400">{t('courses.unavailableText')}</p>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
