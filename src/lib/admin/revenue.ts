import type { Transaction } from '../../types';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * L'AGRÉGATION DU REVENU — logique pure, aucun rendu, aucune lecture.
 *
 * Ce module répond à la seule question qu'aucun écran du produit ne savait poser : combien
 * chaque ligne de business a rapporté sur une période. Il ne classe rien lui-même — la ligne
 * est lue sur la transaction, où le Worker l'a écrite.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/** Les quatre lignes vendues. Miroir d'affichage de `AchatKind`, côté Worker. */
export type LigneBusiness = NonNullable<Transaction['ligne']>;

/** L'ordre d'affichage : du plus structurant au plus accessoire, jamais alphabétique. */
export const LIGNES_BUSINESS: readonly LigneBusiness[] = [
  'formation',
  'club',
  'rysmoSubscription',
  'rysmoPack',
];

export type PeriodeCle = 'mois' | 'trimestre' | 'annee' | 'tout';

export const PERIODES: readonly PeriodeCle[] = ['mois', 'trimestre', 'annee', 'tout'];

const JOURS: Record<Exclude<PeriodeCle, 'tout'>, number> = {
  mois: 30,
  trimestre: 90,
  annee: 365,
};

/**
 * La borne basse d'une période, en ISO 8601 — ou `null` pour « depuis toujours ».
 *
 * ⚠️ LA COMPARAISON EST LEXICOGRAPHIQUE, ET C'EST EXACT. `Transaction.createdAt` est une
 * chaîne ISO 8601 : à fuseau constant, l'ordre des chaînes EST l'ordre des dates. Comparer
 * des chaînes n'est donc pas une approximation qu'on s'autorise, c'est la comparaison juste
 * — et elle évite de construire N objets `Date` pour trier une liste.
 */
export function bornePeriode(cle: PeriodeCle, maintenant: Date): string | null {
  if (cle === 'tout') return null;
  const debut = new Date(maintenant);
  debut.setUTCDate(debut.getUTCDate() - JOURS[cle]);
  return debut.toISOString();
}

export interface RevenuParLigne {
  /** `null` = la transaction est antérieure au marqueur de ligne. Voir le bilan. */
  ligne: LigneBusiness | null;
  /** Encaissé, en francs. Somme des transactions `completed` de la période. */
  brut: number;
  /** Sorti de caisse, daté du jour du REMBOURSEMENT et non de la vente d'origine. */
  rembourse: number;
  net: number;
  /** Ventes encaissées. Sert de dénominateur au panier moyen. */
  ventes: number;
  /** Panier moyen encaissé. `null` à zéro vente — il n'y a pas de moyenne de rien. */
  panierMoyen: number | null;
}

export interface BilanRevenu {
  /** Une entrée par ligne ayant du volume, plus « non réparti » s'il y en a. */
  lignes: RevenuParLigne[];
  brut: number;
  rembourse: number;
  net: number;
  ventes: number;
  /** Toutes les transactions de la période, quel que soit leur statut. */
  tentatives: number;
  echecs: number;
  /** Taux d'échec, en pourcentage entier. `null` à zéro tentative. */
  tauxEchec: number | null;
  panierMoyen: number | null;
  /**
   * Transactions de la période sans champ `ligne`.
   *
   * ⚠️ ELLES SE COMPTENT À PART, ET JAMAIS DANS `formation`. Ce sont les ventes antérieures
   * au marqueur ; les ranger d'office dans la ligne majoritaire donnerait un relevé qui a
   * l'air complet et ne l'est pas. Une absence qui se voit se rattrape — c'est ce que la
   * reprise `backfillLigne` fait — ; une absence rangée par défaut ne se rattrape jamais.
   */
  nonReparties: number;
}

function vide(ligne: LigneBusiness | null): RevenuParLigne {
  return { ligne, brut: 0, rembourse: 0, net: 0, ventes: 0, panierMoyen: null };
}

