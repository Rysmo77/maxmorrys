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
import { resolveStaticRedirect, STATIC_REDIRECTS } from '../src/static-redirects';
import { resolveRoute } from '../src/routes';
import hosting from '../../../../firebase.json';

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

  it('replie un slug inconnu sur /conception plutôt qu en 404', () => {
    const hit = resolveRedirect(at('/via/jamais-cree'), MAP);
    expect(hit?.location).toBe('/conception?via=jamais-cree');
    expect(hit?.code).toBe(302);
    // Aucun document à compter : le repli ne doit pas prétendre en avoir un.
    expect(hit?.rule).toBeNull();
  });

  it('sert un 301 de SEO sans ajouter de paramètre', () => {
    const hit = resolveRedirect(at('/ancienne-offre'), MAP);
    expect(hit).toEqual({ location: '/presence-digitale', code: 301, rule: MAP['/ancienne-offre'] });
  });

  it('refuse une cible protocol-relative et retombe sur /conception', () => {
    // Une entrée hostile écrite hors de l admin ne doit pas sortir du domaine.
    const hit = resolveRedirect(at('/via/hostile'), MAP);
    expect(hit?.location).toBe('/conception?via=hostile');
  });

  it('préserve la query entrante et écrase un via injecté', () => {
    const hit = resolveRedirect(at('/via/eyone?utm_source=footer&via=usurpe'), MAP);
    expect(hit?.location).toBe('/agence?utm_source=footer&via=eyone');
  });

  it('ne pose pas de paramètre pour un slug mal formé', () => {
    // Le slug vient de l URL : l écrire tel quel dans Location serait une injection.
    const hit = resolveRedirect(at('/via/Slug%20Invalide'), MAP);
    expect(hit?.location).toBe('/conception');
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

/*
 * ═══════════════════════════════════════════════════════════════════════════════
 * LES 301 ÉCRITES DE LA REFONTE (CDC §3.4).
 *
 * « URL très probablement liée depuis l'extérieur : la redirection est obligatoire, pas
 * optionnelle. » Ce qui est en jeu n'est pas le confort d'un visiteur : c'est le transfert
 * du capital de liens de deux adresses commerciales vers leurs remplaçantes. Une 301
 * absente ne produit aucune erreur — elle produit une page qui n'existe plus, un lien
 * entrant qui ne mène nulle part, et une position perdue qui ne revient pas seule.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
describe('301 de la refonte — la table écrite', () => {
  it('déplace l offre commerçants, sous-arbre compris', () => {
    expect(resolveStaticRedirect('/presence-digitale')).toBe('/conception/commerces-et-tpe');
    expect(resolveStaticRedirect('/presence-digitale/pack-vitrine')).toBe(
      '/conception/commerces-et-tpe/pack-vitrine',
    );
    expect(resolveStaticRedirect('/en/local-presence')).toBe(
      '/en/design/shops-and-small-business',
    );
    expect(resolveStaticRedirect('/en/local-presence/pricing')).toBe(
      '/en/design/shops-and-small-business/pricing',
    );
  });

  it('remplace la page agence par la page mère, sans emporter son sous-arbre', () => {
    // `keepSuffix: false` : la page mère remplace une section entière, aucun de ses
    // anciens enfants n'a d'équivalent un pour un.
    expect(resolveStaticRedirect('/agence')).toBe('/conception');
    expect(resolveStaticRedirect('/agence/expertises')).toBe('/conception');
    expect(resolveStaticRedirect('/en/agency')).toBe('/en/design');
    expect(resolveStaticRedirect('/en/agency/capabilities')).toBe('/en/design');
  });

  it('sauve la référence d un devis, qui est la seule chose que son URL porte', () => {
    // La règle la plus longue gagne : sans elle, `/agence/devis/A1` tomberait sur
    // `/conception` par `/agence`, et le lien envoyé nommément à quelqu'un serait mort.
    expect(resolveStaticRedirect('/agence/devis/REF-2026-014')).toBe(
      '/conception/commerces-et-tpe/devis/REF-2026-014',
    );
    expect(resolveStaticRedirect('/en/agency/quote/REF-2026-014')).toBe(
      '/en/design/shops-and-small-business/quote/REF-2026-014',
    );
    expect(resolveStaticRedirect('/presence-digitale/devis/REF-2026-014')).toBe(
      '/conception/commerces-et-tpe/devis/REF-2026-014',
    );
    expect(resolveStaticRedirect('/en/local-presence/quote/REF-2026-014')).toBe(
      '/en/design/shops-and-small-business/quote/REF-2026-014',
    );
  });

  it('vise la cible FINALE plutôt que d enchaîner trois sauts', () => {
    // `/en/digital-presence` visait `/en/local-presence`, qui redirige lui-même désormais.
    expect(resolveStaticRedirect('/en/digital-presence')).toBe(
      '/en/design/shops-and-small-business',
    );
    // Et la cible n'est elle-même jamais une source : la chaîne s'arrête à un saut.
    for (const rule of STATIC_REDIRECTS) {
      expect(resolveStaticRedirect(rule.to), `${rule.from} → ${rule.to} repart ailleurs`).toBeNull();
    }
  });

  it('tolère le slash final, comme le reste du routage', () => {
    expect(resolveStaticRedirect('/agence/')).toBe('/conception');
    expect(resolveStaticRedirect('/presence-digitale/')).toBe('/conception/commerces-et-tpe');
  });

  it('ne touche à AUCUNE autre URL — le blog, les formations, le podcast', () => {
    /*
     * « Ne pas toucher aux URL du blog, des formations et du podcast. Ce sont des années
     * de référencement et de liens entrants. » C'est le seul interdit absolu du CDC, et il
     * se vérifie ici plutôt que par relecture de la table.
     */
    for (const path of [
      '/',
      '/blog',
      '/blog/mon-article',
      '/formations',
      '/formations/tunnel-de-vente',
      '/podcast-et-videos',
      '/podcasts/episode-12',
      '/videos/une-video',
      '/club-des-digitos',
      '/verifier',
      '/a-propos',
      '/contact',
      '/faq',
      '/legal/cgv',
      '/conception',
      '/apprendre',
      '/en/blog/my-post',
      '/en/courses/sales-funnel',
    ]) {
      expect(resolveStaticRedirect(path), path).toBeNull();
    }
  });

  it('n attrape pas une page dont le nom COMMENCE comme une source', () => {
    // `/agenceur` n'est pas `/agence` : seul un segment entier compte.
    expect(resolveStaticRedirect('/agenceur')).toBeNull();
    expect(resolveStaticRedirect('/presence-digitale-2')).toBeNull();
  });

  /*
   * ⚠️ L'INVARIANT QUI TIENT LE LOT ENTIER, ET QUI NE SE VOIT DANS AUCUN DES DEUX FICHIERS.
   *
   * `index.ts` résout les redirections écrites AVANT `resolveRoute`. Mais si une source de
   * cette table redevenait une route prérendue, l'ordre ne suffirait plus à décrire
   * l'intention : deux fichiers déclareraient deux comportements pour la même adresse, et
   * le gagnant serait un détail d'implémentation. Ce test interdit l'ambiguïté à la source.
   */
  it('aucune source de la table n est, par ailleurs, une route prérendue', () => {
    const ambigues = STATIC_REDIRECTS.filter((r) => resolveRoute(r.from) !== 'origin').map(
      (r) => r.from,
    );
    expect(ambigues, 'déclarée deux fois : redirigée ici, prérendue dans routes.ts').toEqual([]);
  });

  it('chaque cible de la table est, elle, une route prérendue', () => {
    // La réciproque : rediriger vers une adresse que le bord ne prérend pas ferait servir
    // le shell SPA aux robots, sous le titre et l'`og:url` de la page d'accueil.
    const orphelines = STATIC_REDIRECTS.filter((r) => resolveRoute(r.to) !== 'prerender')
      // Les devis sont en `noindex` par construction : ils ne sont pas prérendus, c'est voulu.
      .filter((r) => !/\/(devis|quote)$/.test(r.to))
      .map((r) => r.to);
    expect(orphelines, 'cible non prérendue : les robots y liraient le shell nu').toEqual([]);
  });
});

