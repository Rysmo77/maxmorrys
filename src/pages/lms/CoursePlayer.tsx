import { useEffect, useState, type ReactNode } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import {
  Button, EmptyState, GlassPanel, Icon, LessonRow, Num,
  Skeleton, Tag, type IconName,
} from '@ds';
import { Sheet } from '@/components/dialogs';
import { SiteDisplay } from '../../components/site';
import DsNavHost from '../../components/layout/DsNavHost';
import LocalizedLink from '../../components/shared/LocalizedLink';
import { useLocalizedPath } from '../../contexts/LanguageContext';
import { markdownToHtml } from '../../lib/markdown';
import type { Formation, Lesson } from '../../types';
import { useCoursePlayer } from './hooks/useCoursePlayer';
import { estAVenir, ouverture } from '../../types/formationRelease';
import { useFormat } from '../../hooks/useFormat';
import QuizCard from '../../components/edu/g3/QuizCard';
import { flattenLessons, parseQuizContent } from '../../components/edu/g3/quiz';

import Bento from '../../components/formations/Bento';
/**
 * LE LECTEUR DE LEÇON — maquette `Edu-Lecon` (kit v3, passe 2 lot B).
 *
 * Deux colonnes : la leçon (fil, média, titre, onglets, contenu, mission du module, navigation
 * précédente / suivante) et, à droite, le module ouvert puis l'entrée de Rysmo IA. Le lecteur vit
 * HORS de `StudentLayout` (route `/cours/:slug`, plein écran) : il porte son propre retour.
 *
 * Ce que la maquette dessine et que le produit n'a pas, donc absent :
 *   · la barre de temps de la vidéo (une `<iframe>` YouTube/Vimeo ne dit ni position ni durée :
 *     une barre qu'on ne peut pas renseigner serait un nombre non sourcé) ;
 *   · les onglets « Mes notes » et « Discussion au Club » par leçon (aucun lien leçon → note ou
 *     fil n'existe en base) ; seuls « La leçon » et « Ressources » sont repris ;
 *   · la conversation d'exemple de Rysmo : la carte mène à l'assistant, qui relève son quota.
 * La progression affichée est la VRAIE (leçons cochées, `source="db"`), jamais une animation.
 *
 * `?lecon=<id>` ouvre directement une leçon : c'est par là que l'écran de quiz de module
 * renvoie, pour enregistrer un sans-faute dans la formation.
 */

/** Le glyphe de chaque type de leçon. Un seul jeu d'icônes, celui du système. */
const LESSON_GLYPH: Record<string, IconName> = {
  video: 'play', text: 'doc', quiz: 'info', resource: 'download', mission: 'target',
};

/* ─────────────────────────────────────────────────────────────────────────────
   Le programme — modules dépliables, lignes de leçon du système.
   ───────────────────────────────────────────────────────────────────────────── */

