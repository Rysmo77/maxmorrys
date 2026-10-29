import { useState, useEffect, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, Num, Skeleton } from '@ds';
import LocalizedLink from '../../../components/shared/LocalizedLink';
import { useAuth } from '../../../contexts/AuthContext';
import { tutorName } from '../../../lib/naming';
import { getGamificationProfile, updateStreak, addXP, syncBadges } from '../../../lib/gamification';
import { getLevelFromXP, getXPForNextLevel, XP_REWARDS } from '../../../types/gamification';
import type { GamificationProfile } from '../../../types/gamification';
import type { EnrolledFormation } from '../hooks/useStudentData';
import { estAVenir } from '../../../types/formationRelease';
import CourseCover from '../../../components/formations/CourseCover';
import { flattenLessons } from '../../../components/edu/g3/quiz';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE TABLEAU DE BORD — maquette `Edu-Espace` (kit v3, passe 2 lot B).
 *
 * Deux colonnes en 1440 (travail · 370 px), une seule en 390. Colonne de travail : la reprise
 * (`mm-promo`), trois relevés (`mm-statcard`), « Reprendre » (`mm-vid`), la cohorte. Colonne de
 * droite : l'agenda de la semaine, puis les quêtes.
 *
 * TOUT SORT DE LA BASE OU N'EST PAS AFFICHÉ :
 *   · la phrase « Plus que N leçons » se calcule sur les leçons cochées de l'inscription ;
 *   · les quêtes sont des objectifs DÉRIVÉS (série, niveau, formation en cours) — aucune quête
 *     « du jour » ni bouton « Récupérer » : aucun mécanisme de réclamation n'existe en base ;
 *   · la cohorte et l'agenda n'ont pas encore de producteur : leur carte dit qu'ils sont vides,
 *     sans avatar ni événement d'exemple. Les jours de la semaine, eux, sont la vraie semaine.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

interface DashboardTabProps {
  displayName: string;
  userId?: string;
  enrolledFormations: EnrolledFormation[];
  loadingEnrollments: boolean;
  avgProgress: number;
  completedCount: number;
}

