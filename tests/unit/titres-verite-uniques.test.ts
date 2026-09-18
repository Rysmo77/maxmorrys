import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * LE PANNEAU DE VÉRITÉ EST LA SIGNATURE DE LA MARQUE. RÉPÉTÉ PARTOUT, IL NE SIGNALE PLUS RIEN.
 *
 * Relevé le 18/09/2026 : **22 panneaux de vérité** sur les seules pages publiques, dont quatre
 * portaient EXACTEMENT le même titre. « Ce que je peux te prouver » vivait dans quatre
 * catalogues, « Ce que je n'affiche pas » dans quatre autres emplacements.
 *
 * Le dispositif vaut par sa rareté et par sa précision : il annonce ce qu'une page peut
 * démontrer et ce qu'elle refuse d'affirmer. Un titre générique répété de page en page le
 * transforme en ornement — le lecteur cesse de le lire au troisième.
 *
 * Ce test ne compte pas les panneaux ; il garde que chacun **nomme son objet**. Un titre qui
 * ne pourrait pas être recopié ailleurs est un titre qui dit de quoi il parle.
 */

const FR = 'src/i18n/locales/fr';

/** Les surfaces d'administration sont hors périmètre : un opérateur n'y cherche pas une promesse. */
const HORS_PERIMETRE = new Set(['admin.json', 'adminClub.json']);

/** Les clés qui portent un titre de panneau de vérité. */
const MOTIF = /(^|\.)(truthTitle|provenTitle|withheldTitle|truthProvenTitle|truthWithheldTitle)$/;

interface Titre { fichier: string; chemin: string; valeur: string }

function parcourir(node: unknown, chemin: string, fichier: string, out: Titre[]): void {
  if (typeof node === 'string') {
    if (MOTIF.test(chemin)) out.push({ fichier, chemin, valeur: node.trim() });
  } else if (node && typeof node === 'object' && !Array.isArray(node)) {
    for (const [k, v] of Object.entries(node)) parcourir(v, chemin ? `${chemin}.${k}` : k, fichier, out);
  }
}

describe('les titres de panneau de vérité nomment chacun leur objet', () => {
  const titres: Titre[] = [];
  for (const f of readdirSync(FR).filter((n) => n.endsWith('.json') && !HORS_PERIMETRE.has(n))) {
    parcourir(JSON.parse(readFileSync(join(FR, f), 'utf8')), '', f, titres);
  }

  it('le balayage trouve bien des panneaux', () => {
    // Garde-fou : un motif qui ne matche plus rendrait ce test vert sans rien avoir lu.
    expect(titres.length).toBeGreaterThan(8);
  });

  it('aucun titre n’est servi sur deux surfaces', () => {
    const par = new Map<string, Titre[]>();
    for (const t of titres) {
      const l = par.get(t.valeur) ?? [];
      l.push(t);
      par.set(t.valeur, l);
    }
    const doublons = [...par.values()]
      .filter((l) => l.length > 1)
      .map((l) => `  « ${l[0].valeur} »\n` + l.map((t) => `      ${t.fichier} → ${t.chemin}`).join('\n'));

    expect(
      doublons,
      `${doublons.length} titre(s) de vérité répété(s) :\n${doublons.join('\n')}\n\n` +
      "Un panneau de vérité dit ce que CETTE page peut prouver. Un titre qui conviendrait " +
      'ailleurs ne nomme pas son objet.',
    ).toEqual([]);
  });
});
