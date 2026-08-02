import { Trans, useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import LocalizedLink from '../../components/shared/LocalizedLink';
import SEOHead from '../../components/seo/SEOHead';

export default function CookiesPage() {
  const { t } = useTranslation('legal');
  return (
    <div className="pt-24 pb-20">
      <SEOHead
        title={t('cookies.seoTitle')}
        description={t('cookies.seoDescription')}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <LocalizedLink to="/" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-brand-600 dark:hover:text-brand-400 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t('common.backToHome')}
        </LocalizedLink>

        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-8">{t('cookies.title')}</h1>

        <div className="space-y-8 text-neutral-600 dark:text-neutral-400 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('cookies.what.heading')}</h2>
            <p>{t('cookies.what.p1')}</p>
            <p className="mt-2">
              <Trans i18nKey="cookies.what.p2" t={t} components={[<span />, <strong />]} />
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('cookies.types.heading')}</h2>

            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mt-4 mb-2">{t('cookies.types.essentialHeading')}</h3>
            <p>{t('cookies.types.essentialBody')}</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>{t('cookies.types.essentialItem1')}</li>
              <li>{t('cookies.types.essentialItem2')}</li>
              <li>{t('cookies.types.essentialItem3')}</li>
              <li>{t('cookies.types.essentialItem4')}</li>
            </ul>

            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mt-4 mb-2">{t('cookies.types.analyticsHeading')}</h3>
            <p>{t('cookies.types.analyticsBody')}</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>{t('cookies.types.analyticsItem1')}</li>
              <li>{t('cookies.types.analyticsItem2')}</li>
            </ul>

            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mt-4 mb-2">{t('cookies.types.marketingHeading')}</h3>
            <p>{t('cookies.types.marketingBody')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('cookies.preferences.heading')}</h2>
            <p>{t('cookies.preferences.p1')}</p>
            <p className="mt-2">{t('cookies.preferences.p2')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('cookies.retention.heading')}</h2>
            <p>{t('cookies.retention.body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('cookies.legal.heading')}</h2>
            <p>{t('cookies.legal.intro')}</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>{t('cookies.legal.item1')}</li>
              <li>{t('cookies.legal.item2')}</li>
              <li>{t('cookies.legal.item3')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('cookies.contact.heading')}</h2>
            <p>
              <Trans i18nKey="cookies.contact.body" t={t} components={[<span />, <strong />]} />
            </p>
          </section>

          <p className="text-sm text-neutral-400 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            {t('common.lastUpdatedApril')}
          </p>
        </div>
      </div>
    </div>
  );
}