/*
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE BORD ET L'HÉBERGEMENT DOIVENT DIRE LA MÊME CHOSE.
 *
 * Les deux tables existent pour deux raisons différentes — le Worker parce qu'une page
 * prérendue n'atteint jamais l'origine et parce que la `Location` de Firebase désignerait
 * `max-morrys.web.app` ; `firebase.json` parce que retirer la route Cloudflare doit rendre
 * la main à l'hébergement sans casser une seule ancienne adresse.
 *
 * Deux tables, donc deux occasions de dériver. Et la dérive serait INVISIBLE : le site
 * répondrait correctement tant que le Worker est en service, et se mettrait à répondre
 * autrement le jour d'un repli — c'est-à-dire le jour où personne n'a le temps de
 * chercher pourquoi.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
describe('parité avec les redirections de firebase.json', () => {
  /** Ce que `resolveStaticRedirect` ferait d'un chemin, écrit à la façon de Hosting. */
  const attenduHosting = (rule: (typeof STATIC_REDIRECTS)[number]) =>
    rule.keepSuffix ? [`${rule.to}`, `${rule.to}/:splat`] : [rule.to, rule.to];

  it('chaque règle du bord a ses deux lignes à l hébergement', () => {
    const declarees = new Map(
      (hosting.hosting.redirects as Array<{ source: string; destination: string; type: number }>)
        .map((r) => [r.source, r]),
    );
    const ecarts: string[] = [];

    for (const rule of STATIC_REDIRECTS) {
      const [exact, splat] = attenduHosting(rule);
      // `**` ne matche PAS la chaîne vide côté Hosting : chaque source a besoin des deux.
      for (const [source, destination] of [
        [rule.from, exact],
        [`${rule.from}/**`, splat],
      ]) {
        const declaree = declarees.get(source);
        if (!declaree) {
          ecarts.push(`${source} : absente de firebase.json`);
          continue;
        }
        if (declaree.destination !== destination) {
          ecarts.push(`${source} → « ${declaree.destination} », le bord dit « ${destination} »`);
        }
        if (declaree.type !== 301) ecarts.push(`${source} : ${declaree.type} et non 301`);
      }
    }

    expect(ecarts).toEqual([]);
  });

  it('aucune redirection de l hébergement ne vise une URL elle-même redirigée', () => {
    const chaines: string[] = [];
    for (const rule of hosting.hosting.redirects as Array<{
      source: string;
      destination: string;
    }>) {
      // On teste la destination débarrassée de son jeton de capture.
      const cible = rule.destination.replace(/\/:splat$/, '');
      const suivante = resolveStaticRedirect(cible);
      if (suivante) chaines.push(`${rule.source} → ${cible} → ${suivante}`);
    }
    expect(chaines, 'trois sauts : Google cesse de transmettre le signal de la 301').toEqual([]);
  });
});
