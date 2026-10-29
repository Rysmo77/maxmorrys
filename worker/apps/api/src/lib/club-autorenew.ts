import type { Firestore } from '@mm/firestore-rest';

import type { Env } from '../env';
import {
  assurerPlanClub,
  creerAbonnementBictorys,
  creerClientBictorys,
  dateDuLien,
  referenceRenouvellement,
} from './bictorys-billing';
import { asText } from './values';

/**
 * LE RENOUVELLEMENT DU CLUB — programmé chez Bictorys par le cron de 08:00.
 *
 * Pourquoi dans le cron et pas dans le webhook : un appel à Bictorys qui échoue au moment où
 * le paiement initial est confirmé ne doit PAS retarder l'ouverture de l'accès, ni faire
 * répondre autre chose que 200 au webhook. Ici, un échec se retente le lendemain.
 *
 * Qui est concerné : les abonnements actifs avec `autoRenew` ET `autoRenewMode: 'bictorys'`.
 * Le second champ est le CONSENTEMENT : il n'est posé que par une adhésion ou un réglage fait
 * après l'ouverture de la fonction. Les anciens `autoRenew: true` voulaient dire « préviens-moi »
 * (voir `renewal.ts`) — on ne les inscrit pas d'office à une relance de paiement.
 */
export async function programmerRenouvellementsClub(
  db: Firestore,
  env: Env,
  maintenant = new Date(),
): Promise<{ examines: number; programmes: number; echecs: number }> {
  if (!env.BICTORYS_SECRET_KEY) return { examines: 0, programmes: 0, echecs: 0 };

  const candidats = await db.query({
    collection: 'club_subscriptions',
    where: [
      { field: 'status', op: '==', value: 'active' },
      { field: 'autoRenewMode', op: '==', value: 'bictorys' },
    ],
  });

  let programmes = 0;
  let echecs = 0;
  let plan: { id: string; montant: number } | null = null;

  for (const abonnement of candidats) {
    const d = abonnement.data;
    if (d.autoRenew !== true || asText(d.bictorysSubscriptionId)) continue;

    const expiresAt = asText(d.expiresAt);
    const startDate = expiresAt ? dateDuLien(expiresAt, maintenant) : null;
    if (!startDate) continue;

    try {
      plan ??= await assurerPlanClub(db, env);
      const userId = asText(d.userId) ?? abonnement.id;
      let customerId = asText(d.bictorysCustomerId);
      if (!customerId) {
        const profil = await db.get(`users/${userId}`);
        customerId = await creerClientBictorys(env, {
          name: asText(d.userName),
          email: asText(d.userEmail),
          phone: asText(profil?.data.phone),
        });
        // Écrit tout de suite : un échec de l'étape suivante ne doit pas recréer le client demain.
        await db.update(abonnement.path, { bictorysCustomerId: customerId });
      }
      const subscriptionId = await creerAbonnementBictorys(env, {
        planId: plan.id,
        customerId,
        startDate,
        reference: referenceRenouvellement(userId),
      });
      await db.update(abonnement.path, {
        bictorysSubscriptionId: subscriptionId,
        bictorysPlanAmount: plan.montant,
        renewalLinkDate: startDate,
      });
      programmes += 1;
    } catch (error: unknown) {
      console.error('Renouvellement Club non programmé pour', abonnement.path, '—', error);
      echecs += 1;
    }
  }

  return { examines: candidats.length, programmes, echecs };
}

/** Un an de plus, compté depuis la fin actuelle si elle est future, depuis maintenant sinon. */
export function prolonger(expiresAt: string | undefined, maintenant: Date): string {
  const fin = expiresAt ? new Date(expiresAt) : null;
  const depart = fin && !Number.isNaN(fin.getTime()) && fin > maintenant ? fin : maintenant;
  const nouvelle = new Date(depart);
  nouvelle.setUTCFullYear(nouvelle.getUTCFullYear() + 1);
  return nouvelle.toISOString();
}
