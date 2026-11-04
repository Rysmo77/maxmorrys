import type { Firestore } from '@mm/firestore-rest';
import { describe, expect, it, vi } from 'vitest';

import { BUDGET_LECON, extraitBorne, getLessonContext, nettoyerContenu } from '../src/lib/rysmo-lecon';

/**
 * Rysmo lit la leçon ouverte À PARTIR DE DEUX IDENTIFIANTS, avec la règle d'accès de
 * `appLeconContenu` : inscrit, ou leçon `isFree` d'une formation publiée. Jamais de texte
 * venu du client.
 */

const LONG = Array.from({ length: 200 }, (_, i) => `Paragraphe ${i}. Le pack local se joue sur la fiche.`).join('\n\n');

function fauxDb(options: { inscrit: boolean; status?: string; isFree?: boolean; content?: string }) {
  const formation = {
    id: 'f1',
    path: 'formations/f1',
    data: {
      title: 'Marketing local',
      status: options.status ?? 'published',
      modules: [
        {
          title: 'Être trouvé sur Google',
          lessons: [
            { id: 'l1', title: 'Fiche Google', type: 'text', content: options.content ?? '## Le pack local\n\nTrois commerces sur la carte.', isFree: options.isFree ?? false },
          ],
        },
      ],
    },
  };
  return {
    get: vi.fn(async (chemin: string) => (chemin === 'formations/f1' ? formation : null)),
    query: vi.fn(async () => (options.inscrit ? [{ id: 'e1', path: 'enrollments/e1', data: { userId: 'u1', formationId: 'f1' } }] : [])),
  } as unknown as Firestore & { get: ReturnType<typeof vi.fn>; query: ReturnType<typeof vi.fn> };
}

describe('getLessonContext', () => {
  it("un élève inscrit reçoit le contenu réel de la leçon", async () => {
    const db = fauxDb({ inscrit: true });
    const bloc = await getLessonContext(db, 'u1', { formationId: 'f1', leconId: 'l1' }, 'web');
    expect(bloc).toContain("LEÇON QUE L'ÉLÈVE A SOUS LES YEUX");
    expect(bloc).toContain('Trois commerces sur la carte.');
    expect(bloc).toContain('« Fiche Google »');
    // L'inscription est cherchée par l'uid du jeton, croisée avec la formation.
    expect(db.query).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'enrollments',
      where: [
        { field: 'userId', op: '==', value: 'u1' },
        { field: 'formationId', op: '==', value: 'f1' },
      ],
    }));
  });

  it("sans inscription, une leçon payante n'est PAS injectée", async () => {
    expect(await getLessonContext(fauxDb({ inscrit: false }), 'u1', { formationId: 'f1', leconId: 'l1' }, 'web')).toBe('');
  });

  it("sans inscription, une leçon d'aperçu (isFree, formation publiée) l'est", async () => {
    const bloc = await getLessonContext(fauxDb({ inscrit: false, isFree: true }), 'u1', { formationId: 'f1', leconId: 'l1' }, 'web');
    expect(bloc).toContain('Trois commerces');
    expect(bloc).toContain("leçon d'aperçu");
  });

  it("l'aperçu d'un brouillon reste fermé", async () => {
    expect(await getLessonContext(fauxDb({ inscrit: false, isFree: true, status: 'draft' }), 'u1', { formationId: 'f1', leconId: 'l1' }, 'web')).toBe('');
  });

  it('identifiants absents, invalides ou inconnus : rien, et sans lecture pour les invalides', async () => {
    const db = fauxDb({ inscrit: true });
    expect(await getLessonContext(db, 'u1', undefined, 'web')).toBe('');
    expect(await getLessonContext(db, 'u1', { formationId: '../users/x', leconId: 'l1' }, 'web')).toBe('');
    expect(await getLessonContext(db, 'u1', { formationId: 'f1', leconId: 42 }, 'web')).toBe('');
    expect(db.get).not.toHaveBeenCalled();
    expect(await getLessonContext(db, 'u1', { formationId: 'f1', leconId: 'inconnue' }, 'web')).toBe('');
  });

  it('un contenu long est borné et coupé proprement, avec une marque', async () => {
    const bloc = await getLessonContext(fauxDb({ inscrit: true, content: LONG }), 'u1', { formationId: 'f1', leconId: 'l1' }, 'web');
    expect(bloc).toContain('[… suite de la leçon non incluse]');
    expect(bloc).not.toContain('Paragraphe 199.');
  });

  it("une leçon sans texte est annoncée par son titre, avec l'interdiction d'en inventer le contenu", async () => {
    const bloc = await getLessonContext(fauxDb({ inscrit: true, content: '' }), 'u1', { formationId: 'f1', leconId: 'l1' }, 'web');
    expect(bloc).toContain('« Fiche Google »');
    expect(bloc).toContain("sans inventer ce qu'elle contient");
  });

  it('une lecture Firestore qui échoue ne fait pas échouer la réponse', async () => {
    const db = { get: vi.fn(async () => { throw new Error('quota'); }), query: vi.fn(async () => []) } as unknown as Firestore;
    expect(await getLessonContext(db, 'u1', { formationId: 'f1', leconId: 'l1' }, 'web')).toBe('');
  });
});

describe('extraitBorne et nettoyerContenu', () => {
  it('ne dépasse jamais le budget et coupe en fin de paragraphe', () => {
    const extrait = extraitBorne(LONG);
    expect(extrait.length).toBeLessThanOrEqual(BUDGET_LECON);
    expect(extrait).toMatch(/fiche\.\n\n\[… suite de la leçon non incluse\]$/);
  });

  it('sans paragraphe ni phrase, ne coupe pas au milieu d’un mot', () => {
    const extrait = extraitBorne('mot '.repeat(3000), 100);
    expect(extrait.length).toBeLessThanOrEqual(100);
    expect(extrait).toMatch(/^(mot )*mot\n\n\[… suite/);
  });

  it('un texte court reste intact', () => {
    expect(extraitBorne('Court.')).toBe('Court.');
  });

  it('retire balises, images et scripts', () => {
    expect(nettoyerContenu('<p>Un <b>pack</b></p><script>x()</script>![img](a.png)<iframe src="v"></iframe>Fin'))
      .toBe('Un pack\nFin');
  });
});
