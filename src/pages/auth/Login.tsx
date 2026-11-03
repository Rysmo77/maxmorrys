import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Field, Icon, IconButton, useToast } from '@ds';
import { useAuth } from '../../contexts/AuthContext';
import { localizeAuthError } from '../../lib/auth-errors';
import GoogleIcon from '../../components/auth/GoogleIcon';
import AuthSplit from '../../components/edu/g2/AuthSplit';
import { useEspaceNavigate, useLocalizedPath } from '../../contexts/LanguageContext';
import { accueilConnecte } from '../../lib/hosts';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


/*
 * ═══════════════════════════════════════════════════════════════════════════════
 * LES QUATRE CHIFFRES DE FAÇADE ONT ÉTÉ RETIRÉS.  (AD-5, règle 6)
 *
 * +340 % de trafic, 10+ formations, 50+ étudiants, 94 % de réussite — quand la base comptait
 * 5 comptes, 0 formation publiée et 0 certificat au relevé du 30 août 2026.
 *
 * L'endroit rendait le défaut pire qu'ailleurs : c'est l'écran où quelqu'un s'apprête à
 * CONFIER SON MOT DE PASSE. C'est le dernier moment où on peut se permettre d'être pris en
 * défaut sur un chiffre vérifiable en trente secondes.
 *
 * Rien ne les remplace. Cet écran n'a pas à vendre — la personne a déjà décidé.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export default function Login() {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signIn, signInWithGoogle } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const path = useLocalizedPath();
  /* `from` est un chemin PHYSIQUE de l'hôte courant (posé par `ProtectedRoute`) ; sans lui,
     l'accueil connecté de l'espace, éventuellement sur un autre hôte. */
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  const go = useEspaceNavigate();
  const suite = () => (from ? navigate(from, { replace: true }) : go(accueilConnecte(), { replace: true }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = t('validation.emailRequired');
    else if (!EMAIL_RE.test(email.trim())) errs.email = t('validation.emailInvalid');
    if (!password) errs.password = t('validation.passwordRequired');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await signIn(email, password);
      addToast('success', t('login.successToast'));
      suite();
    } catch (error: unknown) {
      addToast('error', localizeAuthError(error, t));
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      addToast('success', t('login.successToast'));
      suite();
    } catch (error: unknown) {
      addToast('error', localizeAuthError(error, t));
    }
    setGoogleLoading(false);
  };


  return (
    <AuthSplit
      title={t('v3.loginTitle')}
      subtitle={t('v3.loginSubtitle')}
      seoTitle={t('login.title')}
      footer={
        <p className="m-0 mt-3 text-center text-[12.5px] text-ink-2">
          {t('login.noAccount')}{' '}
          <a href={path('/inscription')} className="font-bold">{t('login.createAccount')}</a>
        </p>
      }
    >
      {/* Google d'abord : sur un clavier de téléphone, le chemin le plus court passe devant. */}
      <Button
        tone="ghost"
        onClick={() => void handleGoogle()}
        loading={googleLoading}
        disabled={googleLoading || loading}
      >
        <GoogleIcon />
        {t('login.googleButton')}
      </Button>

      <div className="flex items-center gap-3 text-[12.5px] text-ink-3">
        <span className="h-px flex-1 bg-[color:var(--line)]" />
        {t('v3.or')}
        <span className="h-px flex-1 bg-[color:var(--line)]" />
      </div>

      {/*
        ── E-MAIL · TÉLÉPHONE ────────────────────────────────────────────────────────
        La maquette ouvre sur « Téléphone » (code par WhatsApp ou SMS). Aucune connexion par
        téléphone n'existe côté serveur : l'audit UI/UX du 03/11/2026 (n°3) a relevé qu'un
        onglet placé en premier pour répondre « pas encore ouverte » était une impasse. L'e-mail
        passe donc devant, seul onglet actif ; « Téléphone » reste visible, après, désactivé et
        marqué « bientôt ».
      */}
      <div className="mm-tabs flex" role="tablist" aria-label={t('v3.methodLabel')}>
        <button type="button" role="tab" aria-selected aria-pressed className="flex-1">
          {t('v3.emailTab')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={false}
          aria-disabled
          disabled
          title={t('v3.phoneSoonTitle')}
          className="flex-1 cursor-not-allowed opacity-60"
        >
          {`${t('v3.phoneTab')} · ${t('v3.soon')}`}
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <Field
          label={t('login.emailLabel')}
          type="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
          placeholder={t('login.emailPlaceholder')}
          inputMode="email"
          autoComplete="email"
          required
          style={{ marginTop: 0 }}
        />
        <Field
          label={t('login.passwordLabel')}
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={setPassword}
          error={errors.password}
          placeholder={t('login.passwordPlaceholder')}
          autoComplete="current-password"
          required
          trailing={
            <IconButton
              label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
              onClick={() => setShowPassword((v) => !v)}
              style={{ width: '32px', height: '32px', background: 'transparent', border: 0, boxShadow: 'none' }}
            >
              {showPassword ? <Icon name="eye-off" size={18} /> : <Icon name="eye" size={18} />}
            </IconButton>
          }
        />
        <p className="m-0 mt-2 text-right text-[12.5px]">
          <a href={path('/mot-de-passe-oublie')} className="mm-touch-extend text-ink-2">{t('login.forgotPassword')}</a>
        </p>
        <button
          type="submit"
          className="mm-pill mt-3"
          disabled={loading || googleLoading}
          aria-busy={loading || undefined}
          style={{ justifyContent: 'space-between', width: '100%' }}
        >
          {loading ? t('login.submitting') : t('login.submit')}
          <i aria-hidden="true"><Icon name="arrow-up-right" size={15} /></i>
        </button>
      </form>
    </AuthSplit>
  );
}
