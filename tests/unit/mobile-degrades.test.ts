import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { tokens } from '../../mobile/ds/tokens.generated';
import { analyserDegrade, ligneDeDegrade } from '../../mobile/ds/degrade';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE MODE SOMBRE N'EST PAS UN FILTRE — ET UN DÉGRADÉ N'EST PAS UNE COULEUR.
 *
 * Le port relisait les teintes d'un dégradé par leur jeton d'origine. Or les `action*`
 * sont FIXES dans les deux modes quand `mmBleu` bascule, et les `arc*` CHANGENT en
 * sombre : la reconstruction était fausse dans les deux sens, sans aucun signal.
 * Trouvé par la réécriture Kotlin (abandonnée), reporté ici.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const RACINE = resolve(__dirname, '../..');
type Table = Record<string, string>;
const clair = tokens.light as unknown as Table;
const sombre = tokens.dark as unknown as Table;
const degrades = Object.keys(clair).filter((k) => clair[k].startsWith('linear-gradient'));

describe('les dégradés du système sont lus dans leur chaîne, mode par mode', () => {
  it('la porte regarde vraiment quelque chose', () => {
    expect(degrades.length).toBeGreaterThanOrEqual(10);
  });

  it('les deux tables de chaque dégradé s’analysent sans exception', () => {
    for (const k of degrades) {
      for (const table of [clair, sombre]) {
        const d = analyserDegrade(table[k]);
        expect(d.colors.length, k).toBeGreaterThanOrEqual(2);
        expect(d.offsets.length, k).toBe(d.colors.length);
      }
    }
  });

  it('l’arc sombre n’est pas l’arc clair', () => {
    expect(analyserDegrade(sombre.arc).colors[0]).not.toBe(analyserDegrade(clair.arc).colors[0]);
  });

  it('les dégradés d’action ne sont pas reconstruits par leurs teintes', () => {
    /* `mmBleu` sombre (#6FB1FF) n'est PAS le premier arrêt de `actionForme` sombre. */
    expect(analyserDegrade(sombre.actionForme).colors[0]).not.toBe(sombre.mmBleu);
    const src = readFileSync(resolve(RACINE, 'mobile/ds/Gradient.tsx'), 'utf8');
    const corps = src.slice(src.indexOf('export function useActionGradient'));
    for (const n of ['actionForme', 'actionInforme', 'actionTransforme', 'actionDigitalise']) {
      expect(corps, `useActionGradient ne lit pas ${n}`).toContain(`'${n}'`);
    }
  });

  it('une valeur non reconnue arrête au lieu de retomber en silence', () => {
    expect(() => analyserDegrade('radial-gradient(#fff,#000)')).toThrow();
    expect(() => analyserDegrade('linear-gradient(90deg,#fff)')).toThrow();
  });
});

describe('l’angle CSS est converti pour la boîte réelle', () => {
  it('90deg traverse de gauche à droite, quelle que soit la hauteur', () => {
    const v = ligneDeDegrade(90, 300, 40);
    expect(v.x1).toBeCloseTo(0); expect(v.x2).toBeCloseTo(300);
    expect(v.y1).toBeCloseTo(20); expect(v.y2).toBeCloseTo(20);
  });

  it('135deg touche les deux coins d’une boîte allongée, comme le CSS', () => {
    /* La ligne CSS passe par le centre et ses extrémités sont les projections des coins :
       le coin haut-gauche doit tomber à la position 0, le bas-droite à la position 1. */
    const [w, h] = [320, 48];
    const v = ligneDeDegrade(135, w, h);
    const position = (x: number, y: number) => {
      const lx = v.x2 - v.x1; const ly = v.y2 - v.y1;
      return ((x - v.x1) * lx + (y - v.y1) * ly) / (lx * lx + ly * ly);
    };
    expect(position(0, 0)).toBeCloseTo(0);
    expect(position(w, h)).toBeCloseTo(1);
  });
});
