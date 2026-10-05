import { describe, it, expect } from 'vitest';
import {
  CATEGORIE_EN_BASE, commentairesDuMessage, compte, libelleDeCategorie, messageEnBase, texteDuMessage,
} from '../../worker/apps/api/src/lib/club-posts';
import { FORME_ID_CLIENT, noteEnBase, texteDeNote } from '../../worker/apps/api/src/lib/notes-format';
import { normaliserPostClub } from '../../src/lib/club/posts';
import { normaliserNote } from '../../src/lib/firestore/notes';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE SITE ET L'APPLICATION ÉCRIVENT LE MÊME FORMAT, ET LISENT LES DEUX.
 *
 * Trouvé le 05/10/2026 : l'application écrivait `club_posts` et `users/{uid}/notes`
 * dans un autre format que le site. Un message mobile faisait tomber le fil du site
 * (`likes.includes` sur un nombre), les messages du site disparaissaient du fil de
 * l'application, et les notes de l'application n'apparaissaient jamais sur le site.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const maintenant = '2026-10-05T10:00:00.000Z';

describe('club_posts', () => {
  it('ce que l’application écrit, le site le lit sans tomber', () => {
    for (const categorie of Object.keys(CATEGORIE_EN_BASE) as Array<keyof typeof CATEGORIE_EN_BASE>) {
      const ecrit = messageEnBase({ uid: 'u1', nom: 'Awa', texte: 'Bonjour', categorie, maintenant });
      const lu = normaliserPostClub({ id: 'p1', ...ecrit });
      expect(Array.isArray(lu.likes)).toBe(true);
      expect(lu.likes.includes('u1')).toBe(false);
      expect(lu.content).toBe('Bonjour');
      expect(lu.commentsCount).toBe(0);
      expect(lu.category).toBe(CATEGORIE_EN_BASE[categorie]);
      /* Et l'application relit sa propre écriture sous le même libellé. */
      expect(libelleDeCategorie(ecrit.category)).toBe(categorie);
    }
  });

  it('l’ancien format de l’application est rattrapé des deux côtés', () => {
    const ancien = { userId: 'u1', userName: 'Awa', text: 'Salut', likes: 0, reposts: 2, comments: 3, category: 'Outils', createdAt: maintenant };
    const lu = normaliserPostClub({ id: 'p0', ...ancien });
    expect(lu.likes).toEqual([]);
    expect(lu.content).toBe('Salut');
    expect(lu.commentsCount).toBe(3);
    expect(lu.category).toBe('ressource');
    expect(texteDuMessage(ancien)).toBe('Salut');
    expect(commentairesDuMessage(ancien)).toBe(3);
    expect(compte(ancien.reposts)).toBe(2);
  });

  it('un message du site arrive entier dans l’application', () => {
    const site = { userName: 'Fatou', content: 'Question', likes: ['a', 'b'], commentsCount: 4, category: 'question' };
    expect(texteDuMessage(site)).toBe('Question');
    expect(compte(site.likes)).toBe(2);
    expect(commentairesDuMessage(site)).toBe(4);
    expect(libelleDeCategorie(site.category)).toBe('Questions');
  });
});

describe('users/{uid}/notes', () => {
  it('une note écrite par l’application porte ce que le site trie et affiche', () => {
    const ecrit = noteEnBase({ texte: 'Ligne 1\nLigne 2', lessonId: 'l1', lessonLabel: null, maintenant });
    expect(ecrit.updatedAt).toBe(maintenant);
    const lu = normaliserNote('n1', ecrit);
    expect(lu.content).toBe('Ligne 1\nLigne 2');
    expect(lu.title).toBe('Ligne 1');
    expect(texteDeNote(ecrit)).toBe('Ligne 1\nLigne 2');
  });

  it('l’ancien format est rattrapé des deux côtés', () => {
    const ancien = { text: 'Vieille note', lessonLabel: 'Leçon 3', createdAt: maintenant };
    const lu = normaliserNote('n0', ancien);
    expect(lu.content).toBe('Vieille note');
    expect(lu.title).toBe('Leçon 3');
    expect(lu.updatedAt).toBe(maintenant);
    expect(texteDeNote(ancien)).toBe('Vieille note');
  });

  it('seul un UUID devient un identifiant de document', () => {
    expect(FORME_ID_CLIENT.test(crypto.randomUUID())).toBe(true);
    for (const faux of ['../autre/notes/x', 'abc', '', 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA/x']) {
      expect(FORME_ID_CLIENT.test(faux)).toBe(false);
    }
  });
});
