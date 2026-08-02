import { Trans, useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import LocalizedLink from '../../components/shared/LocalizedLink';
import SEOHead from '../../components/seo/SEOHead';

export default function CGV() {
  const { t } = useTranslation('legal');
  return (
    <div className="pt-24 pb-20">
      <SEOHead
        title={t('cgv.seoTitle')}
        description={t('cgv.seoDescription')}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <LocalizedLink to="/" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-brand-600 dark:hover:text-brand-400 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t('common.backToHome')}
        </LocalizedLink>

        <p className="text-xs font-bold tracking-[0.3em] uppercase text-brand-600 dark:text-brand-400 mb-3">
          {t('cgv.eyebrow')}
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-8">
          {t('cgv.title')}
        </h1>

        <div className="space-y-8 text-neutral-600 dark:text-neutral-400 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('cgv.art1.heading')}</h2>
            <p>
              <Trans i18nKey="cgv.art1.body" t={t} components={[<span />, <strong />]} />
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('cgv.art2.heading')}</h2>
            <p>{t('cgv.art2.intro')}</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><Trans i18nKey="cgv.art2.item1" t={t} components={[<span />, <strong />]} /></li>
              <li><Trans i18nKey="cgv.art2.item2" t={t} components={[<span />, <strong />]} /></li>
              <li><Trans i18nKey="cgv.art2.item3" t={t} components={[<span />, <strong />]} /></li>
              <li><Trans i18nKey="cgv.art2.item4" t={t} components={[<span />, <strong />]} /></li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('cgv.art3.heading')}</h2>
            <p>{t('cgv.art3.intro')}</p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li><Trans i18nKey="cgv.art3.item1" t={t} components={[<span />, <strong />]} /></li>
              <li><Trans i18nKey="cgv.art3.item2" t={t} components={[<span />, <strong />]} /></li>
              <li><Trans i18nKey="cgv.art3.item3" t={t} components={[<span />, <strong />]} /></li>
              <li><Trans i18nKey="cgv.art3.item4" t={t} components={[<span />, <strong />]} /></li>
              <li><Trans i18nKey="cgv.art3.item5" t={t} components={[<span />, <strong />]} /></li>
              <li><Trans i18nKey="cgv.art3.item6" t={t} components={[<span />, <strong />]} /></li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('cgv.art4.heading')}</h2>
            <p>{t('cgv.art4.p1')}</p>
            <p className="mt-2">{t('cgv.art4.p2')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('cgv.art5.heading')}</h2>

            <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mt-4 mb-1">{t('cgv.art5.sub51Heading')}</h3>
            <p>{t('cgv.art5.sub51Body')}</p>

            <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mt-4 mb-1">{t('cgv.art5.sub52Heading')}</h3>
            <p>
              <Trans i18nKey="cgv.art5.sub52Body" t={t} components={[<span />, <strong />]} />
            </p>

            <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mt-4 mb-1">{t('cgv.art5.sub53Heading')}</h3>
            <p>
              <Trans i18nKey="cgv.art5.sub53Body" t={t} components={[<span />, <strong />]} />
            </p>

            <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mt-4 mb-1">{t('cgv.art5.sub54Heading')}</h3>
            <p>{t('cgv.art5.sub54Body')}</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><Trans i18nKey="cgv.art5.sub54Item1" t={t} components={[<span />, <strong />, <span />, <strong />]} /></li>
              <li>{t('cgv.art5.sub54Item2')}</li>
              <li>{t('cgv.art5.sub54Item3')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('cgv.art6.heading')}</h2>
            <p>{t('cgv.art6.intro')}</p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li>{t('cgv.art6.item1')}</li>
              <li><Trans i18nKey="cgv.art6.item2" t={t} components={[<span />, <strong />]} /></li>
              <li>{t('cgv.art6.item3')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('cgv.art7.heading')}</h2>
            <p>{t('cgv.art7.p1')}</p>
            <p className="mt-2">{t('cgv.art7.p2')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('cgv.art8.heading')}</h2>
            <p>{t('cgv.art8.p1')}</p>
            <p className="mt-2">{t('cgv.art8.p2')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('cgv.art9.heading')}</h2>
            <p>{t('cgv.art9.p1')}</p>
            <p className="mt-2">
              <Trans
                i18nKey="cgv.art9.p2"
                t={t}
                components={[<span />, <strong />, <span />, <LocalizedLink to="/legal/confidentialite" className="text-brand-600 dark:text-brand-400 hover:underline" />]}
              />
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('cgv.art10.heading')}</h2>
            <p>{t('cgv.art10.body')}</p>
          </section>

          <p className="text-sm text-neutral-400 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            {t('common.lastUpdatedApril')}
          </p>
        </div>
      </div>
    </div>
  );
}
