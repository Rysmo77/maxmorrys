import { Trans, useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import LocalizedLink from '../../components/shared/LocalizedLink';
import SEOHead from '../../components/seo/SEOHead';

export default function MentionsLegales() {
  const { t } = useTranslation('legal');
  return (
    <div className="pt-24 pb-20">
      <SEOHead
        title={t('mentions.seoTitle')}
        description={t('mentions.seoDescription')}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <LocalizedLink to="/" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-brand-600 dark:hover:text-brand-400 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t('common.backToHome')}
        </LocalizedLink>

        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-8">{t('mentions.title')}</h1>

        <div className="space-y-8 text-neutral-600 dark:text-neutral-400 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('mentions.editor.heading')}</h2>
            <p>
              <Trans i18nKey="mentions.editor.body" t={t} components={[<span />, <strong />]} />
            </p>
            <ul className="mt-3 space-y-1">
              <li><Trans i18nKey="mentions.editor.companyName" t={t} components={[<span />, <strong />]} /></li>
              <li><Trans i18nKey="mentions.editor.legalForm" t={t} components={[<span />, <strong />]} /></li>
              <li><Trans i18nKey="mentions.editor.capital" t={t} components={[<span />, <strong />]} /></li>
              <li><Trans i18nKey="mentions.editor.rccm" t={t} components={[<span />, <strong />]} /></li>
              <li><Trans i18nKey="mentions.editor.ninea" t={t} components={[<span />, <strong />]} /></li>
              <li><Trans i18nKey="mentions.editor.headquarters" t={t} components={[<span />, <strong />]} /></li>
              <li><Trans i18nKey="mentions.editor.publicationDirector" t={t} components={[<span />, <strong />]} /></li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('mentions.hosting.heading')}</h2>
            <p>
              <Trans i18nKey="mentions.hosting.body" t={t} components={[<span />, <strong />]} />
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('mentions.personalData.heading')}</h2>
            <p>{t('mentions.personalData.body')}</p>
            <p className="mt-2">
              <Trans
                i18nKey="mentions.personalData.more"
                t={t}
                components={[<span />, <LocalizedLink to="/legal/confidentialite" className="text-brand-600 dark:text-brand-400 hover:underline" />]}
              />
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('mentions.cookies.heading')}</h2>
            <p>
              <Trans
                i18nKey="mentions.cookies.body"
                t={t}
                components={[<span />, <LocalizedLink to="/legal/cookies" className="text-brand-600 dark:text-brand-400 hover:underline" />]}
              />
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{t('mentions.liability.heading')}</h2>
            <p>{t('mentions.liability.body')}</p>
          </section>

          <p className="text-sm text-neutral-400 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            {t('common.lastUpdatedApril')}
          </p>
        </div>
      </div>
    </div>
  );
}
