import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Firestore } from '@mm/firestore-rest';

import {
  buildRedirectMap,
  loadRedirectMap,
  resetRedirectMemo,
  isInternalTarget,
  normalizeSource,
  refererHost,
  resolveRedirect,
  shouldConsultRedirects,
  type RedirectMap,
} from '../src/redirects';

/**
 * Le lien d'attribution `https://maxmorrys.me/via/<slug>` est un contrat public :
 * il est déjà posé au pied de sites clients que nous ne redéployons pas. Ces
 * tests figent son comportement, repli compris.
 */

const MAP: RedirectMap = {
  '/via/eyone': { id: 'r1', target: '/agence', code: 302, kind: 'via' },
  '/ancienne-offre': { id: 'r2', target: '/presence-digitale', code: 301, kind: 'path' },
  '/via/hostile': { id: 'r3', target: '//evil.example', code: 302, kind: 'via' },
};

const at = (path: string): URL => new URL(`https://maxmorrys.me${path}`);

describe('résolution des redirections', () => {
  it('sert un lien d attribution déclaré, slug propagé', () => {
    const hit = resolveRedirect(at('/via/eyone'), MAP);
    expect(hit).toEqual({ location: '/agence?via=eyone', code: 302, rule: MAP['/via/eyone'] });
  });

  it('replie un slug inconnu sur /agence plutôt qu en 404', () => {
    const hit = resolveRedirect(at('/via/jamais-cree'), MAP);
    expect(hit?.location).toBe('/agence?via=jamais-cree');
    expect(hit?.code).toBe(302);
    // Aucun document à compter : le repli ne doit pas prétendre en avoir un.
    expect(hit?.rule).toBeNull();
  });

  it('sert un 301 de SEO sans ajouter de paramètre', () => {
    const hit = resolveRedirect(at('/ancienne-offre'), MAP);
    expect(hit).toEqual({ location: '/presence-digitale', code: 301, rule: MAP['/ancienne-offre'] });
  });

  it('refuse une cible protocol-relative et retombe sur /agence', () => {
    // Une entrée hostile écrite hors de l admin ne doit pas sortir du domaine.
    const hit = resolveRedirect(at('/via/hostile'), MAP);
    expect(hit?.location).toBe('/agence?via=hostile');
  });

  it('préserve la query entrante et écrase un via injecté', () => {
    const hit = resolveRedirect(at('/via/eyone?utm_source=footer&via=usurpe'), MAP);
    expect(hit?.location).toBe('/agence?utm_source=footer&via=eyone');
  });

  it('ne pose pas de paramètre pour un slug mal formé', () => {
    // Le slug vient de l URL : l écrire tel quel dans Location serait une injection.
    const hit = resolveRedirect(at('/via/Slug%20Invalide'), MAP);
    expect(hit?.location).toBe('/agence');
  });

  it('tolère la casse et le slash final, comme le reste du routage', () => {
    expect(resolveRedirect(at('/via/EYONE/'), MAP)?.rule?.id).toBe('r1');
  });

  it('laisse passer tout ce qui n est pas déclaré', () => {
    expect(resolveRedirect(at('/blog/mon-article'), MAP)).toBeNull();
    expect(resolveRedirect(at('/'), MAP)).toBeNull();
  });

  it('ne consulte pas la table pour les assets', () => {
    expect(shouldConsultRedirects('/assets/index-a1b2.js')).toBe(false);
    expect(shouldConsultRedirects('/favicon.ico')).toBe(false);
    expect(shouldConsultRedirects('/via/eyone')).toBe(true);
    expect(shouldConsultRedirects('/agence')).toBe(true);
  });
});

describe('formats — miroir de src/lib/redirects.ts', () => {
  it('normalise la source', () => {
    expect(normalizeSource('/VIA/Eyone/')).toBe('/via/eyone');
    expect(normalizeSource('via/eyone')).toBe('/via/eyone');
    expect(normalizeSource('//')).toBe('/');
  });

  it('rejette toute cible non interne', () => {
    expect(isInternalTarget('/agence')).toBe(true);
    expect(isInternalTarget('https://evil.example')).toBe(false);
    expect(isInternalTarget('//evil.example')).toBe(false);
    expect(isInternalTarget('/\\evil.example')).toBe(false);
    expect(isInternalTarget('/agence\nLocation: https://evil.example')).toBe(false);
  });

  it('ne retient du Referer que l hôte', () => {
    expect(refererHost('https://client.example/une/page?q=1')).toBe('client.example');
    expect(refererHost(null)).toBeNull();
    expect(refererHost('pas-une-url')).toBeNull();
  });
});

