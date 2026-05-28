import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Brain, RotateCcw, Loader2, ShieldCheck } from 'lucide-react';
import { db, functions } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/ui/Toast';
import { updateUserProfile } from '../../../lib/firestore';
import Toggle from '../../../components/ui/Toggle';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import type { RysmoProfile } from '../../../types';
import type { EnrolledFormation } from '../hooks/useStudentData';

const clearRysmoMemory = httpsCallable<Record<string, never>, { success: boolean }>(functions, 'clearRysmoMemory');

interface RysmoMemoryTabProps {
  enrolledFormations: EnrolledFormation[];
}

export default function RysmoMemoryTab({ enrolledFormations }: RysmoMemoryTabProps) {
  const { user, userData, refreshUserData } = useAuth();
  const { addToast } = useToast();

  const consent = userData?.preferences?.aiMemoryConsent !== false;
  const [profile, setProfile] = useState<RysmoProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
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
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleToggleConsent = async (checked: boolean) => {
    if (!user || !userData) return;
    setSavingConsent(true);
    try {
      await updateUserProfile(user.uid, { preferences: { ...userData.preferences, aiMemoryConsent: checked } });
      await refreshUserData();
      addToast('success', checked ? 'Mémoire de Rysmo activée.' : 'Mémoire de Rysmo désactivée.');
    } catch {
      addToast('error', 'Erreur lors de la mise à jour.');
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
      addToast('success', 'Mémoire réinitialisée. Rysmo repart de zéro.');
    } catch {
      addToast('error', "Erreur lors de la réinitialisation.");
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
            La mémoire est activée par défaut : Rysmo se souvient de tes échanges pour te répondre de façon plus personnelle
            (tes objectifs, tes sujets, tes points à renforcer). Aucune donnée n'est partagée — tu peux la désactiver ou tout effacer quand tu veux.
          </p>
        </div>
        <Toggle
          checked={consent}
          onChange={handleToggleConsent}
          label="Mémoire de Rysmo"
          description={savingConsent ? 'Mise à jour…' : (consent ? 'Activée — Rysmo personnalise ses réponses selon ton parcours' : 'Désactivée — Rysmo ne retient rien')}
        />
      </div>

      {/* Ce que Rysmo retient */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-teal-600" />
          <h2 className="text-lg font-black text-neutral-900 dark:text-white">Ce que Rysmo retient</h2>
        </div>
        {loadingProfile ? (
          <div className="flex items-center gap-2 text-neutral-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Chargement…</div>
        ) : !consent ? (
          <p className="text-sm text-neutral-500">La mémoire est désactivée. Active-la ci-dessus pour que Rysmo apprenne à te connaître.</p>
        ) : !profile ? (
          <p className="text-sm text-neutral-500">Rysmo n'a pas encore de souvenirs. Discute un peu avec lui et reviens ici.</p>
        ) : (
          <div className="space-y-3 text-sm">
            {profile.summary && (
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-400 font-semibold mb-1">Résumé</p>
                <p className="text-neutral-700 dark:text-neutral-200">{profile.summary}</p>
              </div>
            )}
            {profile.level && (
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-400 font-semibold mb-1">Niveau estimé</p>
                <p className="text-neutral-700 dark:text-neutral-200 capitalize">{profile.level}</p>
              </div>
            )}
            {profile.topics?.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-400 font-semibold mb-1">Sujets d'intérêt</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.topics.map((t) => (
                    <span key={t} className="px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs font-medium">{t}</span>
                  ))}
                </div>
              </div>
            )}
            {profile.weakSpots?.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-400 font-semibold mb-1">Points à renforcer</p>
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
              Réinitialiser la mémoire
            </button>
            <p className="text-xs text-neutral-400 mt-2">Rysmo oublie tout ce qu'il a appris et repart de zéro. La mémoire reste active.</p>
          </div>
        )}
      </div>

      {/* Contexte d'apprentissage */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5">
        <h2 className="text-lg font-black text-neutral-900 dark:text-white mb-1">Ton parcours</h2>
        <p className="text-xs text-neutral-500 mb-4">Rysmo s'appuie toujours sur ta progression pour t'orienter (même sans la mémoire).</p>
        {enrolledFormations.length === 0 ? (
          <p className="text-sm text-neutral-500">Aucune formation pour l'instant.</p>
        ) : (
          <div className="space-y-3">
            {inProgress.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-400 font-semibold mb-1.5">En cours</p>
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
                <p className="text-xs uppercase tracking-wide text-neutral-400 font-semibold mb-1.5">Terminées</p>
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
        title="Réinitialiser la mémoire de Rysmo"
        confirmLabel={clearing ? 'Réinitialisation…' : 'Réinitialiser'}
        variant="danger"
        loading={clearing}
      >
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Rysmo oubliera tout ce qu'il a appris de tes échanges (résumé, sujets, points à renforcer). Tes formations et ta progression ne sont pas affectées. Action irréversible.
        </p>
      </ConfirmDialog>
    </div>
  );
}
