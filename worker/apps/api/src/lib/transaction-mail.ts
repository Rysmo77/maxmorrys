/**
 * LES COURRIERS D'UNE TRANSACTION — production, envoi, et état relançable.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * POURQUOI CE MODULE EXISTE
 *
 * Deux appelants doivent produire EXACTEMENT le même courrier : le webhook de paiement,
 * au moment de l'encaissement, et la relance manuelle depuis la console quand l'envoi a
 * échoué. Dupliquer la logique, c'était garantir qu'une facture relancée finisse par
 * différer de la facture d'origine — même numéro, contenu divergent. Sur une pièce
 * comptable, c'est le pire des deux mondes.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * `mailPending` : LE MARQUEUR QUI REND L'ÉCHEC VISIBLE
 *
 * Jusqu'ici, un e-mail non parti ne laissait qu'un `console.error` dans les journaux du
 * Worker. Personne ne les lit. Le client, lui, n'avait ni confirmation ni facture — et
 * l'article 4 des CGV promet la seconde.
 *
 * L'absence de `invoiceSentAt` DIT déjà que la facture n'est pas partie, mais elle ne
 * s'interroge pas : Firestore ne sait pas requêter un champ ABSENT. `where('invoiceSentAt',
 * '==', null)` ne remonte que les documents où le champ vaut explicitement `null`, jamais
 * ceux où il manque. Un booléen écrit explicitement, lui, s'indexe et se compte — c'est ce
 * qui permet au badge de la console d'exister.
 *
 * Il est écrit dans les DEUX sens : `true` quand il reste quelque chose à envoyer, `false`
 * quand tout est parti. Ne l'écrire qu'en cas d'échec laisserait le drapeau levé à vie
 * après une relance réussie.
 */
import type { Firestore } from '@mm/firestore-rest';

import type { Env } from '../env';
import { sendEmail } from './email';
import { allocateInvoiceNumber, buildInvoice, type Langue } from './invoice';
import { buildPurchaseNotice, classerAchat, urlDeDestination } from './purchase';
import { asText, toNumber } from './values';

/** L'issue d'un des deux courriers. */
export type IssueCourrier = 'envoye' | 'deja' | 'echec' | 'sansDestinataire';

export interface BilanCourriers {
  confirmation: IssueCourrier;
  facture: IssueCourrier;
  /** Numéro attribué, s'il l'a été. Il l'est même si l'envoi échoue : la facture existe. */
  numero?: string;
  /** Reste-t-il quelque chose à envoyer ? C'est ce que porte `mailPending`. */
  enAttente: boolean;
  /** Motif du dernier échec, pour la console et les journaux. */
  erreur?: string;
}

export interface ContexteCourriers {
  /** Jetons crédités et solde, connus seulement du webhook — lus DANS sa transaction
   *  atomique. Une relance ultérieure ne peut plus les produire honnêtement : le solde
   *  a bougé depuis. Absents, la confirmation Rysmo omet simplement le chiffre. */
  jetonsCredites?: number;
  soldeTotal?: number;
}

/*
 * `classerAchat` vivait ici. Elle est passée dans `purchase.ts`, à côté d'`AchatKind`
 * qu'elle produit — et elle lit désormais le champ `ligne` avant de déduire. Elle est
 * ré-exportée ici parce que le webhook et la console la connaissent sous ce chemin.
 */
export { classerAchat };

/**
 * Produit et envoie les deux courriers d'une transaction encaissée.
 *
 * NE LÈVE JAMAIS. C'est le même arbitrage que `sendEmail` : appelée depuis le webhook,
 * une exception ici ferait répondre autre chose que 200 à Bictorys, donc REJOUER un
 * paiement déjà encaissé et déjà crédité.
 *
 * Idempotente sur les deux courriers : `purchaseNoticeSentAt` et `invoiceSentAt` sont
 * relus avant chaque envoi. Une relivraison, ou une relance sur une transaction déjà
 * traitée, n'envoie rien et le dit.
 */