/** Le panier moyen d'un seau. `null` à zéro vente : on ne divise pas par rien. */
function panier(brut: number, ventes: number): number | null {
  return ventes > 0 ? Math.round(brut / ventes) : null;
}

/**
 * Agrège les transactions d'une période.
 *
 * ── CE QUI COMPTE DANS QUOI ────────────────────────────────────────────────────────────
 *
 * `brut` ne retient que `completed` : c'est la définition de l'encaissement, pas un filtre.
 * `rembourse` vient de `refunded`, et il est daté de SA propre journée — un remboursement
 * de janvier ne se soustrait pas au chiffre de décembre. Le pied de l'écran doit le dire,
 * sinon le net d'une période courte se lit comme un solde comptable, ce qu'il n'est pas.
 *
 * `tentatives` compte TOUT, y compris les paniers abandonnés restés `pending` : c'est le
 * dénominateur du taux d'échec, et un taux dont le dénominateur exclut les abandons ment.
 */
export function agregerRevenu(transactions: Transaction[], depuis: string | null): BilanRevenu {
  const seaux = new Map<LigneBusiness | null, RevenuParLigne>();
  let tentatives = 0;
  let echecs = 0;
  let nonReparties = 0;

  for (const tx of transactions) {
    // `createdAt` peut manquer sur un document ancien : sans date, il n'appartient à aucune
    // période bornée. Il reste compté sur « tout », où il n'y a pas de borne.
    const date = typeof tx.createdAt === 'string' ? tx.createdAt : '';
    if (depuis !== null && (date === '' || date < depuis)) continue;

    tentatives += 1;
    if (tx.status === 'failed') echecs += 1;

    const ligne = tx.ligne ?? null;
    if (ligne === null) nonReparties += 1;

    const seau = seaux.get(ligne) ?? vide(ligne);
    const montant = typeof tx.amount === 'number' ? tx.amount : 0;

    if (tx.status === 'completed') {
      seau.brut += montant;
      seau.ventes += 1;
    } else if (tx.status === 'refunded') {
      seau.rembourse += montant;
    }
    seaux.set(ligne, seau);
  }

  /*
   * L'ordre d'affichage est celui de `LIGNES_BUSINESS`, et « non réparti » ferme la marche.
   * Une ligne sans aucune transaction sur la période n'apparaît pas : « zéro n'est pas une
   * tâche », et une colonne vide n'apprend rien.
   */
  const lignes: RevenuParLigne[] = [];
  for (const ligne of LIGNES_BUSINESS) {
    const seau = seaux.get(ligne);
    if (seau) lignes.push({ ...seau, net: seau.brut - seau.rembourse, panierMoyen: panier(seau.brut, seau.ventes) });
  }
  const orphelines = seaux.get(null);
  if (orphelines) {
    lignes.push({
      ...orphelines,
      net: orphelines.brut - orphelines.rembourse,
      panierMoyen: panier(orphelines.brut, orphelines.ventes),
    });
  }

  const brut = lignes.reduce((s, l) => s + l.brut, 0);
  const rembourse = lignes.reduce((s, l) => s + l.rembourse, 0);
  const ventes = lignes.reduce((s, l) => s + l.ventes, 0);

  return {
    lignes,
    brut,
    rembourse,
    net: brut - rembourse,
    ventes,
    tentatives,
    echecs,
    /*
     * ⚠️ LE TAUX PORTE SON DÉNOMINATEUR, ET N'EXISTE PAS SANS LUI. À zéro tentative, « 0 % »
     * affirmerait qu'aucun paiement n'a échoué — alors qu'aucun n'a été tenté. `null` fait
     * rendre « non relevé » par `<Num>`, qui est la seule chose vraie. Même patron que
     * `AdminTransactions`.
     */
    tauxEchec: tentatives > 0 ? Math.round((echecs / tentatives) * 100) : null,
    panierMoyen: panier(brut, ventes),
    nonReparties,
  };
}
