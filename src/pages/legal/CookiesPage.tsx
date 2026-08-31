import { Trans, useTranslation } from 'react-i18next';
import { LegalPage } from '../../components/site/LegalPage';

export default function CookiesPage() {
  const { t } = useTranslation('legal');
  return (
    <LegalPage
      current="cookies"
      titleLines={t('cookies.titleLines', { returnObjects: true }) as string[]}
      seoTitle={t('cookies.seoTitle')}
      seoDescription={t('cookies.seoDescription')}
      version={t('cookies.version')}
    >
        <section>
          <h2>{t('cookies.what.heading')}</h2>
          <p>{t('cookies.what.p1')}</p>
          <p className="mt-2">
            <Trans i18nKey="cookies.what.p2" t={t} components={[<span />, <strong />]} />
          </p>
        </section>

        <section>
          <h2>{t('cookies.types.heading')}</h2>

          <h3 className="text-lg font-semibold text-ink-2 mt-4 mb-2">{t('cookies.types.essentialHeading')}</h3>
          <p>{t('cookies.types.essentialBody')}</p>
          <ul>
            <li>{t('cookies.types.essentialItem1')}</li>
            <li>{t('cookies.types.essentialItem2')}</li>
            <li>{t('cookies.types.essentialItem3')}</li>
            <li>{t('cookies.types.essentialItem4')}</li>
          </ul>

          <h3 className="text-lg font-semibold text-ink-2 mt-4 mb-2">{t('cookies.types.analyticsHeading')}</h3>
          <p>{t('cookies.types.analyticsBody')}</p>
          <ul>
            <li>{t('cookies.types.analyticsItem1')}</li>
            <li>{t('cookies.types.analyticsItem2')}</li>
          </ul>

          <h3 className="text-lg font-semibold text-ink-2 mt-4 mb-2">{t('cookies.types.marketingHeading')}</h3>
          <p>{t('cookies.types.marketingBody')}</p>
        </section>

        <section>
          <h2>{t('cookies.preferences.heading')}</h2>
          <p>{t('cookies.preferences.p1')}</p>
          <p className="mt-2">{t('cookies.preferences.p2')}</p>
        </section>

        <section>
          <h2>{t('cookies.retention.heading')}</h2>
          <p>{t('cookies.retention.body')}</p>
        </section>

        <section>
          <h2>{t('cookies.legal.heading')}</h2>
          <p>{t('cookies.legal.intro')}</p>
          <ul>
            <li>{t('cookies.legal.item1')}</li>
            <li>{t('cookies.legal.item2')}</li>
            <li>{t('cookies.legal.item3')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('cookies.contact.heading')}</h2>
          <p>
            <Trans i18nKey="cookies.contact.body" t={t} components={[<span />, <strong />]} />
          </p>
        </section>

        <p className="text-sm text-ink-2 pt-4 border-t border-[color:var(--line)]">
          {t('common.lastUpdatedApril')}
        </p>
    </LegalPage>
  );
}