export async function envoyerCourriersTransaction(
  db: Firestore,
  env: Env,
  transactionPath: string,
  txn: Record<string, unknown>,
  contexte: ContexteCourriers = {},
): Promise<BilanCourriers> {
  const destinataire = asText(txn.userEmail) ?? '';
  if (!destinataire) {
    // Rien à relancer tant qu'il n'y a pas d'adresse : le drapeau resterait levé sans
    // qu'aucune action ne puisse le baisser. On le dit, on ne le lève pas.
    return { confirmation: 'sansDestinataire', facture: 'sansDestinataire', enAttente: false };
  }

  const userId = asText(txn.userId) ?? '';
  const profil = userId ? await db.get(`users/${userId}`) : null;
  const prefs = profil?.data.preferences as { language?: string } | undefined;
  const langue: Langue = prefs?.language === 'en' ? 'en' : 'fr';

  const { kind, famille } = classerAchat(txn);
  const chargeId = asText(txn.chargeId) ?? '';
  const paidAt = asText(txn.completedAt) ?? new Date().toISOString();

  const bilan: BilanCourriers = { confirmation: 'deja', facture: 'deja', enAttente: false };

  /*
   * LA CONFIRMATION D'ABORD.
   *
   * L'ordre compte dans la boîte de réception : la confirmation dit ce qu'on vient
   * d'obtenir, la facture est la pièce comptable. Reçues dans l'autre sens, la première
   * chose qu'on lit après avoir payé est un document administratif.
   */
  if (!txn.purchaseNoticeSentAt) {
    const avis = buildPurchaseNotice({
      kind,
      langue,
      userName: asText(txn.userName),
      designation: asText(txn.formationTitle),
      jetonsCredites: contexte.jetonsCredites,
      soldeTotal: contexte.soldeTotal,
      url: urlDeDestination(kind, langue, env.APP_BASE_URL),
    });
    const envoi = await sendEmail(env, { to: destinataire, ...avis });
    if (envoi.sent) {
      await db.update(transactionPath, { purchaseNoticeSentAt: new Date().toISOString() });
      bilan.confirmation = 'envoye';
    } else {
      bilan.confirmation = 'echec';
      bilan.erreur = envoi.error;
      console.error('Courriers transaction : confirmation non envoyée —', envoi.error);
    }
  }

  /*
   * LA FACTURE.
   *
   * Le numéro est attribué une seule fois et relu ensuite : une relivraison, ou une
   * relance, ne consomme pas un rang et n'émet pas une seconde facture sous un autre
   * numéro pour le même paiement.
   */
  const numero = await allocateInvoiceNumber(db, transactionPath);
  bilan.numero = numero;

  if (!txn.invoiceSentAt) {
    const facture = buildInvoice(
      {
        amount: toNumber(txn.amount),
        currency: asText(txn.currency) || 'XOF',
        designation: asText(txn.formationTitle),
        userEmail: destinataire,
        userName: asText(txn.userName),
        chargeId,
        paidAt,
        famille,
      },
      numero,
      langue,
      env.INVOICE_TAX_NOTICE || undefined,
    );

    const envoi = await sendEmail(env, {
      to: destinataire,
      subject: facture.subject,
      html: facture.html,
      text: facture.text,
    });
    if (envoi.sent) {
      await db.update(transactionPath, { invoiceSentAt: new Date().toISOString() });
      bilan.facture = 'envoye';
    } else {
      // Le numéro reste attribué : la facture EXISTE, seul son acheminement a échoué.
      bilan.facture = 'echec';
      bilan.erreur = envoi.error;
      console.error('Courriers transaction : facture', numero, 'non envoyée —', envoi.error);
    }
  }

  bilan.enAttente = bilan.confirmation === 'echec' || bilan.facture === 'echec';

  /*
   * Écrit dans les DEUX sens — voir l'en-tête. Un drapeau qu'on ne baisse jamais finit
   * par ne plus rien signaler, et le badge de la console compterait des transactions
   * réglées depuis longtemps.
   */
  await db.update(transactionPath, { mailPending: bilan.enAttente });

  return bilan;
}
