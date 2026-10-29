import { useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EmptyState, Icon, Skeleton } from '@ds';
import SEOHead from '../../../components/seo/SEOHead';
import LocalizedLink from '../../../components/shared/LocalizedLink';
import QuizCard from '../../../components/edu/g3/QuizCard';
import { flattenLessons, parseQuizContent } from '../../../components/edu/g3/quiz';
import type { EnrolledFormation } from '../hooks/useStudentData';

/* Le sous-ensemble du contexte de `StudentLayout` que l'écran lit. Déclaré ici plutôt
   qu'importé : l'import ferait compter à cette route les namespaces de la coquille
   (`tests/unit/route-namespaces.test.ts`), qu'elle ne lit pas. */
interface EduOutlet {
  enrolledFormations: EnrolledFormation[];
  loadingEnrollments: boolean;
}

/**
 * QUIZ DE MODULE — maquette `Edu-Quiz` (kit v3, passe 2 lot B), `/mon-espace/quiz/:moduleId`.
 *
 * Le producteur EXISTE : une leçon `type: 'quiz'` dans le module, au format Markdown lu par
 * `parseQuizContent`. L'écran la cherche dans les inscriptions de la personne ; sans inscription
 * à ce module, ou sans leçon de quiz, il le dit (état vide), sans question d'exemple.
 *
 * Le score se calcule sur l'écran. Il s'ENREGISTRE dans la leçon (`/cours/:slug?lecon=…`), seul
 * endroit qui écrit la progression, l'XP et le certificat : le bouton y renvoie après un
 * sans-faute plutôt que de dupliquer cette écriture ici.
 */
