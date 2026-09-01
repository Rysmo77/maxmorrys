/**
 * LES CONVENTIONS DU PORT NATIF, VÉRIFIÉES DEPUIS LA RACINE.
 *
 * `mobile/` est un projet Expo AUTONOME : son propre `package.json`, son propre verrou, aucun
 * `workspaces` à la racine (AD-9). Il n'a donc pas de lanceur de tests à lui, et il n'en aura
 * pas — en ajouter un ferait entrer Jest et son écosystème dans un dossier dont tout l'intérêt
 * est de rester léger.
 *
 * Ces vérifications sont donc STATIQUES et vivent ici, dans la suite de la racine. Elles ne
 * montent aucun composant natif : elles lisent des fichiers. C'est suffisant, parce que les
 * trois défauts qu'elles attrapent sont tous visibles à la lecture — et qu'aucun ne se voit
 * au typecheck.
 *
 * ── LES TROIS DÉFAUTS ────────────────────────────────────────────────────────────────────
 *
 * 1 · UNE COULEUR ÉCRITE EN DUR. React Native n'a ni cascade ni `var()` : la tentation est de
 *     retaper la valeur. C'est ainsi qu'une palette dérive — pas d'un coup, mais une valeur à
 *     la fois, sans que rien ne le signale. Et le coût est asymétrique : sur 206 jetons, 78
 *     changent en mode sombre, donc un hexadécimal figé est un défaut de mode sombre garanti.
 *     `#0057BC` tombe à 2,84:1 sur `#0B0E13` — interdit en texte.
 *
 * 2 · UN IMPORT PROFOND dans `ds/`. Le jour où une primitive change de fichier, c'est
 *     l'écran qui casse, sans que rien ne l'ait annoncé. `ds/index.ts` est la seule porte.
 *
 * 3 · « RYSMO » ÉCRIT EN DUR là où le nom du répétiteur est visé. « Rysmo » nomme
 *     l'APPLICATION ; le répétiteur qu'elle contient s'appelle « Répétiteur » par défaut et
 *     chaque personne peut le renommer. Confondre les deux rend le renommage inintelligible —
 *     quelqu'un aurait renommé son tuteur et lirait encore le nom du produit. Au web, ce
 *     défaut vivait dans onze emplacements.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = new URL('../..', import.meta.url).pathname;
const MOBILE = join(ROOT, 'mobile');

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.tsx') || p.endsWith('.ts')) out.push(p);
  }
  return out;
}

/** Le code servi, commentaires retirés — une valeur citée dans une explication n'est pas un défaut. */
function code(file: string): string {
  return readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

const rel = (p: string) => p.slice(ROOT.length);

describe('port natif — les jetons sont la seule source de couleur', () => {
  const files = walk(MOBILE);

  it('le dossier natif est bien lu', () => {
    // Garde-fou du test : s'il ne trouve plus rien, il ne doit pas passer en silence.
    expect(files.length).toBeGreaterThan(10);
    expect(files.some((f) => f.endsWith('ds/theme.tsx'))).toBe(true);
  });

  /*
   * `theme.tsx` est le pont de jetons et `Surface.tsx` convertit les voiles du système en
   * couleurs opaques — les deux ont le droit d'écrire des canaux. Partout ailleurs, non.
   */
  const AUTORISES = new Set([
    'mobile/ds/theme.tsx',
    'mobile/ds/Surface.tsx',
    /*
     * La TABLE de jetons, écrite par `npm run ds:tokens` depuis le CSS du système : c'est
     * elle, la source de couleur du natif. Lui interdire d'écrire des valeurs n'aurait aucun
     * sens — et elle n'est pas éditée à la main, donc elle ne peut pas dériver toute seule.
     */
    'mobile/ds/tokens.generated.ts',
  ]);

  it("aucun écran n'écrit une couleur hexadécimale", () => {
    const fautes: string[] = [];
    for (const f of files) {
      if (AUTORISES.has(rel(f))) continue;
      const lignes = code(f).split('\n');
      lignes.forEach((l, i) => {
        // `#RGB`, `#RRGGBB`, `#RRGGBBAA` — dans une chaîne de code, pas dans du texte.
        if (/['"`]#[0-9a-fA-F]{3,8}['"`]/.test(l)) fautes.push(`${rel(f)}:${i + 1} — ${l.trim()}`);
      });
    }
    expect(fautes).toEqual([]);
  });

  it("aucun écran n'écrit une couleur rgb() ou rgba()", () => {
    const fautes: string[] = [];
    for (const f of files) {
      if (AUTORISES.has(rel(f))) continue;
      const lignes = code(f).split('\n');
      lignes.forEach((l, i) => {
        if (/rgba?\(\s*\d/.test(l)) fautes.push(`${rel(f)}:${i + 1} — ${l.trim()}`);
      });
    }
    expect(fautes).toEqual([]);
  });
});

describe('port natif — une seule porte vers les primitives', () => {
  const ecrans = walk(join(MOBILE, 'app'));

  it('aucun écran ne descend dans un fichier de `ds/`', () => {
    const fautes: string[] = [];
    for (const f of ecrans) {
      for (const m of code(f).matchAll(/from\s+'([^']*\/ds\/[^']+)'/g)) {
        fautes.push(`${rel(f)} → ${m[1]}`);
      }
    }
    expect(fautes).toEqual([]);
  });
});

describe('port natif — le nom du répétiteur est un réglage', () => {
  const files = walk(MOBILE);

  /**
   * « Rysmo » reste légitime là où il nomme L'APPLICATION : le nom du paquet, l'écran de
   * lancement, la bannière d'installation, et la phrase qui lève précisément l'ambiguïté
   * (« Rysmo reste le nom de l'application »). Le test cible donc les chaînes qui nomment le
   * TUTEUR — celles qui accolent « Rysmo » à « répétiteur », « tuteur » ou « ton ».
   */
  it('aucune chaîne ne présente « Rysmo » comme le nom du tuteur', () => {
    const fautes: string[] = [];
    const suspect = /(ton|ta|votre)\s+(répétiteur|tuteur)\s+Rysmo|Rysmo,?\s+(ton|ta)\s+(répétiteur|tuteur)/i;
    for (const f of files) {
      const lignes = code(f).split('\n');
      lignes.forEach((l, i) => {
        if (suspect.test(l)) fautes.push(`${rel(f)}:${i + 1} — ${l.trim()}`);
      });
    }
    expect(fautes).toEqual([]);
  });

  it('la barre d’onglets lit le nom, elle ne l’écrit pas', () => {
    const layout = code(join(MOBILE, 'app/(tabs)/_layout.tsx'));
    /*
      `useTutorNom()` est l'accesseur ATTENDU ici, et `tutorNom()` est toléré : ce test
      vérifie que la barre LIT le nom, pas qu'elle emploie une forme précise. Le hook est
      meilleur — il abonne la barre au magasin, donc un renommage la redessine —, mais
      l'invariant du test reste « aucun libellé écrit en dur ».
    */
    expect(layout).toMatch(/useTutorNom\(\)|tutorNom\(\)/);
    expect(layout).not.toMatch(/title:\s*'(Rysmo|Répétiteur)'/);
  });

  /*
   * L'accesseur SIMPLE ne se rend pas à nouveau. Un composant qui l'appelle affichera
   * l'ancien nom jusqu'à ce qu'autre chose le redessine — c'est le défaut exact qui a été
   * trouvé au web, où la barre haute et le corps du même écran affichaient deux noms.
   */
  it('aucun composant natif n’affiche le nom par l’accesseur simple', () => {
    const fautes: string[] = [];
    for (const f of walk(join(MOBILE, 'app'))) {
      const src = code(f);
      // `tutorNom()` reste légitime hors rendu : dans un `onPress`, un message composé…
      const lignes = src.split('\n');
      lignes.forEach((l, i) => {
        if (/\{\s*tutorNom\(\)\s*\}/.test(l) || /title:\s*tutorNom\(\)/.test(l)) {
          fautes.push(`${rel(f)}:${i + 1} — ${l.trim()}`);
        }
      });
    }
    expect(fautes).toEqual([]);
  });
});

describe('port natif — les primitives publiées', () => {
  it('tout fichier de `ds/` est exporté par son point d’entrée', () => {
    const index = readFileSync(join(MOBILE, 'ds/index.ts'), 'utf8');
    const manquants = readdirSync(join(MOBILE, 'ds'))
      .filter((n) => (n.endsWith('.tsx') || n.endsWith('.ts')) && n !== 'index.ts')
      // Les fichiers `*.generated.ts` sont des COPIES écrites par `npm run ds:tokens` —
      // jetons et tracés d'icônes. Ils alimentent les primitives, ils n'en sont pas.
      .filter((n) => !n.endsWith('.generated.ts'))
      .map((n) => n.replace(/\.tsx?$/, ''))
      .filter((n) => !index.includes(`'./${n}'`));
    expect(manquants).toEqual([]);
  });
});

describe('port natif — rien ne sort du dossier', () => {
  /**
   * AUCUN IMPORT NE REMONTE AU-DESSUS DE `mobile/`.
   *
   * C'est le défaut le plus coûteux trouvé sur ce port, parce qu'il passait TOUTES les
   * portes. `ds/theme.tsx` lisait `../../src/design-system/tokens.generated`, `ds/Icon.tsx`
   * lisait `../../src/design-system/icons`, `ds/Mesh.tsx` un type au même endroit.
   * TypeScript résout ces chemins sans broncher — le typecheck natif était vert. Metro, le
   * bundler de React Native, ne résout RIEN hors de la racine du projet :
   *
   *     Error: Unable to resolve module ../../src/design-system/tokens.generated
   *
   * L'application ne pouvait donc ni se bundler, ni tourner, ni se construire — et rien ne
   * le disait. L'intention était juste (une seule source de vérité, AD-8) ; le mécanisme ne
   * l'était pas. `npm run ds:tokens` écrit maintenant les jetons ET les tracés DANS
   * `mobile/ds/`, en `*.generated.ts`. Recopier une source unique n'est pas la dupliquer.
   *
   * Ce test est la porte que le typecheck ne peut pas être. La preuve du bundle, elle, est
   * `npx expo export --platform ios --platform android` — à refaire après tout nouvel import.
   */
  it('aucun fichier natif n’importe au-dessus de `mobile/`', () => {
    const fautes: string[] = [];
    for (const f of walk(MOBILE)) {
      for (const m of code(f).matchAll(/from\s+'(\.\.\/[^']*)'/g)) {
        const cible = join(f, '..', m[1]);
        if (!cible.startsWith(MOBILE)) fautes.push(`${rel(f)} → ${m[1]}`);
      }
    }
    expect(fautes).toEqual([]);
  });

  it('les copies générées sont présentes', () => {
    // Sans elles, le bundle échoue — et elles sont écrites par un script de la RACINE, donc
    // absentes d'une installation fraîche du seul dossier natif tant qu'on ne l'a pas lancé.
    for (const n of ['tokens.generated.ts', 'icons.generated.ts']) {
      expect(existsSync(join(MOBILE, 'ds', n)), `mobile/ds/${n} manque`).toBe(true);
    }
  });
});
