import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { Mail, Lock, Eye, EyeOff, TrendingUp, Users, Award, BookOpen } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { localizeAuthError } from '../../lib/auth-errors';
import LocalizedLink from '../../components/shared/LocalizedLink';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

const brandStats = [
  { icon: TrendingUp, value: '+340%', labelKey: 'stats.trafficGrowth' },
  { icon: BookOpen, value: '10+', labelKey: 'stats.formations' },
  { icon: Users, value: '50+', labelKey: 'stats.students' },
  { icon: Award, value: '94%', labelKey: 'stats.successRate' },
];

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
    <div className="min-h-screen flex">

      {/* ── Panneau marque (gauche, desktop seulement) ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 bg-neutral-950 flex-col relative overflow-hidden">
        {/* Orbes décoratifs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-20 w-72 h-72 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 left-1/4 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 p-10">
          <LocalizedLink to="/" className="inline-block">
            <span className="font-black text-2xl tracking-tight text-white hover:text-brand-400 transition-colors">
              Hellooo<span className="text-brand-500">!</span>
            </span>
          </LocalizedLink>
        </div>

        {/* Contenu central */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-10 xl:px-16">
          <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-400 mb-6">
            {t('brand.eyebrowWelcome')}
          </p>
          <h2 className="text-4xl xl:text-5xl font-black text-white leading-[1.05] tracking-tight mb-6">
            <Trans t={t} i18nKey="brand.loginTitle" components={{ br: <br />, span: <span className="text-brand-400" /> }} />
          </h2>
          <p className="text-neutral-400 text-sm leading-relaxed max-w-xs">
            {t('brand.loginSubtitle')}
          </p>

          {/* Citation */}
          <div className="mt-10 border-l-2 border-brand-500/40 pl-5">
            <p className="text-neutral-300 text-sm italic leading-relaxed">
              {t('brand.quote')}
            </p>
            <p className="text-neutral-500 text-xs mt-2 font-medium">{t('brand.quoteAuthor')}</p>
          </div>
        </div>

        {/* Stats bas */}
        <div className="relative z-10 p-10 border-t border-white/5">
          <div className="grid grid-cols-4 gap-4">
            {brandStats.map((stat) => (
              <div key={stat.labelKey} className="text-center">
                <p className="text-xl font-black text-brand-400 tracking-tight">{stat.value}</p>
                <p className="text-[10px] text-neutral-600 mt-0.5 font-medium leading-tight">{t(stat.labelKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panneau formulaire (droite) ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 pt-24 lg:pt-12 bg-white dark:bg-neutral-950 overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Logo mobile */}
          <div className="lg:hidden text-center mb-10">
            <LocalizedLink to="/">
              <span className="font-black text-2xl tracking-tight text-neutral-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                Hellooo<span className="text-brand-500">!</span>
              </span>
            </LocalizedLink>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white mb-1">
            {t('login.title')}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-8">
            {t('login.subtitle')}
          </p>

          {/* Bouton Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {googleLoading ? (
              <span className="w-5 h-5 border-2 border-neutral-300 border-t-brand-500 rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {t('login.googleButton')}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
            <span className="text-xs font-medium text-neutral-400">{t('login.divider')}</span>
            <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
          </div>

          {/* Formulaire email */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                {t('login.emailLabel')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); }}
                  placeholder={t('login.emailPlaceholder')}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors ${errors.email ? 'border-red-400 dark:border-red-500' : 'border-neutral-200 dark:border-neutral-700'}`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  {t('login.passwordLabel')}
                </label>
                <LocalizedLink to="/mot-de-passe-oublie" className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
                  {t('login.forgotPassword')}
                </LocalizedLink>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
                  placeholder={t('login.passwordPlaceholder')}
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors ${errors.password ? 'border-red-400 dark:border-red-500' : 'border-neutral-200 dark:border-neutral-700'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : null}
              {loading ? t('login.submitting') : t('login.submit')}
            </button>

            <p className="text-[11px] leading-relaxed text-neutral-400 dark:text-neutral-500 text-center">
              {t('terms.loginIntro')}{' '}
              <LocalizedLink to="/legal/cgu" target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 hover:underline">{t('terms.termsLink')}</LocalizedLink>
              {' '}{t('terms.and')}{' '}
              <LocalizedLink to="/legal/confidentialite" target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 hover:underline">{t('terms.privacyLink')}</LocalizedLink>.
            </p>
          </form>

          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 mt-8">
            {t('login.noAccount')}{' '}
            <LocalizedLink to="/inscription" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">
              {t('login.createAccount')}
            </LocalizedLink>
          </p>
        </div>
      </div>
    </div>
  );
}
