import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EmptyState, Icon, Skeleton } from '@ds';
import SEOHead from '../../../components/seo/SEOHead';
import LocalizedLink from '../../../components/shared/LocalizedLink';
import { markdownToHtml } from '../../../lib/markdown';
import { XP_REWARDS } from '../../../types/gamification';
import { estAVenir } from '../../../types/formationRelease';
import { flattenLessons } from '../../../components/edu/g3/quiz';
import type { EnrolledFormation } from '../hooks/useStudentData';

/* Le sous-ensemble du contexte de `StudentLayout` que l'écran lit. Déclaré ici plutôt
   qu'importé : l'import ferait compter à cette route les namespaces de la coquille
   (`tests/unit/route-namespaces.test.ts`), qu'elle ne lit pas. */
interface EduOutlet {
  enrolledFormations: EnrolledFormation[];
  loadingEnrollments: boolean;
}

/**
 * MISSIONS ET RELECTURES — maquette `Edu-Mission` (kit v3, passe 2 lot B), `/mon-espace/missions`.
 *
 * Ce qui EXISTE en base : les leçons `type: 'mission'` des formations suivies, et leur état
 * (cochée ou non dans l'inscription). L'écran les montre — la mission en cours en tête, toutes
 * les autres dessous.
 *
 * Ce qui N'EXISTE PAS encore : le dépôt d'un texte de mission, les relectures entre pairs, la
 * file « à ton tour ». La maquette les dessine ; l'écran pose leurs cartes avec un état vide
 * qui le dit, sans relecteur, sans avis ni compteur d'exemple. La validation reste dans la leçon.
 */