describe('construction de la carte', () => {
  const stub = (docs: Array<{ id: string; data: Record<string, unknown> }>): Firestore =>
    ({ query: async () => docs.map((d) => ({ ...d, path: `redirects/${d.id}` })) }) as unknown as Firestore;

  it('normalise les sources et écarte les entrées inexploitables', async () => {
    const map = await buildRedirectMap(
      stub([
        { id: 'a', data: { source: '/VIA/Eyone', target: '/agence', code: 302, kind: 'via' } },
        { id: 'b', data: { source: '/via/externe', target: 'https://evil.example', code: 302, kind: 'via' } },
        { id: 'c', data: { source: '/', target: '/agence', code: 301, kind: 'path' } },
      ]),
    );

    expect(Object.keys(map)).toEqual(['/via/eyone']);
    expect(map['/via/eyone']).toEqual({ id: 'a', target: '/agence', code: 302, kind: 'via' });
  });

  it('sur doublon de source, garde la plus récemment modifiée', async () => {
    const map = await buildRedirectMap(
      stub([
        { id: 'ancien', data: { source: '/via/x', target: '/agence', code: 302, kind: 'via', updatedAt: '2026-01-01T00:00:00.000Z' } },
        { id: 'recent', data: { source: '/via/x', target: '/presence-digitale', code: 302, kind: 'via', updatedAt: '2026-08-01T00:00:00.000Z' } },
      ]),
    );

    expect(map['/via/x'].id).toBe('recent');
  });
});

describe('chargement de la carte', () => {
  beforeEach(() => resetRedirectMemo());

  /** KV toujours vide : chaque chargement redescend jusqu'à Firestore. */
  const env = () =>
    ({ SEO: { get: async () => null, put: async () => undefined } }) as unknown as Parameters<typeof loadRedirectMap>[1];

  const ctx = (): ExecutionContext & { settled: Promise<unknown>[] } => {
    const settled: Promise<unknown>[] = [];
    return { waitUntil: (p: Promise<unknown>) => settled.push(p), passThroughOnException: () => undefined, settled } as unknown as ExecutionContext & { settled: Promise<unknown>[] };
  };

  const db = (query: () => Promise<unknown[]>): Firestore => ({ query }) as unknown as Firestore;

  it('ne relit pas la table à chaque requête', async () => {
    const query = vi.fn(async () => [
      { id: 'a', path: 'redirects/a', data: { source: '/via/eyone', target: '/agence', code: 302, kind: 'via' } },
    ]);
    const [e, c] = [env(), ctx()];

    await loadRedirectMap(db(query), e, c);
    await loadRedirectMap(db(query), e, c);
    await loadRedirectMap(db(query), e, c);

    expect(query).toHaveBeenCalledTimes(1);
  });

  it('sert la carte périmée sans attendre et rafraîchit derrière', async () => {
    // Le chargement est sur le chemin de toute page : une carte périmée ne doit
    // jamais faire payer une lecture Firestore à la page d'accueil. Le second
    // appel à Firestore est ici volontairement bloqué — la lecture périmée doit
    // aboutir malgré lui.
    vi.useFakeTimers();
    try {
      const ENTRY = [{ id: 'a', path: 'redirects/a', data: { source: '/via/eyone', target: '/agence', code: 302, kind: 'via' } }];
      let calls = 0;
      const gate: { release: (() => void) | null } = { release: null };
      const query = vi.fn(async () => {
        calls += 1;
        if (calls > 1) await new Promise<void>((resolve) => { gate.release = resolve; });
        return ENTRY;
      });
      const [e, c] = [env(), ctx()];

      await loadRedirectMap(db(query), e, c);
      vi.advanceTimersByTime(61_000);

      const served = await loadRedirectMap(db(query), e, c);
      expect(served['/via/eyone']).toBeDefined();

      // Le rafraîchissement était encore en vol quand la carte a été servie.
      expect(gate.release).not.toBeNull();
      gate.release?.();
      await Promise.all(c.settled);
      expect(query).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('conserve la carte précédente si le rafraîchissement échoue', async () => {
    vi.useFakeTimers();
    try {
      let calls = 0;
      const query = vi.fn(async () => {
        calls += 1;
        if (calls > 1) throw new Error('Firestore injoignable');
        return [{ id: 'a', path: 'redirects/a', data: { source: '/via/eyone', target: '/agence', code: 302, kind: 'via' } }];
      });
      const [e, c] = [env(), ctx()];

      await loadRedirectMap(db(query), e, c);
      vi.advanceTimersByTime(61_000);
      await loadRedirectMap(db(query), e, c);
      await Promise.all(c.settled);

      const after = await loadRedirectMap(db(query), e, c);
      expect(after['/via/eyone']).toBeDefined();
    } finally {
      vi.useRealTimers();
    }
  });
});
