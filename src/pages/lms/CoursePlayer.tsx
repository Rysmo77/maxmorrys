import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import {
  Breadcrumb, Button, EmptyState, GlassPanel, Icon, LessonRow, Mesh, Num,
  ProgressBar, Skeleton, Tag, type IconName,
} from '@ds';
import Sheet from '../../components/ui/Sheet';
import { SiteDisplay, SiteEyebrow, useReveal } from '../../components/site';
import DsNavHost from '../../components/layout/DsNavHost';
import { useLocalizedPath } from '../../contexts/LanguageContext';
import { markdownToHtml } from '../../lib/markdown';
import type { Formation, Lesson } from '../../types';
import { useCoursePlayer } from './hooks/useCoursePlayer';

/**
 * LE LECTEUR DE LEÇON (`ScreensSpace.js` · `Lecteur`).
 *
 * ═════════════════════════════════════════════════════════════════════════════
 * LA BARRE DE PROGRESSION EST LA VRAIE, ET C'EST LE PIÈGE PRINCIPAL DE CET ÉCRAN.
 *
 * Le kit dessine `.bar-fill` sous la vidéo. `brand/motion.css` lui fait jouer `barfill` :
 * une animation de 8 % À 38 %, EN 3,4 s, QUELLE QUE SOIT LA VALEUR RÉELLE. C'est une
 * progression fabriquée — sur une planche, elle donne l'impression que ça avance ; en
 * production, elle mentirait à quelqu'un qui a fait 2 % ou 90 %.
 *
 * `ProgressBar` est donc utilisé partout, avec `value={progress}` calculé sur les leçons
 * réellement cochées, `source="db"` et `asOf` = l'instant de la lecture Firestore. Il porte
 * `prog-fill`, le marqueur que `ds:check` reconnaît comme la SEULE exception d'AD-16 : c'est
 * le seul endroit du système où une largeur s'anime, parce qu'un dégradé étiré en `scaleX`
 * n'est pas le même dégradé.
 *
 * La barre de lecture de la VIDÉO, elle, disparaît : le produit rend une `<iframe>` YouTube
 * ou Vimeo, dont on ne connaît ni la position ni la durée. Une barre de temps qu'on ne peut
 * pas renseigner est exactement le nombre non sourcé que la règle 6 refuse.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE LE KIT DESSINE ET QUE LE PRODUIT N'A PAS
 *
 * La `ChipRow` « Vidéo · Transcription · Mes notes · Ressources » suppose quatre vues par
 * leçon. Une `Lesson` a UN `type` et un seul contenu ; il n'y a ni transcription, ni panneau
 * de notes dans le lecteur. Quatre onglets dont trois vides, ce n'est pas une recomposition,
 * c'est une promesse. Ils ne sont pas repris.
 * ═════════════════════════════════════════════════════════════════════════════
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
    <GlassPanel level="flat" padding="4px 18px" as="nav" aria-label={t('player.outlineLabel')}>
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
    </GlassPanel>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Le quiz — inchangé dans sa logique, reposé sur les primitives.
   ───────────────────────────────────────────────────────────────────────────── */

interface QuizQuestion {
  question: string;
  options: { text: string; correct: boolean }[];
}

/**
 * Parse quiz content from markdown format:
 * ## Question text
 * - [ ] Wrong answer
 * - [x] Correct answer
 * - [ ] Wrong answer
 */
function parseQuizContent(content: string): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const blocks = content.split(/^##\s+/m).filter(Boolean);
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    const question = lines[0].trim();
    const options: { text: string; correct: boolean }[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      const correctMatch = line.match(/^-\s*\[x\]\s*(.+)/i);
      const wrongMatch = line.match(/^-\s*\[\s*\]\s*(.+)/);
      if (correctMatch) options.push({ text: correctMatch[1].trim(), correct: true });
      else if (wrongMatch) options.push({ text: wrongMatch[1].trim(), correct: false });
    }
    if (question && options.length >= 2) {
      questions.push({ question, options });
    }
  }
  return questions;
}

