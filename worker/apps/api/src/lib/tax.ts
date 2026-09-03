/**
 * LA FISCALITÉ INDIRECTE — miroir de `src/lib/tax/senegal.ts`.
 *
 * ⚠️ CE FICHIER EST UN MIROIR. La source de vérité est `src/lib/tax/senegal.ts`, et
 * `tests/unit/tax-sync.test.ts` échoue si les deux divergent. Le dépôt tient déjà deux
 * tables de la même façon — voir `tests/unit/segments-sync.test.ts` pour les segments
 * d'URL, dupliqués entre le site et le Worker de bord.
 *
 * La duplication n'est pas un oubli : le Worker et le site sont deux paquets npm distincts,
 * et le site ne sait pas importer depuis `worker/`. Le choix est donc entre une copie gardée
 * par un test, et une copie non gardée. Le test est la seule différence qui compte.
 *
 * Tout le raisonnement — pourquoi trois états et pas deux, pourquoi `exonere` est une
 * affirmation et `indetermine` un silence — vit dans l'original. Ne pas le paraphraser ici :
 * deux rédactions du même raisonnement, c'est une occasion de les faire diverger.
 */

/** Taux normal de TVA au Sénégal. Directive UEMOA n°02/98/CM, CGI Livre II. */
export const TVA_TAUX_NORMAL = 0.18;

export type EtatFiscal = 'taxable' | 'exonere' | 'indetermine';

export interface Regime {
  etat: EtatFiscal;
  taux: number;
}

export type FamilleFiscale = 'agence' | 'formation' | 'club' | 'rysmo';

/** Miroir de `REGIME` dans `src/lib/tax/senegal.ts`. Voir l'original pour le motif de
 *  chaque état — notamment pourquoi `rysmo` reste indéterminée. */
export const REGIME: Record<FamilleFiscale, Regime> = {
  agence: { etat: 'taxable', taux: TVA_TAUX_NORMAL },
  formation: { etat: 'exonere', taux: 0 },
  club: { etat: 'exonere', taux: 0 },
  rysmo: { etat: 'indetermine', taux: 0 },
};

export interface Ventilation {
  ht: number;
  tva: number;
  ttc: number;
  taux: number;
  etat: EtatFiscal;
}

/** XOF est à zéro décimale : l'arrondi porte sur la taxe, le TTC est reconstruit par
 *  addition, pour que `ht + tva === ttc` soit toujours vrai. */
export function ventilerDepuisHT(ht: number, regime: Regime): Ventilation {
  const base = Math.round(ht);
  if (regime.etat !== 'taxable' || regime.taux === 0) {
    return { ht: base, tva: 0, ttc: base, taux: 0, etat: regime.etat };
  }
  const tva = Math.round(base * regime.taux);
  return { ht: base, tva, ttc: base + tva, taux: regime.taux, etat: regime.etat };
}

/**
 * Ventilation d'un montant DÉJÀ TTC.
 *
 * `amount` est ce que l'opérateur a débité : TTC par construction, des deux côtés du
 * changement de l'article 5.1. Ajouter la taxe par-dessus la compterait deux fois, et la
 * facture annoncerait plus que le relevé bancaire du client.
 */
export function ventilerDepuisTTC(ttc: number, regime: Regime): Ventilation {
  const total = Math.round(ttc);
  if (regime.etat !== 'taxable' || regime.taux === 0) {
    return { ht: total, tva: 0, ttc: total, taux: 0, etat: regime.etat };
  }
  const ht = Math.round(total / (1 + regime.taux));
  return { ht, tva: total - ht, ttc: total, taux: regime.taux, etat: regime.etat };
}

export function regimeDe(famille: FamilleFiscale): Regime {
  return REGIME[famille];
}

export function tauxEnPourcent(taux: number): number {
  return Math.round(taux * 1000) / 10;
}

/** Vrai pour `taxable` (le montant) et `exonere` (le motif). Faux pour `indetermine` :
 *  ne rien écrire est le seul comportement sûr tant qu'on ne sait pas. */
export function doitMentionnerLaTaxe(etat: EtatFiscal): boolean {
  return etat === 'taxable' || etat === 'exonere';
}
