/**
 * Les dégradés du système, en données pures — AUCUNE dépendance (ni React, ni React Native),
 * pour que `tests/unit/mobile-degrades.test.ts` les importe et les éprouve sur les vrais jetons.
 */

/** Un `linear-gradient(...)` du système, analysé. */
export interface Degrade {
  angle: number;
  colors: readonly string[];
  /** Positions en fraction (0–1), une par couleur. */
  offsets: readonly number[];
}

/**
 * `linear-gradient(96deg,#0057BC 0%,#6C23DD 25%,…)` → angle, couleurs, positions.
 *
 * ⛔ C'EST LE PARSEUR QUI MANQUAIT, ET SON ABSENCE MENTAIT EN MODE SOMBRE. Le port relisait les
 * teintes d'un dégradé par leur jeton d'origine (`mmBleu`, `mmViolet`…). Or les deux familles
 * ne basculent pas pareil : les quatre `action*` sont FIXES dans les deux modes, quand `mmBleu`
 * passe de #0057BC à #6FB1FF — les boutons de marque prenaient donc des teintes claires sous un
 * texte blanc ; et les six `arc*` CHANGENT en sombre. Seule la chaîne du mode actif dit vrai.
 *
 * Une valeur non reconnue LÈVE : un dégradé qui retomberait en silence sur une couleur par
 * défaut est exactement la panne qu'on corrige.
 */
export function analyserDegrade(css: string): Degrade {
  const m = /^linear-gradient\(\s*(-?[\d.]+)deg\s*,(.+)\)$/i.exec(css.trim());
  if (!m) throw new Error(`Dégradé non reconnu : ${css}`);
  const arrets = m[2].split(/,(?![^(]*\))/).map((a) => a.trim());
  if (arrets.length < 2) throw new Error(`Dégradé à moins de deux arrêts : ${css}`);
  const colors: string[] = [];
  const offsets: number[] = [];
  arrets.forEach((a, i) => {
    const am = /^(#[0-9a-f]{3,8}|rgba?\([^)]*\))(?:\s+(-?[\d.]+)%)?$/i.exec(a);
    if (!am) throw new Error(`Arrêt de dégradé non reconnu : « ${a} » dans ${css}`);
    colors.push(am[1]);
    offsets.push(am[2] !== undefined ? Number(am[2]) / 100 : i / (arrets.length - 1));
  });
  return { angle: Number(m[1]), colors, offsets };
}

/**
 * La ligne de dégradé du CSS, en pixels, pour une boîte W×H.
 *
 * CSS mesure l'angle depuis le HAUT, sens horaire ; l'axe Y de l'écran descend. La direction
 * vaut donc (sin A, −cos A), et la longueur de la ligne |W·sin A| + |H·cos A| — c'est elle qui
 * fait toucher les coins. ⚠️ L'ancienne formule normalisait par max(|x|,|y|) dans le repère de
 * la boîte : juste pour un carré, fausse dès que la boîte s'allonge (un bouton, une bannière).
 */
export function ligneDeDegrade(angle: number, w: number, h: number) {
  const rad = (angle * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  const demi = (Math.abs(w * dx) + Math.abs(h * dy)) / 2;
  return {
    x1: w / 2 - dx * demi, y1: h / 2 - dy * demi,
    x2: w / 2 + dx * demi, y2: h / 2 + dy * demi,
  };
}
