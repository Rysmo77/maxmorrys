import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, addDoc } from 'firebase/firestore';
import { Icon, useToast, type IconName } from '@ds';
import { db } from '../../../config/db';
import { trackSubscribeNewsletter } from '../../../lib/tracking';
import LocalizedLink from '../../shared/LocalizedLink';
import FloatingCovers from './FloatingCovers';

/**
 * LE BAS DE PAGE ÉDITORIAL D'EDU — maquettes Catalogue / Fiche : la carte « lettre » qui
 * chevauche la nuit, « Ce qui guide chaque formation », puis la bande orange.
 * Il se pose JUSTE AU-DESSUS du pied de page du châssis (`Footer`), qui reste le seul pied.
 *
 * LA LETTRE EST LA VRAIE LETTRE. Elle écrit dans `newsletter` exactement comme
 * `NewsletterForm` (adresse en minuscules — condition du désabonnement —, consentement
 * daté, langue, six clés au plus : plafond de `firestore.rules`). La maquette promettait
 * « un e-mail quand une formation ouvre ou qu'un live est programmé » : aucun producteur
 * n'envoie cet e-mail-là aux abonnés de la lettre (`notifyOnPublish` ne vise que les comptes
 * qui l'ont demandé), donc la phrase décrit ce que la lettre fait réellement.
 */
const GUIDES: { key: 'g1' | 'g2' | 'g3'; icon: IconName }[] = [
  { key: 'g1', icon: 'check' },
  { key: 'g2', icon: 'lock' },
  { key: 'g3', icon: 'shield' },
];

interface EduPreFooterProps {
  /** Source de l'inscription (`newsletter.source`). */
  source: string;
}

export default function EduPreFooter({ source }: EduPreFooterProps) {
  const { t, i18n } = useTranslation('formations');
  const { t: tShared } = useTranslation('shared');
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const emailId = useId();
  const consentId = useId();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    if (!consent) {
      addToast('error', tShared('newsletter.consentRequired'));
      return;
    }
    setLoading(true);
    try {
      const now = new Date().toISOString();
      await addDoc(collection(db, 'newsletter'), {
        email: email.trim().toLowerCase(),
        subscribedAt: now,
        source,
        consent: true,
        consentAt: now,
        locale: i18n.language?.startsWith('en') ? 'en' : 'fr',
      });
      trackSubscribeNewsletter(source);
      addToast('success', tShared('newsletter.successToast'));
      setEmail('');
      setConsent(false);
    } catch {
      addToast('error', tShared('newsletter.errorToast'));
    }
    setLoading(false);
  };

  return (
    <section
      className="dk relative z-[1] px-6 pb-[72px] text-[color:color-mix(in_srgb,var(--paper-fixed)_80%,transparent)]"
      style={{ background: 'linear-gradient(180deg,transparent 0,transparent 150px,var(--night) 150px)', marginTop: '-120px' }}
    >
      <div className="mx-auto max-w-[1180px]">
        <div
          className="flex flex-wrap items-center justify-between gap-[30px] rounded-xl border px-6 py-8 wide:flex-nowrap wide:px-11 wide:py-10"
          style={{
            borderColor: 'color-mix(in srgb, var(--paper-fixed) 16%, transparent)',
            background: 'linear-gradient(120deg, var(--night-3) 0%, var(--night) 70%)',
            boxShadow: '0 30px 80px -30px color-mix(in srgb, var(--ink-fixed) 60%, transparent)',
          }}
        >
          <div className="max-w-[520px]">
            <h2 className="mm-d m-0 text-[34px] text-[color:var(--paper-fixed)] wide:text-[46px]">{t('v3.pre.newsTitle')}</h2>
            <p className="m-0 mb-[22px] mt-3 text-[15.5px]">{t('v3.pre.newsBody')}</p>
            <form onSubmit={submit} noValidate>
              <div className="flex flex-wrap gap-2">
                <div className="mm-field min-w-[200px] flex-1">
                  <div className="mm-field__box" style={{ background: 'var(--paper-fixed)' }}>
                    <input
                      id={emailId}
                      type="email"
                      placeholder=" "
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      inputMode="email"
                      required
                      style={{ color: 'var(--ink-fixed)' }}
                    />
                    <label htmlFor={emailId}>{t('v3.pre.emailLabel')}</label>
                  </div>
                </div>
                <button className="mm-pill" type="submit" disabled={loading}>
                  {loading ? tShared('newsletter.loading') : t('v3.pre.subscribe')}
                  <i aria-hidden="true"><Icon name="arrow-up-right" size={15} /></i>
                </button>
              </div>
              <div className="mm-on-color mt-3 flex items-start gap-2.5">
                <input
                  id={consentId}
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0"
                />
                <label htmlFor={consentId} className="text-xs leading-relaxed">
                  {tShared('newsletter.consentLabel')}{' '}
                  <LocalizedLink to="/legal/confidentialite" className="text-[color:var(--paper-fixed)] underline underline-offset-2">
                    {tShared('newsletter.consentPolicyLink')}
                  </LocalizedLink>
                </label>
              </div>
            </form>
          </div>
          <FloatingCovers className="hidden wide:block" />
        </div>

        <h2 className="mm-d m-0 mb-[30px] mt-[72px] max-w-[16ch] text-[34px] text-[color:var(--paper-fixed)] wide:mt-24 wide:text-[48px]">
          {t('v3.pre.guideTitle')}
        </h2>
        <div className="grid gap-8 stack:grid-cols-3">
          {GUIDES.map((g) => (
            <div key={g.key}>
              <span className="inline-flex items-center gap-2.5 text-[17px] font-semibold leading-none text-[color:var(--paper-fixed)]">
                <span className="text-[color:var(--mm-orange-f)]"><Icon name={g.icon} size={18} /></span>
                {t(`v3.pre.${g.key}Title`)}
              </span>
              <p className="m-0 mt-3 text-[14.5px] leading-[1.55]">{t(`v3.pre.${g.key}Body`)}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-5 rounded-xl px-6 py-7 text-[color:var(--ink-fixed)] wide:px-10 wide:py-[34px]" style={{ background: 'var(--mm-orange-f)' }}>
          <div>
            <b className="block font-display text-[30px] font-black leading-none wide:text-[40px]">{t('v3.pre.ctaTitle')}</b>
            <span className="text-[15px]">{t('v3.pre.ctaBody')}</span>
          </div>
          <LocalizedLink className="mm-pill is-ink" to="/formations">
            {t('v3.pre.ctaButton')}
            <i aria-hidden="true"><Icon name="arrow-up-right" size={15} /></i>
          </LocalizedLink>
        </div>
      </div>
    </section>
  );
}
