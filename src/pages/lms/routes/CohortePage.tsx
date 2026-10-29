import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@ds';
import SEOHead from '../../../components/seo/SEOHead';
import LocalizedLink from '../../../components/shared/LocalizedLink';
import { CardEmpty, EduCard, EduGrid, EduHead, EduPage } from '../../../components/edu/g4/EduParts';

/**
 * MA COHORTE — maquette `Edu-Cohorte` (+ `-mobile`), passe 2 lot B.
 *
 * La grille, l'ordre et les titres des cartes sont ceux de la maquette : live de cohorte,
 * avancement par module, missions à relire ; puis, dans le panneau, mes missions, les
 * membres et les règles. AUCUN producteur côté serveur n'existe encore pour les cohortes
 * (ni collection, ni règle Firestore) : chaque carte garde sa place et dit pourquoi elle
 * est vide. Pas de nom, pas d'avancement, pas de compte à rebours inventés (D-09).
 *
 * Les règles de la cohorte, elles, sont une POLITIQUE, pas une donnée : elles s'affichent.
 */
type ReviewTab = 'todo' | 'done' | 'all';

/** Le dégradé corail de la carte live, sans code couleur en dur. */
const LIVE_BG =
  'linear-gradient(120deg, color-mix(in srgb, var(--mm-corail-f) 22%, var(--night)), color-mix(in srgb, var(--mm-corail-f) 72%, var(--night)) 60%, var(--mm-corail-f))';

export default function CohortePage() {
  const { t } = useTranslation('ecrans');
  const [tab, setTab] = useState<ReviewTab>('todo');
  const TABS: { id: ReviewTab; label: string }[] = [
    { id: 'todo', label: t('edu.cohorte.reviewTabTodo') },
    { id: 'done', label: t('edu.cohorte.reviewTabDone') },
    { id: 'all', label: t('edu.cohorte.reviewTabAll') },
  ];

  const aside = (
    <>
      <EduCard title={t('edu.cohorte.myMissionsTitle')} style={{ padding: 20 }}>
        <CardEmpty
          icon="target"
          title={t('edu.cohorte.myMissionsEmpty')}
          body={t('edu.cohorte.myMissionsBody')}
          action={
            <LocalizedLink to="/mon-espace/missions" className="text-[13px] font-semibold text-ink">
              {t('edu.cohorte.myMissionsLink')} →
            </LocalizedLink>
          }
        />
      </EduCard>
      <EduCard title={t('edu.cohorte.membersTitle')} style={{ padding: 20 }}>
        <CardEmpty icon="users" title={t('edu.cohorte.membersEmpty')} body={t('edu.cohorte.membersBody')} />
      </EduCard>
      <EduCard style={{ background: 'var(--paper-2)' }}>
        <h3 style={{ fontSize: 16 }}>{t('edu.cohorte.rulesTitle')}</h3>
        <ul className="m-0 mt-[10px] flex flex-col gap-[6px] pl-[18px] text-[13.5px] text-ink-2">
          <li>{t('edu.cohorte.rule1')}</li>
          <li>{t('edu.cohorte.rule2')}</li>
          <li>{t('edu.cohorte.rule3')}</li>
        </ul>
      </EduCard>
    </>
  );

  return (
    <EduPage>
      <SEOHead title={t('edu.cohorte.title')} description={t('edu.cohorte.empty')} noIndex />
      <EduHead eyebrow={t('edu.cohorte.eyebrow')} title={t('edu.cohorte.title')} />
      <EduGrid aside={aside}>
        {/* ── Le live de cohorte ─────────────────────────────────────────────── */}
        <section className="mm-card dk p-5 stack:p-7" style={{ background: LIVE_BG, color: 'var(--paper-fixed)', border: 0 }}>
          <span className="mm-eyebrow" style={{ color: 'color-mix(in srgb, var(--paper-fixed) 82%, var(--mm-corail-f))' }}>
            {t('edu.cohorte.liveEyebrow')}
          </span>
          <b className="mb-[6px] mt-3 block font-display text-[26px] font-black leading-[1.05] stack:text-[34px]">
            {t('edu.cohorte.liveNone')}
          </b>
          <span className="text-[14px]" style={{ opacity: 0.85 }}>{t('edu.cohorte.liveNoneBody')}</span>
          <div className="mt-[22px] flex flex-wrap gap-[10px]">
            <LocalizedLink to="/mon-espace/cohorte/live" className="mm-pill is-sm" style={{ background: 'var(--paper-fixed)' }}>
              {t('edu.cohorte.liveRoom')}
              <i><Icon name="arrow-up-right" size={15} /></i>
            </LocalizedLink>
            <LocalizedLink
              to="/mon-espace/agenda"
              className="inline-flex h-10 items-center gap-2 rounded-pill px-4 text-[13px] font-semibold no-underline"
              style={{ border: '1px solid color-mix(in srgb, var(--paper-fixed) 50%, transparent)', color: 'var(--paper-fixed)' }}
            >
              <Icon name="calendar" size={15} />
              {t('edu.cohorte.liveAgenda')}
            </LocalizedLink>
          </div>
        </section>

        {/* ── Où en est la cohorte ───────────────────────────────────────────── */}
        <EduCard title={t('edu.cohorte.progressTitle')} meta={t('edu.cohorte.progressMeta')}>
          <CardEmpty icon="bars" title={t('edu.cohorte.empty')} body={t('edu.cohorte.body')} />
        </EduCard>

        {/* ── Missions à relire ─────────────────────────────────────────────── */}
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h3 className="m-0 text-[21px] font-semibold leading-[1.1] tracking-[-.01em]">{t('edu.cohorte.reviewTitle')}</h3>
            <div className="mm-tabs ml-auto" role="group" aria-label={t('edu.cohorte.reviewTitle')}>
              {TABS.map((x) => (
                <button key={x.id} type="button" aria-pressed={tab === x.id} onClick={() => setTab(x.id)}>
                  {x.label}
                </button>
              ))}
            </div>
          </div>
          <EduCard as="div" style={{ padding: 20 }}>
            <CardEmpty icon="comment" title={t('edu.cohorte.reviewEmpty')} body={t('edu.cohorte.reviewBody')} />
          </EduCard>
        </div>
      </EduGrid>
    </EduPage>
  );
}
