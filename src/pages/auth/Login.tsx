import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Field, GlassPanel, Icon, IconButton, useToast } from '@ds';
import { useAuth } from '../../contexts/AuthContext';
import { localizeAuthError } from '../../lib/auth-errors';
import GoogleIcon from '../../components/auth/GoogleIcon';
import { AuthPage, SiteEyebrow } from '../../components/site';
import { useLocalizedPath } from '../../contexts/LanguageContext';

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
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/mon-espace';

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
      navigate(from, { replace: true });
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
      navigate(from, { replace: true });
    } catch (error: unknown) {
      addToast('error', localizeAuthError(error, t));
    }
    setGoogleLoading(false);
  };


  return (
    <AuthPage
      titleLines={t('login.titleLines', { returnObjects: true }) as string[]}
      seoTitle={t('login.title')}
      footer={
        <p className="mt-4 text-center text-meta text-ink-2">
          {t('login.noAccount')}{' '}
          <a href={path('/inscription')} className="font-bold text-forme">
            {t('login.createAccount')}
          </a>
        </p>
      }
      /*
        ── LA SECONDE COLONNE DU KIT ────────────────────────────────────────────────
        `PagesUtiles.js:169-186` : la remise en selle vit À CÔTÉ du formulaire, pas derrière
        un lien. Quelqu'un qui ne se souvient plus de son mot de passe voit la sortie sans
        quitter l'écran — et l'encart qui explique pourquoi la réponse restera évasive.

        UNE DIFFÉRENCE ASSUMÉE AVEC LE KIT : le kit met ici le formulaire complet. La
        production garde une seule implémentation de l'envoi, sur `/mot-de-passe-oublie`, et
        pose ici l'invitation. Deux formulaires d'envoi sur deux écrans, c'est deux fois la
        gestion d'erreur, la limitation de débit et le message de succès — et le jour où l'un
        des deux change, personne ne sait que l'autre existe.
      */
      aside={
        <div>
          <GlassPanel level="flat" padding={26} className="rv" style={{ ['--i' as string]: 1 }}>
            <SiteEyebrow style={{ margin: 0 }}>{t('reset.title')}</SiteEyebrow>
            <p className="m-0 mt-2 font-display text-[19px] font-black tracking-[-.03em] text-ink">
              {(t('reset.titleLines', { returnObjects: true }) as string[]).join(' ')}
            </p>
            <p className="mt-2 mb-4 text-[13px] leading-[1.5] text-ink-2">{t('reset.subtitleDefault')}</p>
            <Button href={path('/mot-de-passe-oublie')} tone="primary" fullWidth={false}>
              {t('reset.submit')}
            </Button>

            <GlassPanel level="truth" className="mt-4">
              <SiteEyebrow style={{ marginBottom: '6px' }}>{t('reset.truthTitle')}</SiteEyebrow>
              <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('reset.truthBody')}</p>
            </GlassPanel>
          </GlassPanel>

          {/* Faux verre : cet encart défile avec la page. */}
          <GlassPanel level="truth" className="rv mt-[14px]" style={{ ['--i' as string]: 2 }}>
            <SiteEyebrow style={{ marginBottom: '6px' }}>{t('login.truthTitle')}</SiteEyebrow>
            <p className="m-0 text-meta-2 text-ink-2 leading-[1.5]">{t('login.truthBody')}</p>
          </GlassPanel>
        </div>
      }
    >
      {/*
        Google d'abord, l'e-mail ensuite. L'ordre du kit, et il n'est pas neutre : sur un
        clavier de téléphone, le chemin qui demande le moins de saisie passe devant.
      */}
      <Button
        tone="ghost"
        onClick={() => void handleGoogle()}
        loading={googleLoading}
        disabled={googleLoading || loading}
      >
        <GoogleIcon />
        {t('login.googleButton')}
      </Button>

      {/* Le séparateur du kit : deux filets encadrant un sourcil, pas un mot posé sur un trait. */}
      <div className="flex items-center gap-3 my-[18px]">
        <span className="flex-1 h-px bg-[color:var(--border-hair)]" />
        <SiteEyebrow style={{ margin: 0 }}>{t('login.divider')}</SiteEyebrow>
        <span className="flex-1 h-px bg-[color:var(--border-hair)]" />
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <Field
          label={t('login.emailLabel')}
          type="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
          placeholder={t('login.emailPlaceholder')}
          /* Sans `inputMode` ni `autoComplete`, aucun clavier adapté ne s'ouvre et rien ne se
             pré-remplit. C'est exactement ce qui manquait au kit, et ça coûte cher au pouce. */
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

        <Button
          type="submit"
          tone="forme"
          loading={loading}
          disabled={loading || googleLoading}
          style={{ marginTop: '17px' }}
        >
          {loading ? t('login.submitting') : t('login.submit')}
        </Button>
      </form>

      <p className="mt-3 text-center text-meta">
        <a href={path('/mot-de-passe-oublie')} className="text-ink-2">
          {t('login.forgotPassword')}
        </a>
      </p>
    </AuthPage>
  );
}
