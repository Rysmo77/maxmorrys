import { Trans, useTranslation } from 'react-i18next';
import LocalizedLink from '../../components/shared/LocalizedLink';
import { LegalPage } from '../../components/site/LegalPage';

export default function MentionsLegales() {
  const { t } = useTranslation('legal');
  return (
    <LegalPage
      current="mentions"
      titleLines={t('mentions.titleLines', { returnObjects: true }) as string[]}
      seoTitle={t('mentions.seoTitle')}
      seoDescription={t('mentions.seoDescription')}
      version={t('mentions.version')}
    >
        <section>
          <h2>{t('mentions.editor.heading')}</h2>
          <p>
            <Trans i18nKey="mentions.editor.body" t={t} components={[<span />, <strong />]} />
          </p>
          <ul>
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
          <h2>{t('mentions.hosting.heading')}</h2>
          <p>
            <Trans i18nKey="mentions.hosting.body" t={t} components={[<span />, <strong />]} />
          </p>
        </section>

        <section>
          <h2>{t('mentions.personalData.heading')}</h2>
          <p>{t('mentions.personalData.body')}</p>
          <p className="mt-2">
            <Trans
              i18nKey="mentions.personalData.more"
              t={t}
              components={[<span />, <LocalizedLink to="/legal/confidentialite" className="text-forme hover:underline" />]}
            />
          </p>
        </section>

        <section>
          <h2>{t('mentions.cookies.heading')}</h2>
          <p>
            <Trans
              i18nKey="mentions.cookies.body"
              t={t}
              components={[<span />, <LocalizedLink to="/legal/cookies" className="text-forme hover:underline" />]}
            />
          </p>
        </section>

        <section>
          <h2>{t('mentions.liability.heading')}</h2>
          <p>{t('mentions.liability.body')}</p>
        </section>

        <p className="text-sm text-ink-2 pt-4 border-t border-[color:var(--line)]">
          {t('common.lastUpdatedApril')}
        </p>
    </LegalPage>
  );
}
