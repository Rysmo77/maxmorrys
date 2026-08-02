import { Trans, useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import LocalizedLink from '../../components/shared/LocalizedLink';
import SEOHead from '../../components/seo/SEOHead';

export default function CGU() {
  const { t } = useTranslation('legal');
  return (
    <div className="pt-24 pb-20">
      <SEOHead
        title={t('cgu.seoTitle')}
        description={t('cgu.seoDescription')}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <LocalizedLink to="/" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-brand-600 dark:hover:text-brand-400 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t('common.backToHome')}
        </LocalizedLink>

        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-8">{t('cgu.title')}</h1>

        <div className="space-y-8 text-neutral-600 dark:text-neutral-400 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('cgu.art1.heading')}</h2>
            <p>
              <Trans i18nKey="cgu.art1.body" t={t} components={[<span />, <strong />]} />
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('cgu.art2.heading')}</h2>
            <p>{t('cgu.art2.body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('cgu.art3.heading')}</h2>
            <p>{t('cgu.art3.intro')}</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>{t('cgu.art3.item1')}</li>
              <li>{t('cgu.art3.item2')}</li>
              <li>{t('cgu.art3.item3')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('cgu.art4.heading')}</h2>
            <p>{t('cgu.art4.body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('cgu.art5.heading')}</h2>
            <p>{t('cgu.art5.intro')}</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <Trans i18nKey="cgu.art5.item1" t={t} components={[<span />, <strong />]} />
              </li>
              <li>
                <Trans i18nKey="cgu.art5.item2" t={t} components={[<span />, <strong />, <span />, <strong />, <span />, <strong />]} />
              </li>
              <li>
                <Trans i18nKey="cgu.art5.item3" t={t} components={[<span />, <strong />, <span />, <strong />, <span />, <em />]} />
              </li>
              <li>
                <Trans
                  i18nKey="cgu.art5.item4"
                  t={t}
                  components={[<span />, <LocalizedLink to="/legal/confidentialite" className="text-brand-600 dark:text-brand-400 underline underline-offset-2" />]}
                />
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('cgu.art6.heading')}</h2>
            <p>{t('cgu.art6.body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('cgu.art7.heading')}</h2>
            <p>{t('cgu.art7.body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('cgu.art8.heading')}</h2>
            <p>{t('cgu.art8.body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('cgu.contact.heading')}</h2>
            <p>
              <Trans i18nKey="cgu.contact.body" t={t} components={[<span />, <strong />]} />
            </p>
          </section>

          <p className="text-sm text-neutral-400 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            {t('common.lastUpdatedMay')}
          </p>
        </div>
      </div>
    </div>
  );
}
