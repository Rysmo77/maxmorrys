import { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Mail, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { localizeAuthError } from '../../lib/auth-errors';
import LocalizedLink from '../../components/shared/LocalizedLink';

export default function ResetPassword() {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      addToast('success', t('reset.successToast'));
    } catch (error: unknown) {
      addToast('error', localizeAuthError(error, t));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-12 bg-neutral-50 dark:bg-neutral-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <LocalizedLink to="/" className="inline-block mb-8">
            <span className="font-black text-2xl tracking-tight text-neutral-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              MAX-MORRYS
            </span>
          </LocalizedLink>
          <h1 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white mb-2">{t('reset.title')}</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            {sent ? t('reset.subtitleSent') : t('reset.subtitleDefault')}
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-700 p-8 shadow-sm">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center mx-auto mb-5">
                <Mail className="w-8 h-8 text-success-600 dark:text-success-400" />
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
                <Trans
                  t={t}
                  i18nKey="reset.sentMessage"
                  values={{ email }}
                  components={{ strong: <strong className="text-neutral-900 dark:text-white" /> }}
                />
              </p>
              <LocalizedLink to="/connexion">
                <Button variant="outline" className="w-full">{t('reset.backToLogin')}</Button>
              </LocalizedLink>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label={t('reset.emailLabel')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('reset.emailPlaceholder')}
                icon={<Mail className="w-4 h-4" />}
              />
              <Button type="submit" className="w-full" loading={loading}>{t('reset.submit')}</Button>
            </form>
          )}
        </div>

        <div className="text-center mt-6">
          <LocalizedLink to="/connexion" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
            <ArrowLeft className="w-4 h-4" /> {t('reset.backToLogin')}
          </LocalizedLink>
        </div>
      </div>
    </div>
  );
}
