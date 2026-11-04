import { describe, expect, it } from 'vitest';

import type { Firestore } from '@mm/firestore-rest';

import { dateDuJour, executerValidation, validerDemande } from '../src/lib/blog-validation';

/**
 * LE SEUL CHEMIN HORS DE L'ADMIN QUI MET UN ARTICLE EN LIGNE.
 *
 * Ce qui doit tenir : on ne publie qu'un brouillon SOUMIS (`pretAValider: true`), jamais un
 * article de test, jamais deux fois ; la date posée est celle que l'admin écrirait ; un refus
 * laisse l'article en brouillon ; les abonnés ne sont prévenus que d'un article réellement en
 * ligne. La doublure de Firestore ci-dessous garde en mémoire tout ce qui est écrit.
 */

type Doc = Record<string, unknown>;

function fausseBase(docs: Record<string, Doc>, abonnes: Array<{ id: string; data: Doc }> = []) {
  const ecrits: Array<{ path: string; data: Doc; precondition?: unknown }> = [];
  const ajouts: Array<{ path: string; data: Doc }> = [];
  const db = {
    async get(path: string) {
      const d = docs[path];
      return d ? { id: path.split('/').pop(), path, data: { ...d }, updateTime: 't1' } : null;
    },
    async update(path: string, data: Doc) {
      ecrits.push({ path, data });
      docs[path] = { ...docs[path], ...data };
    },
    buildWrite(path: string, data: Doc) {
      return { path, data };
    },
    async commit(writes: Array<{ path: string; data: Doc; currentDocument?: unknown }>) {
      for (const w of writes) {
        ecrits.push({ path: w.path, data: w.data, precondition: w.currentDocument });
        docs[w.path] = { ...docs[w.path], ...w.data };
      }
    },
    async query(q: { collection: string }) {
      if (q.collection !== 'blog') return abonnes;
      return Object.entries(docs)
        .filter(([path, d]) => path.startsWith('blog/') && d.pretAValider === true)
        .map(([path, d]) => ({ id: path.split('/').pop(), path, data: d }));
    },
    async count() {
      return abonnes.length;
    },
    async add(path: string, data: Doc) {
      ajouts.push({ path, data });
      return `${path}/x`;
    },
  };
  return { db: db as unknown as Firestore, ecrits, ajouts, docs };
}

const BROUILLON: Doc = { title: 'Un titre', slug: 'un-titre', status: 'draft', pretAValider: true, publishedAt: '' };
const MAINTENANT = new Date('2026-11-04T10:30:00.000Z');
const ABONNE = { id: 'u1', data: { preferences: { notifyOnPublish: true, language: 'fr' } } };

describe('validerDemande', () => {
  it('accepte les trois décisions', () => {
    for (const decision of ['publier', 'refuser']) {
      expect(validerDemande({ id: 'abc_DEF-1', decision }).ok).toBe(true);
    }
    expect(validerDemande({ id: 'abc', decision: 'raison', raison: 'trop long' }).ok).toBe(true);
  });

  it('refuse un identifiant qui sortirait de la collection `blog`', () => {
    expect(validerDemande({ id: '../users/x', decision: 'publier' }).ok).toBe(false);
    expect(validerDemande({ id: 'a/b', decision: 'publier' }).ok).toBe(false);
    expect(validerDemande({ id: '', decision: 'publier' }).ok).toBe(false);
  });

  it('refuse une décision inconnue et une raison vide', () => {
    expect(validerDemande({ id: 'a', decision: 'approve' }).ok).toBe(false);
    expect(validerDemande({ id: 'a', decision: 'raison', raison: '  ' }).ok).toBe(false);
  });
});

describe('publier', () => {
  it('pose `published`, la date du jour au format de l’admin, et prévient les abonnés', async () => {
    const b = fausseBase({ 'blog/a1': { ...BROUILLON } }, [ABONNE]);
    const r = await executerValidation(b.db, { id: 'a1', decision: 'publier' }, MAINTENANT);
    expect(r).toMatchObject({ ok: true, url: 'https://maxmorrys.me/blog/un-titre', notified: 1 });
    expect(b.docs['blog/a1']).toMatchObject({
      status: 'published',
      publishedAt: '2026-11-04',
      updatedAt: '2026-11-04T10:30:00.000Z',
      pretAValider: false,
      validatedVia: 'telegram',
    });
    // L'écriture est conditionnée à la version lue : deux clics ne publient pas deux fois.
    expect(b.ecrits[0].precondition).toEqual({ updateTime: 't1' });
    expect(b.ajouts).toHaveLength(1);
    expect(b.ajouts[0].data).toMatchObject({ link: '/blog/un-titre', type: 'article' });
  });

  it('ne publie pas un brouillon qui n’a pas été soumis à validation', async () => {
    const b = fausseBase({ 'blog/a1': { ...BROUILLON, pretAValider: false } }, [ABONNE]);
    const r = await executerValidation(b.db, { id: 'a1', decision: 'publier' }, MAINTENANT);
    expect(r).toMatchObject({ ok: false, erreur: 'nonSoumis' });
    expect(b.ecrits).toHaveLength(0);
    expect(b.ajouts).toHaveLength(0);
  });

  it('ne publie JAMAIS un article de test : il simule et n’écrit rien', async () => {
    const b = fausseBase({ 'blog/t1': { ...BROUILLON, test: true } }, [ABONNE, ABONNE]);
    const r = await executerValidation(b.db, { id: 't1', decision: 'publier' }, MAINTENANT);
    expect(r).toMatchObject({ ok: true, simulation: true, abonnes: 2 });
    expect(b.ecrits).toHaveLength(0);
    expect(b.ajouts).toHaveLength(0);
    expect(b.docs['blog/t1'].status).toBe('draft');
  });

  it('un article déjà en ligne n’est pas réécrit (second clic)', async () => {
    const b = fausseBase({ 'blog/a1': { ...BROUILLON, status: 'published', publishNotifiedAt: 'x' } }, [ABONNE]);
    const r = await executerValidation(b.db, { id: 'a1', decision: 'publier' }, MAINTENANT);
    expect(r).toMatchObject({ ok: true, dejaPublie: true, alreadyNotified: true, notified: 0 });
    expect(b.ecrits).toHaveLength(0);
    expect(b.ajouts).toHaveLength(0);
  });

  it('dit « introuvable » pour un document absent', async () => {
    const b = fausseBase({});
    expect(await executerValidation(b.db, { id: 'zz', decision: 'publier' })).toMatchObject({ ok: false, erreur: 'introuvable' });
  });

  it('refuse un brouillon sans slug', async () => {
    const b = fausseBase({ 'blog/a1': { ...BROUILLON, slug: '' } });
    expect(await executerValidation(b.db, { id: 'a1', decision: 'publier' })).toMatchObject({ ok: false, erreur: 'sansSlug' });
  });
});

