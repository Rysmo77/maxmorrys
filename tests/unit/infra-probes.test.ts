import { afterEach, describe, expect, it, vi } from 'vitest';
import { bundleFromHtml, compareBundles, probeHost } from '../../src/lib/admin/infraProbes';

/** Les sondes de l'écran Infrastructure (audit UI/UX du 03/11/2026, X16). */

afterEach(() => { vi.unstubAllGlobals(); });

describe('bundleFromHtml', () => {
  it('lit le bundle d’entrée du shell Vite', () => {
    const html = '<head><script type="module" crossorigin src="/assets/index-aeAXKaCK.js"></script>'
      + '<link rel="modulepreload" href="/assets/firebase-x1.js"></head>';
    expect(bundleFromHtml(html)).toBe('index-aeAXKaCK.js');
  });

  it('ne prend pas une feuille de style ou un preload pour le bundle', () => {
    expect(bundleFromHtml('<link rel="modulepreload" href="/assets/index-AAA.js">')).toBeNull();
  });
});

describe('compareBundles', () => {
  it('distingue à jour, différent, développement et illisible', () => {
    expect(compareBundles('index-a.js', 'index-a.js').state).toBe('same');
    expect(compareBundles('index-a.js', 'index-b.js').state).toBe('differs');
    expect(compareBundles('index-a.js', null).state).toBe('dev');
    expect(compareBundles(null, 'index-b.js').state).toBe('unknown');
  });
});

describe('probeHost', () => {
  it('lit le code HTTP sur la même origine', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await probeHost('https://maxmorrys.me/', 'https://maxmorrys.me')).toEqual({ state: 'http-error', status: 503 });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'HEAD' });
  });

  it('ne prétend pas lire un code sur un autre hôte : « répond », en no-cors', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await probeHost('https://edu.maxmorrys.me/', 'https://maxmorrys.me')).toEqual({ state: 'reachable' });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ mode: 'no-cors' });
  });

  it('un échec réseau se lit « injoignable »', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    expect(await probeHost('https://club.maxmorrys.me/', 'https://maxmorrys.me')).toEqual({ state: 'unreachable' });
  });
});
