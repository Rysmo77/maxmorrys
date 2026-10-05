/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LES LEÇONS GARDÉES SUR LE TÉLÉPHONE — LA RÈGLE DU PLAFOND, PURE.
 *
 * Le kit : « LE PLAFOND EST AUTO-IMPOSÉ, et l'application dit ce qu'elle supprime en premier
 * quand elle l'atteint. Une application qui grossit en silence finit désinstallée pour ça. »
 *
 * Ce qui part en premier : la leçon gardée depuis le plus longtemps. Une leçon qu'on vient de
 * garder ne part jamais — sinon garder ne garderait rien.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

export interface Gardee {
  cle: string;
  formationId: string;
  leconId: string;
  titre: string;
  moduleTitre: string | null;
  /** Le poids RÉEL de ce qui est écrit sur l'appareil, en octets. Mesuré, jamais estimé. */
  octets: number;
  /** ISO, heure de l'appareil. */
  gardeeLe: string;
  /** Vrai si la leçon a une vidéo : elle ne se garde pas, et l'écran doit le dire. */
  videoEnLigne: boolean;
}

/** 5 Mo : de l'ordre de deux cents leçons de texte. Le plafond est écrit, pas deviné. */
export const PLAFOND_OCTETS = 5 * 1024 * 1024;

export const cleDeLecon = (formationId: string, leconId: string) => `${formationId}/${leconId}`;

/** Les octets d'une chaîne en UTF-8 — c'est ce que le stockage écrit réellement. */
export function octetsUtf8(texte: string): number {
  let n = 0;
  for (const c of texte) {
    const p = c.codePointAt(0) ?? 0;
    n += p < 0x80 ? 1 : p < 0x800 ? 2 : p < 0x10000 ? 3 : 4;
  }
  return n;
}

/**
 * Ajoute (ou remplace) une leçon, puis retire les plus anciennes jusqu'à tenir sous le
 * plafond. Rend ce qui est gardé ET ce qui a été évincé — l'écran nomme ce qui est parti.
 */
export function garder(index: readonly Gardee[], nouvelle: Gardee, plafond = PLAFOND_OCTETS): { index: Gardee[]; evincees: Gardee[] } {
  const reste = index.filter((g) => g.cle !== nouvelle.cle);
  const anciennes = [...reste].sort((a, b) => a.gardeeLe.localeCompare(b.gardeeLe));
  const evincees: Gardee[] = [];
  let total = anciennes.reduce((n, g) => n + g.octets, 0) + nouvelle.octets;
  while (total > plafond && anciennes.length > 0) {
    const sortie = anciennes.shift() as Gardee;
    evincees.push(sortie);
    total -= sortie.octets;
  }
  return { index: [...anciennes, nouvelle], evincees };
}

export const totalOctets = (index: readonly Gardee[]) => index.reduce((n, g) => n + g.octets, 0);

/** « 12 Ko », « 1,4 Mo » — le poids en clair, pour quelqu'un qui arbitre son forfait. */
export function poids(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
}
