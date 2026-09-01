import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Field, GlassPanel, Icon, IconButton, useToast } from '@ds';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { localizedPath } from '../../i18n/routing';
import { localizeAuthError } from '../../lib/auth-errors';
import { updateUserProfile, getUserById } from '../../lib/firestore';
import { auth } from '../../config/firebase';
import GoogleIcon from '../../components/auth/GoogleIcon';
import { AuthPage, SiteEyebrow } from '../../components/site';
import { useLocalizedPath } from '../../contexts/LanguageContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


export default function Register() {
  const { t } = useTranslation('auth');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signUp, signInWithGoogle } = useAuth();
  const { language } = useLanguage();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const path = useLocalizedPath();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref')?.trim().toUpperCase() || '';

  const captureReferral = async () => {
    if (!refCode) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      const u = await getUserById(uid);
      if (u?.referredByCode) return; // ne pas écraser un parrainage existant
      await updateUserProfile(uid, { referredByCode: refCode });
    } catch { /* non bloquant */ }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = t('validation.nameRequired');
    if (!email.trim()) errs.email = t('validation.emailRequired');
    else if (!EMAIL_RE.test(email.trim())) errs.email = t('validation.emailInvalid');
    if (password.length < 6) errs.password = t('validation.passwordMinLength');
    if (password !== confirm) errs.confirm = t('validation.passwordMismatch');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await signUp(email, password, name);
      await captureReferral();
      addToast('success', t('register.successToast'));
      navigate(localizedPath('/mon-espace', language));
    } catch (error: unknown) {
      addToast('error', localizeAuthError(error, t));
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      await captureReferral();
      addToast('success', t('register.successToast'));
      navigate(localizedPath('/mon-espace', language));
    } catch (error: unknown) {
      addToast('error', localizeAuthError(error, t));
    }
    setGoogleLoading(false);
  };

  /*
   * L'erreur d'un champ s'efface dès qu'on le corrige, pas seulement à la soumission
   * suivante. Le système le formule ainsi : « un message d'erreur ne s'excuse pas — motif,
   * conséquence, sortie ». La sortie, ici, c'est que la correction se voie tout de suite.
   */
  const clearError = (field: string) => setErrors((p) => ({ ...p, [field]: '' }));


  return (
    <AuthPage
      titleLines={t('register.titleLines', { returnObjects: true }) as string[]}
      seoTitle={t('register.title')}
      footer={
        <>
          <GlassPanel level="truth" className="rv mt-[14px]" style={{ ['--i' as string]: 6 }}>
            <SiteEyebrow style={{ marginBottom: '6px' }}>{t('register.truthTitle')}</SiteEyebrow>
            <p className="m-0 text-meta-2 text-ink-2 leading-[1.5]">{t('register.truthBody')}</p>
          </GlassPanel>

          <p className="mt-4 text-center text-meta text-ink-2">
            {t('register.hasAccount')}{' '}
            <a href={path('/connexion')} className="font-bold text-forme">
              {t('register.signIn')}
            </a>
          </p>
        </>
      }
    >
      <Button
        tone="ghost"
        onClick={() => void handleGoogle()}
        loading={googleLoading}
        disabled={googleLoading || loading}
      >
        <GoogleIcon />
        {t('register.googleButton')}
      </Button>

      <div className="flex items-center gap-3 my-[18px]">
        <span className="flex-1 h-px bg-[color:var(--border-hair)]" />
        <SiteEyebrow style={{ margin: 0 }}>{t('register.divider')}</SiteEyebrow>
        <span className="flex-1 h-px bg-[color:var(--border-hair)]" />
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <Field
          label={t('register.nameLabel')}
          value={name}
          onChange={(v) => { setName(v); clearError('name'); }}
          error={errors.name}
          placeholder={t('register.namePlaceholder')}
          autoComplete="name"
          required
          style={{ marginTop: 0 }}
        />

        <Field
          label={t('register.emailLabel')}
          type="email"
          value={email}
          onChange={(v) => { setEmail(v); clearError('email'); }}
          error={errors.email}
          placeholder={t('register.emailPlaceholder')}
          inputMode="email"
          autoComplete="email"
          required
        />

        <Field
          label={t('register.passwordLabel')}
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(v) => { setPassword(v); clearError('password'); }}
          error={errors.password}
          placeholder={t('register.passwordPlaceholder')}
          /* `new-password` et non `current-password` : c'est ce qui déclenche la proposition
             de mot de passe fort du navigateur au lieu du remplissage de l'ancien. */
          autoComplete="new-password"
          required
          trailing={
            <IconButton
              label={showPassword ? t('register.hidePassword') : t('register.showPassword')}
              onClick={() => setShowPassword((v) => !v)}
              style={{ width: '32px', height: '32px', background: 'transparent', border: 0, boxShadow: 'none' }}
            >
              {showPassword ? <Icon name="eye-off" size={18} /> : <Icon name="eye" size={18} />}
            </IconButton>
          }
        />

        <Field
          label={t('register.confirmLabel')}
          type={showConfirm ? 'text' : 'password'}
          value={confirm}
          onChange={(v) => { setConfirm(v); clearError('confirm'); }}
          error={errors.confirm}
          placeholder={t('register.confirmPlaceholder')}
          autoComplete="new-password"
          required
          trailing={
            <IconButton
              label={showConfirm ? t('register.hidePassword') : t('register.showPassword')}
              onClick={() => setShowConfirm((v) => !v)}
              style={{ width: '32px', height: '32px', background: 'transparent', border: 0, boxShadow: 'none' }}
            >
              {showConfirm ? <Icon name="eye-off" size={18} /> : <Icon name="eye" size={18} />}
            </IconButton>
          }
        />

        <Button
          type="submit"
          tone="forme"
          loading={loading}
          disabled={loading || googleLoading}
          style={{ marginTop: '17px' }}
        >
          {loading ? t('register.submitting') : t('register.submit')}
        </Button>
      </form>
    </AuthPage>
  );
}
