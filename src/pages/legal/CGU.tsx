import { Trans, useTranslation } from 'react-i18next';
import LocalizedLink from '../../components/shared/LocalizedLink';
import { LegalPage } from '../../components/site/LegalPage';

export default function CGU() {
  const { t } = useTranslation('legal');
  return (
    <LegalPage
      current="cgu"
      titleLines={t('cgu.titleLines', { returnObjects: true }) as string[]}
      seoTitle={t('cgu.seoTitle')}
      seoDescription={t('cgu.seoDescription')}
      version={t('cgu.version')}
    >
        <section>
          <h2>{t('cgu.art1.heading')}</h2>
          <p>
            <Trans i18nKey="cgu.art1.body" t={t} components={[<span />, <strong />]} />
          </p>
        </section>

        <section>
          <h2>{t('cgu.art2.heading')}</h2>
          <p>{t('cgu.art2.body')}</p>
        </section>

        <section>
          <h2>{t('cgu.art3.heading')}</h2>
          <p>{t('cgu.art3.intro')}</p>
          <ul>
            <li>{t('cgu.art3.item1')}</li>
            <li>{t('cgu.art3.item2')}</li>
            <li>{t('cgu.art3.item3')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('cgu.art4.heading')}</h2>
          <p>{t('cgu.art4.body')}</p>
        </section>

        <section>
          <h2>{t('cgu.art5.heading')}</h2>
          <p>{t('cgu.art5.intro')}</p>
          <ul>
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
                components={[<span />, <LocalizedLink to="/legal/confidentialite" className="text-forme underline underline-offset-2" />]}
              />
            </li>
          </ul>
        </section>

        <section>
          <h2>{t('cgu.art6.heading')}</h2>
          <p>{t('cgu.art6.body')}</p>
        </section>

        <section>
          <h2>{t('cgu.art7.heading')}</h2>
          <p>{t('cgu.art7.body')}</p>
        </section>

        <section>
          <h2>{t('cgu.art8.heading')}</h2>
          <p>{t('cgu.art8.body')}</p>
        </section>

        <section>
          <h2>{t('cgu.contact.heading')}</h2>
          <p>
            <Trans i18nKey="cgu.contact.body" t={t} components={[<span />, <strong />]} />
          </p>
        </section>

        <p className="text-sm text-ink-2 pt-4 border-t border-[color:var(--line)]">
          {t('common.lastUpdatedMay')}
        </p>
    </LegalPage>
  );
}
