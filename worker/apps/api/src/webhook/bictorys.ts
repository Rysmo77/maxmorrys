import { FieldValue } from '@mm/firestore-rest';
import { verifyHmacSha256 } from '@mm/shared';

import { getFirestore } from '../context';
import type { Env } from '../env';
import { sendConversionEvent } from '../lib/meta-capi';
import { ligneDeBusiness } from '../lib/purchase';
import { recompenserParrain } from '../lib/referral';
import { envoyerCourriersTransaction } from '../lib/transaction-mail';
import { asText, toNumber } from '../lib/values';

/**
 * Webhook de paiement Bictorys — port de `bictorysWebhook`.
 *
 * Ce n'est **pas** une callable : Bictorys poste du JSON brut, sans enveloppe
 * `{data}`. Il est donc routé avant la logique onCall.
 *
 * ⚠️ Le corps est lu en texte **avant** tout parse. L'HMAC est calculé sur les
 * octets exacts signés par Bictorys ; sur Workers le corps ne se lit qu'une
 * fois, et passer par `request.json()` d'abord les détruirait définitivement.
 * La vérification échouerait alors systématiquement — en fail-closed, donc
 * 100 % des paiements resteraient bloqués.
 */

interface WebhookBody {
  chargeId?: string;
  charge_id?: string;
  status?: string;
  amount?: unknown;
  value?: unknown;
}

const SUCCESS_STATUSES = new Set(['succeeded', 'completed', 'successful']);
const FAILURE_STATUSES = new Set(['failed', 'expired', 'cancelled']);

