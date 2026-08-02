import { FieldValue } from '@mm/firestore-rest';
import { verifyHmacSha256 } from '@mm/shared';

import { getFirestore } from '../context';
import type { Env } from '../env';
import { sendConversionEvent } from '../lib/meta-capi';
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

  if (status && SUCCESS_STATUSES.has(status)) {
    const rysmoPurchaseId = asText(txn.rysmoPurchaseId);
    const rysmoSubscriptionId = asText(txn.rysmoSubscriptionId);

    // L'effet de bord est appliqué AVANT de marquer la transaction terminée :
    // une panne en cours laisse `pending`, donc rattrapable. Chacun est idempotent.
    if (txn.formationId === 'club_digitos') {
      await db.update(`club_subscriptions/${userId}`, { status: 'active' });
      console.log('Webhook Bictorys : abonnement Club activé pour', userId);
    } else if (txn.rysmoKind === 'pack' && rysmoPurchaseId) {
      // Le crédit du solde et le marquage de l'achat doivent être atomiques.
      await db.runTransaction(async (tx) => {
        const purchase = await tx.get(`rysmoPackPurchases/${rysmoPurchaseId}`);
        if (!purchase) return;
        if (purchase.data.status === 'completed') return; // idempotent
        const rateLimit = await tx.get(`_ratelimits/rysmo_${userId}`);
        const newBalance =
          toNumber(rateLimit?.data.packBalance) + toNumber(purchase.data.requestsTotal);
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
    } else if (txn.rysmoKind === 'subscription' && rysmoSubscriptionId) {
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
    await db.update(transaction.path, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });

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

    if (txn.formationId === 'club_digitos') {
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
    } else if (txn.rysmoKind === 'pack' && asText(txn.rysmoPurchaseId)) {
      await db.update(`rysmoPackPurchases/${asText(txn.rysmoPurchaseId)}`, { status: 'failed' });
    } else if (txn.rysmoKind === 'subscription' && asText(txn.rysmoSubscriptionId)) {
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
