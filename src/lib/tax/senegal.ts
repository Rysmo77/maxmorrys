/**
 * LA FISCALITÉ INDIRECTE SÉNÉGALAISE — taux, régimes et ventilation.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CE QUI EST TRANCHÉ, ET PAR QUI
 *
 * Décisions de la direction, 03/09/2026 :
 *
 *   · MY ONOMA SARL est ASSUJETTIE à la TVA (régime réel). Toute opération taxable
 *     doit donc porter la taxe, et toute opération exonérée doit dire pourquoi.
 *   · Les prestations d'ENSEIGNEMENT bénéficient de l'exonération « éducation » du
 *     Code Général des Impôts.
 *
 * Ce qui reste ouvert est nommé plus bas, sur la famille concernée.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * TROIS ÉTATS, ET PAS DEUX — C'EST TOUT LE MODÈLE
 *
 * `taxable`      — la taxe est due, au taux porté par le régime.
 * `exonere`      — la taxe n'est PAS due, et on sait pourquoi. C'est une AFFIRMATION,
 *                  et une facture exonérée doit la porter : une facture sans TVA et
 *                  sans motif est incomplète aux yeux d'un comptable.
 * `indetermine`  — on ne sait pas encore. Aucune taxe, et surtout AUCUNE mention.
 *
 * Confondre les deux derniers est la faute qui coûte. `invoice.ts` porte la trace d'une
 * erreur réelle — « TVA non applicable, article 293 B » y avait été écrit, qui est du
 * code FRANÇAIS. Sur une facture, une référence fiscale inventée n'est pas une
 * approximation : c'est une mention fausse dans un document que le client produit à son
 * propre comptable.
 *
 * ⚠️ CE MODULE NE RÉDIGE TOUJOURS PAS L'ARTICLE. Il sait qu'une prestation est exonérée
 * et le dit en clair ; il ne cite aucun numéro d'article, parce que celui du CGI
 * sénégalais n'a pas été vérifié. La rédaction exacte reste portée par
 * `INVOICE_TAX_NOTICE`, à renseigner d'après l'avis du comptable.
 */

/** Taux normal de TVA au Sénégal. Directive UEMOA n°02/98/CM, CGI Livre II. */
export const TVA_TAUX_NORMAL = 0.18;

/** Les trois états possibles. Voir l'en-tête : la distinction entre les deux derniers
 *  est la raison d'être de ce module. */
export type EtatFiscal = 'taxable' | 'exonere' | 'indetermine';

export interface Regime {
  etat: EtatFiscal;
  /** Taux effectif. Zéro pour tout ce qui n'est pas `taxable`. */
  taux: number;
}

/** Les familles de produits vendues par la plateforme. */
export type FamilleFiscale = 'agence' | 'formation' | 'club' | 'rysmo';

/**
 * LE RÉGIME PAR FAMILLE.
 *
 * `agence` — TAXABLE à 18 %. Les prestations d'accompagnement (Présence Digitale,
 * MY ONOMA) ne relèvent pas de l'enseignement.
 *
 * `formation` — EXONÉRÉE. Prestation d'enseignement, couverte par l'exonération
 * « éducation » du CGI. Confirmé par la direction le 03/09/2026.
 *
 * `club` — EXONÉRÉE. Le Club des Digitos donne accès à des ateliers et à leurs replays :
 * c'est la même activité d'enseignement que les formations, vendue sous forme
 * d'abonnement. Le support commercial ne change pas la nature de la prestation.
 *
 * ⚠️ `rysmo` — INDÉTERMINÉE, et c'est le seul point encore ouvert. Le répétiteur est un
 * outil pédagogique, ce qui plaide pour l'exonération ; mais il se vend en jetons et en
 * abonnement logiciel, ce qui peut le faire regarder comme un service numérique taxable.
 * La direction a confirmé l'exonération pour les FORMATIONS, sans se prononcer sur ce
 * produit-là — on ne l'étend donc pas d'office. Aucune taxe n'est calculée en attendant,
 * et aucune mention n'est écrite.
 */