/** Les cinq jours ouvrés de la semaine courante (lundi → vendredi). */
function weekDays(now: Date): Date[] {
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const tint = (v: string): CSSProperties => ({ ['--tint' as string]: v });

export default function DashboardTab({
  displayName, userId, enrolledFormations, loadingEnrollments, avgProgress, completedCount,
}: DashboardTabProps) {
  const { t, i18n } = useTranslation('lmsTabs');
  const [gamification, setGamification] = useState<GamificationProfile | null>(null);
  const { userData } = useAuth();
  const tutor = tutorName(userData);

  // La série est mise à jour à l'ouverture de l'écran, et les badges s'y décrochent : c'est le
  // seul écran qui connaît les quatre compteurs à la fois. Cette logique ne bouge pas.
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { currentStreak, isNew } = await updateStreak(userId);
      if (isNew && currentStreak > 0) {
        await addXP(userId, XP_REWARDS.dailyStreak);
      }
      const stats = enrolledFormations.reduce(
        (acc, { enrollment }) => ({
          lessons: acc.lessons + (enrollment.completedLessons?.length ?? 0),
          certificates: acc.certificates + (enrollment.certificateIssued ? 1 : 0),
          formations: acc.formations + 1,
          streak: acc.streak,
        }),
        { lessons: 0, certificates: 0, formations: 0, streak: currentStreak },
      );
      await syncBadges(userId, stats);
      setGamification(await getGamificationProfile(userId));
    })().catch(() => null);
  }, [userId, enrolledFormations]);

  /* Un relevé porte sa date : l'instant du rendu, donc de la lecture Firestore. */
  const asOf = new Date();
  const firstName = displayName.split(' ')[0];

  /* Une précommande n'est pas « en cours » : aucune leçon à ouvrir. */
  const ouvrables = enrolledFormations.filter((ef) => !estAVenir(ef.formation) && ef.formation);
  const enCours = ouvrables.filter((ef) => ef.enrollment.progress < 100);
  const inProgress = enCours.find((ef) => ef.enrollment.progress > 0) ?? enCours[0] ?? null;

  /* La prochaine leçon : la première non cochée, dans l'ordre du programme. */
  const nextOf = (ef: EnrolledFormation) => {
    const done = new Set(ef.enrollment.completedLessons ?? []);
    const all = flattenLessons(ef.formation);
    return { all, next: all.find((l) => !done.has(l.lesson.id)) ?? null, done: done.size };
  };
  const focus = inProgress ? nextOf(inProgress) : null;
  const remaining = focus ? Math.max(0, focus.all.length - focus.done) : 0;
  const focusNum = focus?.next ? `${focus.next.moduleIndex}.${focus.next.lessonIndex}` : null;
  const resumeHref = inProgress?.formation
    ? `/cours/${inProgress.formation.slug}${focus?.next ? `?lecon=${focus.next.lesson.id}` : ''}`
    : '/formations';

  const level = gamification ? getLevelFromXP(gamification.xp) : null;
  const levelCeil = level ? getXPForNextLevel(level) : 0;
  const levelFloor = level ? getXPForNextLevel(level - 1) : 0;

  const days = weekDays(asOf);
  const todayKey = asOf.toDateString();
  const dayFmt = new Intl.DateTimeFormat(i18n.language, { weekday: 'short' });

  /* Les quêtes : des objectifs dont chaque nombre se lit en base. */
  const quests: { key: string; title: string; reward: string; value: number; goal: number; gem: string; icon: 'flame' | 'zap' | 'graduation' }[] = [];
  if (gamification) {
    quests.push({
      key: 'streak', title: t('dashboardV3.questStreak'), reward: t('dashboardV3.questStreakReward'),
      value: Math.min(7, gamification.currentStreak), goal: 7, gem: 'var(--mm-orange-f)', icon: 'flame',
    });
    if (level && Number.isFinite(levelCeil)) {
      quests.push({
        key: 'level', title: t('dashboardV3.questLevel', { level: level + 1 }), reward: `${levelCeil} XP`,
        value: gamification.xp - levelFloor, goal: levelCeil - levelFloor, gem: 'var(--mm-violet-f)', icon: 'zap',
      });
    }
  }
  if (inProgress?.formation && focus && focus.all.length > 0) {
    quests.push({
      key: 'formation', title: t('dashboardV3.questFormation', { title: inProgress.formation.title }),
      reward: `+${XP_REWARDS.completeFormation} XP`, value: focus.done, goal: focus.all.length,
      gem: 'var(--mm-teal-f)', icon: 'graduation',
    });
  }

  return (
    <div className="mx-auto max-w-4xl px-[18px] py-6 wide:max-w-none wide:px-pane">
      <div className="grid items-start gap-[22px] wide:grid-cols-[minmax(0,1fr)_370px]">
        {/* ═══ Colonne de travail ═══ */}
        <div className="flex min-w-0 flex-col gap-5">
          {loadingEnrollments ? (
            <Skeleton height={260} radius="var(--r-xl)" label={t('dashboard.loadingLabel')} />
          ) : (
            <section className="mm-promo" style={{ minHeight: '260px' }}>
              <div className="relative z-[1]" style={{ maxWidth: '520px' }}>
                <span className="mm-eyebrow" style={{ color: 'var(--mm-violet-f)' }}>
                  {firstName ? t('dashboardV3.welcomeBack', { name: firstName }) : t('dashboardV3.welcomeBackAnon')}
                </span>
                {inProgress?.formation ? (
                  <>
                    <h2 style={{ marginTop: '12px' }}>
                      {remaining > 0
                        ? t('dashboardV3.remaining', { count: remaining, title: inProgress.formation.title })
                        : inProgress.formation.title}
                    </h2>
                    {focus?.next && (
                      <p className="hidden stack:block" style={{ margin: '12px 0 0', color: 'var(--mm-violet-t)', fontSize: '15px', maxWidth: '44ch' }}>
                        {t('dashboardV3.nextLesson', { num: focusNum, title: focus.next.lesson.title })}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <h2 style={{ marginTop: '12px' }}>
                      {enrolledFormations.length === 0 ? t('dashboard.readyTitle') : t('dashboard.continueLearning')}
                    </h2>
                    <p style={{ margin: '12px 0 0', color: 'var(--mm-violet-t)', fontSize: '15px', maxWidth: '44ch' }}>
                      {enrolledFormations.length === 0 ? t('dashboard.startAdventure') : t('dashboard.continueLearningHint')}
                    </p>
                  </>
                )}
                <LocalizedLink
                  to={resumeHref}
                  className="mm-btn has-arrow"
                  style={{ marginTop: '22px', background: 'var(--mm-violet-f)', color: 'var(--paper-fixed)' }}
                >
                  {inProgress?.formation
                    ? (focusNum ? t('dashboardV3.resumeLesson', { num: focusNum }) : t('dashboard.resume'))
                    : t('dashboard.explore')}
                  <span className="mm-btn__arrow" style={{ background: 'var(--paper-fixed)', color: 'var(--mm-violet-f)' }}>
                    <Icon name="arrow-up-right" size={14} />
                  </span>
                </LocalizedLink>
              </div>

              {/* Décor de la carte : la vraie couverture, et le vrai rang de la leçon. */}
              {inProgress?.formation && (
                <div aria-hidden="true" className="absolute hidden wide:block" style={{ right: '30px', top: '18px', bottom: '18px', width: '300px' }}>
                  <CourseCover
                    title={inProgress.formation.title}
                    category={inProgress.formation.category}
                    slug={inProgress.formation.slug}
                    id={inProgress.formation.id}
                    coverImage={inProgress.formation.coverImage}
                    kicker={inProgress.formation.category}
                    size="sm"
                    className="mm-floaty"
                    style={{ ['--r' as string]: '-6deg', left: '50px', top: '14px', width: '150px', minHeight: '196px', padding: '14px', transform: 'rotate(-6deg)' }}
                  />
                  {focus && focus.all.length > 0 && (
                    <div className="mm-floaty" style={{ right: 0, top: '40px', width: '130px', padding: '12px', background: 'var(--paper-fixed)', color: 'var(--ink-fixed)', transform: 'rotate(7deg)' }}>
                      <span style={{ fontSize: '10px', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                        {t('dashboardV3.lessonShort')} <Num value={Math.min(focus.done + 1, focus.all.length)} source="db" asOf={asOf} /> / <Num value={focus.all.length} source="db" asOf={asOf} />
                      </span>
                      <div className="mm-progress" style={{ marginTop: '8px' }}>
                        <i style={{ ['--p' as string]: focus.done / focus.all.length }} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* ── Relevés ── */}
          <div className="grid grid-cols-2 gap-4 wide:grid-cols-3">
            <div className="mm-statcard" style={tint('color-mix(in srgb, var(--mm-teal-f) 14%, transparent)')}>
              <span className="ico" style={{ background: 'var(--mm-teal-f)' }}><Icon name="book" size={20} /></span>
              <div>
                <span style={{ fontSize: '14px', color: 'var(--ink-2)' }}>{t('dashboard.statFormations')}</span>
                <div className="v" style={{ marginTop: '6px' }}>
                  <Num value={completedCount} source="db" asOf={asOf} />/<Num value={enrolledFormations.length} source="db" asOf={asOf} />
                  <small>{t('dashboardV3.statDone', { count: completedCount })}</small>
                </div>
              </div>
            </div>
            <div className="mm-statcard" style={tint('color-mix(in srgb, var(--mm-orange-f) 16%, transparent)')}>
              <span className="ico" style={{ background: 'var(--mm-orange-f)' }}><Icon name="star" size={20} /></span>
              <div>
                <span style={{ fontSize: '14px', color: 'var(--ink-2)' }}>{t('dashboardV3.statPoints')}</span>
                <div className="v" style={{ marginTop: '6px' }}>
                  <Num value={gamification ? gamification.xp : null} source="db" asOf={asOf} fallback="—" />
                  <small>
                    {gamification && level && Number.isFinite(levelCeil)
                      ? <>/ <Num value={levelCeil} source="db" asOf={asOf} /> XP</>
                      : 'XP'}
                  </small>
                </div>
              </div>
            </div>
            <div className="hidden wide:block">
            <div className="mm-statcard h-full items-center justify-center" style={tint('color-mix(in srgb, var(--mm-violet-f) 12%, transparent)')}>
              <div className="mm-ringx" style={{ width: '140px', height: '140px' }}>
                <svg viewBox="0 0 120 120" aria-hidden="true">
                  <circle className="tk" cx="60" cy="60" r="54" />
                  <circle
                    className="vl" cx="60" cy="60" r="54"
                    style={{ stroke: 'var(--mm-bleu-f)', strokeDasharray: 339.3, strokeDashoffset: 339.3 * (1 - (enrolledFormations.length > 0 ? Math.min(100, avgProgress) / 100 : 0)) }}
                  />
                </svg>
                <div>
                  <b><Num value={enrolledFormations.length > 0 ? avgProgress : null} unit="%" source="db" asOf={asOf} fallback="—" /></b>
                  <span>{inProgress?.formation?.title ?? t('dashboard.statAvgProgress')}</span>
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* ── Reprendre ── */}
          <section className="mm-card">
            <div className="mb-4 flex items-center">
              <h3 style={{ fontSize: '23px' }}>{t('dashboardV3.resumeTitle')}</h3>
              <LocalizedLink
                to="/mon-espace/cours"
                className="ml-auto inline-flex items-center rounded-pill no-underline"
                style={{ height: '34px', padding: '0 14px', background: 'var(--paper-2)', font: '600 13px/1 var(--f-body)', color: 'var(--ink-2)' }}
              >
                {t('dashboardV3.seeAll')}
              </LocalizedLink>
            </div>
            {enCours.length === 0 ? (
              <p className="m-0 text-ink-2" style={{ fontSize: '14.5px' }}>
                {enrolledFormations.length === 0 ? t('dashboardV3.resumeEmpty') : t('courses.resumeNone')}
              </p>
            ) : (
              <div className="-mx-1 flex snap-x gap-[14px] overflow-x-auto px-1 pb-1 stack:grid stack:grid-cols-3 stack:overflow-visible">
                {enCours.slice(0, 3).map((ef) => {
                  const f = ef.formation!;
                  const n = nextOf(ef);
                  return (
                    <LocalizedLink
                      key={ef.enrollment.id}
                      to={`/cours/${f.slug}${n.next ? `?lecon=${n.next.lesson.id}` : ''}`}
                      className="mm-vid min-w-[240px] snap-start stack:min-w-0"
                    >
                      <div className="mm-vid__th">
                        <CourseCover title={f.title} category={f.category} slug={f.slug} id={f.id} coverImage={f.coverImage} kicker="Max-Morrys Edu" size="sm" style={{ position: 'absolute', inset: 0, borderRadius: 0, minHeight: 0 }} />
                        <div className="mm-vid__bar">
                          <span className="tr"><i style={{ ['--p' as string]: Math.min(1, ef.enrollment.progress / 100) }} /></span>
                          <span><Num value={ef.enrollment.progress} unit="%" source="db" asOf={asOf} /></span>
                        </div>
                      </div>
                      <div className="mm-vid__b">
                        <span>{n.next ? `${f.title} · ${t('dashboardV3.moduleN', { n: n.next.moduleIndex })}` : f.title}</span>
                        <b>{n.next ? `${n.next.moduleIndex}.${n.next.lessonIndex} · ${n.next.lesson.title}` : t('dashboard.continue')}</b>
                      </div>
                    </LocalizedLink>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── La cohorte : pas encore de producteur, donc une carte vide qui le dit ── */}
          <section
            className="mm-card grid items-center gap-5 stack:grid-cols-[1fr_auto]"
            style={{ background: 'linear-gradient(110deg, color-mix(in srgb, var(--mm-corail-f) 10%, var(--bento)), var(--bento) 60%)' }}
          >
            <div>
              <span className="mm-eyebrow">{t('dashboardV3.cohortEyebrow')}</span>
              <b className="mt-2 block" style={{ font: '600 18px/1.3 var(--f-body)' }}>{t('dashboardV3.cohortEmpty')}</b>
              <p className="m-0 mt-1 text-ink-2" style={{ fontSize: '14px' }}>{t('dashboardV3.cohortBody')}</p>
            </div>
            <LocalizedLink to="/mon-espace/cohorte" className="mm-pill is-sm justify-self-start">
              {t('dashboardV3.cohortCta')}
              <i><Icon name="arrow-up-right" size={14} /></i>
            </LocalizedLink>
          </section>

          {/* ── L'assistant : son nom vient du profil (`tutorName`), jamais d'une constante.
              Aucun historique n'est cité : rien ne le produit en base. ── */}
          <section className="mm-card grid items-center gap-5 stack:grid-cols-[1fr_auto]">
            <div className="flex items-center gap-4">
              <span aria-hidden="true" className="grid flex-none place-items-center rounded-m" style={{ width: '46px', height: '46px', background: 'var(--mm-violet-f)', color: 'var(--paper-fixed)' }}>
                <Icon name="sparkles" size={20} />
              </span>
              <div className="min-w-0">
                <b className="block" style={{ font: '600 18px/1.3 var(--f-body)' }}>{t('dashboard.tutorTitle', { tutor })}</b>
                <p className="m-0 mt-1 text-ink-2" style={{ fontSize: '14px' }}>{t('dashboard.tutorBody')}</p>
              </div>
            </div>
            <LocalizedLink to="/mon-espace/assistant" className="mm-btn is-sm is-club justify-self-start">
              {t('dashboard.tutorCta')}
            </LocalizedLink>
          </section>
        </div>

        {/* ═══ Colonne de droite ═══ */}
        <div className="flex flex-col gap-5">
          <section className="mm-card">
            <div className="mb-4 flex items-center">
              <h3>{t('dashboardV3.agendaTitle')}</h3>
              <LocalizedLink to="/mon-espace/agenda" className="mm-more" aria-label={t('dashboardV3.agendaOpen')}>
                <Icon name="calendar" size={15} />
              </LocalizedLink>
            </div>
            <div className="mm-days" role="group" aria-label={t('dashboardV3.agendaWeek')}>
              {days.map((d) => (
                <button key={d.toISOString()} type="button" aria-pressed={d.toDateString() === todayKey} tabIndex={-1}>
                  {dayFmt.format(d).replace('.', '')}
                  <b>{d.getDate()}</b>
                </button>
              ))}
            </div>
            <p className="m-0 mt-4 text-ink-2" style={{ fontSize: '14px', lineHeight: 1.5 }}>{t('dashboardV3.agendaEmpty')}</p>
          </section>

          <section className="mm-card">
            <div className="flex items-center">
              <h3>{t('dashboardV3.questsTitle')}</h3>
              <LocalizedLink to="/mon-espace/succes" className="mm-more" aria-label={t('dashboardV3.questsOpen')}>
                <Icon name="trophy" size={15} />
              </LocalizedLink>
            </div>
            {quests.length === 0 ? (
              <p className="m-0 mt-4 text-ink-2" style={{ fontSize: '14px', lineHeight: 1.5 }}>{t('dashboardV3.questsEmpty')}</p>
            ) : quests.map((q) => {
              const pct = q.goal > 0 ? Math.min(1, Math.max(0, q.value / q.goal)) : 0;
              return (
                <div key={q.key} className="mm-quest">
                  <div className="row">
                    <span className="gem" style={{ background: q.gem }}><Icon name={q.icon} size={20} /></span>
                    <div className="min-w-0">
                      <b>{q.title}</b>
                      <span className="xp">{q.reward}</span>
                    </div>
                  </div>
                  <div className="mm-qbar"><i style={{ ['--p' as string]: pct }} /></div>
                  <div className="flex items-center justify-between" style={{ fontSize: '12.5px', color: 'var(--ink-2)' }}>
                    <span><Num value={q.value} source="db" asOf={asOf} />/<Num value={q.goal} source="db" asOf={asOf} /></span>
                    {pct >= 1 && <span className="mm-tag">{t('dashboardV3.questDone')}</span>}
                  </div>
                </div>
              );
            })}
          </section>
        </div>
      </div>
    </div>
  );
}
