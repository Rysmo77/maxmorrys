import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';

import {
  isInternalTarget,
  isValidSlug,
  normalizeSource,
  normalizeTarget,
  viaSlugFromPath,
  VIA_FALLBACK,
  VIA_PREFIX,
} from '../../src/lib/redirects';

describe('normalisation des sources', () => {
  it('impose le slash initial, la casse basse et retire les slashes finaux', () => {
    expect(normalizeSource('via/eyone')).toBe('/via/eyone');
    expect(normalizeSource('/VIA/Eyone/')).toBe('/via/eyone');
    expect(normalizeSource('  /via/eyone  ')).toBe('/via/eyone');
  });

  it('préserve la racine', () => {
    expect(normalizeSource('/')).toBe('/');
    expect(normalizeSource('//')).toBe('/');
    expect(normalizeSource('')).toBe('/');
  });
});

describe('validation des slugs', () => {
  it('accepte minuscules, chiffres et tirets', () => {
    expect(isValidSlug('eyone')).toBe(true);
    expect(isValidSlug('client-x2')).toBe(true);
  });

  it('refuse tout ce qui ne tient pas dans une URL propre', () => {
    for (const bad of ['', 'Eyone', '-eyone', 'client x', 'client/x', 'a'.repeat(65)]) {
      expect(isValidSlug(bad), bad).toBe(false);
    }
  });
});

describe('validation des cibles', () => {
  it('accepte un chemin interne', () => {
    expect(isInternalTarget('/agence')).toBe(true);
    expect(isInternalTarget('/presence-digitale?pack=vitrine')).toBe(true);
  });

  it('refuse tout ce qui sortirait du domaine', () => {
    // Accepter ces formes ferait de /via/ un redirecteur ouvert, réutilisable
    // en hameçonnage sous notre domaine.
    for (const bad of ['https://evil.example', '//evil.example', '/\\evil.example', 'agence']) {
      expect(isInternalTarget(bad), bad).toBe(false);
    }
  });

  it('refuse les retours chariot', () => {
    expect(isInternalTarget('/agence\nLocation: https://evil.example')).toBe(false);
  });

  it('normalise sans altérer query ni fragment', () => {
    expect(normalizeTarget(' agence?a=1#b ')).toBe('/agence?a=1#b');
    expect(normalizeTarget('')).toBe('');
  });
});

describe('extraction du slug d attribution', () => {
  it('lit le slug d un lien de crédit', () => {
    expect(viaSlugFromPath('/via/eyone')).toBe('eyone');
    expect(viaSlugFromPath('/VIA/Eyone/')).toBe('eyone');
  });

  it('renvoie null hors des liens de crédit', () => {
    expect(viaSlugFromPath('/agence')).toBeNull();
    expect(viaSlugFromPath('/via')).toBeNull();
    expect(viaSlugFromPath('/via/')).toBeNull();
  });
});

/**
 * Le Worker sert les redirections au bord et ne peut pas importer `src/` : il
 * porte une copie de ces fonctions, comme `prerender/segments.ts` porte
 * `src/i18n/segments.ts`. Une divergence silencieuse produirait un slug qui
 * résout en local et 404 en production — ce test la rend bruyante.
 */
describe('parité avec le port du Worker', () => {
  const APP = readFileSync('src/lib/redirects.ts', 'utf8');
  const EDGE = readFileSync('worker/apps/site/src/redirects.ts', 'utf8');

  const extract = (source: string, declaration: string): string => {
    const start = source.indexOf(declaration);
    expect(start, declaration).toBeGreaterThan(-1);
    const end = source.indexOf('\n}\n', start);
    return source.slice(start, end);
  };

  it('partage les mêmes constantes', () => {
    for (const line of [
      "export const VIA_PREFIX = '/via/';",
      "export const VIA_FALLBACK = '/agence';",
      'const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;',
    ]) {
      expect(APP, line).toContain(line);
      expect(EDGE, line).toContain(line);
    }
  });

  it('partage les mêmes implémentations de format', () => {
    for (const declaration of [
      'export function normalizeSource(path: string): string {',
      'export function isValidSlug(slug: string): boolean {',
      'export function isInternalTarget(target: string): boolean {',
    ]) {
      expect(extract(EDGE, declaration)).toBe(extract(APP, declaration));
    }
  });

  it('vise la même destination de repli', () => {
    expect(VIA_PREFIX).toBe('/via/');
    expect(VIA_FALLBACK).toBe('/agence');
  });
});
