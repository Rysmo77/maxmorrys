import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * UNE REQUÊTE NE FILTRE PAS SUR UN CHAMP QUI N'EXISTE PAS.
 *
 * Le défaut qui a motivé ce test : `getPublicCounts` interrogeait
 * `where('published', '==', true)`. Les documents ne portent pas ce champ — ils
 * déclarent `status: 'published' | 'draft'` — et les règles Firestore gardent
 * exactement là-dessus. Firestore refuse une requête dont les contraintes ne
 * GARANTISSENT pas la règle : les quatre comptages revenaient en `permission-denied`,
 * le `catch` du module rendait `null`, et l'accueil n'affichait aucun chiffre.
 *
 * ── POURQUOI RIEN NE POUVAIT LE VOIR ──────────────────────────────────────────
 * Le typecheck ne connaît pas les champs Firestore : `where()` prend une `string`, et
 * n'importe quelle chaîne passe. Le lint non plus. Les suites ne parlent pas au serveur.
 * Et l'échec était SILENCIEUX par conception — c'est le module lui-même qui décide
 * qu'un comptage raté rend `null` plutôt qu'un zéro faux, ce qui est la bonne décision
 * et ce qui a masqué le défaut pendant toute sa vie.
 *
 * Il a fallu ouvrir la page dans un navigateur pour voir les requêtes refusées. Ce test
 * remplace ce détour : il compare les champs FILTRÉS aux champs DÉCLARÉS.
 *
 * ── CE QU'IL VÉRIFIE, ET CE QU'IL NE VÉRIFIE PAS ──────────────────────────────
 * Il vérifie l'EXISTENCE du champ, pas la conformité à la règle. Vérifier la seconde
 * demanderait de résoudre le nom de la collection — souvent une variable, comme dans
 * `countPublished(name)` justement — et un test qui ne couvre que les cas littéraux
 * aurait laissé passer celui-ci.
 *
 * L'existence suffit à fermer la classe : un filtre sur un champ que rien ne déclare
 * est faux dans tous les cas, qu'il vise une collection gardée ou non.
 *
 * ⚠️ L'extraction des propriétés est VOLONTAIREMENT LARGE — toute ligne de la forme
 * `  nom?:` dans les types et les modules Firestore. Elle ramasse donc aussi des clés
 * qui ne sont pas des champs de document. C'est le bon sens du compromis : ce test doit
 * échouer quand un champ n'existe NULLE PART, jamais parce qu'il est déclaré ailleurs
 * que là où on l'a cherché.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const ROOT = resolve(__dirname, '../..');
const SRC = join(ROOT, 'src');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.tsx?$/.test(full) ? [full] : [];
  });
}

/** Toute propriété déclarée dans un type ou un module de données. */
function declaredFields(): Set<string> {
  const out = new Set<string>();
  for (const file of [...walk(join(SRC, 'types')), ...walk(join(SRC, 'lib', 'firestore'))]) {
    for (const m of readFileSync(file, 'utf8').matchAll(/^\s{2,}(\w+)\??\s*:/gm)) {
      out.add(m[1]);
    }
  }
  return out;
}

/** Tout champ passé à `where()`, où qu'il soit appelé. */
function queriedFields(): { field: string; where: string }[] {
  const out: { field: string; where: string }[] = [];
  for (const file of walk(SRC)) {
    const source = readFileSync(file, 'utf8');
    if (!source.includes('where(')) continue;
    for (const m of source.matchAll(/where\(\s*'([a-zA-Z0-9_.]+)'/g)) {
      out.push({ field: m[1], where: `${relative(SRC, file)}:${source.slice(0, m.index).split('\n').length}` });
    }
  }
  return out;
}

/** Les champs que les règles emploient — ils sont déclarés côté serveur, pas en TS. */
function ruleFields(): Set<string> {
  const rules = readFileSync(join(ROOT, 'firestore.rules'), 'utf8');
  return new Set([...rules.matchAll(/resource\.data\.(\w+)/g)].map((m) => m[1]));
}

describe('Firestore — les champs filtrés existent', () => {
  const declared = declaredFields();
  const rules = ruleFields();
  const queried = queriedFields();

  it('trouve bien des champs des deux côtés (sinon le test ne prouve rien)', () => {
    expect(declared.size).toBeGreaterThan(50);
    expect(queried.length).toBeGreaterThan(5);
  });

  it('aucun `where()` ne filtre un champ que rien ne déclare', () => {
    const unknown = queried.filter(({ field }) => {
      /* Un chemin imbriqué (`profil.ville`) se juge sur son premier segment : c'est lui
         qui doit exister sur le document. */
      const base = field.split('.')[0];
      return !declared.has(base) && !rules.has(base);
    });

    expect(
      unknown.map((u) => `${u.where} → where('${u.field}', …)`),
      'Ces requêtes filtrent sur un champ qu\'aucune interface TypeScript ni aucune règle '
      + 'Firestore ne déclare. `where()` prend une `string` : le typecheck ne peut pas le '
      + 'voir, et Firestore refusera la requête sans que rien ne le dise — le `catch` rendra '
      + 'un état vide qui ressemble à « pas de données ».',
    ).toEqual([]);
  });

  it('`published` en particulier n\'est jamais filtré — c\'est `status`', () => {
    /* Le défaut d'origine, nommé. Les documents portent `status: 'published' | 'draft'`,
       et dix-neuf requêtes du dépôt filtrent correctement dessus ; une seule s'en écartait. */
    const wrong = queried.filter(({ field }) => field === 'published');
    expect(
      wrong.map((w) => w.where),
      "Le champ est `status`, avec la valeur 'published' — pas un booléen `published`.",
    ).toEqual([]);
  });
});