export default function MissionsPage() {
  const { t } = useTranslation('ecrans');
  const ctx = useOutletContext<EduOutlet | undefined>();

  const missions = (ctx?.enrolledFormations ?? [])
    .filter((ef) => ef.formation && !estAVenir(ef.formation))
    .flatMap((ef) => {
      const done = new Set(ef.enrollment.completedLessons ?? []);
      return flattenLessons(ef.formation)
        .filter((l) => l.lesson.type === 'mission')
        .map((l) => ({ ...l, formation: ef.formation!, done: done.has(l.lesson.id) }));
    });
  const current = missions.find((m) => !m.done) ?? null;
  const num = (m: { moduleIndex: number; lessonIndex: number }) => `${m.moduleIndex}.${m.lessonIndex}`;

  return (
    <div className="mx-auto max-w-4xl px-[18px] py-6 wide:max-w-none wide:px-pane">
      <SEOHead title={t('edu.missions.title')} description={t('edu.missions.empty')} noIndex />

      <nav aria-label={t('edu.missions.crumbLabel')} className="mb-4 flex flex-wrap items-center gap-[10px] text-[13px] text-ink-2">
        {current ? (
          <>
            <LocalizedLink to={`/cours/${current.formation.slug}`} className="text-inherit no-underline">{current.formation.title}</LocalizedLink>
            <span aria-hidden="true">›</span>
            <span>{t('edu.missions.lesson', { n: num(current) })}</span>
            <span aria-hidden="true">›</span>
          </>
        ) : null}
        <span>{t('edu.missions.crumbMission')}</span>
      </nav>

      <div className="grid items-start gap-[22px] wide:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex min-w-0 flex-col gap-5">
          {ctx?.loadingEnrollments ? (
            <Skeleton height={260} radius="var(--r-xl)" label={t('edu.missions.title')} />
          ) : current ? (
            <section style={{ borderRadius: '26px', background: 'var(--mm-orange-f)', color: 'var(--ink-fixed)', padding: '26px' }}>
              <span className="mm-eyebrow" style={{ color: 'var(--ink-fixed)' }}>
                {t('edu.missions.eyebrowXp', { n: num(current), xp: XP_REWARDS.completeLesson })}
              </span>
              <b className="block" style={{ font: '900 30px/1.1 var(--f-display)', margin: '12px 0 14px' }}>{current.lesson.title}</b>
              {current.lesson.content ? (
                <div className="mm-prose" style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--ink-fixed)' }} dangerouslySetInnerHTML={{ __html: markdownToHtml(current.lesson.content) }} />
              ) : (
                <p className="m-0" style={{ fontSize: '14.5px' }}>{t('edu.missions.contentSoon')}</p>
              )}
            </section>
          ) : (
            <section className="mm-card" style={{ padding: '26px' }}>
              <p className="mm-eyebrow m-0">{t('edu.missions.eyebrow')}</p>
              <h1 className="mm-d m-0 mt-3" style={{ fontSize: 'clamp(26px, 3.2vw, 38px)' }}>{t('edu.missions.title')}</h1>
              <EmptyState
                glyph={<Icon name="target" size={26} strokeWidth={2} />}
                title={missions.length > 0 ? t('edu.missions.allDone') : t('edu.missions.empty')}
                body={t('edu.missions.body')}
                action={(
                  <LocalizedLink to="/mon-espace/cours" className="mm-pill is-sm mt-4">
                    {t('links.courses')}
                    <i><Icon name="arrow-up-right" size={14} /></i>
                  </LocalizedLink>
                )}
              />
            </section>
          )}

          {current && (
            <section className="mm-card" style={{ padding: '26px' }}>
              <div className="mb-[14px] flex flex-wrap items-center gap-[10px]">
                <h3>{t('edu.missions.mine')}</h3>
                <span className="mm-tag" style={{ background: 'var(--mm-orange-c)', color: 'var(--mm-orange-t)' }}>{t('edu.missions.todo')}</span>
              </div>
              <div className="text-ink-2" style={{ padding: '18px', borderRadius: '16px', border: '1px dashed var(--line)', fontSize: '15px', lineHeight: 1.6 }}>
                {t('edu.missions.depositSoon')}
              </div>
              <LocalizedLink to={`/cours/${current.formation.slug}?lecon=${current.lesson.id}`} className="mm-pill is-sm mt-4">
                {t('edu.missions.openLesson')}
                <i><Icon name="arrow-up-right" size={14} /></i>
              </LocalizedLink>
            </section>
          )}

          {missions.length > 0 && (
            <section className="mm-card">
              <h3>{t('edu.missions.allTitle')}</h3>
              <ul className="m-0 mt-3 flex list-none flex-col gap-1 p-0">
                {missions.map((m) => (
                  <li key={`${m.formation.id}-${m.lesson.id}`}>
                    <LocalizedLink
                      to={`/cours/${m.formation.slug}?lecon=${m.lesson.id}`}
                      className="flex items-center gap-3 rounded-m no-underline"
                      style={{ padding: '11px 12px', color: 'var(--ink)', fontSize: '14px' }}
                    >
                      <span
                        aria-hidden="true"
                        className="grid flex-none place-items-center rounded-pill"
                        style={{ width: '24px', height: '24px', background: m.done ? 'var(--mm-teal-f)' : 'var(--paper-2)', color: m.done ? 'var(--paper-fixed)' : 'var(--ink-3)' }}
                      >
                        <Icon name={m.done ? 'check' : 'target'} size={12} />
                      </span>
                      <span className="text-ink-2" style={{ fontSize: '12px' }}>{num(m)}</span>
                      <span className="min-w-0 flex-1 font-semibold">{m.lesson.title}</span>
                      <span className="text-ink-2" style={{ fontSize: '12.5px' }}>{m.done ? t('edu.missions.done') : t('edu.missions.todo')}</span>
                    </LocalizedLink>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* ── Les relectures entre pairs : pas encore de producteur ── */}
        <div className="flex flex-col gap-[14px]">
          <h3 className="m-0" style={{ font: '600 21px/1.1 var(--f-body)' }}>{t('edu.missions.reviewsTitle')}</h3>
          <article className="mm-card flex items-start gap-3" style={{ background: 'var(--paper-2)' }}>
            <span className="grid flex-none place-items-center rounded-m" style={{ width: '36px', height: '36px', background: 'var(--bento)' }}>
              <Icon name="users" size={17} />
            </span>
            <span className="text-ink-2" style={{ fontSize: '13.5px', lineHeight: 1.5 }}>{t('edu.missions.reviewsEmpty')}</span>
          </article>
          <section className="mm-card" style={{ background: 'var(--mm-violet-c)', borderColor: 'transparent', color: 'var(--ink-fixed)' }}>
            <b className="block" style={{ font: '900 20px/1.15 var(--f-display)' }}>{t('edu.missions.turnTitle')}</b>
            <p className="m-0" style={{ fontSize: '13.5px', color: 'var(--mm-violet-t)', margin: '8px 0 14px' }}>{t('edu.missions.turnBody')}</p>
            <LocalizedLink to="/mon-espace/cohorte" className="mm-btn is-sm is-club">{t('links.cohort')}</LocalizedLink>
          </section>
        </div>
      </div>
    </div>
  );
}
