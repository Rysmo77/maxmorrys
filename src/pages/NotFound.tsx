import { useTranslation } from 'react-i18next';
import LocalizedLink from '../components/shared/LocalizedLink';
import SEOHead from '../components/seo/SEOHead';

export default function NotFound() {
  const { t } = useTranslation('errors');
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
      <SEOHead title={t('notFound.seoTitle')} noIndex />
      <div className="max-w-md w-full text-center space-y-6">
        <div>
          <p className="text-sm font-semibold tracking-wider text-brand-600 uppercase mb-2">{t('notFound.label')}</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-2">
            {t('notFound.title')}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t('notFound.text')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <LocalizedLink
            to="/"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors"
          >
            {t('notFound.home')}
          </LocalizedLink>
          <LocalizedLink
            to="/blog"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            {t('notFound.blog')}
          </LocalizedLink>
        </div>
      </div>
    </div>
  );
}
