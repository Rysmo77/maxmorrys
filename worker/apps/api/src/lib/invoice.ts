/**
 * LA FACTURE — rendu et numérotation.
 *
 * Elle existe parce que les CGV la promettent : « Une facture est envoyée automatiquement par
 * e-mail au nom de MY ONOMA SARL dès validation du paiement » (article 4). Jusqu'ici la clause
 * ne correspondait à rien — le dépôt n'avait aucun canal d'envoi, et le mot « facture »
 * n'apparaissait nulle part dans le code. Une clause de CGV qui décrit un produit imaginaire
 * est une dette, pas une formalité.
 *
 * ── CE MODULE NE SAIT PAS ENVOYER ──
 * Il rend un objet `{ number, subject, html, text }`. L'envoi vit dans `email.ts`. La
 * séparation n'est pas de la cosmétique : elle rend le rendu testable sans réseau, et elle
 * laisse le chemin d'envoi changer — binding Worker aujourd'hui, autre chose demain — sans
 * toucher au document légal.
 *
 * ── RÈGLE 6 : AUCUN CHIFFRE QUI NE VIENNE DE LA BASE ──
 * Tout ce qui s'affiche ici sort de la transaction Firestore écrite par `createBictorysCharge`
 * et vérifiée par le webhook contre le montant annoncé par l'opérateur. Aucune valeur par
 * défaut de démonstration, aucun montant recalculé côté client. Un champ absent laisse sa
 * ligne absente plutôt que d'afficher un tiret : sur une facture, une ligne vide est une
 * question, une ligne inventée est un faux.
 */

import * as DS from './email-design';
import { regimeDe, tauxEnPourcent, ventilerDepuisTTC, type FamilleFiscale } from './tax';

/** Identité de l'émetteur. Reprise VERBATIM des mentions légales publiées
 *  (`src/i18n/locales/fr/legal.json` § mentions.editor) : deux rédactions de la même identité
 *  légale, c'est une occasion de les faire diverger. */
export const EMETTEUR = {
  raisonSociale: 'MY ONOMA SARL',
  formeJuridique: 'Société à Responsabilité Limitée (SARL)',
  capital: '100 000 FCFA',
  rccm: 'SN DKR 2022 B 11134',
  ninea: '009319501',
  siege: 'Quartier Ouakam, Cité Batrain, Lot 384 — Dakar, Sénégal',
  marque: 'Max-Morrys',
} as const;

export type Langue = 'fr' | 'en';

/** Ce que la transaction Firestore porte et dont la facture a besoin. Tout est optionnel sauf
 *  le montant et la devise : une facture sans montant n'est pas une facture. */
export interface TransactionFacturable {
  amount: number;
  currency: string;
  /** Libellé de ce qui a été acheté — `formationTitle` sur la transaction. */
  designation?: string;
  userEmail?: string;
  userName?: string;
  /** Référence de la charge chez l'opérateur, pour le rapprochement. */
  chargeId?: string;
  /** Horodatage ISO de la validation du paiement. */
  paidAt?: string;
  /**
   * Famille fiscale de ce qui a été vendu. Détermine le régime appliqué — voir `tax.ts`.
   *
   * Par défaut `formation`, donc EXONÉRÉE : une transaction dont la famille serait mal
   * renseignée ne se verra jamais facturer une taxe qu'elle ne doit pas. Le défaut penche
   * du côté où l'erreur est réparable — on peut réémettre une facture qui a omis la TVA,
   * on ne peut pas défaire un client qui l'a payée à tort.
   */
  famille?: FamilleFiscale;
}

export interface Facture {
  number: string;
  subject: string;
  html: string;
  text: string;
}

/** L'insécable, en ÉCHAPPEMENT et non en caractère littéral : invisible à la relecture,
 *  elle est indistinguable d'une espace ordinaire — et `no-irregular-whitespace` la refuse. */
const NB = '\u00A0';

/**
 * SÉPARATEUR DE MILLIERS, À LA MAIN ET NON PAR `Intl`.
 *
 * Le système fixe la règle : espace insécable en français (`95 000 F`), virgule en anglais
 * (`95,000 F`). `Intl.NumberFormat` la respecterait sur un poste de développement, mais les
 * données ICU d'un runtime de bord ne sont pas garanties identiques d'un déploiement à
 * l'autre — et un montant qui change de forme entre deux factures du même mois est une
 * question du comptable. Sur un document légal, on écrit la règle plutôt qu'on la délègue.
 *
 * L'espace est un U+00A0 (insécable) : un montant coupé en fin de ligne se lit comme deux.
 */
