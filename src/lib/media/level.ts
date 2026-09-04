/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CE QUE LE MICRO ENTEND, MESURÉ — JAMAIS SIMULÉ.
 *
 * L'enveloppe affichée pendant un enregistrement audio n'est pas une décoration : c'est la
 * seule preuve, AVANT le téléversement, que l'entrée choisie capte quelque chose. Micro
 * coupé, mauvaise entrée, casque débranché se découvraient jusqu'ici à la relecture — donc
 * après avoir parlé deux minutes.
 *
 * D'où l'extraction : une barre qui bouge sans écouter serait pire que pas de barre, et
 * c'est précisément le genre d'erreur qui ne se voit pas à l'écran. Un décalage de centre,
 * un signe inversé ou une division manquante rendent une barre PLATE ou SATURÉE — deux
 * images plausibles, toutes deux fausses. Ici, elles échouent.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Gain appliqué au RMS avant affichage.
 *
 * `getByteTimeDomainData` rend une voix de conversation autour de 0,1 en RMS normalisé :
 * sans remontée, l'enveloppe resterait collée au plancher et ne dirait rien. 3 place une
 * voix normale au tiers de la hauteur et laisse la marge pour un éclat.
 */
const GAIN = 3;

/**
 * Niveau sonore d'une trame temporelle, de 0 à 1.
 *
 * `AnalyserNode.getByteTimeDomainData` rend des octets **centrés sur 128** : 128 est le
 * silence, 0 et 255 les extrêmes de l'amplitude. On recentre, on normalise, puis on prend la
 * moyenne quadratique — la moyenne simple d'une onde vaut zéro, positif et négatif
 * s'annulant, et rendrait le silence pour n'importe quel son.
 */
export function rmsFromTimeDomain(frame: Uint8Array, gain = GAIN): number {
  if (frame.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < frame.length; i++) {
    const v = (frame[i] - 128) / 128;
    sum += v * v;
  }
  return Math.min(1, Math.sqrt(sum / frame.length) * gain);
}