export const REGIME: Record<FamilleFiscale, Regime> = {
  agence: { etat: 'taxable', taux: TVA_TAUX_NORMAL },
  formation: { etat: 'exonere', taux: 0 },
  club: { etat: 'exonere', taux: 0 },
  rysmo: { etat: 'indetermine', taux: 0 },
};

/** Le détail d'un montant, une fois la taxe séparée. */
export interface Ventilation {
  /** Base hors taxes, en unités entières de la devise. */
  ht: number;
  /** Montant de la taxe. Zéro dès que l'état n'est pas `taxable`. */
  tva: number;
  /** Ce qui est réellement dû. `ht + tva`, toujours exactement. */
  ttc: number;
  /** Le taux appliqué. Zéro hors `taxable`. */
  taux: number;
  /** L'état qui a produit ce calcul — c'est lui qui décide de ce qu'on AFFICHE. */
  etat: EtatFiscal;
}

/**
 * LE FRANC CFA N'A PAS DE CENTIMES.
 *
 * XOF est une devise à zéro décimale : un montant fractionnaire n'est pas payable, et
 * Bictorys refuse ce qu'il ne sait pas débiter. Tout ce qui sort d'ici est donc entier.
 *
 * L'arrondi porte sur la TAXE, et le TTC est ensuite reconstruit par addition. C'est
 * l'ordre qui garantit l'égalité `ht + tva === ttc` — arrondir les trois séparément la
 * casse une fois sur deux, et une facture dont les lignes ne totalisent pas est une
 * facture qu'un comptable rejette.
 */
export function ventilerDepuisHT(ht: number, regime: Regime): Ventilation {
  const base = Math.round(ht);
  if (regime.etat !== 'taxable' || regime.taux === 0) {
    return { ht: base, tva: 0, ttc: base, taux: 0, etat: regime.etat };
  }
  const tva = Math.round(base * regime.taux);
  return { ht: base, tva, ttc: base + tva, taux: regime.taux, etat: regime.etat };
}

/**
 * La ventilation d'un montant DÉJÀ TTC — pour tout ce qui a été encaissé.
 *
 * `amount` est ce que l'opérateur a réellement débité : un montant toutes taxes comprises
 * par construction, des deux côtés du changement de l'article 5.1 des CGV. Reconstruire le
 * total en ajoutant la taxe au débit la compterait deux fois, et la facture annoncerait
 * plus que le relevé bancaire du client.
 *
 * Vaut aussi pour les ventes antérieures au 03/09/2026, encaissées sous un article 5.1 qui
 * annonçait « toutes taxes comprises » : la taxe y est dedans.
 */
export function ventilerDepuisTTC(ttc: number, regime: Regime): Ventilation {
  const total = Math.round(ttc);
  if (regime.etat !== 'taxable' || regime.taux === 0) {
    return { ht: total, tva: 0, ttc: total, taux: 0, etat: regime.etat };
  }
  const ht = Math.round(total / (1 + regime.taux));
  return { ht, tva: total - ht, ttc: total, taux: regime.taux, etat: regime.etat };
}

/** Le régime d'une famille, en un appel. */
export function regimeDe(famille: FamilleFiscale): Regime {
  return REGIME[famille];
}

/** Le taux en pourcentage lisible — `18` pour 0,18. Pour l'affichage seulement. */
export function tauxEnPourcent(taux: number): number {
  return Math.round(taux * 1000) / 10;
}

/**
 * Faut-il écrire quelque chose sur la taxe ?
 *
 * Vrai pour `taxable` (le montant de la taxe) et pour `exonere` (le motif). Faux pour
 * `indetermine` : ne rien écrire est le seul comportement sûr tant qu'on ne sait pas.
 */
export function doitMentionnerLaTaxe(etat: EtatFiscal): boolean {
  return etat === 'taxable' || etat === 'exonere';
}
