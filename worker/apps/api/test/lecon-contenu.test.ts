import { describe, expect, it, vi } from 'vitest';

import type { Firestore } from '@mm/firestore-rest';

import type { CallContext } from '../src/context';
import { appLeconContenu } from '../src/handlers/app/leconContenu';

/** Le contenu d'une leçon : réservé à SA inscription, et entier. */
function contexte(inscrit: boolean, completed: string[] = [], enCours?: string): CallContext {
  const formation = {
    modules: [
      { title: 'Module 1', lessons: [
        { id: 'a', title: 'Intro', type: 'text', content: '# Bonjour\n\nTexte.', duration: '5 min' },
        { id: 'b', title: 'Vidéo', type: 'video', videoUrl: 'https://www.youtube.com/embed/x', resources: [{ title: 'Fiche', type: 'pdf', url: 'https://r2/fiche.pdf', size: '180 Ko' }, { title: 'sans url' }] },
      ] },
      { title: 'Module 2', lessons: [{ id: 'c', title: 'Quiz', type: 'quiz', content: '{}' }] },
    ],
  };
  const db = {
    query: vi.fn(async () => (inscrit ? [{ id: 'e1', path: 'enrollments/e1', data: { userId: 'u1', formationId: 'f1', completedLessons: completed, currentLessonId: enCours } }] : [])),
    get: vi.fn(async (chemin: string) => (chemin === 'formations/f1' ? { id: 'f1', path: chemin, data: formation } : null)),
  } as unknown as Firestore;
  return { db, auth: { uid: 'u1' } } as unknown as CallContext;
}

describe('appLeconContenu', () => {
  it('sans inscription, aucun contenu', async () => {
    const r = await appLeconContenu({ formationId: 'f1', leconId: 'a' }, contexte(false));
    expect(r.vue).toBeNull();
  });

  it('rend la leçon demandée, entière, avec ses voisines', async () => {
    const r = await appLeconContenu({ formationId: 'f1', leconId: 'b' }, contexte(true, ['a']));
    expect(r.vue).toMatchObject({
      id: 'b', type: 'video', moduleTitre: 'Module 1', video: 'https://www.youtube.com/embed/x',
      precedente: 'a', suivante: 'c', faite: false,
    });
    /* Une ressource sans adresse n'est pas une ressource : elle serait un bouton mort. */
    expect(r.vue?.ressources).toEqual([{ titre: 'Fiche', type: 'pdf', url: 'https://r2/fiche.pdf', taille: '180 Ko' }]);
  });

  it('sans leçon désignée : la leçon en cours, sinon la première qui reste', async () => {
    expect((await appLeconContenu({ formationId: 'f1' }, contexte(true, [], 'c'))).vue?.id).toBe('c');
    expect((await appLeconContenu({ formationId: 'f1' }, contexte(true, ['a']))).vue?.id).toBe('b');
    expect((await appLeconContenu({ formationId: 'f1' }, contexte(true, ['a', 'b', 'c']))).vue?.id).toBe('a');
  });

  it('refuse une formation non désignée', async () => {
    await expect(appLeconContenu({}, contexte(true))).rejects.toThrow();
  });
});
