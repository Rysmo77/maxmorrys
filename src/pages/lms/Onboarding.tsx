import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, BookOpen, Compass, ArrowRight, ArrowLeft, Camera, Loader2, Check } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { updateUserProfile } from '../../lib/firestore';
import { updateProfile } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../config/firebase';
import { captureError } from '../../lib/sentry';
import { trackEvent } from '../../lib/tracking';

interface OnboardingProps {
  onComplete: () => void;
}

const STEPS = [
  { id: 'welcome', icon: User, title: 'Bienvenue !', subtitle: 'Personnalise ton profil' },
  { id: 'explore', icon: BookOpen, title: 'Explore', subtitle: 'Découvre les formations' },
  { id: 'ready', icon: Compass, title: 'C\'est parti !', subtitle: 'Ton espace est prêt' },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { user, refreshUserData } = useAuth();
  const { addToast } = useToast();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState(user?.photoURL || '');

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors placeholder-neutral-400';

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) { addToast('error', 'Seules les images sont acceptées.'); return; }
    if (file.size > 2 * 1024 * 1024) { addToast('error', 'Max 2 Mo.'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileRef = storageRef(storage, `avatars/${user.uid}/profile.${ext}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      await updateProfile(user, { photoURL: url });
      await updateUserProfile(user.uid, { photoURL: url });
      setPreviewUrl(url);
    } catch (error: unknown) {
      captureError(error, { context: 'Failed to upload onboarding photo' });
      addToast('error', error instanceof Error ? error.message : 'Erreur lors du téléchargement.');
    } finally {
      setUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const name = displayName.trim() || user.displayName || 'Étudiant';
      await updateProfile(user, { displayName: name });
      await updateUserProfile(user.uid, {
        displayName: name,
        bio: bio.trim() || undefined,
      });
      await refreshUserData();
      setStep(1);
    } catch (error: unknown) {
      captureError(error, { context: 'Failed to save onboarding profile' });
      addToast('error', error instanceof Error ? error.message : 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    try {
      await updateUserProfile(user.uid, { onboardingCompleted: true });
      await refreshUserData();
      trackEvent('onboarding_completed', { method: 'profile_form' });
      onComplete();
    } catch (error: unknown) {
      captureError(error, { context: 'Failed to mark onboarding as completed' });
      addToast('error', error instanceof Error ? error.message : "Impossible d'enregistrer. Reessaie.");
    }
  };

  const initials = (displayName || user?.email?.split('@')[0] || 'É')
    .split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
      <motion.div
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >

        {/* Progress bar */}
        <div className="h-1 bg-neutral-200 dark:bg-neutral-800">
          <div
            className="h-full bg-brand-500 transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-8 pt-6 pb-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex flex-col items-center gap-1.5">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                i < step ? 'bg-success-100 dark:bg-success-900/30 text-success-600' :
                i === step ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400' :
                'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
              }`}>
                {i < step ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
              </div>
              <span className={`text-[10px] font-semibold ${
                i === step ? 'text-brand-600 dark:text-brand-400' : 'text-neutral-400'
              }`}>
                {s.subtitle}
              </span>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="p-8">

          {/* Step 0: Profile setup */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-1">
                  Bienvenue sur Max-Morrys !
                </h2>
                <p className="text-sm text-neutral-500">
                  Personnalise ton profil pour que la communauté te connaisse.
                </p>
              </div>

              {/* Photo */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center overflow-hidden ring-4 ring-brand-50 dark:ring-brand-900/20">
                    {previewUrl ? (
                      <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">{initials}</span>
                    )}
                  </div>
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center shadow-lg transition-colors disabled:opacity-60"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  </button>
                  <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400">Ton nom d'affichage</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Comment veux-tu qu'on t'appelle ?"
                  className={inputCls}
                />
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  Bio courte <span className="font-normal text-neutral-400">(optionnel)</span>
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Marketeur digital, passionné de SEO..."
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
              </div>

              <Button className="w-full" onClick={handleSaveProfile} disabled={saving} icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}>
                {saving ? 'Enregistrement...' : 'Continuer'}
              </Button>

              <button onClick={() => setStep(1)} className="w-full text-center text-xs text-neutral-400 hover:text-neutral-600 transition-colors">
                Passer cette étape
              </button>
            </div>
          )}

          {/* Step 1: Explore formations */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-1">
                  Explore les formations
                </h2>
                <p className="text-sm text-neutral-500">
                  Voici ce qui t'attend sur la plateforme.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { emoji: '🎯', title: 'Formations pratiques', desc: 'Des cours concrets en marketing digital, SEO et IA' },
                  { emoji: '🤖', title: 'Rysmo, ton répétiteur IA', desc: 'Pose tes questions à tout moment pendant tes cours' },
                  { emoji: '🏆', title: 'Certificats', desc: 'Obtiens un certificat à chaque formation terminée' },
                  { emoji: '👥', title: 'Club des Digitos', desc: 'Rejoins la communauté d\'étudiants et d\'experts' },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                    <span className="text-xl flex-shrink-0">{item.emoji}</span>
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-white text-sm">{item.title}</p>
                      <p className="text-xs text-neutral-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(0)} icon={<ArrowLeft className="w-4 h-4" />}>
                  Retour
                </Button>
                <Button className="flex-1" onClick={() => setStep(2)} icon={<ArrowRight className="w-4 h-4" />}>
                  Continuer
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Ready */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">🚀</div>
                <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-1">
                  Tu es prêt !
                </h2>
                <p className="text-sm text-neutral-500 max-w-xs mx-auto">
                  Ton espace étudiant est configuré. Commence par explorer les formations ou lance-toi directement.
                </p>
              </div>

              <div className="bg-brand-50 dark:bg-brand-900/10 border border-brand-200 dark:border-brand-800/40 rounded-xl p-4 text-center">
                <p className="text-sm font-semibold text-brand-700 dark:text-brand-300 mb-1">
                  Conseil de pro
                </p>
                <p className="text-xs text-brand-600/80 dark:text-brand-400/80">
                  Les étudiants qui commencent une formation dans les 24h ont 3x plus de chances de la terminer.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Link to="/formations" onClick={handleComplete}>
                  <Button className="w-full" icon={<BookOpen className="w-4 h-4" />}>
                    Explorer les formations
                  </Button>
                </Link>
                <button
                  onClick={handleComplete}
                  className="w-full text-center text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Aller à mon tableau de bord
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