describe('refuser', () => {
  it('laisse l’article en brouillon, pose `refusedAt` et retire la soumission', async () => {
    const b = fausseBase({ 'blog/a1': { ...BROUILLON } }, [ABONNE]);
    const r = await executerValidation(b.db, { id: 'a1', decision: 'refuser' }, MAINTENANT);
    expect(r.ok).toBe(true);
    expect(b.docs['blog/a1']).toMatchObject({ status: 'draft', refusedAt: '2026-11-04T10:30:00.000Z', pretAValider: false });
    expect(b.ajouts).toHaveLength(0);
  });

  it('n’écrit rien sur un article de test', async () => {
    const b = fausseBase({ 'blog/t1': { ...BROUILLON, test: true } });
    expect(await executerValidation(b.db, { id: 't1', decision: 'refuser' })).toMatchObject({ ok: true, simulation: true });
    expect(b.ecrits).toHaveLength(0);
  });

  it('ne « refuse » pas un article déjà en ligne', async () => {
    const b = fausseBase({ 'blog/a1': { ...BROUILLON, status: 'published' } });
    expect(await executerValidation(b.db, { id: 'a1', decision: 'refuser' })).toMatchObject({ ok: false, erreur: 'pasUnBrouillon' });
  });

  it('la raison ne s’écrit que sur un article refusé', async () => {
    const b = fausseBase({ 'blog/a1': { ...BROUILLON } });
    expect(await executerValidation(b.db, { id: 'a1', decision: 'raison', raison: 'x' })).toMatchObject({ ok: false, erreur: 'pasRefuse' });
    b.docs['blog/a1'].refusedAt = '2026-11-04T10:30:00.000Z';
    expect((await executerValidation(b.db, { id: 'a1', decision: 'raison', raison: 'titre trop vague' })).ok).toBe(true);
    expect(b.docs['blog/a1'].refusReason).toBe('titre trop vague');
  });
});

describe('lister et marquer (WF-BLOG-NOTIFY)', () => {
  it('ne liste que les brouillons soumis dont la carte n’est pas partie', async () => {
    const b = fausseBase({
      'blog/a1': { ...BROUILLON, content: '## Corps' },
      'blog/a2': { ...BROUILLON, telegramNotifiedAt: '2026-11-04T08:00:00.000Z' },
      'blog/a3': { ...BROUILLON, status: 'published' },
      'blog/a4': { ...BROUILLON, pretAValider: false },
      'blog/t1': { ...BROUILLON, test: true },
    });
    const r = await executerValidation(b.db, { id: '', decision: 'lister' });
    expect('articles' in r && r.articles.map((x) => x.id).sort()).toEqual(['a1', 't1']);
    expect('articles' in r && r.articles.find((x) => x.id === 'a1')?.content).toBe('## Corps');
  });

  it('`lister` n’exige pas d’identifiant, les autres décisions oui', () => {
    expect(validerDemande({ decision: 'lister' }).ok).toBe(true);
    expect(validerDemande({ decision: 'marquer' }).ok).toBe(false);
  });

  it('`marquer` note la carte envoyée, sans toucher au statut', async () => {
    const b = fausseBase({ 'blog/a1': { ...BROUILLON } });
    const r = await executerValidation(b.db, { id: 'a1', decision: 'marquer', messageId: '42', documentMessageId: '41' }, MAINTENANT);
    expect(r.ok).toBe(true);
    expect(b.docs['blog/a1']).toMatchObject({ status: 'draft', pretAValider: true, telegramNotifiedAt: '2026-11-04T10:30:00.000Z', telegramMessageId: '42' });
  });
});

describe('dateDuJour', () => {
  it('écrit AAAA-MM-JJ, comme `todayIso()` de l’admin', () => {
    expect(dateDuJour(new Date('2026-01-09T23:59:59.000Z'))).toBe('2026-01-09');
  });
});
