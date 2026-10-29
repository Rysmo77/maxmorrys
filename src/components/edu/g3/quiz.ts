/**
 * Le format d'un quiz de leçon — déplacé de `CoursePlayer.tsx` (passe 2, lot B) pour être lu
 * à la fois par le lecteur et par l'écran de quiz de module (`/mon-espace/quiz/:moduleId`).
 *
 * Le contenu d'une leçon `type: 'quiz'` est du Markdown :
 *   ## Question
 *   - [ ] Mauvaise réponse
 *   - [x] Bonne réponse
 * Aucune explication par réponse n'est stockée : l'écran ne peut donc dire que « juste » ou
 * « la bonne réponse était… » — jamais une justification inventée.
 */
import type { Formation, Lesson } from '../../../types';

export interface QuizQuestion {
  question: string;
  options: { text: string; correct: boolean }[];
}

export function parseQuizContent(content: string): QuizQuestion[] {
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
    if (question && options.length >= 2) questions.push({ question, options });
  }
  return questions;
}

/** Une leçon repérée dans sa formation : numéro de module et de leçon comptés à partir de 1. */
export interface LocatedLesson {
  lesson: Lesson;
  moduleId: string;
  moduleTitle: string;
  moduleIndex: number;
  lessonIndex: number;
}

/** Toutes les leçons d'une formation, dans l'ordre du programme. */
export function flattenLessons(formation: Formation | null | undefined): LocatedLesson[] {
  return (formation?.modules ?? [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .flatMap((m, mi) => (m.lessons ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((lesson, li) => ({
        lesson, moduleId: m.id, moduleTitle: m.title, moduleIndex: mi + 1, lessonIndex: li + 1,
      })));
}