export function formatMontant(montant: number, devise: string, langue: Langue): string {
  const entier = Math.round(montant);
  const groupes = String(Math.abs(entier)).replace(/\B(?=(\d{3})+(?!\d))/g, langue === 'fr' ? NB : ',');
  const signe = entier < 0 ? '-' : '';
  return `${signe}${groupes}${NB}${devise === 'XOF' ? 'FCFA' : devise}`;
}

/** Date en toutes lettres, dans la langue du destinataire. Une facture datée « 03/04 » se lit
 *  différemment à Dakar et à New York ; le mois écrit ne se lit que d'une façon. */
export function formatDateFacture(iso: string, langue: Langue): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const mois = langue === 'fr'
    ? ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const jour = d.getUTCDate();
  const m = mois[d.getUTCMonth()];
  const an = d.getUTCFullYear();
  return langue === 'fr' ? `${jour} ${m} ${an}` : `${m} ${jour}, ${an}`;
}

/**
 * LE NUMÉRO DE FACTURE EST SÉQUENTIEL, ET IL N'EST ATTRIBUÉ QU'UNE FOIS.
 *
 * Format `MO-2026-000001` : l'émetteur, l'exercice, puis un rang qui repart à 1 chaque année —
 * la numérotation continue et sans trou par exercice est ce qu'attend une comptabilité OHADA.
 *
 * Deux propriétés à ne pas casser :
 *
 * 1. **Idempotence.** Bictorys relivre un webhook déjà traité — le code le prévoit déjà par
 *    `eventPath`. Si le numéro était attribué à chaque passage, une relivraison consommerait
 *    un rang et enverrait une deuxième facture portant un autre numéro pour le même paiement.
 *    Le numéro est donc écrit SUR LA TRANSACTION, et un appel ultérieur relit celui qui existe
 *    au lieu d'en tirer un nouveau.
 *
 * 2. **Pas de trou.** Le compteur et le marquage de la transaction sont dans la même
 *    transaction Firestore. Une panne entre les deux laisserait un rang consommé sans facture
 *    — un trou dans la séquence, que le comptable devra justifier.
 */
export function formatNumeroFacture(annee: number, rang: number): string {
  return `MO-${annee}-${String(rang).padStart(6, '0')}`;
}

/**
 * Attribue — ou relit — le numéro de la transaction. Les deux écritures (compteur de
 * l'exercice, marquage de la transaction) sont dans la MÊME transaction Firestore : une panne
 * entre les deux laisserait un rang consommé sans facture, donc un trou dans la séquence.
 *
 * Relire d'abord est ce qui rend l'opération idempotente sous relivraison de webhook.
 */
export async function allocateInvoiceNumber(
  db: {
    runTransaction: <T>(fn: (tx: {
      get: (path: string) => Promise<{ data: Record<string, unknown> } | null>;
      set: (path: string, data: Record<string, unknown>, options?: { merge?: boolean }) => void;
      update: (path: string, data: Record<string, unknown>) => void;
    }) => Promise<T>) => Promise<T>;
  },
  transactionPath: string,
  annee = new Date().getUTCFullYear(),
): Promise<string> {
  return db.runTransaction(async (tx) => {
    const existant = await tx.get(transactionPath);
    const dejaEmis = existant?.data.invoiceNumber;
    if (typeof dejaEmis === 'string' && dejaEmis) return dejaEmis;

    const compteurPath = `_counters/invoices_${annee}`;
    const compteur = await tx.get(compteurPath);
    const brut = compteur?.data.next;
    const rang = typeof brut === 'number' && brut > 0 ? brut : 1;

    const numero = formatNumeroFacture(annee, rang);
    tx.set(compteurPath, { next: rang + 1 }, { merge: true });
    tx.update(transactionPath, { invoiceNumber: numero });
    return numero;
  });
}

