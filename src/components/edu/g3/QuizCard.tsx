import { useState, type ReactNode } from 'react';
import { Icon, Num } from '@ds';
import type { QuizQuestion } from './quiz';

/**
 * LE QUIZ, UNE QUESTION À LA FOIS — maquette `Edu-Quiz` (kit v3, passe 2).
 *
 * Partagé par le lecteur (`/cours/:slug`, leçon `type: 'quiz'`) et par l'écran de quiz de module
 * (`/mon-espace/quiz/:moduleId`). Les deux routes ne chargent pas le même namespace i18n : les
 * libellés arrivent donc en props, déjà traduits, et ce composant n'appelle pas `useTranslation`.
 *
 * Le score est CALCULÉ SUR CET ÉCRAN : sa source est le barème du quiz, citée comme telle.
 * Aucune explication n'est stockée par réponse — le retour dit « juste » ou donne la bonne
 * réponse, il n'invente pas de justification.
 */
export interface QuizCardLabels {
  question: (n: number, total: number) => string;
  correctCount: string;
  answersLabel: string;
  right: string;
  wrong: (answer: string) => string;
  next: string;
  finish: string;
  resultTitle: string;
  resultPass: string;
  resultFail: string;
  restart: string;
  scoreSource: string;
}

interface QuizCardProps {
  questions: QuizQuestion[];
  labels: QuizCardLabels;
  readAt: Date;
  /** Appelé quand toutes les réponses sont justes (la règle de validation du produit). */
  onPass?: () => void;
  /** Le bouton qui suit un sans-faute (« Valider la leçon »…). */
  passAction?: ReactNode;
  /** Lien secondaire en pied (« Revoir la leçon »). */
  aside?: ReactNode;
  /** Remonte l'avancement pour la colonne « Ton parcours ». */
  onProgress?: (state: { index: number; results: (boolean | null)[] }) => void;
}

