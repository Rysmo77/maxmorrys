/**
 * UNE ROUTE DÉCLARE LES NAMESPACES i18n QU'ELLE LIT.
 *
 * `src/i18n/index.ts` monte react-i18next avec `useSuspense: false` et charge quinze
 * namespaces À LA DEMANDE. Une route qui lit un de ces quinze doit donc le précharger, ce que
 * `lazyWithReload(factory, ['ns'])` fait en parallèle du chunk du composant.
 *
 * SANS CE PRÉCHARGEMENT, LE DÉFAUT N'EST PAS « DU TEXTE MANQUANT ». `t('cle')` rend la CLÉ,
 * une chaîne — et partout où le code attend un tableau, tout casse :
 *
 *     t('pole.titleLines', { returnObjects: true }).join(' ')
 *     → TypeError: t(...).join is not a function
 *
 * La page entière tombe alors sur la frontière d'erreur. C'est arrivé sur `MediaPole`, seule
 * page du dépôt chargée par `lazy` nu : tout le territoire « Je te transforme » affichait
 * « Unexpected Application Error » au lieu de son contenu. Ses deux voisines de namespace,
 * `PodcastDetail` et `VideoDetail`, déclaraient bien `['media']` — c'est ce qui rendait
 * l'oubli invisible à la relecture.
 *
 * Ni le typecheck, ni le lint, ni les autres suites ne pouvaient le voir : `t()` est typé
 * comme renvoyant `string`, et le `as string[]` du code le contredit sans que rien ne vérifie.
 * Le seul témoin était le navigateur, sur cette route-là.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';

const ROOT = new URL('../..', import.meta.url).pathname;
const APP = join(ROOT, 'src/App.tsx');

/** Les namespaces chargés à la demande — les seuls qui exigent une déclaration. */
function lazyNamespaces(): Set<string> {
  const src = readFileSync(join(ROOT, 'src/i18n/index.ts'), 'utf8');
  const block = src.match(/export const LAZY_NAMESPACES = \[([\s\S]*?)\] as const;/);
  expect(block, 'LAZY_NAMESPACES introuvable dans src/i18n/index.ts').toBeTruthy();
  return new Set([...block![1].matchAll(/'([^']+)'/g)].map((m) => m[1]));
}

interface RouteDecl {
  name: string;
  importPath: string;
  declared: string[];
  /** `lazy` nu : aucune déclaration possible, donc aucun namespace paresseux permis. */
  raw: boolean;
}

/** Les composants de route déclarés dans `App.tsx`, avec leurs namespaces annoncés. */
function routeDeclarations(): RouteDecl[] {
  const src = readFileSync(APP, 'utf8');
  const out: RouteDecl[] = [];

  const withReload = /const (\w+) = lazyWithReload\(\s*\(\)\s*=>\s*import\('([^']+)'\)\s*(?:,\s*\[([^\]]*)\])?\s*\)/g;
  for (const m of src.matchAll(withReload)) {
    out.push({
      name: m[1],
      importPath: m[2],
      declared: m[3] ? [...m[3].matchAll(/'([^']+)'/g)].map((x) => x[1]) : [],
      raw: false,
    });
  }

  const bare = /const (\w+) = lazy\(\s*\(\)\s*=>\s*import\('([^']+)'\)\s*\)/g;
  for (const m of src.matchAll(bare)) {
    out.push({ name: m[1], importPath: m[2], declared: [], raw: true });
  }

  return out;
}

/** Les namespaces qu'un fichier lit réellement, par `useTranslation('x')` ou `ns="x"`. */
function namespacesUsedBy(file: string): string[] {
  const src = readFileSync(file, 'utf8');
  const found = new Set<string>();
  for (const m of src.matchAll(/useTranslation\(\s*'([^']+)'/g)) found.add(m[1]);
  for (const m of src.matchAll(/useTranslation\(\s*\[([^\]]+)\]/g)) {
    for (const x of m[1].matchAll(/'([^']+)'/g)) found.add(x[1]);
  }
  for (const m of src.matchAll(/\bns="([^"]+)"/g)) found.add(m[1]);
  return [...found];
}

function resolveImport(importPath: string): string | null {
  const base = resolve(dirname(APP), importPath);
  for (const ext of ['.tsx', '.ts']) if (existsSync(base + ext)) return base + ext;
  return null;
}

describe('namespaces i18n des routes', () => {
  const lazyNs = lazyNamespaces();
  const decls = routeDeclarations();

  it('la table de routes est bien lue', () => {
    // Garde-fou du test : si l'extraction casse, il ne doit pas passer en silence.
    expect(decls.length).toBeGreaterThan(30);
    expect(lazyNs.size).toBeGreaterThan(10);
    expect(decls.some((d) => d.name === 'MediaPole')).toBe(true);
  });

  it('chaque route déclare les namespaces paresseux qu’elle lit', () => {
    const manquants: string[] = [];

    for (const d of decls) {
      const file = resolveImport(d.importPath);
      if (!file) continue;
      for (const ns of namespacesUsedBy(file)) {
        if (!lazyNs.has(ns)) continue;              // namespace de base : toujours chargé
        if (d.declared.includes(ns)) continue;      // déclaré : rien à dire
        manquants.push(
          `${d.name} (${d.importPath}) lit « ${ns} »` +
          (d.raw ? ' et passe par `lazy` nu — utiliser `lazyWithReload`' : ' sans le déclarer'),
        );
      }
    }

    expect(manquants).toEqual([]);
  });

  /** Le cas précis qui a motivé ce test. */
  it('le pôle média précharge « media »', () => {
    const media = decls.find((d) => d.name === 'MediaPole');
    expect(media?.raw).toBe(false);
    expect(media?.declared).toContain('media');
  });
});
