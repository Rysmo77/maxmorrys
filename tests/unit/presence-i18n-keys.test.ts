/**
 * LE DEVIS COMMERCES ET TPE N'AFFICHE JAMAIS UNE CLÉ BRUTE.
 *
 * Audit UI/UX du 03/11/2026, constat n°2 : les listes déroulantes du devis montraient
 * `packs.undecided.name`, `plans.aucun.name` et `plans.undecided.name`. `i18n-keys.test.ts`
 * ne pouvait pas le voir : il ne lit que les clés LITTÉRALES des `.tsx`, et celles-ci sont
 * construites — t(`packs.${k}.name`) — sur des listes de valeurs (`PACK_KEYS`, `PLAN_KEYS`)
 * qui vivent dans `lib/presence/offer.ts`. Le hook `usePresenceQuote.ts` n'est même pas un
 * `.tsx`.
 *
 * Ce test lit donc les trois fichiers du parcours, et :
 *   1. vérifie chaque clé littérale `t('a.b')` dans les deux langues ;
 *   2. DÉPLIE chaque clé gabarit `t(`a.${x}.b`)` sur le domaine déclaré pour son préfixe,
 *      et vérifie chaque clé obtenue dans les deux langues. Un préfixe sans domaine déclaré
 *      fait échouer le test : on ne peut pas ajouter un gabarit sans dire ce qu'il déplie.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PACKS, PLANS, PACK_KEYS, PLAN_KEYS, SECTOR_KEYS } from '../../src/lib/presence/offer';

const NS = 'presence';
const LANGS = ['fr', 'en'] as const;
const FILES = [
  'src/pages/PresenceDigitale.tsx',
  'src/pages/PresenceDevis.tsx',
  'src/pages/presence/usePresenceQuote.ts',
];

const dicts = Object.fromEntries(
  LANGS.map((l) => [l, JSON.parse(readFileSync(join('src/i18n/locales', l, `${NS}.json`), 'utf8'))]),
) as Record<(typeof LANGS)[number], Record<string, unknown>>;

function resolve(dict: Record<string, unknown>, key: string): unknown {
  let cur: unknown = dict;
  for (const part of key.split('.')) {
    if (typeof cur !== 'object' || cur === null || !(part in cur)) return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

/**
 * Domaine de la variable, selon le texte qui la précède et celui qui la suit.
 * `.features` n'est lu que pour un pack / une formule RÉELS (gardé par `findPack` /
 * `findPlan` dans `PresenceDevis`) — `undecided` et `aucun` n'en ont pas.
 */
function domain(prefix: string, suffix: string): readonly (string | number)[] | undefined {
  if (prefix === 'packs.') return suffix === '.features' ? PACKS.map((p) => p.key) : PACK_KEYS;
  if (prefix === 'plans.') return suffix === '.features' ? PLANS.map((p) => p.key) : PLAN_KEYS;
  if (prefix === 'form.sectors.') return SECTOR_KEYS;
  if (prefix === 'v3.packs.summary.') return PACKS.map((p) => p.key);
  if (prefix === 'v3.steps.s') return [1, 2, 3, 4];
  return undefined;
}

/** Retire les commentaires : un commentaire qui cite une clé n'est pas un appel. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const literal: { file: string; key: string }[] = [];
const expanded: { file: string; tpl: string; key: string }[] = [];
const undeclared: string[] = [];

for (const file of FILES) {
  const src = stripComments(readFileSync(file, 'utf8'));
  for (const m of src.matchAll(/\bt\(\s*(['"])([^'"\n]+)\1/g)) literal.push({ file, key: m[2] });
  for (const m of src.matchAll(/\bt\(\s*`([^`]+)`/g)) {
    const tpl = m[1];
    const parts = tpl.split(/\$\{[^}]+\}/);
    if (parts.length === 1) { literal.push({ file, key: tpl }); continue; }
    if (parts.length !== 2) { undeclared.push(`${file} : ${tpl}`); continue; }
    const values = domain(parts[0], parts[1]);
    if (!values) { undeclared.push(`${file} : ${tpl}`); continue; }
    for (const v of values) expanded.push({ file, tpl, key: `${parts[0]}${v}${parts[1]}` });
  }
}

describe('devis Commerces et TPE — clés i18n', () => {
  it('lit bien des clés dans les trois fichiers (garde-fou du test lui-même)', () => {
    expect(literal.length).toBeGreaterThan(20);
    expect(expanded.some((e) => e.key === 'packs.undecided.name')).toBe(true);
    expect(expanded.some((e) => e.key === 'plans.aucun.name')).toBe(true);
  });

  it('chaque clé gabarit a un domaine déclaré', () => {
    expect(undeclared).toEqual([]);
  });

  for (const lang of LANGS) {
    it(`toute clé littérale existe en ${lang}`, () => {
      const missing = literal.filter(({ key }) => resolve(dicts[lang], key) === undefined)
        .map(({ file, key }) => `${file} : ${key}`);
      expect(missing).toEqual([]);
    });

    it(`toute clé gabarit dépliée existe en ${lang}`, () => {
      const missing = expanded.filter(({ key }) => resolve(dicts[lang], key) === undefined)
        .map(({ file, tpl, key }) => `${file} : ${tpl} → ${key}`);
      expect([...new Set(missing)]).toEqual([]);
    });
  }
});