export default function QuizCard({ questions, labels, readAt, onPass, passAction, aside, onProgress }: QuizCardProps) {
  const total = questions.length;
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [results, setResults] = useState<(boolean | null)[]>(() => questions.map(() => null));
  const [done, setDone] = useState(false);

  const q = questions[index];
  const answered = picked !== null;
  const score = results.filter(Boolean).length;
  const source = { cite: labels.scoreSource };

  const report = (i: number, r: (boolean | null)[]) => onProgress?.({ index: i, results: r });

  const choose = (oi: number) => {
    if (answered) return;
    setPicked(oi);
    const r = results.slice();
    r[index] = q.options[oi].correct;
    setResults(r);
    report(index, r);
  };

  const next = () => {
    if (index + 1 < total) {
      setIndex(index + 1);
      setPicked(null);
      report(index + 1, results);
    } else {
      setDone(true);
      if (results.every(Boolean)) onPass?.();
    }
  };

  const restart = () => {
    const r = questions.map(() => null);
    setIndex(0); setPicked(null); setResults(r); setDone(false);
    report(0, r);
  };

  if (done) {
    const pass = score === total;
    return (
      <section className="mm-card" style={{ padding: 'clamp(22px, 3vw, 36px)' }}>
        <p className="mm-eyebrow m-0">{labels.resultTitle}</p>
        <p className="mm-d m-0 mt-3" style={{ fontSize: 'clamp(30px, 4vw, 44px)' }}>
          <Num value={`${score} / ${total}`} source={source} asOf={readAt} />
        </p>
        <p className="m-0 mt-3 text-ink-2" style={{ fontSize: '15px', lineHeight: 1.55, maxWidth: '52ch' }}>
          {pass ? labels.resultPass : labels.resultFail}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={restart} className="mm-pill is-ink is-sm" style={{ border: 0, cursor: 'pointer' }}>
            {labels.restart}
            <i><Icon name="repeat" size={14} /></i>
          </button>
          {pass && passAction}
        </div>
      </section>
    );
  }

  return (
    <section className="mm-card" style={{ padding: 'clamp(22px, 3vw, 36px)' }}>
      <div className="flex items-center gap-[14px]" style={{ marginBottom: '26px' }}>
        <span style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>{labels.question(index + 1, total)}</span>
        <div className="mm-progress" style={{ flex: 1 }} aria-hidden="true">
          <i style={{ ['--p' as string]: (index + (answered ? 1 : 0)) / total }} />
        </div>
        <span style={{ fontSize: '13px', color: 'var(--mm-teal-t)', whiteSpace: 'nowrap' }}>
          <Num value={score} source={source} asOf={readAt} /> {labels.correctCount}
        </span>
      </div>

      <h1 className="mm-d m-0" style={{ fontSize: 'clamp(26px, 3.2vw, 38px)', marginBottom: '24px', maxWidth: '24ch' }}>{q.question}</h1>

      <div role="radiogroup" aria-label={labels.answersLabel} className="flex flex-col gap-[10px]">
        {q.options.map((opt, oi) => {
          const selected = picked === oi;
          const showRight = answered && opt.correct;
          const showWrong = answered && selected && !opt.correct;
          return (
            <button
              key={oi}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={answered}
              onClick={() => choose(oi)}
              className="mm-press flex w-full items-center gap-[14px] text-left"
              style={{
                padding: '18px', borderRadius: '18px', cursor: answered ? 'default' : 'pointer',
                border: showRight ? '2px solid var(--mm-teal-f)' : showWrong ? '2px solid var(--stop)' : '1px solid var(--line)',
                background: showRight ? 'color-mix(in srgb, var(--mm-teal-f) 10%, var(--bento))'
                  : showWrong ? 'color-mix(in srgb, var(--stop) 8%, var(--bento))' : 'var(--bento)',
                color: 'var(--ink)', fontFamily: 'var(--f-body)',
              }}
            >
              <b aria-hidden="true" className="grid flex-none place-items-center rounded-xs" style={{ width: '30px', height: '30px', background: 'var(--paper-2)', fontSize: '13px' }}>
                {String.fromCharCode(65 + oi)}
              </b>
              <span style={{ flex: 1, fontSize: '16px', fontWeight: 600 }}>{opt.text}</span>
              {showRight ? (
                <span className="grid flex-none place-items-center rounded-pill" style={{ width: '28px', height: '28px', background: 'var(--mm-teal-f)', color: 'var(--paper-fixed)' }}>
                  <Icon name="check" size={15} />
                </span>
              ) : showWrong ? (
                <span className="grid flex-none place-items-center rounded-pill" style={{ width: '28px', height: '28px', background: 'var(--stop)', color: 'var(--paper-fixed)' }}>
                  <Icon name="close" size={15} />
                </span>
              ) : (
                <span aria-hidden="true" className="flex-none rounded-pill" style={{ width: '28px', height: '28px', border: '1.5px solid var(--line)' }} />
              )}
            </button>
          );
        })}
      </div>

      {answered && (
        <div
          role="status"
          className="mt-4 flex gap-3"
          style={{
            padding: '16px 18px', borderRadius: '18px', fontSize: '14.5px', lineHeight: 1.55,
            background: q.options[picked].correct ? 'color-mix(in srgb, var(--mm-teal-f) 12%, var(--bento))' : 'color-mix(in srgb, var(--stop) 8%, var(--bento))',
            color: q.options[picked].correct ? 'var(--mm-teal-t)' : 'var(--stop)',
          }}
        >
          <b className="flex-none">{q.options[picked].correct ? labels.right : labels.wrong(q.options.find((o) => o.correct)?.text ?? '')}</b>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <span>{aside}</span>
        <button
          type="button"
          onClick={next}
          disabled={!answered}
          className="mm-pill"
          style={{ border: 0, cursor: answered ? 'pointer' : 'not-allowed', opacity: answered ? 1 : 0.5 }}
        >
          {index + 1 < total ? labels.next : labels.finish}
          <i><Icon name="arrow-up-right" size={14} /></i>
        </button>
      </div>
    </section>
  );
}
