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
 *
 * ── LE SCANNER SUIT LES IMPORTS LOCAUX, SUR UN NIVEAU  (17/09/2026) ──────────────────────
 *
 * Il ne lisait QUE le fichier de route. Un composant monté par la page pouvait donc lire un
 * namespace que la route ne déclare pas, et le test passait — pendant que la production
 * rendait des clés brutes. Le défaut est réel et il a une adresse : `components/agency/`
 * fixait `useTranslation('agency')` en dur, et deux composants de la piste Conception
 * n'existent que parce qu'on ne pouvait pas les monter sur `/conception/realisations` sans
 * charger `agency` avec eux.
 *
 * Un seul niveau, et c'est délibéré. Il attrape le cas réel — une page qui monte un
 * composant — sans avoir à résoudre un graphe complet, et sans faire dépendre le résultat
 * d'un barrel qui ne lit, lui, aucun namespace. Un composant profond qui lit un namespace
 * paresseux reste donc invisible : la parade est de ne lire AUCUN namespace dans un
 * composant partagé, et de recevoir ses chaînes déjà traduites — c'est ce que font
 * `SiteExit` et les cartes de `components/conception/`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join, dirname, resolve, relative } from 'path';

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

/**
 * Retire commentaires de bloc et de ligne avant analyse.
 *
 * ⚠️ SANS ÇA, EXPLIQUER POURQUOI ON N'UTILISE PAS UN NAMESPACE SUFFISAIT À FAIRE ÉCHOUER LE
 * TEST. Une page de la piste Conception portait, en commentaire, la phrase « il appelle
 * `useTranslation('agency')` en dur » — pour dire précisément qu'elle ne le fait PAS. Le
 * scanner lisait la citation comme un usage et réclamait la déclaration du namespace, ce qui
 * aurait chargé un catalogue mort sur la route.
 *
 * C'est le mode d'échec classique d'un nettoyage : ce qui reste, c'est un commentaire qui CITE
 * ce qu'on a retiré. `interdits-preuve-sociale.test.ts` s'en protège de la même façon, pour la
 * même raison — le `(^|[^:])` du second motif évite de couper `https://` en deux.
 */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
}

/** Les namespaces qu'un fichier lit réellement, par `useTranslation('x')` ou `ns="x"`. */
function namespacesUsedBy(file: string): string[] {
  const src = stripComments(readFileSync(file, 'utf8'));
  const found = new Set<string>();
  for (const m of src.matchAll(/useTranslation\(\s*'([^']+)'/g)) found.add(m[1]);
  for (const m of src.matchAll(/useTranslation\(\s*\[([^\]]+)\]/g)) {
    for (const x of m[1].matchAll(/'([^']+)'/g)) found.add(x[1]);
  }
  for (const m of src.matchAll(/\bns="([^"]+)"/g)) found.add(m[1]);
  return [...found];
}

/** Résout un spécificateur relatif : fichier, puis `index` du dossier. */
function resolveFrom(fromFile: string, spec: string): string | null {
  const base = resolve(dirname(fromFile), spec);
  for (const candidat of [`${base}.tsx`, `${base}.ts`, join(base, 'index.tsx'), join(base, 'index.ts')]) {
    if (existsSync(candidat)) return candidat;
  }
  return null;
}

/**
 * Les imports LOCAUX d'un fichier (`./`, `../`), résolus — un seul niveau.
 *
 * Les imports de paquets et l'alias `@ds` sont hors sujet : le premier ne lit pas nos
 * catalogues, le second est le design system, à qui il est interdit d'en lire un.
 */
function localImports(file: string): string[] {
  const src = stripComments(readFileSync(file, 'utf8'));
  const out = new Set<string>();
  for (const m of src.matchAll(/from\s+'(\.[^']*)'/g)) {
    const resolu = resolveFrom(file, m[1]);
    if (resolu) out.add(resolu);
  }
  return [...out];
}

function resolveImport(importPath: string): string | null {
  return resolveFrom(APP, importPath);
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
      // La route ET ce qu'elle monte : un composant importé lit dans la même route.
      for (const lu of [file, ...localImports(file)]) {
        for (const ns of namespacesUsedBy(lu)) {
          if (!lazyNs.has(ns)) continue;              // namespace de base : toujours chargé
          if (d.declared.includes(ns)) continue;      // déclaré : rien à dire
          const ou = lu === file ? d.importPath : relative(ROOT, lu);
          manquants.push(
            `${d.name} (${ou}) lit « ${ns} »` +
            (d.raw ? ' et passe par `lazy` nu — utiliser `lazyWithReload`' : ' sans le déclarer'),
          );
        }
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
