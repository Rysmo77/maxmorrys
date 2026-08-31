/**
 * L'étape « en conflit » de la console des redirections.
 *
 * Le kit donne le pipeline « tout · actives · en conflit » sans dire ce qu'est un conflit. La
 * réponse ne se choisit pas : elle est écrite dans `worker/apps/site/src/redirects.ts`, qui
 * construit sa carte à partir des entrées ACTIVES, écarte `/` et les cibles non internes, et
 * sur doublon de source garde la plus récemment modifiée. Un état que le bord traite en
 * silence est exactement ce qu'un écran d'administration doit montrer.
 *
 * Ce test tient la définition à ce comportement-là. Il existe surtout parce que le pôle média
 * fusionné a besoin de deux entrées 301 — `/podcasts` et `/videos` vers `/podcast-et-videos` —
 * et qu'une saisie de travers y produirait soit une boucle, soit une chaîne : les deux se
 * voient à l'œil sur deux lignes, jamais sur trente.
 */
import { describe, it, expect } from 'vitest';

import { findConflicts } from '../../src/pages/admin/hooks/redirectConflicts';
import type { Redirect } from '../../src/types';

const entry = (over: Partial<Redirect> & { id: string }): Redirect => ({
  source: '/a',
  target: '/b',
  code: 301,
  kind: 'path',
  active: true,
  createdAt: '2026-08-01T00:00:00.000Z',
  ...over,
} as Redirect);

describe('findConflicts', () => {
  it('ne signale rien sur les deux entrées du pôle média', () => {
    const table = [
      entry({ id: 'podcasts', source: '/podcasts', target: '/podcast-et-videos' }),
      entry({ id: 'videos', source: '/videos', target: '/podcast-et-videos' }),
    ];
    expect(findConflicts(table).size).toBe(0);
  });

  it('signale un doublon de source, des deux côtés', () => {
    const table = [
      entry({ id: 'un', source: '/podcasts', target: '/podcast-et-videos' }),
      entry({ id: 'deux', source: '/podcasts', target: '/media' }),
    ];
    const conflicts = findConflicts(table);
    expect(conflicts.get('un')).toBe('duplicate');
    expect(conflicts.get('deux')).toBe('duplicate');
  });

  it('reconnaît un doublon écrit dans une casse ou avec un slash final différents', () => {
    const table = [
      entry({ id: 'un', source: '/podcasts', target: '/podcast-et-videos' }),
      entry({ id: 'deux', source: '/Podcasts/', target: '/media' }),
    ];
    expect(findConflicts(table).get('deux')).toBe('duplicate');
  });

  it('signale une boucle directe, query et fragment compris', () => {
    const table = [
      entry({ id: 'boucle', source: '/podcasts', target: '/podcasts' }),
      entry({ id: 'boucle-query', source: '/videos', target: '/videos?src=footer' }),
    ];
    const conflicts = findConflicts(table);
    expect(conflicts.get('boucle')).toBe('loop');
    expect(conflicts.get('boucle-query')).toBe('loop');
  });

  it('signale une chaîne, et donc aussi un cycle en deux temps', () => {
    const chaine = findConflicts([
      entry({ id: 'a', source: '/podcasts', target: '/videos' }),
      entry({ id: 'b', source: '/videos', target: '/podcast-et-videos' }),
    ]);
    expect(chaine.get('a')).toBe('chain');
    expect(chaine.has('b')).toBe(false);

    const cycle = findConflicts([
      entry({ id: 'a', source: '/podcasts', target: '/videos' }),
      entry({ id: 'b', source: '/videos', target: '/podcasts' }),
    ]);
    expect(cycle.get('a')).toBe('chain');
    expect(cycle.get('b')).toBe('chain');
  });

  it("signale ce que le bord écarte sans un mot : la racine et une cible externe", () => {
    const conflicts = findConflicts([
      entry({ id: 'racine', source: '/', target: '/accueil' }),
      entry({ id: 'externe', source: '/vieux', target: '//evil.com' }),
    ]);
    expect(conflicts.get('racine')).toBe('unserved');
    expect(conflicts.get('externe')).toBe('unserved');
  });

  it('ignore les entrées éteintes : le bord ne les charge pas', () => {
    const conflicts = findConflicts([
      entry({ id: 'vivante', source: '/podcasts', target: '/podcast-et-videos' }),
      entry({ id: 'eteinte', source: '/podcasts', target: '/media', active: false }),
      entry({ id: 'boucle-eteinte', source: '/videos', target: '/videos', active: false }),
    ]);
    expect(conflicts.size).toBe(0);
  });
});