const T = {
  fr: {
    subject: (n: string) => `Ta facture ${n} — Max-Morrys`,
    bonjour: (nom?: string) => (nom ? `Bonjour ${nom},` : 'Bonjour,'),
    intro: 'Ton paiement est passé. Voici ta facture — garde-la, elle te servira si tu dois justifier la dépense.',
    titre: 'Facture',
    numero: 'Numéro',
    date: 'Date',
    designation: 'Désignation',
    montant: 'Montant réglé',
    reference: 'Référence de paiement',
    client: 'Client',
    emetteur: 'Émetteur',
    totalHT: 'Total hors taxes',
    exonere: "Exonéré de TVA — prestation d'enseignement.",
    tva: (taux: number) => `TVA ${taux} %`,
    total: 'Total réglé',
    pied: "Cette facture est émise automatiquement à la validation du paiement. Si un élément te paraît faux, réponds à ce message : je corrige et je réémets.",
    signature: 'Max-Morrys',
  },
  en: {
    subject: (n: string) => `Your invoice ${n} — Max-Morrys`,
    bonjour: (nom?: string) => (nom ? `Hi ${nom},` : 'Hi,'),
    intro: "Your payment went through. Here's your invoice — keep it, you'll need it if you ever have to account for the expense.",
    titre: 'Invoice',
    numero: 'Number',
    date: 'Date',
    designation: 'Description',
    montant: 'Amount paid',
    reference: 'Payment reference',
    client: 'Customer',
    emetteur: 'Issued by',
    totalHT: 'Total excluding tax',
    exonere: 'VAT-exempt — teaching service.',
    tva: (taux: number) => `VAT ${taux}%`,
    total: 'Total paid',
    pied: "This invoice is issued automatically when payment clears. If anything looks wrong, reply to this message — I'll fix it and reissue.",
    signature: 'Max-Morrys',
  },
} as const;

/* L'échappement vivait ici en copie. Il est désormais unique dans `email-design.ts`, appliqué
   par les primitives elles-mêmes : une valeur ne peut plus traverser le HTML sans passer par
   lui. Voir `DS.echapper`. */

/**
 * Rend la facture dans les deux formats. `text` n'est pas une politesse : certains clients de
 * messagerie n'affichent que lui, et son absence pèse sur le score anti-spam — donc sur la
 * probabilité qu'une facture arrive.
 */
/**
 * ⚠️ AUCUNE MENTION DE TVA N'EST ÉMISE, ET C'EST DÉLIBÉRÉ.
 *
 * Une facture doit dire son traitement de TVA. Je ne connais pas celui de MY ONOMA SARL —
 * assujettie, exonérée, sous un régime particulier — et je ne peux pas le déduire du dépôt :
 * les mentions légales donnent le NINEA et le RCCM, pas le régime fiscal.
 *
 * J'ai d'abord écrit « TVA non applicable, article 293 B », qui est du code français. Sur une
 * facture, une référence fiscale inventée n'est pas une approximation : c'est une mention
 * légale fausse, dans un document que le client peut produire à son propre comptable.
 *
 * `mentionFiscale` est donc un paramètre, sans valeur par défaut. Tant qu'il n'est pas
 * renseigné, la facture n'affirme rien sur la TVA — l'omission se voit et se corrige, une
 * fausse mention se recopie. À renseigner d'après l'avis du comptable de la société.
 */
