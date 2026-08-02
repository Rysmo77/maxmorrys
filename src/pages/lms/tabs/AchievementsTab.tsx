import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Award, CheckCircle, Loader2, ArrowRight, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import LocalizedLink from '../../../components/shared/LocalizedLink';
import Button from '../../../components/ui/Button';
import { staggerContainer, staggerItem } from '../../../lib/animations';
import XPBar from '../../../components/lms/XPBar';
import StreakWidget from '../../../components/lms/StreakWidget';
import BadgeCard from '../../../components/lms/BadgeCard';
import { useFormat } from '../../../hooks/useFormat';
import { issueCertificate, getUserCertificates } from '../../../lib/firestore';
import { getGamificationProfile } from '../../../lib/gamification';
import { BADGES } from '../../../types/gamification';
import type { GamificationProfile } from '../../../types/gamification';
import type { Certificate } from '../../../types';
import type { EnrolledFormation } from '../hooks/useStudentData';
import { captureError } from '../../../lib/sentry';

interface AchievementsTabProps {
  userId: string;
  certificates: Certificate[];
  setCertificates: React.Dispatch<React.SetStateAction<Certificate[]>>;
  loadingCerts: boolean;
  enrolledFormations: EnrolledFormation[];
  addToast: (type: 'success' | 'error', message: string) => void;
}

export default function AchievementsTab({
  userId,
  certificates,
  setCertificates,
  loadingCerts,
  enrolledFormations,
  addToast,
}: AchievementsTabProps) {
  const { t } = useTranslation('lmsTabs');
  const { formatDate } = useFormat();
  const [gamification, setGamification] = useState<GamificationProfile | null>(null);

  useEffect(() => {
    getGamificationProfile(userId).then(setGamification).catch(() => null);
  }, [userId]);

  const fireConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0c93e7', '#ed9516', '#22c55e', '#f59e0b'],
    });
  };

  const handleIssueCertificate = async (formationId: string, formationTitle: string) => {
    try {
      await issueCertificate(userId, formationId, formationTitle);
      const updated = await getUserCertificates(userId);
      setCertificates(updated);
      fireConfetti();
      addToast('success', t('achievements.certToastSuccess'));
    } catch (error: unknown) {
      captureError(error, { context: 'Failed to issue certificate' });
      addToast('error', error instanceof Error ? error.message : t('achievements.certToastError'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Gamification section */}
      {gamification && (
        <div className="grid sm:grid-cols-2 gap-4">
          <XPBar xp={gamification.xp} />
          <StreakWidget currentStreak={gamification.currentStreak} longestStreak={gamification.longestStreak} />
        </div>
      )}

      {/* Badges */}
      {gamification && (
        <div>
          <h3 className="font-bold text-neutral-900 dark:text-white mb-3">{t('achievements.badgesTitle')}</h3>
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {BADGES.map((badge) => (
              <motion.div key={badge.id} variants={staggerItem}>
                <BadgeCard badge={badge} unlocked={gamification.badges.includes(badge.id)} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      <div>
        <h3 className="font-bold text-neutral-900 dark:text-white mb-1">{t('achievements.certsTitle')}</h3>
        <p className="text-sm text-neutral-500">{t('achievements.certsSubtitle')}</p>
      </div>
      {loadingCerts ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
      ) : certificates.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-warning-100 to-warning-50 dark:from-warning-900/40 dark:to-warning-900/20 flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-warning-500" />
          </div>
          <h4 className="font-bold text-neutral-900 dark:text-white mb-1">{t('achievements.emptyTitle')}</h4>
          <p className="text-sm text-neutral-500 mb-1 max-w-sm mx-auto">
            {t('achievements.emptyText')}
          </p>
          {enrolledFormations.length > 0 ? (
            <p className="text-xs text-brand-600 dark:text-brand-400 font-medium mt-3">
              {t('achievements.inProgressHint', { count: enrolledFormations.length })}
            </p>
          ) : (
            <LocalizedLink to="/formations" className="inline-flex items-center gap-1.5 text-sm text-brand-600 dark:text-brand-400 font-semibold mt-3 hover:underline">
              {t('achievements.startCourse')} <ArrowRight className="w-3.5 h-3.5" />
            </LocalizedLink>
          )}
        </div>
      ) : (
        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {certificates.map((cert) => (
            <motion.div key={cert.id} variants={staggerItem} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 text-center hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="w-16 h-16 rounded-full bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-warning-500" />
              </div>
              <p className="font-bold text-neutral-900 dark:text-white text-sm mb-1 line-clamp-2">{cert.formationTitle}</p>
              <p className="text-xs text-neutral-400 mb-3">{t('achievements.obtainedOn', { date: formatDate(cert.issuedAt) })}</p>
              <p className="text-xs font-mono bg-neutral-100 dark:bg-neutral-700 text-neutral-500 rounded-lg px-3 py-1.5 mb-3">{cert.certificateCode}</p>
              <LocalizedLink to={`/certificat/${cert.certificateCode}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                <Share2 className="w-3 h-3" /> {t('achievements.share')}
              </LocalizedLink>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Formations to complete */}
      {enrolledFormations.filter((ef) => ef.enrollment.progress === 100 && !certificates.find((c) => c.formationId === ef.enrollment.formationId)).length > 0 && (
        <div>
          <h4 className="font-semibold text-neutral-900 dark:text-white mb-3 text-sm">{t('achievements.toClaimTitle')}</h4>
          <div className="space-y-3">
            {enrolledFormations
              .filter((ef) => ef.enrollment.progress === 100 && !certificates.find((c) => c.formationId === ef.enrollment.formationId))
              .map(({ enrollment, formation }) => (
                <div key={enrollment.id} className="flex items-center gap-4 bg-white dark:bg-neutral-800 border border-success-200 dark:border-success-800 rounded-2xl p-4">
                  <CheckCircle className="w-8 h-8 text-success-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900 dark:text-white text-sm truncate">{formation?.title ?? t('achievements.formationFallback')}</p>
                    <p className="text-xs text-success-600 dark:text-success-400">{t('achievements.completed100')}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<Award className="w-4 h-4" />}
                    onClick={() => {
                      if (formation) handleIssueCertificate(enrollment.formationId, formation.title);
                    }}
                  >
                    {t('achievements.obtain')}
                  </Button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