export default function QuizPage() {
  const { t } = useTranslation('ecrans');
  const { moduleId } = useParams();
  const ctx = useOutletContext<EduOutlet | undefined>();
  const [track, setTrack] = useState<{ index: number; results: (boolean | null)[] } | null>(null);
  const readAt = new Date();

  const found = (ctx?.enrolledFormations ?? [])
    .map((ef) => ({ ef, lessons: flattenLessons(ef.formation) }))
    .map(({ ef, lessons }) => ({ ef, hit: lessons.find((l) => l.moduleId === moduleId && l.lesson.type === 'quiz') ?? null, mod: lessons.find((l) => l.moduleId === moduleId) ?? null }))
    .find((x) => x.mod) ?? null;
  const formation = found?.ef.formation ?? null;
  const quiz = found?.hit ?? null;
  const questions = quiz ? parseQuizContent(quiz.lesson.content) : [];
  const alreadyDone = quiz ? (found?.ef.enrollment.completedLessons ?? []).includes(quiz.lesson.id) : false;
  const lessonHref = formation && quiz ? `/cours/${formation.slug}?lecon=${quiz.lesson.id}` : '/mon-espace/cours';
  const results = track?.results ?? questions.map(() => null);
  const current = track?.index ?? 0;

  return (
    <div className="mx-auto max-w-4xl px-[18px] py-6 wide:max-w-none wide:px-pane">
      <SEOHead title={t('edu.quiz.title')} description={t('edu.quiz.empty')} noIndex />

      <nav aria-label={t('edu.quiz.crumbLabel')} className="mb-4 flex flex-wrap items-center gap-[10px] text-[13px] text-ink-2">
        {formation ? (
          <LocalizedLink to={`/cours/${formation.slug}`} className="text-inherit no-underline">{formation.title}</LocalizedLink>
        ) : (
          <LocalizedLink to="/mon-espace/cours" className="text-inherit no-underline">{t('edu.quiz.crumbCourses')}</LocalizedLink>
        )}
        {found?.mod && (<><span aria-hidden="true">›</span><span>{t('edu.quiz.module', { n: found.mod.moduleIndex, title: found.mod.moduleTitle })}</span></>)}
        <span aria-hidden="true">›</span>
        <span>{t('edu.quiz.crumbQuiz')}</span>
      </nav>

      <div className="grid items-start gap-[22px] wide:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          {ctx?.loadingEnrollments ? (
            <Skeleton height={420} radius="var(--r-xl)" label={t('edu.quiz.title')} />
          ) : questions.length === 0 ? (
            <section className="mm-card" style={{ padding: 'clamp(22px, 3vw, 36px)' }}>
              <p className="mm-eyebrow m-0">{t('edu.quiz.eyebrow')}</p>
              <h1 className="mm-d m-0 mt-3" style={{ fontSize: 'clamp(26px, 3.2vw, 38px)' }}>{t('edu.quiz.title')}</h1>
              <EmptyState
                glyph={<Icon name="help" size={26} strokeWidth={2} />}
                title={t('edu.quiz.empty')}
                body={t('edu.quiz.body')}
                action={(
                  <LocalizedLink to="/mon-espace/cours" className="mm-pill is-sm mt-4">
                    {t('links.courses')}
                    <i><Icon name="arrow-up-right" size={14} /></i>
                  </LocalizedLink>
                )}
              />
            </section>
          ) : (
            <QuizCard
              questions={questions}
              readAt={readAt}
              onProgress={setTrack}
              labels={{
                question: (n, total) => t('edu.quiz.question', { n, total }),
                correctCount: t('edu.quiz.correct'),
                answersLabel: t('edu.quiz.answersLabel'),
                right: t('edu.quiz.right'),
                wrong: (answer) => t('edu.quiz.wrong', { answer }),
                next: t('edu.quiz.next'),
                finish: t('edu.quiz.finish'),
                resultTitle: t('edu.quiz.result'),
                resultPass: alreadyDone ? t('edu.quiz.passDone') : t('edu.quiz.pass'),
                resultFail: t('edu.quiz.fail'),
                restart: t('edu.quiz.restart'),
                scoreSource: t('edu.quiz.source'),
              }}
              aside={quiz && quiz.lessonIndex > 1 ? (
                <LocalizedLink to={formation ? `/cours/${formation.slug}` : '/mon-espace/cours'} style={{ font: '600 14px/1 var(--f-body)' }}>
                  {t('edu.quiz.reviewModule')}
                </LocalizedLink>
              ) : undefined}
              passAction={alreadyDone ? undefined : (
                <LocalizedLink to={lessonHref} className="mm-pill is-sm">
                  {t('edu.quiz.save')}
                  <i><Icon name="arrow-up-right" size={14} /></i>
                </LocalizedLink>
              )}
            />
          )}
        </div>

        <div className="flex flex-col gap-5">
          <section className="mm-card">
            <h3 style={{ fontSize: '17px' }}>{t('edu.quiz.trackTitle')}</h3>
            {questions.length > 0 && (
              <div className="flex flex-wrap gap-2" style={{ margin: '14px 0' }}>
                {results.map((r, i) => (
                  <span
                    key={i}
                    aria-label={t('edu.quiz.question', { n: i + 1, total: questions.length })}
                    className="grid place-items-center rounded-m"
                    style={{
                      width: '34px', height: '34px', font: '600 13px/1 var(--f-body)',
                      background: r === true ? 'var(--mm-teal-f)' : r === false ? 'var(--stop)' : i === current ? 'var(--ink-fixed)' : 'var(--paper-2)',
                      color: r !== null || i === current ? 'var(--paper-fixed)' : 'var(--ink-3)',
                    }}
                  >
                    {i + 1}
                  </span>
                ))}
              </div>
            )}
            <p className="m-0 text-ink-2" style={{ fontSize: '13.5px', lineHeight: 1.5, marginTop: questions.length ? 0 : '8px' }}>{t('edu.quiz.rule')}</p>
          </section>
          <section className="mm-card" style={{ background: 'var(--paper-2)' }}>
            <h3 style={{ fontSize: '16px' }}>{t('edu.quiz.rysmoTitle')}</h3>
            <p className="m-0 mt-2 text-ink-2" style={{ fontSize: '13.5px', lineHeight: 1.5 }}>{t('edu.quiz.rysmoBody')}</p>
            <LocalizedLink to="/mon-espace/assistant" className="mt-3 inline-block" style={{ font: '600 13.5px/1 var(--f-body)' }}>
              {t('links.assistant')}
            </LocalizedLink>
          </section>
        </div>
      </div>
    </div>
  );
}
