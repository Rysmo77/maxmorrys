import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * LES RAYONS DE LA REFONTE VIENNENT DE L'ÉCHELLE, PAS D'UN NOMBRE TAPÉ À LA MAIN.
 *
 * L'échelle réelle, posée par les jetons : `xs` 10 · `m` 16 · `card` 24 · `media` 26 ·
 * `xl` 30 · `pill` 999. Les huit pages de la refonte en employaient quatre qui n'en sont pas
 * — 22, 18, 12 et 10 px écrits en arbitraire — plus `rounded-full` (9999) là où le jeton dit
 * 999, et `rounded-xl` détourné : il vaut **30**, le rayon du panneau héros, et servait de
 * cadre au portrait, qui se retrouvait plus arrondi que toutes les cartes de sa page.
 *
 * ⚠️ `rounded-2xl` et `rounded-lg` sont des DÉFAUTS de Tailwind qui survivent sous `extend`
 * (16 et 8 px) : ils ne sont pas dans le kit, et rien ne les distingue à la lecture d'un
 * jeton. C'est le même piège que `tailwind-radius-collision.test.ts` documente pour
 * `rounded-s` / `rounded-l`.
 *
 * ── PORTÉE VOLONTAIREMENT ÉTROITE, ET C'EST LA DÉCISION ────────────────────────────────────
 * Ce test ne regarde que les surfaces touchées par la refonte. Le dépôt compte des dizaines
 * de `rounded-full` ailleurs — console, LMS, formations. Les interdire ici noierait les
 * corrections réelles sous un bruit qu'aucun lot de ce chantier n'a introduit. Élargir la
 * portée est un travail en soi, qui se décide et se planifie ; ce n'est pas à ce fichier de
 * le faire en passant.
 */

const PORTEE = [
  'src/pages/Home.tsx',
  'src/pages/About.tsx',
  'src/pages/Contact.tsx',
  'src/pages/Apprendre.tsx',
  'src/pages/conception',
  'src/components/site',
  'src/components/conception',
  'src/components/navigation',
];

const INTERDITS: readonly [RegExp, string][] = [
  [/rounded-\[\d+px\]/, "un rayon écrit à la main — l'échelle en porte six, nommés"],
  [/rounded-full\b/, '9999 là où le jeton `rounded-pill` dit 999'],
  [/rounded-2xl\b/, 'défaut Tailwind (16 px), absent du kit — `rounded-m` ou `rounded-card`'],
  [/rounded-lg\b/, 'défaut Tailwind (8 px), absent du kit'],
];

/**
 * Le code sans ses commentaires.
 *
 * ⚠️ Indispensable ici, et mesuré : deux des trois occurrences relevées à l'écriture de ce
 * test vivaient dans des commentaires qui INTERDISENT justement ces rayons (« PAS
 * `rounded-2xl` : les défauts de Tailwind survivent sous `extend` »). Un nettoyage laisse
 * toujours derrière lui un commentaire qui cite ce qu'il a retiré.
 */
function sansCommentaires(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
}

function fichiers(chemin: string): string[] {
  let stat;
  try {
    stat = readdirSync(chemin, { withFileTypes: true });
  } catch {
    return [chemin]; // c'est un fichier
  }
  return stat.flatMap((e) => (e.isDirectory() ? fichiers(join(chemin, e.name)) : join(chemin, e.name)))
    .filter((f) => f.endsWith('.tsx'));
}

describe('rayons — les surfaces de la refonte suivent l’échelle', () => {
  const cibles = PORTEE.flatMap(fichiers);

  it('le balayage voit bien les fichiers', () => {
    expect(cibles.length).toBeGreaterThan(10);
  });

  it('aucun rayon hors échelle', () => {
    const fautes: string[] = [];
    for (const f of cibles) {
      const code = sansCommentaires(readFileSync(f, 'utf8'));
      for (const [motif, pourquoi] of INTERDITS) {
        const m = code.match(motif);
        if (m) fautes.push(`  ${f} → ${m[0]} (${pourquoi})`);
      }
    }
    expect(fautes, `${fautes.length} rayon(s) hors échelle :\n${fautes.join('\n')}`).toEqual([]);
  });
});
