import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, ArrowRight } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { trackSubscribeNewsletter } from '../../lib/tracking';
import { useToast } from '../ui/Toast';
import LocalizedLink from './LocalizedLink';

interface NewsletterFormProps {
  variant?: 'inline' | 'card';
  source?: string;
}

/**
 * Inscription à la newsletter.
 *
 * ⚠️ Le consentement est explicite et **jamais pré-coché** : `consent` démarre à `false`,
 * et la soumission est refusée tant qu'il n'est pas donné. Le champ `consentAt` horodate
 * le recueil.
 *
 * ⚠️ La règle Firestore de la collection `newsletter` borne le nombre de clés du document.
 * Ajouter un champ ici sans relever ce plafond ferait échouer **toutes** les inscriptions.
 * Les deux ont été modifiés ensemble — voir `firestore.rules` et `docs/LEGAL-TODO.md §7`.
 */
export default function NewsletterForm({ variant = 'inline', source = 'footer' }: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const { t } = useTranslation('shared');
  const consentId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    if (!consent) {
      addToast('error', t('newsletter.consentRequired'));
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'newsletter'), {
        email: email.trim(),
        subscribedAt: new Date().toISOString(),
        source,
        consent: true,
        consentAt: new Date().toISOString(),
      });
      trackSubscribeNewsletter(source || 'newsletter');
      addToast('success', t('newsletter.successToast'));
      setEmail('');
      setConsent(false);
    } catch {
      addToast('error', t('newsletter.errorToast'));
    }
    setLoading(false);
  };

  /** Case de consentement + renvoi vers la politique de confidentialité. */
  const consentField = (tone: 'light' | 'dark') => (
    <div className="flex items-start gap-2.5">
      <input
        id={consentId}
        type="checkbox"
        checked={consent}
        onChange={(e) => setConsent(e.target.checked)}
        className={`mt-0.5 h-4 w-4 shrink-0 rounded border ${
          tone === 'dark'
            ? 'border-white/40 bg-white/10 text-brand-700 focus:ring-white/40'
            : 'border-neutral-300 dark:border-neutral-600 text-brand-600 focus:ring-brand-500'
        }`}
      />
      <label
        htmlFor={consentId}
        className={`text-xs leading-relaxed ${
          tone === 'dark' ? 'text-brand-100' : 'text-neutral-500 dark:text-neutral-400'
        }`}
      >
        {t('newsletter.consentLabel')}{' '}
        <LocalizedLink
          to="/legal/confidentialite"
          className={`underline underline-offset-2 ${
            tone === 'dark' ? 'text-white' : 'text-brand-600 dark:text-brand-400'
          }`}
        >
          {t('newsletter.consentPolicyLink')}
        </LocalizedLink>
      </label>
    </div>
  );

  if (variant === 'card') {
    return (
      <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold">{t('newsletter.cardTitle')}</h3>
        </div>
        <p className="text-brand-100 text-sm mb-6 leading-relaxed">
          {t('newsletter.cardText')}
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <label htmlFor="newsletter-card-email" className="sr-only">{t('newsletter.emailLabel')}</label>
            <input
              id="newsletter-card-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('newsletter.emailPlaceholder')}
              required
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-brand-200 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            <button
              type="submit"
              disabled={loading}
              aria-label={loading ? t('newsletter.submittingAria') : t('newsletter.submitAria')}
              className="px-4 py-2.5 bg-white text-brand-700 rounded-xl font-semibold text-sm hover:bg-brand-50 transition-colors disabled:opacity-50"
            >
              {loading ? t('newsletter.loading') : t('newsletter.submit')}
            </button>
          </div>
          {consentField('dark')}
        </form>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" aria-hidden="true" />
          <label htmlFor="newsletter-inline-email" className="sr-only">{t('newsletter.emailLabel')}</label>
          <input
            id="newsletter-inline-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('newsletter.emailPlaceholder')}
            required
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          aria-label={loading ? t('newsletter.submittingAria') : t('newsletter.submitAria')}
          className="px-4 py-2.5 bg-brand-600 text-white rounded-xl font-semibold text-sm hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      {consentField('light')}
    </form>
  );
}
