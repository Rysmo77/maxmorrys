import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, MessageCircle, Printer, ArrowLeft, Check, AlertTriangle } from 'lucide-react';
import LocalizedLink from '../components/shared/LocalizedLink';
import SEOHead from '../components/seo/SEOHead';
import { getAgencyQuote } from '../lib/firestore';
import { useFormat } from '../hooks/useFormat';
import { captureError } from '../lib/sentry';
import { universeThemes } from '../lib/sectionThemes';
import { computeTotals, depositAmount, balanceAmount, findPack, findPlan } from '../lib/agency/offer';
import { whatsappUrl } from '../lib/agency/whatsapp';
import type { AgencyQuote } from '../types';

const theme = universeThemes.agency;

/**
 * Récapitulatif partageable par lien.
 *
 * Le document lu ici ne contient AUCUNE donnée personnelle (cf. `agency_quotes` dans
 * firestore.rules) : le lien circule sur WhatsApp, il doit pouvoir être transféré sans
 * exposer le téléphone ou l'email du prospect.
 *
 * `noIndex` : un récapitulatif client n'a rien à faire dans les résultats de recherche.
 */
export default function AgenceDevis() {
  const { ref } = useParams<{ ref: string }>();
  const { t } = useTranslation('agency');
  const { formatPrice, formatDate } = useFormat();

  const [quote, setQuote] = useState<AgencyQuote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ref) { setLoading(false); return; }
    let active = true;
    getAgencyQuote(ref)
      .then((q) => { if (active) { setQuote(q); setLoading(false); } })
      .catch((error: unknown) => {
        captureError(error, { context: 'Load agency quote failed' });
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [ref]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className={`w-8 h-8 animate-spin ${theme.spinner}`} aria-label="…" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <SEOHead title={t('quote.notFound.title')} description={t('quote.notFound.text')} noIndex />
        <div className="max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-5" aria-hidden="true" />
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white mb-3">
            {t('quote.notFound.title')}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
            {t('quote.notFound.text')}
          </p>
          <LocalizedLink
            to="/agence"
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-colors ${theme.buttonSolid}`}
          >
            {t('quote.notFound.cta')}
          </LocalizedLink>
        </div>
      </div>
    );
  }

  const pack = findPack(quote.pack);
  const plan = findPlan(quote.plan);
  // Recalcul depuis la grille courante plutôt que d'afficher les montants stockés :
  // si la grille a bougé depuis l'émission, le total resterait cohérent avec ses lignes.
  const totals = computeTotals(quote.pack, quote.plan);
  const expired = new Date(quote.expiresAt) < new Date();

  const whatsappHref = whatsappUrl(
    `${t('whatsapp.quoteIntro')} ${quote.ref} — ${quote.businessName}`,
  );

  const packFeatures = pack
    ? (t(`packs.${quote.pack}.features`, { returnObjects: true }) as string[])
    : [];
  const planFeatures = plan
    ? (t(`plans.${quote.plan}.features`, { returnObjects: true }) as string[])
    : [];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-10 sm:py-16 print:bg-white print:py-0">
      <SEOHead title={t('quote.seoTitle')} description={t('quote.title')} noIndex />

      {/* `print:` neutralise ombres, arrondis et fonds pour une sortie PDF propre. */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="bg-white dark:bg-neutral-800 rounded-3xl border border-neutral-200 dark:border-neutral-700 overflow-hidden print:border-0 print:rounded-none print:shadow-none">

          {/* En-tête — aplat lagoon-500 avec texte foncé : signature de l'univers Agence */}
          <header className={`px-7 sm:px-10 py-8 ${theme.signatureFill}`}>
            <p className="text-xs font-bold tracking-[0.3em] uppercase opacity-70 mb-2">
              {t('quote.eyebrow')}
            </p>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">{t('quote.title')}</h1>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm font-semibold">
              <span>{t('quote.forBusiness')} : {quote.businessName}{quote.city ? `, ${quote.city}` : ''}</span>
              <span className="tabular-nums">{t('quote.reference')} : {quote.ref}</span>
            </div>
          </header>

          <div className="px-7 sm:px-10 py-8 space-y-8">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-neutral-500 tabular-nums">
              <span>{t('quote.issuedOn', { date: formatDate(quote.createdAt) })}</span>
              <span>{t('quote.validUntil', { date: formatDate(quote.expiresAt) })}</span>
            </div>

            {expired && (
              <p className="rounded-xl bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 px-4 py-3 text-sm text-warning-800 dark:text-warning-300">
                {t('quote.expired')}
              </p>
            )}

            {/* Mise en place */}
            {pack && (
              <section>
                <h2 className="text-xs font-bold tracking-[0.25em] uppercase text-neutral-400 mb-3">
                  {t('quote.setupSection')}
                </h2>
                <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
                  <p className="text-xl font-black text-neutral-900 dark:text-white">
                    {t(`packs.${quote.pack}.name`)}
                  </p>
                  <p className="text-xl font-black text-neutral-900 dark:text-white tabular-nums whitespace-nowrap">
                    {formatPrice(totals.packPrice)}
                  </p>
                </div>
                <ul className="space-y-2">
                  {packFeatures.map((f) => (
                    <li key={f} className="flex gap-2.5 text-sm text-neutral-600 dark:text-neutral-400">
                      <Check className="w-4 h-4 text-lagoon-600 dark:text-lagoon-400 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Accompagnement */}
            {plan && (
              <section className="pt-8 border-t border-neutral-200 dark:border-neutral-700">
                <h2 className="text-xs font-bold tracking-[0.25em] uppercase text-neutral-400 mb-3">
                  {t('quote.planSection')}
                </h2>
                <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
                  <p className="text-xl font-black text-neutral-900 dark:text-white">
                    {t(`plans.${quote.plan}.name`)}
                  </p>
                  <p className="text-right tabular-nums whitespace-nowrap">
                    <span className="text-xl font-black text-neutral-900 dark:text-white block">
                      {formatPrice(totals.planSetup)}
                    </span>
                    <span className={`text-sm font-bold ${theme.accentText}`}>
                      + {formatPrice(totals.planMonthly)} / {t('quote.monthly')}
                    </span>
                  </p>
                </div>
                <ul className="space-y-2">
                  {planFeatures.map((f) => (
                    <li key={f} className="flex gap-2.5 text-sm text-neutral-600 dark:text-neutral-400">
                      <Check className="w-4 h-4 text-lagoon-600 dark:text-lagoon-400 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {totals.commitmentMonths && totals.commitmentTotal && (
                  <p className="mt-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300 tabular-nums">
                    {t('quote.commitmentTotal', {
                      total: formatPrice(totals.commitmentTotal),
                      months: totals.commitmentMonths,
                    })}
                  </p>
                )}
              </section>
            )}

            {/* Totaux et échéancier */}
            {totals.upfront > 0 && (
              <section className="pt-8 border-t border-neutral-200 dark:border-neutral-700">
                <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
                  <p className="text-base font-black text-neutral-900 dark:text-white">
                    {t('quote.upfrontTotal')}
                  </p>
                  <p className="text-3xl font-black text-neutral-900 dark:text-white tabular-nums whitespace-nowrap">
                    {formatPrice(totals.upfront)}
                  </p>
                </div>
                <dl className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 px-4 py-3">
                    <dt className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-0.5">
                      {t('quote.deposit')}
                    </dt>
                    <dd className="font-black text-neutral-900 dark:text-white tabular-nums">
                      {formatPrice(depositAmount(totals.upfront))}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 px-4 py-3">
                    <dt className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-0.5">
                      {t('quote.balance')}
                    </dt>
                    <dd className="font-black text-neutral-900 dark:text-white tabular-nums">
                      {formatPrice(balanceAmount(totals.upfront))}
                    </dd>
                  </div>
                </dl>
                <p className="text-xs text-neutral-500 mt-3">{t('quote.notIncluded')}</p>
              </section>
            )}

            <p className="text-xs text-neutral-500 leading-relaxed pt-6 border-t border-neutral-200 dark:border-neutral-700">
              {t('quote.disclaimer')}
            </p>

            <div className="flex flex-wrap gap-3 print:hidden">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-colors ${theme.buttonSolid}`}
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                {t('quote.cta')}
              </a>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:border-lagoon-500 transition-colors"
              >
                <Printer className="w-4 h-4" aria-hidden="true" />
                {t('quote.print')}
              </button>
            </div>
          </div>
        </div>

        <LocalizedLink
          to="/agence"
          className={`inline-flex items-center gap-2 mt-6 text-sm font-semibold print:hidden ${theme.accentText}`}
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t('quote.backToOffer')}
        </LocalizedLink>
      </div>
    </div>
  );
}
