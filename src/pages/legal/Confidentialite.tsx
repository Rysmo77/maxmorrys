import { Trans, useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import LocalizedLink from '../../components/shared/LocalizedLink';
import SEOHead from '../../components/seo/SEOHead';

export default function Confidentialite() {
  const { t } = useTranslation('legal');
  return (
    <div className="pt-24 pb-20">
      <SEOHead
        title={t('privacy.seoTitle')}
        description={t('privacy.seoDescription')}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <LocalizedLink to="/" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-brand-600 dark:hover:text-brand-400 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t('common.backToHome')}
        </LocalizedLink>

        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-8">{t('privacy.title')}</h1>

        <div className="space-y-8 text-neutral-600 dark:text-neutral-400 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('privacy.intro.heading')}</h2>
            <p><Trans i18nKey="privacy.intro.p1" t={t} components={[<span />, <strong />]} /></p>
            <p className="mt-2">{t('privacy.intro.p2')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('privacy.collected.heading')}</h2>
            <p>{t('privacy.collected.intro')}</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>{t('privacy.collected.item1')}</li>
              <li>{t('privacy.collected.item2')}</li>
              <li>{t('privacy.collected.item3')}</li>
              <li>{t('privacy.collected.item4')}</li>
              <li>{t('privacy.collected.item5')}</li>
              <li>{t('privacy.collected.item6')}</li>
            </ul>
            <p className="mt-2 text-sm">
              <Trans i18nKey="privacy.collected.note" t={t} components={[<span />, <strong />, <span />, <em />]} />
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('privacy.purposes.heading')}</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>{t('privacy.purposes.item1')}</li>
              <li>{t('privacy.purposes.item2')}</li>
              <li>{t('privacy.purposes.item3')}</li>
              <li>{t('privacy.purposes.item4')}</li>
              <li>{t('privacy.purposes.item5')}</li>
              <li>{t('privacy.purposes.item6')}</li>
              <li>{t('privacy.purposes.item7')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('privacy.retention.heading')}</h2>
            <p>{t('privacy.retention.intro')}</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>{t('privacy.retention.item1')}</li>
              <li>{t('privacy.retention.item2')}</li>
              <li>{t('privacy.retention.item3')}</li>
              <li>{t('privacy.retention.item4')}</li>
              <li>{t('privacy.retention.item5')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('privacy.rights.heading')}</h2>
            <p>{t('privacy.rights.intro')}</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>{t('privacy.rights.item1')}</li>
              <li>{t('privacy.rights.item2')}</li>
              <li>{t('privacy.rights.item3')}</li>
              <li>{t('privacy.rights.item4')}</li>
              <li>{t('privacy.rights.item5')}</li>
              <li>{t('privacy.rights.item6')}</li>
            </ul>
            <p className="mt-2">{t('privacy.rights.contact')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('privacy.processors.heading')}</h2>
            <p>{t('privacy.processors.intro')}</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>{t('privacy.processors.item1')}</li>
              <li>{t('privacy.processors.item2')}</li>
              <li>{t('privacy.processors.item3')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('privacy.contact.heading')}</h2>
            <p>{t('privacy.contact.intro')}</p>
            <p className="mt-2">{t('privacy.contact.email')}</p>
            <p>
              <Trans
                i18nKey="privacy.contact.cdp"
                t={t}
                components={[<span />, <a href="https://www.cdp.sn" target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 hover:underline" />]}
              />
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
