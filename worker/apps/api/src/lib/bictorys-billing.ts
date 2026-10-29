import type { Firestore } from '@mm/firestore-rest';

import type { Env } from '../env';
import { CLUB_PRICE, type ChargeCustomer } from './bictorys';
import { asText, toNumber } from './values';

/**
 * L'API DE FACTURATION RÉCURRENTE DE BICTORYS — clients, plans, abonnements.
 *
 * Ce qu'un « abonnement » Bictorys fait réellement (doc `createSubscription`) : à chaque
 * échéance, à 07:00 UTC, Bictorys ENVOIE UN LIEN DE PAIEMENT au client (e-mail, SMS ou
 * WhatsApp). Ce n'est pas un prélèvement : Wave et Orange Money n'ont pas de mandat, et rien
 * n'est débité tant que la personne ne paie pas le lien. Le renouvellement est donc automatique
 * côté RELANCE, jamais côté DÉBIT — c'est ce que disent les CGV, art. 5.4.
 *
 * Ces appels exigent la clé SECRÈTE (la publique répond 400 sur `/billing`).
 */

/** Préavis du lien : envoyé sept jours avant la fin de l'accès, pour laisser le temps de payer. */
export const LIEN_JOURS_AVANT = 7;

/** Le document qui garde l'id du plan Club créé chez Bictorys. Serveur seul. */
const CONFIG_PATH = '_config/bictorys';

function base(env: Env): string {
  return new URL(env.BICTORYS_API_URL).origin;
}

async function appel<T>(env: Env, chemin: string, corps?: unknown): Promise<T> {
  if (!env.BICTORYS_SECRET_KEY) throw new Error('BICTORYS_SECRET_KEY absente');
  const response = await fetch(`${base(env)}${chemin}`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'X-API-Key': env.BICTORYS_SECRET_KEY,
    },
    ...(corps === undefined ? {} : { body: JSON.stringify(corps) }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Bictorys ${chemin} → ${response.status} ${detail.slice(0, 300)}`);
  }
  const texte = await response.text();
  return (texte ? JSON.parse(texte) : {}) as T;
}

/**
 * Crée la fiche client. On ne la relit jamais (la clé n'a pas `CustomersRd`) : l'id est gardé
 * sur l'abonnement Club. Le pays est obligatoire — sans lui, Bictorys crée une fiche VIDE au
 * lieu de refuser (constaté le 29/10/2026).
 */
export async function creerClientBictorys(env: Env, client: ChargeCustomer): Promise<string> {
  const cree = await appel<{ id?: string }>(env, '/customer-management/v1/customers', {
    country: 'SN',
    locale: 'fr-FR',
    ...(client.name ? { name: client.name } : {}),
    ...(client.email ? { email: client.email } : {}),
    ...(client.phone ? { phone: client.phone } : {}),
  });
  if (!cree.id) throw new Error('Bictorys : client créé sans id');
  return cree.id;
}

/**
 * Le plan « Club annuel », créé une fois et mémorisé. Si le prix change dans le code, un NOUVEAU
 * plan est créé : les abonnements existants gardent l'ancien montant, ce qui est le bon défaut —
 * une hausse ne s'applique pas en silence à quelqu'un qui a souscrit à l'ancien prix.
 */
export async function assurerPlanClub(db: Firestore, env: Env): Promise<{ id: string; montant: number }> {
  const config = await db.get(CONFIG_PATH);
  const id = asText(config?.data.clubPlanId);
  if (id && toNumber(config?.data.clubPlanAmount) === CLUB_PRICE) return { id, montant: CLUB_PRICE };

  const plan = await appel<{ id?: string }>(env, '/billing/v1/subscription-plans', {
    name: 'Club des Digitos — annuel',
    reference: `club_digitos_annuel_${CLUB_PRICE}`,
    amount: CLUB_PRICE,
    currency: 'XOF',
    installmentIntervalDays: 365,
    customerMessage:
      "Renouvellement de ton abonnement annuel au Club des Digitos. Rien n'est prélevé sans ce paiement : si tu ne paies pas, ton accès s'arrête simplement à l'échéance.",
  });
  if (!plan.id) throw new Error('Bictorys : plan créé sans id');
  await db.set(CONFIG_PATH, { clubPlanId: plan.id, clubPlanAmount: CLUB_PRICE }, { merge: true });
  return { id: plan.id, montant: CLUB_PRICE };
}

/** Référence portée par l'abonnement — et, si Bictorys la propage, par chaque paiement. */
export function referenceRenouvellement(uid: string): string {
  return `clubrenew_${uid}`;
}

export async function creerAbonnementBictorys(
  env: Env,
  options: { planId: string; customerId: string; startDate: string; reference: string },
): Promise<string> {
  const cree = await appel<{ id?: string }>(env, '/billing/v1/subscriptions', {
    subscriptionPlanId: options.planId,
    customerId: options.customerId,
    startDate: options.startDate,
    reference: options.reference,
    notificationChannel: 'email',
  });
  if (!cree.id) throw new Error('Bictorys : abonnement créé sans id');
  return cree.id;
}

export async function annulerAbonnementBictorys(env: Env, subscriptionId: string): Promise<void> {
  await appel(env, `/billing/v1/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`);
}

/**
 * Le jour où Bictorys enverra le lien : sept jours avant la fin de l'accès, jamais avant demain
 * (l'API refuse une date passée, et « aujourd'hui » à 07:00 UTC peut déjà l'être).
 */
export function dateDuLien(expiresAt: string, maintenant: Date): string | null {
  const fin = new Date(expiresAt);
  if (Number.isNaN(fin.getTime())) return null;
  const lien = new Date(fin.getTime() - LIEN_JOURS_AVANT * 86_400_000);
  const demain = new Date(maintenant.getTime() + 86_400_000);
  const retenu = lien > demain ? lien : demain;
  if (retenu >= fin) return null; // l'accès finit avant qu'un lien puisse partir
  return retenu.toISOString().slice(0, 10);
}
