import { Trans, useTranslation } from 'react-i18next';
import LocalizedLink from '../../components/shared/LocalizedLink';
import { LegalPage } from '../../components/site/LegalPage';

export default function CGV() {
  const { t } = useTranslation('legal');
  return (
    <LegalPage
      current="cgv"
      titleLines={t('cgv.titleLines', { returnObjects: true }) as string[]}
      seoTitle={t('cgv.seoTitle')}
      seoDescription={t('cgv.seoDescription')}
      version={t('cgv.version')}
    >

        <section>
          <h2>{t('cgv.art1.heading')}</h2>
          <p>
            <Trans i18nKey="cgv.art1.body" t={t} components={[<span />, <strong />]} />
          </p>
        </section>

        <section>
          <h2>{t('cgv.art2.heading')}</h2>
          <p>{t('cgv.art2.intro')}</p>
          <ul>
            <li><Trans i18nKey="cgv.art2.item1" t={t} components={[<span />, <strong />]} /></li>
            <li><Trans i18nKey="cgv.art2.item2" t={t} components={[<span />, <strong />]} /></li>
            <li><Trans i18nKey="cgv.art2.item3" t={t} components={[<span />, <strong />]} /></li>
            <li><Trans i18nKey="cgv.art2.item4" t={t} components={[<span />, <strong />]} /></li>
          </ul>
        </section>

        <section>
          <h2>{t('cgv.art3.heading')}</h2>
          <p>{t('cgv.art3.intro')}</p>
          <ul>
            <li><Trans i18nKey="cgv.art3.item1" t={t} components={[<span />, <strong />]} /></li>
            <li><Trans i18nKey="cgv.art3.item2" t={t} components={[<span />, <strong />]} /></li>
            <li><Trans i18nKey="cgv.art3.item3" t={t} components={[<span />, <strong />]} /></li>
            <li><Trans i18nKey="cgv.art3.item4" t={t} components={[<span />, <strong />]} /></li>
            <li><Trans i18nKey="cgv.art3.item5" t={t} components={[<span />, <strong />]} /></li>
            <li><Trans i18nKey="cgv.art3.item6" t={t} components={[<span />, <strong />]} /></li>
          </ul>
        </section>

        <section>
          <h2>{t('cgv.art4.heading')}</h2>
          <p>{t('cgv.art4.p1')}</p>
          <p className="mt-2">{t('cgv.art4.p2')}</p>
        </section>

        <section>
          <h2>{t('cgv.art5.heading')}</h2>

          <h3 className="text-base font-semibold text-ink-2 mt-4 mb-1">{t('cgv.art5.sub51Heading')}</h3>
          <p>{t('cgv.art5.sub51Body')}</p>

          <h3 className="text-base font-semibold text-ink-2 mt-4 mb-1">{t('cgv.art5.sub52Heading')}</h3>
          <p>
            <Trans i18nKey="cgv.art5.sub52Body" t={t} components={[<span />, <strong />]} />
          </p>

          <h3 className="text-base font-semibold text-ink-2 mt-4 mb-1">{t('cgv.art5.sub53Heading')}</h3>
          <p>
            <Trans i18nKey="cgv.art5.sub53Body" t={t} components={[<span />, <strong />]} />
          </p>

          <h3 className="text-base font-semibold text-ink-2 mt-4 mb-1">{t('cgv.art5.sub54Heading')}</h3>
          <p>{t('cgv.art5.sub54Body')}</p>
          <ul>
            <li><Trans i18nKey="cgv.art5.sub54Item1" t={t} components={[<span />, <strong />, <span />, <strong />]} /></li>
            <li>{t('cgv.art5.sub54Item2')}</li>
            <li>{t('cgv.art5.sub54Item3')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('cgv.art6.heading')}</h2>
          <p>{t('cgv.art6.intro')}</p>
          <ul>
            <li>{t('cgv.art6.item1')}</li>
            <li><Trans i18nKey="cgv.art6.item2" t={t} components={[<span />, <strong />]} /></li>
            <li>{t('cgv.art6.item3')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('cgv.art7.heading')}</h2>
          <p>{t('cgv.art7.p1')}</p>
          <p className="mt-2">{t('cgv.art7.p2')}</p>
        </section>

        <section>
          <h2>{t('cgv.art8.heading')}</h2>
          <p>{t('cgv.art8.p1')}</p>
          <p className="mt-2">{t('cgv.art8.p2')}</p>
        </section>

        <section>
          <h2>{t('cgv.art9.heading')}</h2>
          <p>{t('cgv.art9.p1')}</p>
          <p className="mt-2">
            <Trans
              i18nKey="cgv.art9.p2"
              t={t}
              components={[<span />, <strong />, <span />, <LocalizedLink to="/legal/confidentialite" className="text-forme hover:underline" />]}
            />
          </p>
        </section>

        <section>
          <h2>{t('cgv.art10.heading')}</h2>
          <p>{t('cgv.art10.body')}</p>
        </section>

        <p className="text-sm text-ink-2 pt-4 border-t border-[color:var(--line)]">
          {t('common.lastUpdatedApril')}
        </p>
    </LegalPage>
  );
}
