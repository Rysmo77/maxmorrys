import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import LocalizedLink from '../../components/shared/LocalizedLink';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { updateUserProfile } from '../../lib/firestore';
import { updateProfile } from 'firebase/auth';
import { uploadMedia } from '../../lib/storage';
import { captureError } from '../../lib/sentry';
import { trackEvent } from '../../lib/tracking';
import { Field, Icon } from '@ds';

interface OnboardingProps {
  onComplete: () => void;
}

const STEPS = [
  { id: 'welcome', icon: 'user', subtitleKey: 'onboarding.stepWelcomeSubtitle' },
  { id: 'explore', icon: 'book', subtitleKey: 'onboarding.stepExploreSubtitle' },
  { id: 'ready', icon: 'compass', subtitleKey: 'onboarding.stepReadySubtitle' },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { t } = useTranslation('lms');
  const { user, refreshUserData } = useAuth();
  const { addToast } = useToast();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState(user?.photoURL || '');

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) { addToast('error', t('onboarding.errorImageOnly')); return; }
    if (file.size > 2 * 1024 * 1024) { addToast('error', t('onboarding.errorMaxSize')); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const url = await uploadMedia(file, `avatars/${user.uid}/profile.${ext}`);
      await updateProfile(user, { photoURL: url });
      await updateUserProfile(user.uid, { photoURL: url });
      setPreviewUrl(url);
    } catch (error: unknown) {
      captureError(error, { context: 'Failed to upload onboarding photo' });
      addToast('error', error instanceof Error ? error.message : t('onboarding.errorUpload'));
    } finally {
      setUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const name = displayName.trim() || user.displayName || t('fallbackName');
      await updateProfile(user, { displayName: name });
      await updateUserProfile(user.uid, {
        displayName: name,
        bio: bio.trim() || undefined,
      });
      await refreshUserData();
      setStep(1);
    } catch (error: unknown) {
      captureError(error, { context: 'Failed to save onboarding profile' });
      addToast('error', error instanceof Error ? error.message : t('onboarding.errorSave'));
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
      addToast('error', error instanceof Error ? error.message : t('onboarding.errorComplete'));
    }
  };

  const initials = (displayName || user?.email?.split('@')[0] || 'É')
    .split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
      <motion.div
        className="w-full max-w-lg bg-paper dark:bg-[color:var(--night-3)] rounded-3xl shadow-2xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >

        {/* Progress bar */}
        <div className="h-1 bg-[color:var(--fill-3)]">
          <div
            className="h-full bg-[color:var(--mm-bleu)] prog-fill transition-[width] duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-8 pt-6 pb-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex flex-col items-center gap-1.5">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                i < step ? 'bg-[color-mix(in_srgb,var(--ok)_4%,transparent)] text-ok' :
                i === step ? 'bg-[color-mix(in_srgb,var(--mm-bleu)_4%,transparent)] text-forme' :
                'bg-[color:var(--fill-2)] text-ink-2'
              }`}>
                {i < step ? <Icon name="check" size={20} /> : <Icon name={s.icon} size={20} />}
              </div>
              <span className={`text-[10px] font-semibold ${
                i === step ? 'text-forme' : 'text-ink-2'
              }`}>
                {t(s.subtitleKey)}
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
                <h2 className="text-2xl font-black text-ink mb-1">
                  {t('onboarding.welcomeTitle')}
                </h2>
                <p className="text-sm text-ink-2">
                  {t('onboarding.welcomeText')}
                </p>
              </div>

              {/* Photo */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-[color-mix(in_srgb,var(--mm-bleu)_5%,transparent)] flex items-center justify-center overflow-hidden ring-4">
                    {previewUrl ? (
                      <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-forme">{initials}</span>
                    )}
                  </div>
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-forme hover:bg-[color:var(--mm-bleu)] text-white flex items-center justify-center shadow-lg transition-colors disabled:opacity-60"
                  >
                    <Icon name="camera" size={16} />
                  </button>
                  <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </div>
              </div>

              {/* Le nom et la bio passent par `Field` : contrôle réel, `<label htmlFor>` lié,
                  `autoComplete` renseigné. Les deux libellés d'avant étaient ORPHELINS — le
                  point ouvert B du handoff, sur le tout premier formulaire que remplit un
                  nouvel élève. */}
              <Field
                label={t('onboarding.nameLabel')}
                value={displayName}
                onChange={setDisplayName}
                placeholder={t('onboarding.namePlaceholder')}
                autoComplete="name"
              />

              {/* « (facultatif) » entre dans le libellé plutôt qu'à côté : un lecteur d'écran
                  annonce le nom du champ, et doit entendre qu'il peut le sauter. */}
              <Field
                as="textarea"
                label={`${t('onboarding.bioLabel')} ${t('onboarding.bioOptional')}`}
                value={bio}
                onChange={setBio}
                placeholder={t('onboarding.bioPlaceholder')}
                rows={2}
              />

              <Button className="w-full" onClick={handleSaveProfile} disabled={saving} loading={saving} icon={<Icon name="forward" size={16} />}>
                {saving ? t('onboarding.saving') : t('onboarding.continue')}
              </Button>

              <button onClick={() => setStep(1)} className="w-full text-center text-xs text-ink-2 hover:text-ink-2 transition-colors">
                {t('onboarding.skipStep')}
              </button>
            </div>
          )}

          {/* Step 1: Explore formations */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-ink mb-1">
                  {t('onboarding.exploreTitle')}
                </h2>
                <p className="text-sm text-ink-2">
                  {t('onboarding.exploreText')}
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { emoji: '🎯', title: t('onboarding.feature1Title'), desc: t('onboarding.feature1Desc') },
                  { emoji: '🤖', title: t('onboarding.feature2Title'), desc: t('onboarding.feature2Desc') },
                  { emoji: '🏆', title: t('onboarding.feature3Title'), desc: t('onboarding.feature3Desc') },
                  { emoji: '👥', title: t('onboarding.feature4Title'), desc: t('onboarding.feature4Desc') },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3 p-3 rounded-xl bg-[color:var(--fill-1)]">
                    <span className="text-xl flex-shrink-0">{item.emoji}</span>
                    <div>
                      <p className="font-semibold text-ink text-sm">{item.title}</p>
                      <p className="text-xs text-ink-2">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(0)} icon={<Icon name="back" size={16} />}>
                  {t('onboarding.back')}
                </Button>
                <Button className="flex-1" onClick={() => setStep(2)} icon={<Icon name="forward" size={16} />}>
                  {t('onboarding.continue')}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Ready */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">🚀</div>
                <h2 className="text-2xl font-black text-ink mb-1">
                  {t('onboarding.readyTitle')}
                </h2>
                <p className="text-sm text-ink-2 max-w-xs mx-auto">
                  {t('onboarding.readyText')}
                </p>
              </div>

              <div className="bg-[color-mix(in_srgb,var(--mm-bleu)_4%,transparent)] border border-[color-mix(in_srgb,var(--mm-bleu)_7%,transparent)] rounded-xl p-4 text-center">
                <p className="text-sm font-semibold text-forme mb-1">
                  {t('onboarding.proTipTitle')}
                </p>
                <p className="text-xs text-[color-mix(in_srgb,var(--mm-bleu)_80%,transparent)]/80">
                  {t('onboarding.proTipText')}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <LocalizedLink to="/formations" onClick={handleComplete}>
                  <Button className="w-full" icon={<Icon name="book" size={16} />}>
                    {t('onboarding.exploreFormations')}
                  </Button>
                </LocalizedLink>
                <button
                  onClick={handleComplete}
                  className="w-full text-center text-sm font-semibold text-forme hover:underline"
                >
                  {t('onboarding.goToDashboard')}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
