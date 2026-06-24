import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Brain, RotateCcw, Loader2, ShieldCheck } from 'lucide-react';
import { db, functions } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/ui/Toast';
import { updateUserProfile } from '../../../lib/firestore';
import Toggle from '../../../components/ui/Toggle';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import type { RysmoProfile, ContentEngagement } from '../../../types';
import type { EnrolledFormation } from '../hooks/useStudentData';

const clearRysmoMemory = httpsCallable<Record<string, never>, { success: boolean }>(functions, 'clearRysmoMemory');

interface RysmoMemoryTabProps {
  enrolledFormations: EnrolledFormation[];
}

export default function RysmoMemoryTab({ enrolledFormations }: RysmoMemoryTabProps) {
  const { t } = useTranslation('lmsTabs');
  const { user, userData, refreshUserData } = useAuth();
  const { addToast } = useToast();

  const consent = userData?.preferences?.aiMemoryConsent !== false;
  const [profile, setProfile] = useState<RysmoProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [topCategories, setTopCategories] = useState<string[]>([]);
  const [recentContent, setRecentContent] = useState<ContentEngagement[]>([]);
  const [savingConsent, setSavingConsent] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setLoadingProfile(true);
    try {
      const snap = await getDoc(doc(db, 'rysmoProfiles', user.uid));
      setProfile(snap.exists() ? (snap.data() as RysmoProfile) : null);
    } catch {
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
    // Centres d'intérêt déduits de l'engagement contenus
    try {
      const engSnap = await getDocs(query(
        collection(db, `users/${user.uid}/engagement`),
        orderBy('lastAt', 'desc'),
        limit(12),
      ));
      const items = engSnap.docs.map((d) => d.data() as ContentEngagement);
      const byCat = new Map<string, number>();
      items.forEach((e) => {
        const score = Math.min(e.scrollPctMax ?? 0, 100) / 100 + Math.min(e.dwellSec ?? 0, 600) / 600 + Math.min(e.mediaSec ?? 0, 1800) / 1800;
        byCat.set(e.category || 'général', (byCat.get(e.category || 'général') ?? 0) + score);
      });
      setTopCategories([...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c]) => c));
      setRecentContent(items.slice(0, 5));
    } catch {
      setTopCategories([]);
      setRecentContent([]);
    }
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleToggleConsent = async (checked: boolean) => {
    if (!user || !userData) return;
    setSavingConsent(true);
    try {
      await updateUserProfile(user.uid, { preferences: { ...userData.preferences, aiMemoryConsent: checked } });
      await refreshUserData();
      addToast('success', checked ? t('rysmoMemory.toastMemoryOn') : t('rysmoMemory.toastMemoryOff'));
    } catch {
      addToast('error', t('rysmoMemory.toastUpdateError'));
    } finally {
      setSavingConsent(false);
    }
  };

  const handleClear = async () => {
    if (!user) return;
    setClearing(true);
    try {
      await clearRysmoMemory({});
      setProfile(null);
      setTopCategories([]);
      setRecentContent([]);
      addToast('success', t('rysmoMemory.toastResetSuccess'));
    } catch {
      addToast('error', t('rysmoMemory.toastResetError'));
    } finally {
      setClearing(false);
      setShowConfirm(false);
    }
  };

  const inProgress = enrolledFormations.filter((ef) => ef.enrollment.progress < 100);
  const completed = enrolledFormations.filter((ef) => ef.enrollment.progress >= 100);

  return (
    <div className="space-y-6">
      {/* Consentement */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5">
        <div className="flex items-start gap-3 mb-4">
          <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            {t('rysmoMemory.consentIntro')}
          </p>
        </div>
        <Toggle
          checked={consent}
          onChange={handleToggleConsent}
          label={t('rysmoMemory.memoryLabel')}
          description={savingConsent ? t('rysmoMemory.updating') : (consent ? t('rysmoMemory.memoryOn') : t('rysmoMemory.memoryOff'))}
        />
      </div>

      {/* Ce que Rysmo retient */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-teal-600" />
          <h2 className="text-lg font-black text-neutral-900 dark:text-white">{t('rysmoMemory.remembersTitle')}</h2>
        </div>
        {loadingProfile ? (
          <div className="flex items-center gap-2 text-neutral-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> {t('rysmoMemory.loading')}</div>
        ) : !consent ? (
          <p className="text-sm text-neutral-500">{t('rysmoMemory.disabledText')}</p>
        ) : !profile ? (
          <p className="text-sm text-neutral-500">{t('rysmoMemory.noMemoriesText')}</p>
        ) : (
          <div className="space-y-3 text-sm">
            {profile.summary && (
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-400 font-semibold mb-1">{t('rysmoMemory.summary')}</p>
                <p className="text-neutral-700 dark:text-neutral-200">{profile.summary}</p>
              </div>
            )}
            {profile.level && (
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-400 font-semibold mb-1">{t('rysmoMemory.estimatedLevel')}</p>
                <p className="text-neutral-700 dark:text-neutral-200 capitalize">{profile.level}</p>
              </div>
            )}
            {profile.topics?.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-400 font-semibold mb-1">{t('rysmoMemory.topics')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.topics.map((t) => (
                    <span key={t} className="px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs font-medium">{t}</span>
                  ))}
                </div>
              </div>
            )}
            {profile.weakSpots?.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-400 font-semibold mb-1">{t('rysmoMemory.weakSpots')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.weakSpots.map((t) => (
                    <span key={t} className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Réinitialiser — toujours disponible quand la mémoire est active */}
        {consent && (
          <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <button
              onClick={() => setShowConfirm(true)}
              disabled={clearing}
              className="inline-flex items-center gap-2 py-2 px-3 rounded-xl border border-error-300 dark:border-error-700 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              {t('rysmoMemory.reset')}
            </button>
            <p className="text-xs text-neutral-400 mt-2">{t('rysmoMemory.resetHint')}</p>
          </div>
        )}
      </div>

      {/* Centres d'intérêt déduits de l'activité */}
      {consent && (topCategories.length > 0 || recentContent.length > 0) && (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5">
          <h2 className="text-lg font-black text-neutral-900 dark:text-white mb-1">{t('rysmoMemory.interestsTitle')}</h2>
          <p className="text-xs text-neutral-500 mb-4">{t('rysmoMemory.interestsSubtitle')}</p>
          {topCategories.length > 0 && (
            <div className="mb-3">
              <p className="text-xs uppercase tracking-wide text-neutral-400 font-semibold mb-1.5">{t('rysmoMemory.favoriteCategories')}</p>
              <div className="flex flex-wrap gap-1.5">
                {topCategories.map((c) => (
                  <span key={c} className="px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs font-medium">{c}</span>
                ))}
              </div>
            </div>
          )}
          {recentContent.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-400 font-semibold mb-1.5">{t('rysmoMemory.recentlyViewed')}</p>
              {recentContent.map((e, i) => (
                <div key={`${e.slug}-${i}`} className="text-sm text-neutral-700 dark:text-neutral-200 py-0.5 truncate">
                  {e.title} <span className="text-xs text-neutral-400">· {e.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contexte d'apprentissage */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5">
        <h2 className="text-lg font-black text-neutral-900 dark:text-white mb-1">{t('rysmoMemory.journeyTitle')}</h2>
        <p className="text-xs text-neutral-500 mb-4">{t('rysmoMemory.journeySubtitle')}</p>
        {enrolledFormations.length === 0 ? (
          <p className="text-sm text-neutral-500">{t('rysmoMemory.noFormation')}</p>
        ) : (
          <div className="space-y-3">
            {inProgress.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-400 font-semibold mb-1.5">{t('rysmoMemory.inProgress')}</p>
                {inProgress.map((ef) => (
                  <div key={ef.enrollment.id} className="flex items-center justify-between py-1">
                    <span className="text-sm text-neutral-700 dark:text-neutral-200 truncate">{ef.formation?.title ?? ef.enrollment.formationId}</span>
                    <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">{ef.enrollment.progress}%</span>
                  </div>
                ))}
              </div>
            )}
            {completed.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-400 font-semibold mb-1.5">{t('rysmoMemory.completed')}</p>
                {completed.map((ef) => (
                  <div key={ef.enrollment.id} className="text-sm text-neutral-700 dark:text-neutral-200 py-1 truncate">{ef.formation?.title ?? ef.enrollment.formationId}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleClear}
        title={t('rysmoMemory.confirmTitle')}
        confirmLabel={clearing ? t('rysmoMemory.confirmResetting') : t('rysmoMemory.confirmReset')}
        variant="danger"
        loading={clearing}
      >
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          {t('rysmoMemory.confirmText')}
        </p>
      </ConfirmDialog>
    </div>
  );
}
