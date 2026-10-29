/**
 * CHAQUE URL ANGLAISE ANNONCÉE AUX MOTEURS SERT UNE PAGE, ET CHAQUE CLÉ FRANÇAISE A SA JUMELLE.
 *
 * Audit du 29/10/2026, registre #1 : le sitemap et les hreflang promettent ~60 URLs `/en/…`,
 * dont plusieurs plantaient ou affichaient des clés brutes. Ce test croise trois sources qui
 * ne se voient pas entre elles :
 *
 *   1. `STATIC_PAGES` du sitemap (Worker) — ce que les moteurs reçoivent ;
 *   2. `enPath` du Worker, puis `toCanonicalPath` du site — l'aller-retour EN → FR ;
 *   3. les `path:` de `src/App.tsx` — ce que le routeur sait réellement servir.
 *
 * Il vérifie aussi la parité structurelle des catalogues : une clé présente en français et
 * absente en anglais s'affiche BRUTE pour un lecteur anglophone dès que le repli manque.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { enPath } from '../../worker/apps/site/src/prerender/segments';
import { localizedPath, toCanonicalPath } from '../../src/i18n/routing';

const sitemapSrc = readFileSync('worker/apps/site/src/seo/sitemap.ts', 'utf8');
const staticBlock = sitemapSrc.slice(sitemapSrc.indexOf('const STATIC_PAGES'));
const sitemapPaths = [
  ...staticBlock.slice(0, staticBlock.indexOf('];')).matchAll(/path:\s*'([^']+)'/g),
].map((m) => m[1]);

const appSrc = readFileSync('src/App.tsx', 'utf8');
const routePatterns = [...appSrc.matchAll(/path:\s*'([^']+)'/g)]
  .map((m) => m[1])
  .filter((p) => p !== '*')
  .map((p) => new RegExp(`^/${p.replace(/:[^/]+/g, '[^/]+')}$`));

function hasRoute(frPath: string): boolean {
  if (frPath === '/') return true; // route index du layout public
  return routePatterns.some((re) => re.test(frPath));
}

describe('sitemap — les URLs anglaises', () => {
  it('lit bien la liste des pages statiques', () => {
    expect(sitemapPaths.length).toBeGreaterThan(15);
  });

  it.each(sitemapPaths)('%s : son URL /en revient au même chemin FR, servi par une route', (fr) => {
    const en = enPath(fr);
    expect(en.startsWith('/en')).toBe(true);
    // Le Worker et le site calculent la même URL anglaise…
    expect(localizedPath(fr, 'en')).toBe(en);
    // …et le site la ramène au chemin FR que le routeur connaît.
    expect(toCanonicalPath(en)).toBe(fr);
    expect(hasRoute(fr)).toBe(true);
  });
});

/** Toutes les clés feuilles d'un catalogue, en notation pointée. */
function leafKeys(obj: unknown, prefix = '', out: string[] = []): string[] {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj)) leafKeys(v, prefix ? `${prefix}.${k}` : k, out);
  } else {
    out.push(prefix);
  }
  return out;
}

const LOCALES = 'src/i18n/locales';
const namespaces = readdirSync(join(LOCALES, 'fr')).filter((f) => f.endsWith('.json'));

describe('catalogues — parité FR / EN', () => {
  it('chaque catalogue français a son pendant anglais', () => {
    const en = new Set(readdirSync(join(LOCALES, 'en')));
    expect(namespaces.filter((f) => !en.has(f))).toEqual([]);
  });

  it.each(namespaces)('%s : aucune clé française absente en anglais', (file) => {
    const fr = JSON.parse(readFileSync(join(LOCALES, 'fr', file), 'utf8'));
    const en = JSON.parse(readFileSync(join(LOCALES, 'en', file), 'utf8'));
    const enKeys = new Set(leafKeys(en));
    // Les suffixes de pluriel diffèrent légitimement d'une langue à l'autre.
    const plural = /_(zero|one|two|few|many|other)$/;
    const missing = leafKeys(fr).filter(
      (k) => !enKeys.has(k) && !(plural.test(k) && enKeys.has(k.replace(plural, '_other'))),
    );
    expect(missing).toEqual([]);
  });
});
