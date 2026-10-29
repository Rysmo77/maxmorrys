import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, Num, Skeleton } from '@ds';
import LocalizedLink from '../../../components/shared/LocalizedLink';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import CourseCover from '../../../components/formations/CourseCover';
import OfflineCard from '../../../components/edu/g3/OfflineCard';
import { flattenLessons } from '../../../components/edu/g3/quiz';
import { CLUB_MEMBER_FORMATION_DISCOUNT } from '../../../lib/club/pricing';
import type { EnrolledFormation } from '../hooks/useStudentData';
import type { Certificate } from '../../../types';
import { estAVenir } from '../../../types/formationRelease';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * « MES FORMATIONS » — maquette `Edu-Cours` (kit v3, passe 2 lot B).
 *
 * Colonne principale : filtre par état (`mm-tabs`, comptes DÉDUITS des inscriptions), puis une
 * carte horizontale par formation — couverture, état, progression, prochaine leçon, actions.
 * Colonne de droite (≥ 1080 px) : hors connexion (poids mesurés), le catalogue, l'offre Club.
 *
 * Écarts assumés à la maquette :
 *   · « Liste d'attente » devient « À venir » : la liste d'attente n'est LISTABLE que par
 *     l'administration, l'écran ne peut donc pas la lire ; les précommandes, si.
 *   · « Enregistrées » n'existe pas (aucun favori en base) : la carte mène au catalogue.
 *   · « dernière visite hier » : aucune date de visite n'est stockée, la mention est retirée.
 * La remise Club est lue dans `lib/club/pricing.ts` (miroir serveur), jamais écrite ici.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

interface CoursesTabProps {
  enrolledFormations: EnrolledFormation[];
  loadingEnrollments: boolean;
  certificates?: Certificate[];
  isClubActive?: boolean;
}

type CourseFilter = 'all' | 'ongoing' | 'done' | 'soon';

