import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tokens } from '../../mobile/ds/tokens.generated';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE MOUVEMENT TIENT LA GRAMMAIRE DU KIT — « quatre durées, deux courbes, et rien d'autre ».
 *
 * Source : `DS_Final/brand/motion.css` et les planches `guidelines/planche-*.html`.
 * Ces règles sont faciles à perdre au prochain écran : une animation de largeur, une
 * durée inventée, un troisième « moment », une préférence d'accessibilité relue ailleurs.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const MOBILE = resolve(__dirname, '../../mobile');
const lire = (p: string) => readFileSync(join(MOBILE, p), 'utf8');
const sansCommentaires = (c: string) => c.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

function sources(dir = MOBILE, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e.startsWith('.') || e === 'dist') continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) sources(p, out);
    else if (/\.tsx?$/.test(e) && !e.endsWith('.generated.ts')) out.push(p);
  }
  return out;
}

describe('les durées viennent des jetons du kit', () => {
  it('quatre durées, deux décalages, deux enfoncements — les valeurs du kit', () => {
    const l = tokens.light as unknown as Record<string, string>;
    expect([l.tTap, l.tUi, l.tEnter, l.tScene]).toEqual(['120ms', '220ms', '380ms', '700ms']);
    expect([l.stagger, l.staggerLine]).toEqual(['70ms', '90ms']);
    expect([l.pressScale, l.pressScaleSm]).toEqual(['.975', '.94']);
  });

  it('le module de mouvement les LIT, il ne les recopie pas', () => {
    const m = sansCommentaires(lire('ds/mouvement.ts'));
    for (const j of ['tTap', 'tUi', 'tEnter', 'tScene', 'stagger', 'staggerLine', 'pressScale', 'pressScaleSm', 'ease', 'easeOut']) {
      expect(m, j).toContain(`tokens.light.${j}`);
    }
  });
});

describe('ce que le système s’interdit', () => {
  it('toute animation passe par le pilote natif — donc ni largeur, ni hauteur, ni couleur', () => {
    const fautes: string[] = [];
    for (const f of sources()) {
      const code = sansCommentaires(readFileSync(f, 'utf8'));
      for (const m of code.matchAll(/Animated\.(timing|spring|decay)\([^)]*?\{([^}]*)\}/g)) {
        if (!/useNativeDriver:\s*true/.test(m[2])) fautes.push(`${f.slice(MOBILE.length + 1)} · ${m[0].slice(0, 70)}`);
      }
    }
    expect(fautes, 'animations hors pilote natif').toEqual([]);
  });

  it('l’enfoncement n’est plus un saut : plus aucun `scale: pressed`', () => {
    const fautes = sources().filter((f) => /scale:\s*pressed/.test(sansCommentaires(readFileSync(f, 'utf8'))));
    expect(fautes.map((f) => f.slice(MOBILE.length + 1))).toEqual([]);
  });

  it('« réduire les animations » est lu à UN seul endroit', () => {
    const lecteurs = sources().filter((f) => /isReduceMotionEnabled|reduceMotionChanged/.test(sansCommentaires(readFileSync(f, 'utf8'))));
    expect(lecteurs.map((f) => f.slice(MOBILE.length + 1))).toEqual(['ds/mouvement.ts']);
  });

  it('deux moments scénarisés, pas un troisième', () => {
    const anneaux = sources().filter((f) => /<Anneaux\b/.test(sansCommentaires(readFileSync(f, 'utf8'))));
    expect(anneaux.map((f) => f.slice(MOBILE.length + 1)), 'les anneaux ne servent qu’à l’attente de règlement').toEqual(['app/acces.tsx']);
    const boucles = sources().filter((f) => /Animated\.loop\(/.test(sansCommentaires(readFileSync(f, 'utf8'))));
    /* Deux boucles seulement : la dérive du maillage (ambiance) et les anneaux (moment nº1). */
    expect(boucles.map((f) => f.slice(MOBILE.length + 1)).sort()).toEqual(['ds/Anneaux.tsx', 'ds/Mesh.tsx']);
  });

  it('la dérive du maillage se fige sous « réduire » et sur un appareil modeste', () => {
    expect(sansCommentaires(lire('ds/Mesh.tsx'))).toMatch(/fige=\{reduit \|\| modeste\}/);
  });
});

describe('les endroits où le kit demande du mouvement l’ont', () => {
  it('les titres montent sous masque, ligne par ligne, et ne se tronquent plus', () => {
    const type = sansCommentaires(lire('ds/Type.tsx'));
    expect(type).toMatch(/DUREE\.scene/);
    expect(type).toMatch(/i \* DUREE\.decalageLigne/);
    expect(type).toMatch(/adjustsFontSizeToFit/);
  });

  it('les écrans défilants entrent en cascade, posée une fois dans `Screen`', () => {
    expect(sansCommentaires(lire('ds/Screen.tsx'))).toMatch(/\{enCascade\(children\)\}/);
  });

  it('les onglets changent en fondu, sans translation', () => {
    expect(sansCommentaires(lire('app/(tabs)/_layout.tsx'))).toMatch(/animation: 'fade'/);
  });
});
