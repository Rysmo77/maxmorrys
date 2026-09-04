import { describe, expect, it } from 'vitest';

import { rmsFromTimeDomain } from '../../src/lib/media/level';

/**
 * UNE BARRE QUI BOUGE SANS ÉCOUTER SERAIT PIRE QUE PAS DE BARRE.
 *
 * L'enveloppe sonore est la seule preuve, AVANT le téléversement, que le micro capte quelque
 * chose. Ses modes de panne sont muets : un centre mal placé, un signe perdu ou une division
 * oubliée rendent une barre PLATE ou SATURÉE — deux images parfaitement plausibles à l'écran,
 * toutes deux fausses, et qu'on ne démentirait qu'après avoir parlé deux minutes pour rien.
 *
 * D'où ces cas : le silence, le son, la saturation, et la moyenne quadratique elle-même.
 */

/** Trame de silence : `getByteTimeDomainData` centre sur 128, pas sur 0. */
const silence = (n = 1024) => new Uint8Array(n).fill(128);

/** Onde carrée d'amplitude `amp` (en octets autour de 128). */
function square(amp: number, n = 1024): Uint8Array {
  const frame = new Uint8Array(n);
  for (let i = 0; i < n; i++) frame[i] = 128 + (i % 2 === 0 ? amp : -amp);
  return frame;
}

describe('le silence est zéro, et rien d’autre ne l’est', () => {
  it('une trame pleine de 128 rend exactement 0', () => {
    // Le piège central : 128 est le silence. Traiter l'octet brut rendrait un niveau
    // maximal en permanence — une barre saturée qui ne dit plus rien.
    expect(rmsFromTimeDomain(silence())).toBe(0);
  });

  it('une trame vide rend 0 sans diviser par zéro', () => {
    expect(rmsFromTimeDomain(new Uint8Array(0))).toBe(0);
  });

  it('le moindre son sort du plancher', () => {
    expect(rmsFromTimeDomain(square(4))).toBeGreaterThan(0);
  });
});

describe('le signe ne doit pas s’annuler', () => {
  it('une onde symétrique ne rend PAS zéro', () => {
    /*
     * Le défaut que ce cas interdit : une moyenne SIMPLE vaut zéro sur toute onde
     * symétrique — positif et négatif s'annulent — donc le silence s'afficherait pour
     * n'importe quel son. C'est la raison d'être de la moyenne quadratique.
     */
    expect(rmsFromTimeDomain(square(40))).toBeGreaterThan(0.2);
  });

  it('une déviation vers le bas compte autant qu’une vers le haut', () => {
    const haut = new Uint8Array(512).fill(128 + 30);
    const bas = new Uint8Array(512).fill(128 - 30);
    expect(rmsFromTimeDomain(haut)).toBeCloseTo(rmsFromTimeDomain(bas), 10);
  });
});

describe('l’échelle reste dans ses bornes', () => {
  it('ne dépasse jamais 1, même à saturation', () => {
    expect(rmsFromTimeDomain(square(127))).toBeLessThanOrEqual(1);
    expect(rmsFromTimeDomain(new Uint8Array(256).fill(255))).toBeLessThanOrEqual(1);
  });

  it('plus fort rend plus haut', () => {
    // Sans gain, pour comparer la mesure elle-même et non son plafonnement.
    const faible = rmsFromTimeDomain(square(10), 1);
    const fort = rmsFromTimeDomain(square(60), 1);
    expect(fort).toBeGreaterThan(faible);
  });

  it('la mesure est la vraie RMS : une amplitude constante rend son amplitude', () => {
    // 64 octets d'écart sur une échelle de 128 = 0,5 en amplitude normalisée.
    expect(rmsFromTimeDomain(square(64), 1)).toBeCloseTo(0.5, 6);
  });

  it('une voix de conversation occupe une part visible de la hauteur', () => {
    // ~0,1 en RMS normalisé, remonté par le gain : ni collé au plancher, ni saturé.
    const voix = rmsFromTimeDomain(square(13));
    expect(voix).toBeGreaterThan(0.15);
    expect(voix).toBeLessThan(0.6);
  });
});