export async function handleBictorysWebhook(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (!env.BICTORYS_WEBHOOK_SECRET) {
    console.error('BICTORYS_WEBHOOK_SECRET absent — webhook refusé');
    return new Response('Server misconfigured', { status: 500 });
  }

  // Les octets exacts, avant tout parse. Voir l'avertissement en tête de fichier.
  const rawBody = await request.text();
  const signature = request.headers.get('x-bictorys-signature') ?? '';

  if (!(await verifyHmacSha256(env.BICTORYS_WEBHOOK_SECRET, rawBody, signature))) {
    console.warn('Webhook Bictorys : signature absente ou invalide');
    return new Response('Forbidden', { status: 403 });
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(rawBody) as WebhookBody;
  } catch {
    console.warn('Webhook Bictorys : corps JSON illisible');
    return new Response('OK', { status: 200 });
  }

  const chargeId = body.chargeId ?? body.charge_id;
  const status = body.status;
  if (!chargeId) {
    console.warn('Webhook Bictorys : chargeId manquant');
    return new Response('OK', { status: 200 });
  }

  const db = getFirestore(env);

  // Idempotence. L'événement n'est enregistré qu'APRÈS traitement : une panne en
  // cours laisse la transaction `pending`, et une relivraison peut rattraper.
  const eventPath = `webhook_events/${chargeId}`;
  const event = await db.get(eventPath);
  if (event && event.data.status === status) {
    console.log('Webhook Bictorys : doublon ignoré', chargeId, status);
    return new Response('OK', { status: 200 });
  }

  const pending = await db.query({
    collection: 'transactions',
    where: [
      { field: 'chargeId', op: '==', value: chargeId },
      { field: 'status', op: '==', value: 'pending' },
    ],
    limit: 1,
  });
  if (pending.length === 0) {
    // Déjà traité ou inconnu : on acquitte pour couper les relivraisons.
    console.log('Webhook Bictorys : aucune transaction en attente pour', chargeId);
    return new Response('OK', { status: 200 });
  }

  const transaction = pending[0];
  const txn = transaction.data;

  /**
   * Défense en profondeur. La signature HMAC reste le contrôle d'intégrité
   * faisant autorité ; le garde `typeof === 'number'` fait qu'un champ montant
   * renommé ou absent est simplement ignoré, sans faux rejet — ce qui permet de
   * rejeter un vrai écart en gardant la transaction `pending` pour examen.
   */
  const webhookAmount = body.amount ?? body.value;
  if (typeof webhookAmount === 'number' && webhookAmount !== toNumber(txn.amount)) {
    console.error('Webhook Bictorys : montant divergent, rejet', {
      chargeId,
      webhookAmount,
      expected: txn.amount,
    });
    return new Response('Amount verification failed', { status: 400 });
  }

  const userId = asText(txn.userId) ?? '';

  /*
   * CE QUE CETTE TRANSACTION VEND — lu UNE fois, pour les deux aiguillages.
   *
   * Ce fichier reposait la question six fois, en réécrivant à chaque branche
   * `formationId === 'club_digitos'` et `rysmoKind === '…'`. Ce n'était pas une copie de
   * `classerAchat` — c'est un aiguillage d'effets — mais c'en était la même règle, redite
   * en six endroits qu'il aurait fallu corriger ensemble.
   *
   * `ligneDeBusiness` lit le champ écrit quand il est là, et retombe sur la déduction pour
   * les transactions antérieures : le comportement est inchangé sur tout l'historique.
   */
  const ligne = ligneDeBusiness(txn);

  if (status && SUCCESS_STATUSES.has(status)) {
    const rysmoPurchaseId = asText(txn.rysmoPurchaseId);
    const rysmoSubscriptionId = asText(txn.rysmoSubscriptionId);

    /* Renseignés par la branche « pack » ci-dessous, pour le courrier de confirmation. */
    let jetonsCredites: number | undefined;
    let soldeRysmo: number | undefined;

    // L'effet de bord est appliqué AVANT de marquer la transaction terminée :
    // une panne en cours laisse `pending`, donc rattrapable. Chacun est idempotent.
    if (ligne === 'club') {
      await db.update(`club_subscriptions/${userId}`, { status: 'active' });
      console.log('Webhook Bictorys : abonnement Club activé pour', userId);

      /*
        LA CONTREPARTIE DU PARRAINAGE, versée ici et nulle part ailleurs.

        C'est l'instant exact où `onReferralConversion` se déclenchait — un trigger Firestore
        sur `club_subscriptions/{uid}` passant à `active` — et il n'existe plus depuis le plan
        Spark. Le filleul obtenait bien sa remise de 15 % (calculée dans `payments.ts`), mais le
        parrain n'obtenait plus rien : ni XP, ni badge, ni ligne dans son compteur, qui affichait
        donc 0 à vie. Une seule moitié de l'échange fonctionnait.

        `recompenserParrain` ne jette jamais : un échec de récompense ne doit pas faire répondre
        autre chose que 200 à Bictorys, sous peine de relivraison sur un paiement déjà encaissé.
      */
      const parrainage = await recompenserParrain(db, userId);
      if (parrainage.recompense) {
        console.log('Parrainage : parrain', parrainage.parrainId, 'récompensé pour', userId);
      } else if (parrainage.raison && parrainage.raison !== 'pasDeParrain') {
        console.log('Parrainage : rien versé pour', userId, '—', parrainage.raison);
      }
    } else if (ligne === 'rysmoPack' && rysmoPurchaseId) {
      // Le crédit du solde et le marquage de l'achat doivent être atomiques.
      await db.runTransaction(async (tx) => {
        const purchase = await tx.get(`rysmoPackPurchases/${rysmoPurchaseId}`);
        if (!purchase) return;
        if (purchase.data.status === 'completed') return; // idempotent
        const rateLimit = await tx.get(`_ratelimits/rysmo_${userId}`);
        const newBalance =
          toNumber(rateLimit?.data.packBalance) + toNumber(purchase.data.requestsTotal);
        /*
         * Ces deux nombres SORTENT de la transaction pour le courrier de confirmation.
         *
         * Ils sont lus ici et nulle part ailleurs : les relire après coup donnerait un solde
         * qui a pu bouger entre-temps — le répétiteur consomme des jetons en continu. Un
         * courrier qui annonce « tu en as 1 700 » alors que la personne en a déjà dépensé
         * trois est faux, et c'est le genre de faux qu'on ne remarque jamais côté serveur.
         *
         * Les deux sorties anticipées ci-dessus les laissent indéfinis, ce qui est correct :
         * elles signalent une relivraison déjà traitée, donc un courrier déjà parti.
         */
        jetonsCredites = toNumber(purchase.data.requestsTotal);
        soldeRysmo = newBalance;
        tx.update(`rysmoPackPurchases/${rysmoPurchaseId}`, {
          status: 'completed',
          completedAt: new Date().toISOString(),
        });
        tx.set(
          `_ratelimits/rysmo_${userId}`,
          { packBalance: newBalance, lastReset: Date.now() },
          { merge: true },
        );
      });
      console.log('Webhook Bictorys : pack Rysmo crédité pour', userId);
    } else if (ligne === 'rysmoSubscription' && rysmoSubscriptionId) {
      await db.update(`rysmoSubscriptions/${rysmoSubscriptionId}`, { status: 'active' });
      console.log('Webhook Bictorys : abonnement Rysmo+ activé pour', userId);
    } else {
      const formationId = asText(txn.formationId) ?? '';
      const enrollmentId = `${userId}_${formationId}`;
      if (!(await db.get(`enrollments/${enrollmentId}`))) {
        await db.set(`enrollments/${enrollmentId}`, {
          id: enrollmentId,
          userId,
          formationId,
          enrolledAt: new Date().toISOString(),
          progress: 0,
          completedLessons: [],
          certificateIssued: false,
        });
      }
      console.log('Webhook Bictorys : inscription créée pour', enrollmentId);
    }

    // L'usage du coupon n'est décompté qu'ici, au succès : un panier abandonné
    // ne doit pas en consommer un.
    const couponId = asText(txn.couponId);
    if (couponId) {
      await db.set(`coupons/${couponId}`, { usedCount: FieldValue.increment(1) }, { merge: true });
    }

    // La transaction passe à `completed` EN DERNIER, une fois l'effet acquis.
    const completedAt = new Date().toISOString();
    await db.update(transaction.path, { status: 'completed', completedAt });

    /*
     * LA FACTURE — ce que l'article 4 des CGV promet depuis toujours : « Une facture est
     * envoyée automatiquement par e-mail au nom de MY ONOMA SARL dès validation du paiement ».
     * Jusqu'à ce lot, le dépôt n'avait aucun canal d'envoi : la clause décrivait un produit
     * qui n'existait pas.
     *
     * Comme Meta CAPI juste en dessous, et pour une raison plus forte : un échec ici ne doit
     * JAMAIS faire échouer le webhook. Une réponse non-200 déclenche une relivraison Bictorys
     * sur un paiement déjà encaissé et déjà crédité — un serveur de messagerie qui hoquette
     * ferait rejouer le chemin de l'argent. `sendEmail` ne lève pas ; on journalise.
     */
    try {
      /*
       * Les deux courriers sont produits par `transaction-mail.ts`, et non plus ici.
       *
       * La raison est la RELANCE : la console doit pouvoir renvoyer une facture dont
       * l'acheminement a échoué, et elle doit renvoyer EXACTEMENT la même — même numéro,
       * même contenu. Deux rédactions du même document sous le même numéro, c'est la
       * divergence garantie à la première évolution.
       *
       * `completedAt` est joint à la transaction lue : il vient d'être écrit en base
       * juste au-dessus, mais l'objet en mémoire ne le porte pas encore, et c'est lui
       * qui date la facture.
       */
      const bilan = await envoyerCourriersTransaction(
        db,
        env,
        transaction.path,
        { ...txn, completedAt },
        { jetonsCredites, soldeTotal: soldeRysmo },
      );
      if (bilan.confirmation === 'sansDestinataire') {
        console.error('Webhook Bictorys : aucune adresse sur la transaction', chargeId);
      } else {
        console.log(
          `Webhook Bictorys : courriers ${chargeId} — confirmation ${bilan.confirmation}, ` +
            `facture ${bilan.facture}${bilan.numero ? ` (${bilan.numero})` : ''}`,
        );
      }
    } catch (error: unknown) {
      console.error('Webhook Bictorys : échec de facturation pour', chargeId, error);
    }

    // Meta CAPI n'est pas critique : un échec ici ne doit jamais faire échouer le
    // webhook, ce qui déclencherait des relivraisons sur un paiement déjà traité.
    await sendConversionEvent(
      env,
      'Purchase',
      {
        content_ids: [txn.formationId],
        content_name: txn.formationTitle,
        content_type: 'product',
        value: toNumber(txn.amount),
        currency: asText(txn.currency) || 'XOF',
      },
      {
        em: asText(txn.userEmail),
        client_ip_address: request.headers.get('CF-Connecting-IP') ?? undefined,
        client_user_agent: request.headers.get('user-agent') ?? undefined,
      },
      asText(txn.metaEventId),
    );
  } else if (status && FAILURE_STATUSES.has(status)) {
    await db.update(transaction.path, { status: 'failed' });

    if (ligne === 'club') {
      // On efface l'abonnement en attente, sinon `createClubCharge` bloquerait
      // toute nouvelle tentative.
      const subscription = await db.get(`club_subscriptions/${userId}`);
      if (
        subscription &&
        subscription.data.status === 'pending' &&
        subscription.data.chargeId === chargeId
      ) {
        await db.delete(`club_subscriptions/${userId}`);
      }
    } else if (ligne === 'rysmoPack' && asText(txn.rysmoPurchaseId)) {
      await db.update(`rysmoPackPurchases/${asText(txn.rysmoPurchaseId)}`, { status: 'failed' });
    } else if (ligne === 'rysmoSubscription' && asText(txn.rysmoSubscriptionId)) {
      await db.update(`rysmoSubscriptions/${asText(txn.rysmoSubscriptionId)}`, {
        status: 'cancelled',
      });
    }
    console.log('Webhook Bictorys : paiement échoué pour', chargeId);
  } else {
    console.log('Webhook Bictorys : statut non traité', status, 'pour', chargeId);
  }

  await db.set(
    eventPath,
    { chargeId, status, receivedAt: new Date().toISOString() },
    { merge: true },
  );

  return new Response('OK', { status: 200 });
}
