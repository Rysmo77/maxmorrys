import { Trans, useTranslation } from 'react-i18next';
import { LegalPage } from '../../components/site/LegalPage';

export default function Confidentialite() {
  const { t } = useTranslation('legal');
  return (
    <LegalPage
      current="privacy"
      titleLines={t('privacy.titleLines', { returnObjects: true }) as string[]}
      seoTitle={t('privacy.seoTitle')}
      seoDescription={t('privacy.seoDescription')}
      version={t('privacy.version')}
    >
        <section>
          <h2>{t('privacy.intro.heading')}</h2>
          <p><Trans i18nKey="privacy.intro.p1" t={t} components={[<span />, <strong />]} /></p>
          <p className="mt-2">{t('privacy.intro.p2')}</p>
        </section>

        <section>
          <h2>{t('privacy.collected.heading')}</h2>
          <p>{t('privacy.collected.intro')}</p>
          <ul>
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
          <h2>{t('privacy.purposes.heading')}</h2>
          <ul>
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
          <h2>{t('privacy.retention.heading')}</h2>
          <p>{t('privacy.retention.intro')}</p>
          <ul>
            <li>{t('privacy.retention.item1')}</li>
            <li>{t('privacy.retention.item2')}</li>
            <li>{t('privacy.retention.item3')}</li>
            <li>{t('privacy.retention.item4')}</li>
            <li>{t('privacy.retention.item5')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('privacy.rights.heading')}</h2>
          <p>{t('privacy.rights.intro')}</p>
          <ul>
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
          <h2>{t('privacy.processors.heading')}</h2>
          <p>{t('privacy.processors.intro')}</p>
          <ul>
            <li>{t('privacy.processors.item1')}</li>
            <li>{t('privacy.processors.item2')}</li>
            <li>{t('privacy.processors.item3')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('privacy.contact.heading')}</h2>
          <p>{t('privacy.contact.intro')}</p>
          <p className="mt-2">{t('privacy.contact.email')}</p>
          <p>
            <Trans
              i18nKey="privacy.contact.cdp"
              t={t}
              components={[<span />, <a href="https://www.cdp.sn" target="_blank" rel="noopener noreferrer" className="text-forme hover:underline" />]}
            />
          </p>
        </section>

        <p className="text-sm text-ink-2 pt-4 border-t border-[color:var(--line)]">
          {t('common.lastUpdatedApril')}
        </p>
    </LegalPage>
  );
}
