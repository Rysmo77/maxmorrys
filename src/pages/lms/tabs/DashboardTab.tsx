import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, BarChart2, Award, Play, ArrowRight, Loader2 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { staggerContainer, staggerItem } from '../../../lib/animations';
import XPBar from '../../../components/lms/XPBar';
import StreakWidget from '../../../components/lms/StreakWidget';
import { getGamificationProfile, updateStreak, addXP } from '../../../lib/gamification';
import type { GamificationProfile } from '../../../types/gamification';
import { XP_REWARDS } from '../../../types/gamification';
import type { EnrolledFormation } from '../hooks/useStudentData';

interface DashboardTabProps {
  displayName: string;
  userId?: string;
  enrolledFormations: EnrolledFormation[];
  loadingEnrollments: boolean;
  avgProgress: number;
  completedCount: number;
}

export default function DashboardTab({ displayName, userId, enrolledFormations, loadingEnrollments, avgProgress, completedCount }: DashboardTabProps) {
  const [gamification, setGamification] = useState<GamificationProfile | null>(null);

  // Update streak on dashboard view + load gamification
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { currentStreak, isNew } = await updateStreak(userId);
      if (isNew && currentStreak > 0) {
        await addXP(userId, XP_REWARDS.dailyStreak);
      }
      const profile = await getGamificationProfile(userId);
      setGamification(profile);
    })().catch(() => null);
  }, [userId]);
  return (
    <div className="space-y-6">
      {/* Welcome — with resume course or explore CTA */}
      {(() => {
        const inProgress = enrolledFormations.find((ef) => ef.enrollment.progress > 0 && ef.enrollment.progress < 100);
        return (
          <div className="bg-gradient-to-r from-brand-500 to-brand-700 rounded-2xl p-6 text-white">
            <h2 className="text-xl font-bold mb-1">Bonjour, {displayName.split(' ')[0]} 👋</h2>
            {inProgress && inProgress.formation ? (
              <div className="mt-3">
                <p className="text-brand-100 text-sm mb-2">Reprends où tu t'es arrêté :</p>
                <div className="flex items-center gap-4 bg-white/10 rounded-xl p-3">
                  {inProgress.formation.coverImage && (
                    <img src={inProgress.formation.coverImage} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{inProgress.formation.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white rounded-full transition-all" style={{ width: `${inProgress.enrollment.progress}%` }} />
                      </div>
                      <span className="text-xs text-brand-100 flex-shrink-0">{inProgress.enrollment.progress}%</span>
                    </div>
                  </div>
                  <Link
                    to={`/cours/${inProgress.formation.slug}`}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-white text-brand-700 font-bold text-sm rounded-full hover:bg-brand-50 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" /> Reprendre
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-brand-100 text-sm mb-3">
                  {enrolledFormations.length === 0
                    ? 'Commence ton aventure en explorant nos formations.'
                    : 'Continue ton apprentissage là où tu t\'es arrêté.'}
                </p>
                {enrolledFormations.length === 0 && (
                  <Link
                    to="/formations"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-700 font-bold text-sm rounded-full hover:bg-brand-50 transition-colors"
                  >
                    Explorer les formations <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Stats */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {[
          { icon: BookOpen, label: 'Formations', value: enrolledFormations.length, color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-50 dark:bg-brand-900/20' },
          { icon: CheckCircle, label: 'Terminées', value: completedCount, color: 'text-success-600 dark:text-success-400', bg: 'bg-success-50 dark:bg-success-900/20' },
          { icon: BarChart2, label: 'Progression moy.', value: `${avgProgress}%`, color: 'text-accent-600 dark:text-accent-400', bg: 'bg-accent-50 dark:bg-accent-900/20' },
          { icon: Award, label: 'Certificats', value: completedCount, color: 'text-warning-600 dark:text-warning-400', bg: 'bg-warning-50 dark:bg-warning-900/20' },
        ].map((s, i) => (
          <motion.div key={i} variants={staggerItem} className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4">
            <div className={`p-2 rounded-xl ${s.bg} w-fit mb-2`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-neutral-500">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Gamification widgets */}
      {gamification && (
        <div className="grid sm:grid-cols-2 gap-4">
          <XPBar xp={gamification.xp} compact />
          <StreakWidget currentStreak={gamification.currentStreak} longestStreak={gamification.longestStreak} compact />
        </div>
      )}

      {/* Continue learning */}
      <div>
        <h3 className="font-bold text-neutral-900 dark:text-white mb-3">Continuer l'apprentissage</h3>
        {loadingEnrollments ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
        ) : enrolledFormations.length === 0 ? (
          <div className="bg-white dark:bg-neutral-800 border border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 dark:from-brand-900/40 dark:to-brand-900/20 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7 text-brand-500" />
            </div>
            <h4 className="font-bold text-neutral-900 dark:text-white mb-1">Prêt à apprendre ?</h4>
            <p className="text-sm text-neutral-500 mb-4 max-w-xs mx-auto">
              Explore nos formations en marketing digital, SEO et IA. Chacune est conçue pour être pratique et actionnable.
            </p>
            <Link to="/formations">
              <Button size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>Découvrir les formations</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {enrolledFormations.filter((ef) => ef.enrollment.progress < 100).slice(0, 3).map(({ enrollment, formation }) => (
              <div key={enrollment.id} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 flex items-center gap-4">
                {formation?.coverImage && (
                  <img src={formation.coverImage} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" loading="lazy" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 dark:text-white truncate">{formation?.title ?? 'Formation'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${enrollment.progress}%` }} />
                    </div>
                    <span className="text-xs text-neutral-500 flex-shrink-0">{enrollment.progress}%</span>
                  </div>
                </div>
                {formation && (
                  <Link to={`/cours/${formation.slug}`}>
                    <Button size="sm" icon={<Play className="w-3.5 h-3.5" />}>Continuer</Button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
