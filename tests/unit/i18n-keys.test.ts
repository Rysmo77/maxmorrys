/**
 * TOUTE CLÉ APPELÉE PAR UN ÉCRAN EXISTE, DANS LES DEUX LANGUES.
 *
 * i18next ne signale rien quand une clé manque : il rend LA CLÉ. Le défaut s'affiche donc en
 * production sous la forme d'un texte comme « seo.title » ou « reset.submitting », et il ne
 * casse ni la compilation, ni le typecheck, ni le lint, ni aucun autre test.
 *
 * Cinq occurrences vivaient dans le dépôt au moment d'écrire ce fichier, dont deux visibles :
 *
 *   • `/faq` posait `<title>seo.title</title>` — le namespace porte `seoTitle`, à sa racine.
 *     C'est la page publique la plus liée du site, et son onglet de navigateur affichait le
 *     nom d'une clé.
 *   • `/podcasts/:slug` introuvable affichait « podcasts.notFound » en titre d'affichage,
 *     Fraunces 900, 34 px.
 *   • trois autres étaient masquées par un `defaultValue` écrit EN FRANÇAIS — donc invisibles
 *     en français, et servies telles quelles à un lecteur anglais.
 *
 * Les trois dernières disent pourquoi ce test regarde LES DEUX langues : un repli codé en dur
 * rend le défaut invisible dans la langue de qui l'écrit, et seulement dans celle-là.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';

const LANGS = ['fr', 'en'] as const;
const LOCALES = 'src/i18n/locales';

/** Toutes les surfaces : `src/**\/*.tsx`. */
function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.tsx')) out.push(p);
  }
  return out;
}

const bundles = new Map<string, Record<string, unknown> | null>();
function bundle(lang: string, ns: string): Record<string, unknown> | null {
  const id = `${lang}/${ns}`;
  if (!bundles.has(id)) {
    const p = join(LOCALES, lang, `${ns}.json`);
    bundles.set(id, existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null);
  }
  return bundles.get(id) ?? null;
}

function resolve(dict: Record<string, unknown>, key: string): unknown {
  let cur: unknown = dict;
  for (const part of key.split('.')) {
    if (typeof cur !== 'object' || cur === null || !(part in cur)) return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

/**
 * `const { t } = useTranslation('faq')` et `const { t: tNav } = useTranslation('nav')`.
 * L'alias compte : plusieurs namespaces cohabitent dans un même écran.
 */
const HOOK = /const\s*\{\s*t(?:\s*:\s*(\w+))?\s*\}\s*=\s*useTranslation\(\s*'(\w+)'/g;

/** Clés littérales seulement — une clé construite (`t(\`tab.${key}\`)`) n'est pas vérifiable ici. */
const callsOf = (alias: string) => new RegExp(`\\b${alias}\\(\\s*'([a-zA-Z0-9_.]+)'`, 'g');

interface Miss { file: string; ns: string; key: string; lang: string }

const misses: Miss[] = [];
for (const file of walk('src')) {
  const source = readFileSync(file, 'utf8');
  const bindings = new Map<string, string>();
  for (const m of source.matchAll(HOOK)) bindings.set(m[1] ?? 't', m[2]);

  for (const [alias, ns] of bindings) {
    if (!bundle('fr', ns)) continue; // namespace hors table : rien à vérifier ici
    for (const call of source.matchAll(callsOf(alias))) {
      const key = call[1];
      for (const lang of LANGS) {
        const dict = bundle(lang, ns);
        if (!dict) continue;
        // Les formes plurielles vivent sous `_one` / `_other`, jamais sous la clé nue.
        const found =
          resolve(dict, key) !== undefined ||
          resolve(dict, `${key}_one`) !== undefined ||
          resolve(dict, `${key}_other`) !== undefined;
        if (!found) misses.push({ file, ns, key, lang });
      }
    }
  }
}

describe('i18n — les clés appelées existent', () => {
  it('ne laisse aucune clé littérale sans traduction, en français comme en anglais', () => {
    const report = misses.map((m) => `${m.file} → ${m.ns}.${m.key} (${m.lang})`);
    expect(report).toEqual([]);
  });
});