export function buildInvoice(
  txn: TransactionFacturable,
  numero: string,
  langue: Langue = 'fr',
  mentionFiscale?: string,
): Facture {
  const t = T[langue];
  const montant = formatMontant(txn.amount, txn.currency, langue);
  const date = formatDateFacture(txn.paidAt ?? new Date().toISOString(), langue);

  // Les lignes optionnelles ne s'affichent que si elles ont une valeur. Une facture qui
  // annonce « Référence : — » invite à demander laquelle.
  const lignes: Array<[string, string]> = [
    [t.numero, numero],
    [t.date, date],
  ];
  if (txn.designation) lignes.push([t.designation, txn.designation]);
  if (txn.userName) lignes.push([t.client, txn.userName]);
  if (txn.chargeId) lignes.push([t.reference, txn.chargeId]);

  /*
   * ── LA VENTILATION SE FAIT DEPUIS LE TTC, JAMAIS DEPUIS LE HT ──
   *
   * `txn.amount` est ce que l'opérateur a RÉELLEMENT débité. C'est donc un montant toutes
   * taxes comprises par construction, et ça reste vrai des deux côtés du changement de
   * l'article 5.1 :
   *
   *   · avant le 03/09/2026, les prix étaient annoncés TTC — la taxe était dedans ;
   *   · depuis, ils sont annoncés HT et la taxe est ajoutée AVANT le débit — elle est donc
   *     encore dedans au moment où l'opérateur encaisse.
   *
   * Reconstruire le TTC en ajoutant la taxe au montant débité le compterait deux fois. Une
   * facture qui annonce plus que ce qui a été prélevé est un faux, et le client le voit sur
   * son relevé.
   *
   * Les deux lignes n'apparaissent que si une taxe est due. Une ligne « TVA 0 » sur une
   * prestation dont le régime n'est pas tranché serait une affirmation fiscale — exactement
   * ce que l'avertissement de `mentionFiscale` plus bas interdit d'écrire.
   */
  const regime = regimeDe(txn.famille ?? 'formation');
  const v = ventilerDepuisTTC(txn.amount, regime);
  if (v.etat === 'taxable' && v.tva > 0) {
    lignes.push([t.totalHT, formatMontant(v.ht, txn.currency, langue)]);
    lignes.push([t.tva(tauxEnPourcent(v.taux)), formatMontant(v.tva, txn.currency, langue)]);
  }

  /*
   * LA MENTION FISCALE — trois comportements, un par état.
   *
   * `taxable`     les deux lignes ci-dessus suffisent : le montant de la taxe EST la mention.
   * `exonere`     il faut dire POURQUOI. Une facture sans TVA et sans motif est incomplète
   *               pour un comptable, et MY ONOMA est assujettie — l'absence de taxe sur une
   *               de ses factures demande donc une explication.
   * `indetermine` on n'écrit rien. C'est le seul comportement sûr tant qu'on ne sait pas.
   *
   * `INVOICE_TAX_NOTICE` reste prioritaire : le jour où le comptable fournit la rédaction
   * exacte, avec son article, elle remplace la phrase par défaut sans toucher au code. Cette
   * phrase-ci ne cite AUCUN article, précisément parce que celui du CGI sénégalais n'a pas
   * été vérifié — et qu'une référence inventée se recopie chez le client.
   */
  const mention = mentionFiscale ?? (v.etat === 'exonere' ? t.exonere : undefined);

  const emetteurLignes = [
    EMETTEUR.raisonSociale,
    EMETTEUR.formeJuridique,
    `RCCM : ${EMETTEUR.rccm}`,
    `NINEA : ${EMETTEUR.ninea}`,
    EMETTEUR.siege,
  ];

  /*
   * LA HIÉRARCHIE DE LA PIÈCE.
   *
   * L'identité légale de l'émetteur descend en PIED DE PAGE, hors de la carte blanche. Elle
   * occupait le centre du document alors qu'elle ne s'y lit jamais : ce qu'on ouvre une
   * facture pour voir, c'est le montant et ce qu'on a acheté. Le bloc reste intégralement
   * présent — les CGV et le comptable du client l'exigent — mais à sa place.
   *
   * Le total est la seule ligne portée à 24 px : la hiérarchie se fait par la taille, jamais
   * par une couleur d'accent, parce qu'un accent coloré sur une facture se lit comme une
   * alerte.
   */
  const html = DS.page({
    langue,
    apercu: `${t.titre} ${numero} · ${montant}`,
    contenu: [
      DS.paragraphe(t.bonjour(txn.userName)),
      DS.paragraphe(t.intro, true),
      DS.filet(),
      DS.surTitre(t.titre),
      DS.lignes(lignes),
      DS.total(t.total, montant),
      mention ? DS.mention(mention, DS.ECHELLE.small) : '',
      DS.filet(),
      DS.mention(t.pied),
      DS.paragraphe(t.signature),
    ]
      .filter(Boolean)
      .join('\n'),
    pied: [`${t.emetteur} :`, ...emetteurLignes],
  });

  const text = [
    t.bonjour(txn.userName),
    '',
    t.intro,
    '',
    `${t.titre} ${numero}`,
    '',
    ...lignes.map(([k, v]) => `${k} : ${v}`),
    `${t.total} : ${montant}`,
    ...(mention ? ['', mention] : []),
    '',
    `${t.emetteur} :`,
    ...emetteurLignes,
    '',
    t.pied,
    '',
    t.signature,
  ].join('\n');

  return { number: numero, subject: t.subject(numero), html, text };
}