export default function CoursesTab({ enrolledFormations, loadingEnrollments, certificates = [], isClubActive = false }: CoursesTabProps) {
  const { t } = useTranslation('lmsTabs');
  const certByFormation = new Map(certificates.map((c) => [c.formationId, c]));
  const [filter, setFilter] = useState<CourseFilter>('all');
  /* Le cache hors connexion ne s'ouvre qu'en grand écran : monté par crochet, pas masqué. */
  const isWide = useMediaQuery('(min-width: 1080px)');
  const asOf = new Date();

  const stateOf = (ef: EnrolledFormation): Exclude<CourseFilter, 'all'> =>
    estAVenir(ef.formation) ? 'soon' : ef.enrollment.progress >= 100 ? 'done' : 'ongoing';

  const counts = useMemo(() => {
    const c = { all: enrolledFormations.length, ongoing: 0, done: 0, soon: 0 };
    for (const ef of enrolledFormations) c[stateOf(ef)] += 1;
    return c;
  }, [enrolledFormations]);

  const shown = enrolledFormations.filter((ef) => filter === 'all' || stateOf(ef) === filter);
  const TABS: CourseFilter[] = ['all', 'ongoing', 'done', 'soon'];

  return (
    <div className="mx-auto max-w-4xl px-[18px] py-6 wide:max-w-none wide:px-pane">
      <div className="mb-5 mt-1">
        <span className="mm-eyebrow">{t('coursesV3.eyebrow')}</span>
        <h1 className="mm-d m-0 mt-[10px]" style={{ fontSize: 'clamp(32px, 4vw, 44px)' }}>{t('coursesV3.title')}</h1>
      </div>

      <div className="grid items-start gap-[22px] wide:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-[14px]">
          <div className="mm-tabs max-w-full self-start overflow-x-auto" role="group" aria-label={t('courses.filterLabel')}>
            {TABS.map((k) => (
              <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)} style={{ whiteSpace: 'nowrap' }}>
                {t(`coursesV3.tab_${k}`)} · <Num value={counts[k]} source="db" asOf={asOf} />
              </button>
            ))}
          </div>

          {loadingEnrollments ? (
            [0, 1].map((i) => <Skeleton key={i} height={198} radius="var(--r-xl)" label={t('courses.loadingLabel')} />)
          ) : enrolledFormations.length === 0 ? (
            <section className="mm-card" style={{ padding: '28px' }}>
              <b style={{ display: 'block', font: '700 22px/1.15 var(--f-body)' }}>{t('courses.emptyTitle')}</b>
              <p className="m-0 mt-2 text-ink-2" style={{ fontSize: '14.5px', lineHeight: 1.55, maxWidth: '52ch' }}>{t('courses.emptyText')}</p>
              <LocalizedLink to="/formations" className="mm-pill is-sm mt-5">
                {t('courses.explore')}
                <i><Icon name="arrow-up-right" size={14} /></i>
              </LocalizedLink>
            </section>
          ) : shown.length === 0 ? (
            <div className="mm-card"><p className="m-0 text-ink-2" style={{ fontSize: '14.5px' }}>{t('coursesV3.filterEmpty')}</p></div>
          ) : shown.map((ef) => {
            const { enrollment, formation } = ef;
            if (!formation) {
              return (
                <div key={enrollment.id} className="mm-card">
                  <b>{t('courses.unavailableTitle')}</b>
                  <p className="m-0 mt-1 text-ink-2" style={{ fontSize: '13.5px' }}>{t('courses.unavailableText')}</p>
                </div>
              );
            }
            const state = stateOf(ef);
            const cert = certByFormation.get(enrollment.formationId);
            const all = flattenLessons(formation);
            const done = new Set(enrollment.completedLessons ?? []);
            const next = all.find((l) => !done.has(l.lesson.id));
            const tag = state === 'soon' ? t('courses.comingSoonTag')
              : state === 'done' ? (cert ? t('coursesV3.tagCertified') : t('courses.completedTag'))
                : t('coursesV3.tab_ongoing');
            return (
              <article
                key={enrollment.id}
                className="mm-card grid items-center gap-6 stack:grid-cols-[200px_1fr] wide:grid-cols-[230px_1fr_auto]"
                style={{ padding: '14px 22px 14px 14px' }}
              >
                <CourseCover
                  title={formation.title}
                  category={formation.category}
                  slug={formation.slug}
                  id={formation.id}
                  coverImage={formation.coverImage}
                  kicker={`Max-Morrys Edu · ${formation.category}`}
                  size="sm"
                  style={{ height: '170px', minHeight: '170px' }}
                  transitionName={`course-${formation.slug}`}
                />
                <div className="min-w-0">
                  <span className="mm-tag" style={{ background: 'var(--paper-2)' }}>{tag}</span>
                  <b className="mt-[10px] block" style={{ font: '700 22px/1.15 var(--f-body)' }}>{formation.title}</b>
                  {state === 'soon' ? (
                    <p className="m-0 mt-2 text-ink-2" style={{ fontSize: '13.5px' }}>{t('courses.comingSoonNote')}</p>
                  ) : (
                    <>
                      <div className="mt-[14px] flex items-center gap-3" style={{ maxWidth: '420px' }}>
                        <div className="mm-progress" style={{ flex: 1 }} role="progressbar" aria-label={t('courses.progressLabel')} aria-valuenow={enrollment.progress} aria-valuemin={0} aria-valuemax={100}>
                          <i style={{ ['--p' as string]: Math.min(1, Math.max(0, enrollment.progress / 100)) }} />
                        </div>
                        <span style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                          <Num value={done.size} source="db" asOf={asOf} /> / <Num value={all.length || null} source="db" asOf={asOf} /> {t('courses.lessonsLabel')}
                        </span>
                      </div>
                      <span className="mt-2 block text-ink-2" style={{ fontSize: '13px' }}>
                        {cert
                          ? <>{t('coursesV3.certificate')} · <b>{cert.certificateCode}</b></>
                          : next ? t('coursesV3.next', { num: `${next.moduleIndex}.${next.lessonIndex}`, title: next.lesson.title }) : null}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex flex-col gap-2 stack:col-span-2 wide:col-span-1" style={{ minWidth: '190px' }}>
                  {state === 'soon' ? (
                    <LocalizedLink to={`/formations/${formation.slug}`} className="mm-pill is-sm" style={{ justifyContent: 'space-between' }}>
                      {t('coursesV3.seeSheet')}
                      <i><Icon name="arrow-up-right" size={14} /></i>
                    </LocalizedLink>
                  ) : cert ? (
                    <LocalizedLink to={`/certificat/${cert.certificateCode}`} className="mm-pill is-sm" style={{ justifyContent: 'space-between' }}>
                      {t('coursesV3.myCertificate')}
                      <i><Icon name="arrow-up-right" size={14} /></i>
                    </LocalizedLink>
                  ) : (
                    <LocalizedLink to={`/cours/${formation.slug}${next ? `?lecon=${next.lesson.id}` : ''}`} className="mm-pill is-sm" style={{ justifyContent: 'space-between' }}>
                      {state === 'done' ? t('coursesV3.review') : t('courses.resumeAction')}
                      <i><Icon name="arrow-up-right" size={14} /></i>
                    </LocalizedLink>
                  )}
                  <LocalizedLink
                    to={state === 'soon' || cert ? `/cours/${formation.slug}` : `/formations/${formation.slug}`}
                    className="flex items-center justify-center rounded-pill no-underline"
                    style={{ height: '40px', border: '1px solid var(--line)', font: '600 13px/1 var(--f-body)', color: 'var(--ink)' }}
                  >
                    {state === 'soon' || cert ? t('coursesV3.review') : t('coursesV3.program')}
                  </LocalizedLink>
                </div>
              </article>
            );
          })}
        </div>

        <div className="flex flex-col gap-5">
          {isWide && (
            <OfflineCard
              labels={{
                title: t('coursesV3.offlineTitle'),
                reading: t('courses.offlineReading'),
                empty: t('courses.offlineEmpty'),
                onDevice: (count) => t('coursesV3.offlineOnDevice', { count }),
                manage: t('courses.offlineSetup'),
              }}
            />
          )}
          <section className="mm-card">
            <h3>{t('coursesV3.catalogTitle')}</h3>
            <p className="m-0 mt-2 text-ink-2" style={{ fontSize: '13.5px', lineHeight: 1.5 }}>{t('coursesV3.catalogBody')}</p>
            <LocalizedLink to="/formations" className="mm-pill is-sm mt-4">
              {t('coursesV3.catalogCta')}
              <i><Icon name="arrow-up-right" size={14} /></i>
            </LocalizedLink>
          </section>
          {!isClubActive && (
            <section className="mm-card" style={{ background: 'var(--mm-violet-c)', borderColor: 'transparent', color: 'var(--ink-fixed)' }}>
              <b style={{ display: 'block', font: '900 22px/1.1 var(--f-display)' }}>
                {t('coursesV3.clubTitle', { pct: Math.round(CLUB_MEMBER_FORMATION_DISCOUNT * 100) })}
              </b>
              <p className="m-0 mt-2" style={{ fontSize: '13.5px', color: 'var(--mm-violet-t)' }}>{t('coursesV3.clubBody')}</p>
              <LocalizedLink to="/club-des-digitos" className="mm-btn is-sm is-club mt-4">{t('coursesV3.clubCta')}</LocalizedLink>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
