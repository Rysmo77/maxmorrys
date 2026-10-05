/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LA FILE D'ENVOI — LE CŒUR, SANS RÉSEAU NI STOCKAGE (pur, donc éprouvé par
 * `tests/unit/mobile-hors-ligne.test.ts`).
 *
 * Le kit : « LA FILE D'ENVOI DEVIENT UN OBJET PERMANENT, au lieu d'un rattrapage. Ce qui a
 * été fait hors réseau est LISTÉ, avec son heure, et il part au retour du réseau sans rien
 * demander. »
 *
 * TROIS RÈGLES, ET CHACUNE ÉVITE UN DÉGÂT PRÉCIS :
 *
 * 1 · LES GESTES SUR UNE MÊME LEÇON FUSIONNENT. Cocher puis décocher hors ligne ne doit pas
 *     rejouer deux allers-retours : seul le DERNIER état part. `marquerLecon` POSE un état,
 *     il ne le bascule pas — le rejouer est sûr, le rejouer dans le désordre ne l'est pas.
 * 2 · LA FILE S'ARRÊTE AU PREMIER ÉCHEC DE TRANSPORT. Envoyer la suite quand la tête n'est
 *     pas partie changerait l'ordre des gestes ; le réseau qui vient de lâcher lâchera aussi
 *     pour la suivante.
 * 3 · UN REFUS DU SERVEUR N'EST PAS UNE PANNE. Une leçon retirée de la formation, une
 *     inscription disparue : le geste ne passera jamais. On l'ÉCARTE de la file — sinon il la
 *     bloquerait pour toujours — mais on le GARDE, avec son motif, pour le dire à l'écran.
 *     Une progression qui disparaît sans un mot est la façon la plus sûre de perdre quelqu'un.
 *
 * Les notes portent un `idClient` : le serveur en fait l'identifiant du document, donc une
 * note dont la première tentative a ARRIVÉ sans que la réponse revienne ne se duplique pas.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

export type Operation =
  | { type: 'marquerLecon'; params: { formationId: string; leconId: string; faite: boolean } }
  | { type: 'ecrireUneNote'; params: { texte: string; lessonId?: string; lessonLabel?: string; idClient: string } };

export interface EnFile {
  id: string;
  /** Ce que l'écran affiche : « Leçon 4 · terminée », « Note · Les mots clés ». */
  titre: string;
  /** ISO, heure de l'APPAREIL — c'est l'heure du geste, pas une donnée serveur. */
  faitLe: string;
  operation: Operation;
}

export interface Ecartee extends EnFile {
  motif: string;
}

/** La clé de fusion : deux gestes sur la même leçon n'en font qu'un. Une note est unique. */
function cleDeFusion(op: Operation): string {
  return op.type === 'marquerLecon'
    ? `lecon:${op.params.formationId}:${op.params.leconId}`
    : `note:${op.params.idClient}`;
}

/** Ajoute un geste ; un geste plus ancien sur la même leçon est REMPLACÉ, à sa place. */
export function ajouter(file: readonly EnFile[], entree: EnFile): EnFile[] {
  const cle = cleDeFusion(entree.operation);
  const i = file.findIndex((e) => cleDeFusion(e.operation) === cle);
  if (i < 0) return [...file, entree];
  /* Le geste garde la PLACE du premier (l'ordre des leçons touchées), et l'état du dernier. */
  const copie = [...file];
  copie[i] = { ...entree, id: file[i].id };
  return copie;
}

export type Issue = 'envoye' | 'transport' | { refus: string };

export interface Bilan {
  restantes: EnFile[];
  envoyees: EnFile[];
  ecartees: Ecartee[];
}

/** Vide la file dans l'ordre. `envoyer` dit ce qui s'est passé pour UN geste ; il ne jette pas. */
export async function vider(file: readonly EnFile[], envoyer: (e: EnFile) => Promise<Issue>): Promise<Bilan> {
  const envoyees: EnFile[] = [];
  const ecartees: Ecartee[] = [];
  for (let i = 0; i < file.length; i += 1) {
    const e = file[i];
    const issue = await envoyer(e);
    if (issue === 'transport') return { restantes: file.slice(i), envoyees, ecartees };
    if (issue === 'envoye') envoyees.push(e);
    else ecartees.push({ ...e, motif: issue.refus });
  }
  return { restantes: [], envoyees, ecartees };
}

/** Un identifiant v4. Hermes n'a pas `crypto.randomUUID` ; l'unicité suffit à l'idempotence. */
export function identifiant(aleatoire: () => number = Math.random): string {
  const h = (n: number) => Array.from({ length: n }, () => Math.floor(aleatoire() * 16).toString(16)).join('');
  const variante = (8 + Math.floor(aleatoire() * 4)).toString(16);
  return `${h(8)}-${h(4)}-4${h(3)}-${variante}${h(3)}-${h(12)}`;
}
