import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import config from '../../tailwind.config.js';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DEUX RUPTURES, PAS SIX.
 *
 * `brand/breakpoints.css` — copie littérale du kit — n'écrit que deux media queries :
 * **700 px** et **1080 px**. Le dépôt en pratiquait pourtant quatre de plus, celles de
 * Tailwind : `sm` 640, `md` 768, `lg` 1024, `xl` 1280, sur 116 classes.
 *
 * Le défaut n'est pas cosmétique : deux règles de mise en page basculaient à 60 px
 * d'écart sur la même page — une grille passait à deux colonnes à 640 pendant que la
 * carte voisine attendait 700. La bande entre les deux n'a jamais été dessinée par
 * personne, et c'est justement la largeur qui compte le plus ici : la tablette en
 * portrait.
 *
 * Les quatre échelles sont annulées dans la configuration, donc un `sm:` oublié ne
 * rend RIEN — mais « ne rien rendre » ne se voit qu'à l'écran, et seulement sur la
 * largeur concernée. Ce test le dit à l'écriture.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const SRC = resolve(__dirname, '../../src');
const LEGACY = ['sm', 'md', 'lg', 'xl', '2xl'];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((e) => {
    const full = join(dir, e);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.tsx?$/.test(full) ? [full] : [];
  });
}

const stripComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('points de rupture', () => {
  it('la configuration ne déclare que `stack` et `wide`', () => {
    const screens = (config.theme?.extend?.screens ?? {}) as Record<string, string | undefined>;
    expect(screens.stack).toBe('700px');
    expect(screens.wide).toBe('1080px');
    for (const key of LEGACY) {
      expect(screens[key], `\`${key}\` doit rester annulé : le kit ne le déclare pas`).toBeUndefined();
    }
  });

  it('aucune source n\'utilise un préfixe que le système ne déclare pas', () => {
    const offenders: string[] = [];
    /* Le préfixe doit être suivi d'un UTILITAIRE : `sm:` seul, dans un commentaire ou
       une clé d'objet, n'est pas une classe. `md:` suivi d'une lettre l'est. */
    const re = new RegExp(`(?:^|["'\`\s])(${LEGACY.join('|')}):[a-z][a-z0-9-]*`, 'g');
    for (const file of walk(SRC)) {
      for (const hit of stripComments(readFileSync(file, 'utf8')).match(re) ?? []) {
        offenders.push(`${relative(SRC, file)} → ${hit.trim()}`);
      }
    }
    expect(
      offenders,
      'Le système ne déclare que 700 px (`stack`) et 1080 px (`wide`). Ces préfixes sont '
      + 'annulés dans la configuration : ils ne rendent rien.\n\n' + offenders.join('\n'),
    ).toEqual([]);
  });
});
