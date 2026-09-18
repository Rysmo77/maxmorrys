import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 * DEUX PAGES NE RACONTENT PAS LA MÊME CHOSE.
 *
 * Ce dépôt sait vérifier beaucoup : ses jetons (`ds:check`), ses miroirs SEO (`seo:check`),
 * ses cartes de partage (`og:check`), une phrase contre la donnée qu'elle décrit
 * (`proof:check`). Aucune de ces portes ne regarde si la MÊME PHRASE est servie deux fois,
 * sur deux pages, à un visiteur qui les lit à la suite.
 *
 * Le 17/09/2026, sept lots de refonte ont été menés en parallèle sur des périmètres étanches.
 * Chacun a résolu son problème correctement. Personne n'a lu les cinq pages d'affilée. Ce que
 * la relecture a trouvé, et que ce test aurait trouvé tout seul :
 *
 *   • l'accueil et À propos décrivaient les deux pistes avec 28 mots identiques ;
 *   • `conception:levels.custom.body` et `conception:custom.lede` étaient la même phrase,
 *     rendue sur deux pages de la même piste ;
 *   • `conception:work.categories.*` et `realisations:categories.*` portaient les sept mêmes
 *     paires clé/valeur, à l'octet près ;
 *   • « Voir toutes les réalisations » existait deux fois, « sous deux jours ouvrés » trois
 *     fois dans un même entonnoir.
 *
 * ── CE QU'IL NE CHERCHE PAS ────────────────────────────────────────────────────────────────
 * Les chaînes COURTES. Un libellé de bouton, un sourcil, un intitulé de champ ont le droit de
 * se répéter — c'est même ce qu'on veut : `common:cta.*` existe pour ça. Le seuil est posé à
 * 60 caractères, au-dessus duquel une chaîne n'est plus un libellé mais une PHRASE, c'est-à-dire
 * un argument. Deux pages qui servent le même argument se volent leur raison d'être.
 *
 * ── LES EXEMPTIONS SE NOMMENT UNE PAR UNE ──────────────────────────────────────────────────
 * Jamais une famille, jamais un dossier. Une règle qui crie au loup finit ignorée, et ça coûte
 * plus cher que de ne pas l'avoir — mais une exemption large la vide de son sens en silence.
 * Chaque entrée porte sa raison. Quand elle disparaît, l'exemption disparaît avec elle.
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 */

const FR = 'src/i18n/locales/fr';

/** Au-dessus, une chaîne n'est plus un libellé : c'est un argument. */
const SEUIL = 60;

/**
 * Les catalogues des surfaces d'ADMINISTRATION et des documents LÉGAUX sont hors périmètre.
 *
 * La console est lue par une seule personne, qui n'y cherche pas une promesse ; et un document
 * contractuel répète ses formules par nécessité juridique — c'est même ce qui le rend opposable.
 */
const HORS_PERIMETRE = new Set(['admin.json', 'adminClub.json', 'legal.json']);

/**
 * Exemptions nommées, ancrées sur les CHEMINS DE CLÉS et non sur la valeur.
 *
 * Une exemption qui cite la phrase se périme au premier mot changé, et se rouvre alors en
 * silence — exactement le mode d'échec que ce fichier existe pour fermer. Un couple de clés,
 * lui, survit à la réécriture de ce qu'il porte.
 *
 * Chaque entrée dit POURQUOI ces deux emplacements ont le droit de coïncider. Quand la raison
 * disparaît, l'exemption part avec elle.
 */
const EXEMPTIONS: readonly (readonly [string[], string])[] = [
  [
    ['club.json:publicPage.seoDescription', 'club.json:publicPage.lede'],
    "La description servie aux moteurs EST la première phrase que le visiteur lira en " +
      "arrivant. Les faire diverger ferait promettre au résultat de recherche autre chose " +
      "que ce que la page ouvre.",
  ],
  [
    ['lms.json:checkout.successText', 'lms.json:paymentReturn.confirmedText'],
    "Les deux chemins d'arrivée d'un MÊME événement — paiement confirmé sur place, ou retour " +
      "depuis la page du prestataire. Personne ne voit les deux : les faire diverger donnerait " +
      "deux récits d'un seul achat selon la route empruntée.",
  ],
];

/** Un groupe de doublons est-il exempté ? Oui si ses emplacements sont exactement une entrée. */
function exempte(emplacements: string[]): boolean {
  const vu = [...emplacements].sort().join('|');
  return EXEMPTIONS.some(([cles]) => [...cles].sort().join('|') === vu);
}

interface Chaine { fichier: string; chemin: string; valeur: string }

function parcourir(node: unknown, chemin: string, fichier: string, out: Chaine[]): void {
  if (typeof node === 'string') {
    if (node.trim().length >= SEUIL) out.push({ fichier, chemin, valeur: node.trim() });
  } else if (Array.isArray(node)) {
    node.forEach((v, i) => parcourir(v, `${chemin}[${i}]`, fichier, out));
  } else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) parcourir(v, chemin ? `${chemin}.${k}` : k, fichier, out);
  }
}

function toutesLesChaines(): Chaine[] {
  const out: Chaine[] = [];
  for (const f of readdirSync(FR).filter((n) => n.endsWith('.json') && !HORS_PERIMETRE.has(n))) {
    parcourir(JSON.parse(readFileSync(join(FR, f), 'utf8')), '', f, out);
  }
  return out;
}

describe('la copie ne se répète pas d’une page à l’autre', () => {
  const chaines = toutesLesChaines();

  it('le balayage voit bien quelque chose', () => {
    // Garde-fou du test : un chemin cassé le rendrait vert sans rien avoir lu.
    expect(chaines.length).toBeGreaterThan(200);
  });

  it('aucune phrase n’est servie à deux endroits', () => {
    const par = new Map<string, Chaine[]>();
    for (const c of chaines) {
      const liste = par.get(c.valeur) ?? [];
      liste.push(c);
      par.set(c.valeur, liste);
    }

    const doublons = [...par.values()]
      .filter((l) => l.length > 1)
      .filter((l) => !exempte(l.map((c) => `${c.fichier}:${c.chemin}`)))
      .map((l) => `  « ${l[0].valeur.slice(0, 90)}${l[0].valeur.length > 90 ? '…' : ''} »\n` +
        l.map((c) => `      ${c.fichier} → ${c.chemin}`).join('\n'));

    expect(
      doublons,
      `${doublons.length} phrase(s) écrite(s) plus d'une fois :\n${doublons.join('\n')}\n\n` +
      'Soit la phrase appartient à UNE page et les autres la citent à tort, soit elle est ' +
      'partagée et doit vivre dans `shared`/`common` — pas recopiée. Une exemption se nomme ' +
      'en tête de ce fichier, avec sa raison.',
    ).toEqual([]);
  });
});