function CourseOutline({
  formation, expandedModules, toggleModule, completedLessons, activeLesson, setActiveLesson, readAt,
  preview = false,
}: {
  formation: Formation;
  expandedModules: string[];
  toggleModule: (id: string) => void;
  completedLessons: string[];
  activeLesson: Lesson | null;
  setActiveLesson: (lesson: Lesson) => void;
  readAt: Date;
  /** Aperçu sans inscription : seules les leçons marquées gratuites s'ouvrent. */
  preview?: boolean;
}) {
  const { t } = useTranslation('lms');

  return (
    <Bento padding="4px 18px" as="nav" aria-label={t('player.outlineLabel')}>
      {(formation.modules ?? []).map((module, mi) => {
        const isExpanded = expandedModules.includes(module.id);
        const moduleCompleted = module.lessons.length > 0 && module.lessons.every((l) => completedLessons.includes(l.id));
        const lastModule = mi === (formation.modules?.length ?? 0) - 1;

        return (
          <div key={module.id}>
            <LessonRow
              state={moduleCompleted ? 'done' : 'plain'}
              title={module.title}
              meta={<Num value={module.lessons.length} unit={t('checkout.lessonsLabel').toLowerCase()} source="db" asOf={readAt} />}
              onClick={() => toggleModule(module.id)}
              trailing={
                <span style={{ display: 'grid', placeItems: 'center', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform var(--t-ui) var(--ease)' }}>
                  <Icon name="chevron" size={16} color="var(--text-muted)" title={t('player.moduleToggle', { title: module.title })} />
                </span>
              }
              last={lastModule && !isExpanded}
            />

            {isExpanded && module.lessons.map((lesson, li) => {
              const isComplete = completedLessons.includes(lesson.id);
              const isActive = activeLesson?.id === lesson.id;
              /* En aperçu, tout ce qui n'est pas marqué gratuit se voit et ne s'ouvre pas :
                 la personne mesure ce qu'elle achète au lieu de deviner. */
              const locked = preview && !lesson.isFree;
              return (
                <LessonRow
                  key={lesson.id}
                  state={isComplete ? 'done' : isActive ? 'current' : 'todo'}
                  icon={
                    locked ? <Icon name="lock" size={13} color="var(--ink-2)" strokeWidth={2.4} />
                      : isActive ? <Icon name={LESSON_GLYPH[lesson.type] ?? 'doc'} size={13} color="var(--paper-fixed)" />
                      : undefined
                  }
                  iconBackground={locked ? 'var(--fill-2)' : isActive ? 'var(--action-forme)' : undefined}
                  title={lesson.title}
                  meta={isActive ? `${lesson.duration} · ${t('player.lessonCurrent')}` : lesson.duration}
                  onClick={locked ? undefined : () => setActiveLesson(lesson)}
                  last={lastModule && li === module.lessons.length - 1}
                />
              );
            })}
          </div>
        );
      })}
    </Bento>
  );
}


/* ─────────────────────────────────────────────────────────────────────────────
   La mission — contenu de la leçon `type: 'mission'`, validée par la personne.
   ───────────────────────────────────────────────────────────────────────────── */

function MissionBody({ content, onComplete, isComplete }: { content: string; onComplete: () => void; isComplete: boolean }) {
  const { t } = useTranslation('lms');
  return (
    <div>
      {content ? (
        <div className="mm-prose prose-article mb-6" style={{ maxWidth: '68ch' }} dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }} />
      ) : (
        <p className="text-ink-2 italic mb-6">{t('player.missionContentSoon')}</p>
      )}
      {isComplete
        ? <Tag tone="ok"><Icon name="check" size={13} /> {t('player.missionAccomplished')}</Tag>
        : <Button tone="informe" size="sm" fullWidth={false} onClick={onComplete}><Icon name="check" size={15} color="var(--ink-fixed)" /> {t('player.missionDone')}</Button>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   L'écran.
   ───────────────────────────────────────────────────────────────────────────── */

export default function CoursePlayer() {
  const { t } = useTranslation('lms');
  const { slug } = useParams();
  const [params] = useSearchParams();
  const path = useLocalizedPath();
  const { formatDate } = useFormat();
  const [mobileOutlineOpen, setMobileOutlineOpen] = useState(false);
  const [tab, setTab] = useState<'lesson' | 'resources'>('lesson');

  const {
    formation, enrollment, loading, saving, completedLessons,
    activeLesson, setActiveLesson, expandedModules, toggleModule,
    totalLessons, progress, readAt, positionOf, toggleComplete,
  } = useCoursePlayer(slug);

  /* `?lecon=<id>` : l'écran de quiz de module renvoie ici pour enregistrer un sans-faute. */
  const wanted = params.get('lecon');
  useEffect(() => {
    if (!wanted || !formation) return;
    const hit = flattenLessons(formation).find((l) => l.lesson.id === wanted);
    if (hit) setActiveLesson(hit.lesson);
  }, [wanted, formation, setActiveLesson]);

  useEffect(() => { setTab('lesson'); }, [activeLesson?.id]);

  if (loading) {
    return (
      <Frame>
        <Skeleton width="40%" height={14} label={t('certificate.loadingAria')} />
        <Skeleton height={440} radius="var(--r-media)" style={{ marginTop: '16px' }} />
        <Skeleton width="70%" height={34} style={{ marginTop: '20px' }} />
        <Skeleton height={220} radius="var(--r-l)" style={{ marginTop: '14px' }} />
      </Frame>
    );
  }

  if (!formation) {
    return (
      <Frame back={{ href: path('/mon-espace'), label: t('player.backToSpace') }}>
        <SiteDisplay lines={t('player.notFoundLines', { returnObjects: true }) as string[]} size={30} />
        <Bento padding={20} className="mt-[18px]">
          <EmptyState
            glyph={<Icon name="book" size={26} color="var(--text-muted)" />}
            title={t('player.courseNotFoundTitle')}
            action={<Button tone="quiet" fullWidth href={path('/mon-espace')}>{t('player.backToSpace')}</Button>}
            style={{ padding: 0 }}
          />
        </Bento>
      </Frame>
    );
  }

  /* Une formation à venir n'a rien à lire, même pour qui l'a précommandée : le verrou est
     DÉRIVÉ de la formation et tombe tout seul le jour de l'ouverture. */
  if (estAVenir(formation)) {
    const quand = ouverture(formation);
    return (
      <Frame back={{ href: path(`/formations/${formation.slug}`), label: t('player.seeFormation') }}>
        <SiteDisplay lines={t('player.lockedLines', { returnObjects: true }) as string[]} size={30} />
        <Bento padding={20} className="mt-[18px]">
          <EmptyState
            glyph={<Icon name="lock" size={26} color="var(--warn)" />}
            title={t('player.comingSoonTitle')}
            body={quand
              ? t('player.comingSoonBodyDated', { date: quand.kind === 'date' ? formatDate(quand.value) : quand.value })
              : t('player.comingSoonBody')}
            action={<Button tone="quiet" fullWidth href={path(`/formations/${formation.slug}`)}>{t('player.seeFormation')}</Button>}
            style={{ padding: 0 }}
          />
        </Bento>
      </Frame>
    );
  }

  /* L'aperçu gratuit : sans inscription, seules les leçons `isFree` s'ouvrent. Sans inscription
     et sans leçon gratuite, le mur reste — il est alors la vérité. */
  const freeLessons = (formation.modules ?? []).flatMap((m) => m.lessons ?? []).filter((l) => l.isFree);
  const preview = !enrollment && freeLessons.length > 0;

  if (!enrollment && !preview) {
    return (
      <Frame back={{ href: path(`/formations/${formation.slug}`), label: t('player.seeFormation') }}>
        <SiteDisplay lines={t('player.lockedLines', { returnObjects: true }) as string[]} size={30} />
        <Bento padding={20} className="mt-[18px]">
          <EmptyState
            glyph={<Icon name="lock" size={26} color="var(--text-muted)" />}
            title={t('player.enrollmentRequiredTitle')}
            body={
              <>
                <Trans ns="lms" i18nKey="player.notEnrolledText" values={{ title: formation.title }} components={{ strong: <strong className="text-ink" /> }} />{' '}
                {t('player.enrollPrompt')}
              </>
            }
            action={
              <>
                <Button tone="forme" href={path(`/formations/${formation.slug}`)}>
                  {t('player.seeFormation')} <Icon name="forward" size={16} color="var(--paper-fixed)" />
                </Button>
                <Button tone="quiet" fullWidth href={path('/formations')} className="mt-2.5">{t('player.allFormations')}</Button>
              </>
            }
            style={{ padding: 0 }}
          />
        </Bento>
      </Frame>
    );
  }

  /* ── Repères dérivés du programme ─────────────────────────────────────────── */
  const all = flattenLessons(formation);
  const at = activeLesson ? all.findIndex((l) => l.lesson.id === activeLesson.id) : -1;
  const here = at >= 0 ? all[at] : null;
  const position = activeLesson ? positionOf(activeLesson.id) : null;
  const num = position ? `${position.moduleIndex + 1}.${position.lessonIndex + 1}` : null;
  const opens = (l: Lesson) => !preview || l.isFree;
  const prev = at > 0 ? all.slice(0, at).reverse().find((l) => opens(l.lesson)) ?? null : null;
  const next = at >= 0 ? all.slice(at + 1).find((l) => opens(l.lesson)) ?? null : null;
  const moduleLessons = here ? all.filter((l) => l.moduleId === here.moduleId) : [];
  /* La mission du module ouvert, s'il en a une et qu'elle n'est pas déjà à l'écran. */
  const mission = here && activeLesson?.type !== 'mission'
    ? moduleLessons.find((l) => l.lesson.type === 'mission') ?? null
    : null;
  const isDone = activeLesson ? completedLessons.includes(activeLesson.id) : false;
  const resources = activeLesson?.resources ?? [];
  const questions = activeLesson?.type === 'quiz' ? parseQuizContent(activeLesson.content) : [];

  const finishAndNext = async () => {
    if (!activeLesson) return;
    if (!isDone && enrollment) await toggleComplete(activeLesson.id);
    if (next) setActiveLesson(next.lesson);
  };

  const outline = (
    <CourseOutline
      formation={formation}
      expandedModules={expandedModules}
      toggleModule={toggleModule}
      completedLessons={completedLessons}
      activeLesson={activeLesson}
      setActiveLesson={(lesson) => { setActiveLesson(lesson); setMobileOutlineOpen(false); }}
      readAt={readAt}
      preview={preview}
    />
  );

  return (
    <Frame back={{ href: path('/mon-espace/cours'), label: t('playerV3.crumbCourses') }}>
      <div className="grid items-start gap-[22px] wide:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          {/* ── Le fil ─────────────────────────────────────────────────────── */}
          <nav aria-label={t('player.breadcrumbLabel')} className="mb-[14px] flex flex-wrap items-center gap-[10px] text-[13px] text-ink-2">
            <LocalizedLink to="/mon-espace/cours" className="text-inherit no-underline">{t('playerV3.crumbCourses')}</LocalizedLink>
            <span aria-hidden="true">›</span>
            <span>{formation.title}</span>
            {here && (<><span aria-hidden="true">›</span><span>{t('playerV3.module', { n: here.moduleIndex })}</span></>)}
            {at >= 0 && (
              <span className="ml-auto">
                {t('playerV3.lesson')} <Num value={at + 1} source="db" asOf={readAt} /> / <Num value={all.length} source="db" asOf={readAt} />
              </span>
            )}
          </nav>

          {preview && (
            <GlassPanel level="truth" className="mb-4">
              <p className="mm-eyebrow m-0 mb-[6px]">{t('player.previewEyebrow')}</p>
              <p className="m-0 text-meta-2 text-ink-2 leading-[1.5]">{t('player.previewBody')}</p>
              <Button href={path(`/formations/${formation.slug}`)} tone="forme" size="sm" fullWidth={false} className="mt-3">
                {t('player.previewCta')}
              </Button>
            </GlassPanel>
          )}

          {!activeLesson ? (
            <Bento padding={20}>
              <EmptyState
                glyph={<Icon name="play" size={26} color="var(--text-muted)" />}
                title={t('player.selectLessonTitle')}
                body={t('player.selectLessonText')}
                style={{ padding: 0 }}
              />
            </Bento>
          ) : (
            <>
              {/* ── Le média : la vidéo réelle, ou la surface de la maquette sans faux lecteur ── */}
              {activeLesson.type === 'video' && (
                activeLesson.videoUrl ? (
                  <div className="overflow-hidden rounded-media bg-[color:var(--night)]" style={{ aspectRatio: '16 / 9' }}>
                    <iframe
                      src={activeLesson.videoUrl}
                      title={t('player.videoLabel')}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div
                    className="relative grid place-items-center overflow-hidden rounded-media"
                    style={{ height: 'clamp(220px, 34vw, 440px)', background: 'linear-gradient(150deg, var(--night) 0%, var(--mm-bleu-f) 55%, var(--mm-violet-f))' }}
                  >
                    <span className="mm-photo__label" style={{ left: '24px', top: '22px', bottom: 'auto' }}>{t('player.videoSoon')}</span>
                    <span aria-hidden="true" className="grid place-items-center rounded-pill" style={{ width: '84px', height: '84px', background: 'color-mix(in srgb, var(--paper-fixed) 92%, transparent)', color: 'var(--ink-fixed)' }}>
                      <Icon name="play" size={28} />
                    </span>
                  </div>
                )
              )}

              <div className="mt-5 flex items-end justify-between gap-4">
                <h1 className="mm-d m-0" style={{ fontSize: 'clamp(28px, 3.4vw, 40px)' }}>
                  {num ? `${num} · ` : ''}{activeLesson.title}
                </h1>
                {isDone && <Tag tone="ok"><Icon name="check" size={13} /> {t('player.lessonDone')}</Tag>}
              </div>

              <div className="mm-tabs max-w-full overflow-x-auto" role="tablist" aria-label={t('playerV3.tabsLabel')} style={{ margin: '18px 0' }}>
                <button type="button" role="tab" aria-selected={tab === 'lesson'} aria-pressed={tab === 'lesson'} onClick={() => setTab('lesson')}>
                  {t('playerV3.tabLesson')}
                </button>
                <button type="button" role="tab" aria-selected={tab === 'resources'} aria-pressed={tab === 'resources'} onClick={() => setTab('resources')}>
                  {t('playerV3.tabResources')} · <Num value={resources.length} source="db" asOf={readAt} />
                </button>
              </div>

              {tab === 'resources' ? (
                resources.length === 0 ? (
                  <p className="m-0 text-ink-2" style={{ fontSize: '15px' }}>{t('playerV3.resourcesEmpty')}</p>
                ) : (
                  <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {resources.map((r) => (
                      <li key={r.id}>
                        <a href={r.url} target="_blank" rel="noreferrer" className="mm-card flex items-center gap-3 no-underline" style={{ padding: '14px 16px', color: 'var(--ink)' }}>
                          <Icon name="download" size={18} />
                          <span className="flex-1 font-semibold">{r.title}</span>
                          {r.size && <span className="text-ink-2" style={{ fontSize: '13px' }}>{r.size}</span>}
                        </a>
                      </li>
                    ))}
                  </ul>
                )
              ) : activeLesson.type === 'quiz' ? (
                questions.length === 0 ? (
                  <EmptyState glyph={<Icon name="info" size={26} color="var(--text-muted)" />} body={t('player.quizPreparing')} />
                ) : (
                  <QuizCard
                    key={activeLesson.id}
                    questions={questions}
                    readAt={readAt}
                    labels={{
                      question: (n, total) => t('playerV3.quizQuestion', { n, total }),
                      correctCount: t('playerV3.quizCorrect'),
                      answersLabel: t('player.quizAnswersLabel'),
                      right: t('playerV3.quizRight'),
                      wrong: (answer) => t('playerV3.quizWrong', { answer }),
                      next: t('playerV3.quizNext'),
                      finish: t('playerV3.quizFinish'),
                      resultTitle: t('playerV3.quizResult'),
                      resultPass: t('playerV3.quizPass'),
                      resultFail: t('playerV3.quizFail'),
                      restart: t('player.restart'),
                      scoreSource: t('playerV3.quizSource'),
                    }}
                    passAction={enrollment && !isDone ? (
                      <Button tone="digitalise" size="sm" fullWidth={false} loading={saving} onClick={() => void toggleComplete(activeLesson.id)}>
                        <Icon name="check" size={15} color="var(--paper-fixed)" /> {t('player.markCompleted')}
                      </Button>
                    ) : undefined}
                  />
                )
              ) : activeLesson.type === 'mission' ? (
                <MissionBody
                  key={activeLesson.id}
                  content={activeLesson.content}
                  onComplete={() => void toggleComplete(activeLesson.id)}
                  isComplete={isDone}
                />
              ) : activeLesson.content ? (
                <div className="mm-prose prose-article" style={{ maxWidth: '68ch', fontSize: '16.5px', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: markdownToHtml(activeLesson.content) }} />
              ) : (
                <p className="text-ink-2 italic">{t('player.lessonContentSoon')}</p>
              )}

              {/* ── La mission du module ─────────────────────────────────────── */}
              {mission && (
                <div
                  className="mt-6 flex flex-col gap-5 stack:flex-row stack:items-center stack:justify-between"
                  style={{ borderRadius: '22px', background: 'var(--mm-orange-f)', color: 'var(--ink-fixed)', padding: '22px' }}
                >
                  <div>
                    <span className="mm-eyebrow" style={{ color: 'var(--ink-fixed)' }}>
                      {t('playerV3.missionEyebrow', { n: `${mission.moduleIndex}.${mission.lessonIndex}` })}
                    </span>
                    <b className="mt-2 block" style={{ font: '900 24px/1.1 var(--f-display)' }}>{mission.lesson.title}</b>
                  </div>
                  <div className="flex flex-none flex-col gap-2">
                    <button
                      type="button"
                      className="mm-pill is-ink is-sm"
                      disabled={!opens(mission.lesson)}
                      onClick={() => setActiveLesson(mission.lesson)}
                    >
                      {t('playerV3.missionOpen')}
                      <i><Icon name="arrow-up-right" size={14} /></i>
                    </button>
                    <LocalizedLink to="/mon-espace/assistant" className="text-center" style={{ font: '600 13px/1 var(--f-body)', color: 'var(--ink-fixed)' }}>
                      {t('playerV3.askRysmo')}
                    </LocalizedLink>
                  </div>
                </div>
              )}

              {/* ── Précédente / terminée · suivante ─────────────────────────── */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                {prev ? (
                  <button
                    type="button"
                    onClick={() => setActiveLesson(prev.lesson)}
                    className="mm-press inline-flex items-center gap-2 rounded-pill"
                    style={{ height: '46px', padding: '0 20px', border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink)', font: '600 14px/1 var(--f-body)', cursor: 'pointer' }}
                  >
                    <Icon name="back" size={15} />
                    {`${prev.moduleIndex}.${prev.lessonIndex} · ${prev.lesson.title}`}
                  </button>
                ) : <span />}
                {activeLesson.type !== 'quiz' && activeLesson.type !== 'mission' && enrollment ? (
                  <button type="button" className="mm-pill" onClick={() => void finishAndNext()} disabled={saving}>
                    {next ? t('playerV3.doneNext') : isDone ? t('player.lessonDone') : t('player.markLessonCompleted')}
                    <i><Icon name="arrow-up-right" size={14} /></i>
                  </button>
                ) : next ? (
                  <button type="button" className="mm-pill" onClick={() => setActiveLesson(next.lesson)}>
                    {t('playerV3.next')}
                    <i><Icon name="arrow-up-right" size={14} /></i>
                  </button>
                ) : null}
              </div>
            </>
          )}
        </div>

        {/* ── Colonne de droite : le module ouvert, puis Rysmo IA ─────────────── */}
        <div className="flex flex-col gap-5">
          <section className="mm-card">
            <div className="mb-[14px] flex items-center gap-[10px]">
              <h3>{here ? t('playerV3.moduleTitle', { n: here.moduleIndex, title: here.moduleTitle }) : t('player.programTitle')}</h3>
              <button type="button" className="mm-more" aria-label={t('player.courseOutline')} onClick={() => setMobileOutlineOpen(true)} style={{ cursor: 'pointer' }}>
                <Icon name="list" size={15} />
              </button>
            </div>
            <div className="mb-[10px] flex items-center gap-[10px]">
              <div className="mm-progress" style={{ flex: 1 }} role="progressbar" aria-label={t('player.progressLabel')} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                <i style={{ ['--p' as string]: Math.min(1, Math.max(0, progress / 100)) }} />
              </div>
              <span style={{ fontSize: '12.5px' }}>
                <Num value={completedLessons.length} source="db" asOf={readAt} /> / <Num value={totalLessons} source="db" asOf={readAt} />
              </span>
            </div>
            {(here ? moduleLessons : all.slice(0, 8)).map((l) => {
              const done = completedLessons.includes(l.lesson.id);
              const active = l.lesson.id === activeLesson?.id;
              const locked = !opens(l.lesson);
              return (
                <button
                  key={l.lesson.id}
                  type="button"
                  disabled={locked}
                  aria-current={active ? 'true' : undefined}
                  onClick={() => setActiveLesson(l.lesson)}
                  className="flex w-full items-center gap-3 rounded-m text-left"
                  style={{
                    padding: '11px 12px', border: 0, cursor: locked ? 'not-allowed' : 'pointer', fontSize: '14px',
                    background: active ? 'var(--mm-bleu-c)' : 'transparent', color: active ? 'var(--mm-bleu-f)' : 'var(--ink)',
                    opacity: locked ? 0.55 : 1,
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="grid flex-none place-items-center rounded-pill"
                    style={{
                      width: '24px', height: '24px',
                      background: done ? 'var(--mm-teal-f)' : active ? 'var(--mm-bleu-f)' : 'var(--paper-2)',
                      color: done || active ? 'var(--paper-fixed)' : 'var(--ink-3)',
                    }}
                  >
                    <Icon name={locked ? 'lock' : done ? 'check' : LESSON_GLYPH[l.lesson.type] ?? 'doc'} size={12} />
                  </span>
                  <span className="text-ink-2" style={{ fontSize: '12px' }}>{`${l.moduleIndex}.${l.lessonIndex}`}</span>
                  <span className="flex-1 font-semibold">{l.lesson.title}</span>
                </button>
              );
            })}
          </section>

          <section className="mm-card">
            <h3>{num ? t('playerV3.rysmoTitle', { n: num }) : t('playerV3.rysmoName')}</h3>
            <p className="m-0 mt-2 text-ink-2" style={{ fontSize: '14px', lineHeight: 1.55 }}>{t('playerV3.rysmoBody')}</p>
            <LocalizedLink to="/mon-espace/assistant" className="mm-pill is-sm mt-4">
              {t('playerV3.askRysmo')}
              <i><Icon name="arrow-up-right" size={14} /></i>
            </LocalizedLink>
          </section>
        </div>
      </div>

      <Sheet open={mobileOutlineOpen} onClose={() => setMobileOutlineOpen(false)} title={t('player.courseOutline')}>
        {outline}
      </Sheet>
    </Frame>
  );
}

/**
 * La coquille d'un écran plein écran : le lecteur vit HORS de `StudentLayout` (route
 * `/cours/:slug`), sans colonne ni barre d'onglets à hériter — il porte donc son retour.
 */
function Frame({ children, back }: { children: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="relative min-h-screen bg-[color:var(--paper)] px-[18px] pb-16 pt-4 wide:px-8">
      <DsNavHost className="relative mx-auto w-full max-w-[1360px]">
        {back && (
          <div className="mb-1 flex h-12 items-center">
            <a href={back.href} className="mm-touch-extend inline-flex items-center gap-2 text-ink-2 no-underline" style={{ fontSize: '13px', fontWeight: 600 }}>
              <Icon name="back" size={17} strokeWidth={2.4} />
              {back.label}
            </a>
          </div>
        )}
        {children}
      </DsNavHost>
    </div>
  );
}