function QuizRenderer({ content, onComplete, readAt }: { content: string; onComplete: () => void; readAt: Date }) {
  const { t } = useTranslation('lms');
  const questions = parseQuizContent(content);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = submitted
    ? Object.entries(answers).filter(([qi, ai]) => questions[Number(qi)]?.options[ai]?.correct).length
    : 0;

  const handleReset = useCallback(() => {
    setAnswers({});
    setSubmitted(false);
  }, []);

  if (questions.length === 0) {
    return (
      <EmptyState
        glyph={<Icon name="info" size={26} color="var(--text-muted)" />}
        body={t('player.quizPreparing')}
      />
    );
  }

  return (
    <div className="p-[18px] space-y-7">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="w-10 h-10 rounded-m grid place-items-center bg-[color:var(--fill-1)]">
          <Icon name="info" size={19} color="var(--mm-orange-t)" />
        </span>
        <div>
          <p className="font-display text-ttl text-ink m-0">{t('player.quizTitle', { count: questions.length })}</p>
          {/* Le score est un nombre CALCULÉ SUR CET ÉCRAN : sa source est le barème du quiz,
              pas la base. Il se cite, comme tout le reste. */}
          {submitted && (
            <p className="m-0 text-meta font-semibold">
              <Num
                value={`${score}/${questions.length}`}
                source={{ cite: t('player.quizTitle', { count: questions.length }) }}
                asOf={readAt}
              />
            </p>
          )}
        </div>
      </div>

      {questions.map((q, qi) => (
        <fieldset key={qi} className="space-y-2.5 border-0 p-0 m-0">
          <legend className="font-semibold text-ink text-meta p-0 mb-2.5">{qi + 1}. {q.question}</legend>
          <div className="space-y-2" role="group" aria-label={t('player.quizAnswersLabel')}>
            {q.options.map((opt, oi) => {
              const selected = answers[qi] === oi;
              let border = 'var(--ctl-off-brd)';
              let background = 'var(--ctl-off-bg)';
              if (submitted) {
                if (opt.correct) { border = 'var(--ok)'; background = 'color-mix(in srgb, var(--ok) 8%, transparent)'; }
                else if (selected) { border = 'var(--stop)'; background = 'color-mix(in srgb, var(--stop) 8%, transparent)'; }
              } else if (selected) {
                border = 'var(--ctl-sel-brd)';
                background = 'color-mix(in srgb, var(--mm-bleu) 8%, transparent)';
              }
              return (
                <button
                  key={oi}
                  type="button"
                  disabled={submitted}
                  aria-pressed={selected}
                  onClick={() => setAnswers((prev) => ({ ...prev, [qi]: oi }))}
                  className="mm-press mm-touch-extend w-full text-left flex items-center gap-2"
                  style={{
                    padding: '13px 16px', borderRadius: 'var(--r-m)',
                    borderStyle: 'solid', borderWidth: '1.5px', borderColor: border, background,
                    fontFamily: 'var(--f-body)', fontSize: 'var(--fs-meta)', color: 'var(--text-body)',
                    opacity: submitted && !opt.correct && !selected ? 0.6 : undefined,
                    transition: 'transform var(--t-tap) var(--ease),background var(--t-ui) var(--ease),border-color var(--t-ui) var(--ease)',
                  }}
                >
                  <span style={{ flex: 1 }}>{opt.text}</span>
                  {submitted && opt.correct && <Icon name="check" size={15} color="var(--ok)" />}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="flex gap-2.5 pt-2">
        {!submitted ? (
          <Button tone="forme" size="sm" onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length < questions.length}>
            {t('player.validateAnswers')}
          </Button>
        ) : (
          <>
            <Button tone="quiet" size="sm" onClick={handleReset}>
              <Icon name="repeat" size={15} /> {t('player.restart')}
            </Button>
            {score === questions.length && (
              <Button tone="digitalise" size="sm" onClick={onComplete}>
                <Icon name="check" size={15} color="var(--paper-fixed)" /> {t('player.markCompleted')}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MissionRenderer({ content, title, onComplete, isComplete }: { content: string; title: string; onComplete: () => void; isComplete: boolean }) {
  const { t } = useTranslation('lms');
  return (
    <div className="p-[18px]">
      <div className="flex items-center gap-3 mb-5">
        <span aria-hidden="true" className="w-10 h-10 rounded-m grid place-items-center bg-[color:var(--fill-1)]">
          <Icon name="target" size={19} color="var(--mm-orange-t)" />
        </span>
        <div>
          <SiteEyebrow style={{ margin: 0 }}>{t('player.mission')}</SiteEyebrow>
          <p className="font-display text-ttl text-ink m-0">{title}</p>
        </div>
      </div>

      {content ? (
        <div
          className="mm-prose prose-article mb-7"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
        />
      ) : (
        <p className="text-ink-2 italic mb-7">{t('player.missionContentSoon')}</p>
      )}

      {isComplete
        ? <Tag tone="ok"><Icon name="check" size={13} /> {t('player.missionAccomplished')}</Tag>
        : <Button tone="informe" size="sm" onClick={onComplete}><Icon name="check" size={15} color="var(--ink-fixed)" /> {t('player.missionDone')}</Button>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   L'écran.
   ───────────────────────────────────────────────────────────────────────────── */

export default function CoursePlayer() {
  const { t } = useTranslation('lms');
  const { slug } = useParams();
  const path = useLocalizedPath();
  const reveal = useReveal<HTMLDivElement>();
  const [mobileOutlineOpen, setMobileOutlineOpen] = useState(false);

  const {
    formation, enrollment, loading, saving, completedLessons,
    activeLesson, setActiveLesson, expandedModules, toggleModule,
    totalLessons, progress, readAt, positionOf, toggleComplete,
  } = useCoursePlayer(slug);

  if (loading) {
    return (
      <Frame>
        <Skeleton width="40%" height={14} label={t('certificate.loadingAria')} />
        <Skeleton width="85%" height={34} style={{ marginTop: '10px' }} />
        <Skeleton height={178} radius="var(--r-media)" style={{ marginTop: '16px' }} />
        <Skeleton height={8} radius="5px" style={{ marginTop: '20px' }} />
        <Skeleton height={220} radius="var(--r-l)" style={{ marginTop: '14px' }} />
      </Frame>
    );
  }

  if (!formation) {
    return (
      <Frame back={{ href: path('/mon-espace'), label: t('player.backToSpace') }}>
        <SiteDisplay lines={t('player.notFoundLines', { returnObjects: true }) as string[]} size={30} />
        <GlassPanel level="flat" padding={20} className="mt-[18px]">
          <EmptyState
            glyph={<Icon name="book" size={26} color="var(--text-muted)" />}
            title={t('player.courseNotFoundTitle')}
            action={<Button tone="quiet" fullWidth href={path('/mon-espace')}>{t('player.backToSpace')}</Button>}
            style={{ padding: 0 }}
          />
        </GlassPanel>
      </Frame>
    );
  }

  /*
    ── L'APERÇU GRATUIT, QUI N'EXISTAIT PAS ────────────────────────────────────────────────
    Trois surfaces le promettent — le chapô du catalogue (« le module d'ouverture de chacune
    est en accès libre : tu juges avant de payer »), l'étiquette « Gratuit » du programme et
    le bouton « Commencer le module gratuit » de la carte de prix. Le lecteur, lui, exigeait
    une inscription et renvoyait tout le monde au mur, y compris sur une formation dont des
    leçons portent `isFree: true`. Le champ existait au modèle et n'était lu NULLE PART.

    Il n'y a rien à ouvrir côté sécurité : `firestore.rules` autorise déjà la lecture d'une
    formation publiée par n'importe qui. C'était donc un mur d'interface, pas un cloisonnement.

    Sans inscription et sans leçon gratuite, le mur reste — il est alors la vérité.
  */
  const freeLessons = (formation.modules ?? []).flatMap((m) => m.lessons ?? []).filter((l) => l.isFree);
  const preview = !enrollment && freeLessons.length > 0;

  if (!enrollment && !preview) {
    return (
      <Frame back={{ href: path(`/formations/${formation.slug}`), label: t('player.seeFormation') }}>
        <SiteDisplay lines={t('player.lockedLines', { returnObjects: true }) as string[]} size={30} />
        <GlassPanel level="flat" padding={20} className="mt-[18px]">
          <EmptyState
            glyph={<Icon name="lock" size={26} color="var(--text-muted)" />}
            title={t('player.enrollmentRequiredTitle')}
            body={
              <>
                <Trans
                  ns="lms"
                  i18nKey="player.notEnrolledText"
                  values={{ title: formation.title }}
                  components={{ strong: <strong className="text-ink" /> }}
                />{' '}
                {t('player.enrollPrompt')}
              </>
            }
            action={
              <>
                <Button tone="forme" href={path(`/formations/${formation.slug}`)}>
                  {t('player.seeFormation')} <Icon name="forward" size={16} color="var(--paper-fixed)" />
                </Button>
                <Button tone="quiet" fullWidth href={path('/formations')} className="mt-2.5">
                  {t('player.allFormations')}
                </Button>
              </>
            }
            style={{ padding: 0 }}
          />
        </GlassPanel>
      </Frame>
    );
  }

  const position = activeLesson ? positionOf(activeLesson.id) : null;
  const outline = (
    <CourseOutline
      formation={formation}
      expandedModules={expandedModules}
      toggleModule={toggleModule}
      completedLessons={completedLessons}
      activeLesson={activeLesson}
      setActiveLesson={setActiveLesson}
      readAt={readAt}
      preview={preview}
    />
  );

  return (
    <Frame back={{ href: path('/mon-espace'), label: t('player.mySpace') }}>
      <Breadcrumb
        label={t('player.breadcrumbLabel')}
        items={[{ label: t('player.mySpace'), href: path('/mon-espace') }, { label: formation.title }]}
        className="mb-3"
      />

      <div ref={reveal} className="grid wide:grid-cols-[1fr_340px] gap-6 items-start">
        <div className="min-w-0">
          {/* L'aperçu dit ce qu'il est, et ce qu'il n'est pas — dont le fait que la
              progression ne s'enregistre pas : la découvrir après coup serait pire. */}
          {preview && (
            <GlassPanel level="truth" className="mb-4">
              <p className="mm-eyebrow m-0 mb-[6px]">{t('player.previewEyebrow')}</p>
              <p className="m-0 text-meta-2 text-ink-2 leading-[1.5]">{t('player.previewBody')}</p>
              <Button
                href={path(`/formations/${formation.slug}`)}
                tone="forme"
                size="sm"
                fullWidth={false}
                className="mt-3"
              >
                {t('player.previewCta')}
              </Button>
            </GlassPanel>
          )}

          {position && (
            <SiteEyebrow>
              {t('player.moduleLesson', { module: position.moduleIndex + 1, lesson: position.lessonIndex + 1 })}
            </SiteEyebrow>
          )}

          {/* Le titre de la leçon vient de la base : il peut faire soixante caractères, et
              `SiteDisplay` pose `white-space: nowrap` sur chaque ligne par contrat (AD-13,
              titres ÉCRITS ligne à ligne). Un titre de données prend donc la même face
              d'affichage, mais il se replie. */}
          {activeLesson
            ? <h1 className="font-display text-dsp-xs text-ink m-0 mt-1.5">{activeLesson.title}</h1>
            : <SiteDisplay lines={t('player.selectLines', { returnObjects: true }) as string[]} size={30} />}

          {/* ── La leçon ─────────────────────────────────────────────────── */}
          {activeLesson ? (
            <GlassPanel level="flat" padding={0} className="rv mt-4 overflow-hidden" style={{ ['--i' as string]: 3 }}>
              {activeLesson.type === 'video' ? (
                <div className="aspect-video bg-[color:var(--surface-night)] grid place-items-center">
                  {activeLesson.videoUrl ? (
                    <iframe
                      src={activeLesson.videoUrl}
                      title={t('player.videoLabel')}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <EmptyState
                      glyph={<Icon name="play" size={26} color="var(--text-invert)" />}
                      glyphBackground="color-mix(in srgb, var(--text-invert) 12%, transparent)"
                      body={<span style={{ color: 'var(--text-invert)' }}>{t('player.videoSoon')}</span>}
                    />
                  )}
                </div>
              ) : activeLesson.type === 'quiz' ? (
                <QuizRenderer key={activeLesson.id} content={activeLesson.content} readAt={readAt} onComplete={() => void toggleComplete(activeLesson.id)} />
              ) : activeLesson.type === 'mission' ? (
                <MissionRenderer
                  key={activeLesson.id}
                  content={activeLesson.content}
                  title={activeLesson.title}
                  onComplete={() => void toggleComplete(activeLesson.id)}
                  isComplete={completedLessons.includes(activeLesson.id)}
                />
              ) : (
                <div className="p-[18px] min-h-[260px]">
                  {activeLesson.content ? (
                    <div
                      className="mm-prose prose-article"
                      dangerouslySetInnerHTML={{ __html: markdownToHtml(activeLesson.content) }}
                    />
                  ) : (
                    <p className="text-ink-2 italic">{t('player.lessonContentSoon')}</p>
                  )}
                </div>
              )}

              {activeLesson.type !== 'quiz' && activeLesson.type !== 'mission' && (
                <div className="p-[18px] border-t border-[color:var(--border-hair)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink m-0">{activeLesson.title}</p>
                    <p className="text-meta text-ink-2 m-0">{activeLesson.duration}</p>
                  </div>
                  {/* `loading` fait balayer un liseré sur le libellé, qui RESTE. Jamais un rond
                      qui tourne : c'est le contrat de `Button`, et c'est ce qui remplace ici
                      les deux `Loader2` de l'ancienne version. */}
                  <Button
                    tone={completedLessons.includes(activeLesson.id) ? 'quiet' : 'primary'}
                    size="sm"
                    loading={saving}
                    onClick={() => void toggleComplete(activeLesson.id)}
                  >
                    {completedLessons.includes(activeLesson.id) && <Icon name="check" size={15} />}
                    {completedLessons.includes(activeLesson.id) ? t('player.lessonDone') : t('player.markLessonCompleted')}
                  </Button>
                </div>
              )}
            </GlassPanel>
          ) : (
            <GlassPanel level="flat" padding={20} className="rv mt-4" style={{ ['--i' as string]: 3 }}>
              <EmptyState
                glyph={<Icon name="play" size={26} color="var(--text-muted)" />}
                title={t('player.selectLessonTitle')}
                body={t('player.selectLessonText')}
                style={{ padding: 0 }}
              />
            </GlassPanel>
          )}

          {/* ── Le programme ─────────────────────────────────────────────── */}
          <div className="rv mt-5" style={{ ['--i' as string]: 5 }}>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="font-display text-ttl text-ink m-0">{t('player.programTitle')}</p>
                <p className="text-small text-ink-2 m-0">
                  {t('player.programMeta', {
                    modules: formation.modules?.length ?? 0,
                    lessons: totalLessons,
                    done: completedLessons.length,
                  })}
                </p>
              </div>
              {progress === 100 && <Tag tone="ok">{t('player.finished')}</Tag>}
            </div>

            {/*
              LA VRAIE VALEUR. `readout` rend le pourcentage par <Num>, donc en monospace
              tabulaire, avec sa provenance au survol : « Lu en base · relevé du … ».
            */}
            <ProgressBar
              value={progress}
              source="db"
              asOf={readAt}
              readout
              label={t('player.progressLabel')}
              style={{ marginTop: '10px' }}
            />
          </div>

          {/* Sous 1024 px, le programme vit dans la feuille du bas : ici, seul le grand écran
              l'a dans la colonne de droite. */}
          <div className="lg:hidden mt-3.5">{outline}</div>
        </div>

        <aside className="hidden lg:block wide:sticky lg:top-6">{outline}</aside>
      </div>

      {/* Déclencheur de la feuille, petit écran seulement. */}
      <button
        type="button"
        onClick={() => setMobileOutlineOpen(true)}
        className="mm-press mm-touch-extend lg:hidden fixed bottom-6 right-6 z-40 inline-flex items-center gap-2"
        style={{
          minHeight: 'var(--touch-btn)', padding: '0 20px', borderRadius: 'var(--r-pill)',
          background: 'var(--action-forme)', color: 'var(--paper-fixed)', border: 0,
          fontFamily: 'var(--f-body)', fontWeight: 700, fontSize: '13.5px',
          boxShadow: 'var(--sh-bleu)', cursor: 'pointer',
        }}
      >
        <Icon name="list" size={16} color="var(--paper-fixed)" />
        {t('player.courseOutline')}
      </button>

      <Sheet open={mobileOutlineOpen} onClose={() => setMobileOutlineOpen(false)} title={t('player.courseOutline')}>
        <CourseOutline
          formation={formation}
          expandedModules={expandedModules}
          toggleModule={toggleModule}
          completedLessons={completedLessons}
          activeLesson={activeLesson}
          setActiveLesson={(lesson) => { setActiveLesson(lesson); setMobileOutlineOpen(false); }}
          readAt={readAt}
        />
      </Sheet>
    </Frame>
  );
}

/**
 * La coquille d'un écran de PILE — le lecteur porte la barre d'onglets dans le kit, mais
 * dans ce produit il vit HORS de `StudentLayout` (route `/cours/:slug`, sous `LmsLayout`) :
 * il n'a donc ni colonne latérale ni barre d'onglets à hériter, et un bouton retour à porter.
 */
function Frame({
  children, back,
}: {
  children: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="relative min-h-screen isolate overflow-x-clip px-[18px] pt-4 pb-16">
      <Mesh territory="forme" />
      <DsNavHost className="relative z-[3] w-full max-w-[1120px] mx-auto">
        {back && (
          <div className="flex items-center h-12 mb-1">
            <a href={back.href} aria-label={back.label} className="mm-touch-extend inline-grid place-items-center w-touch h-touch rounded-full text-ink-2">
              <Icon name="back" size={19} strokeWidth={2.4} />
            </a>
          </div>
        )}
        {children}
      </DsNavHost>
    </div>
  );
}
