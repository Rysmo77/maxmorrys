/**
 * L'ENVOI PAR MODÈLE BREVO — le second canal, et ses garde-fous.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DEUX CANAUX, ET LA FRONTIÈRE N'EST PAS TECHNIQUE
 *
 * `email.ts` envoie par le binding Cloudflare, sans aucune clé, depuis
 * `facture@mail.maxmorrys.me`. Il porte les HUIT courriers qui existaient avant : facture,
 * confirmation d'achat, rappel d'échéance, relance de devis, liste d'attente, accusé de
 * rendez-vous, réponse à un message. Ils ne bougent pas.
 *
 * Ce module-ci envoie par Brevo, depuis `lettre@lettre.maxmorrys.me`, en appelant des MODÈLES
 * dont la copie vit chez Brevo. Il porte les courriers déclenchés qui n'existaient pas.
 *
 * La frontière entre les deux n'est pas « ancien / nouveau » : c'est la CRITICITÉ. Ce qui est
 * promis par un contrat reste sur Cloudflare, en DMARC `p=reject`, hors d'atteinte d'un
 * incident marketing. Le reste passe par Brevo.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * ⚠️ LE RÉGIME EST VÉRIFIÉ ICI, PAS À L'APPEL
 *
 * Un courrier `marketing` n'est PAS envoyé sans consentement, et le module le vérifie
 * lui-même plutôt que de faire confiance à l'appelant. C'est délibéré : les appelants sont
 * dispersés — un webhook, un cron, une callable — et il suffirait d'en oublier un pour
 * envoyer une sollicitation à quelqu'un qui ne l'a pas demandée. Un seul endroit décide.
 *
 * Le lien de retrait est injecté par le module, jamais fourni par l'appelant, pour la même
 * raison. `lienDesabonnement()` n'avait AUCUN appelant avant ce module : la route existait,
 * mais rien n'y menait.
 *
 * Un courrier `transactionnel` ne porte PAS ce lien : proposer de se désabonner d'une facture
 * laisserait croire qu'on peut la refuser.
 */
import type { Firestore } from '@mm/firestore-rest';

import type { Env } from '../env';
import { lienDesabonnement, normaliserAdresse } from './unsubscribe';

/** Les modèles créés par `scripts/brevo-templates.mjs`. Les identifiants sont stables. */
export const MODELES = {
  certificat: { fr: 1, en: 2, regime: 'transactionnel' },
  panierAbandonne: { fr: 3, en: 4, regime: 'transactionnel' },
  bienvenue1: { fr: 5, en: 6, regime: 'transactionnel' },
  accuseDevis: { fr: 7, en: 8, regime: 'transactionnel' },
  accuseAgence: { fr: 9, en: 10, regime: 'transactionnel' },
  bienvenue2: { fr: 11, en: 12, regime: 'marketing' },
  bienvenue3: { fr: 13, en: 14, regime: 'marketing' },
  quotaRysmo: { fr: 15, en: 16, regime: 'marketing' },
  serieRompue: { fr: 17, en: 18, regime: 'marketing' },
  reactivation: { fr: 19, en: 20, regime: 'marketing' },
  nurtureDevis: { fr: 21, en: 22, regime: 'marketing' },
} as const;

export type CleModele = keyof typeof MODELES;
export type Langue = 'fr' | 'en';

export interface Envoi {
  modele: CleModele;
  to: string;
  langue: Langue;
  /** Variables du modèle. Les clés correspondent aux `{{ params.xxx }}` du gabarit. */
  params: Record<string, unknown>;
}

export type IssueEnvoi = 'envoye' | 'sansConsentement' | 'nonConfigure' | 'echec';

export interface Resultat {
  issue: IssueEnvoi;
  erreur?: string;
}

/** Le pied de retrait, dans la langue du destinataire. */
const RETRAIT = {
  fr: {
    raison: 'Tu reçois ce message parce que tu as accepté de recevoir la lettre.',
    libelle: 'Me désabonner',
  },
  en: {
    raison: 'You’re getting this because you agreed to receive the newsletter.',
    libelle: 'Unsubscribe',
  },
} as const;

/**
 * Le contact a-t-il consenti au marketing ?
 *
 * DEUX SOURCES, comme la synchronisation : la collection `newsletter` (abonnés sans compte)
 * et `users.preferences.newsletter`. Un désabonnement sur l'une vaut refus, même si l'autre
 * dit oui — c'est le retrait le plus récent qui fait foi, et dans le doute on n'envoie pas.
 */
export async function aConsenti(db: Firestore, email: string): Promise<boolean> {
  const adresse = normaliserAdresse(email);

  const abonnes = await db.query({
    collection: 'newsletter',
    where: [{ field: 'email', op: '==', value: adresse }],
  });
  // Un seul document retiré suffit à refuser : on ne cherche pas un « oui » ailleurs.
  if (abonnes.some((a) => a.data.unsubscribedAt)) return false;
  if (abonnes.some((a) => a.data.consent === true)) return true;

  const comptes = await db.query({
    collection: 'users',
    where: [{ field: 'email', op: '==', value: adresse }],
    limit: 1,
  });
  const prefs = (comptes[0]?.data.preferences ?? {}) as Record<string, unknown>;
  return prefs.newsletter === true;
}

/**
 * Envoie un courrier par modèle Brevo.
 *
 * NE LÈVE JAMAIS — même arbitrage que `sendEmail`, et pour la même raison : plusieurs
 * appelants sont sur le chemin de l'argent (le webhook de paiement, notamment). Faire échouer
 * un webhook parce qu'une API tierce a hoqueté transformerait un incident sans conséquence en
 * rejeu d'un paiement déjà encaissé.
 *
 * `db` n'est requis que pour les modèles marketing, dont il faut vérifier le consentement.
 */
export async function envoyerModele(
  env: Env,
  envoi: Envoi,
  db?: Firestore,
): Promise<Resultat> {
  if (!env.BREVO_API_KEY) return { issue: 'nonConfigure', erreur: 'BREVO_API_KEY absente' };
  if (!envoi.to || !envoi.to.includes('@')) return { issue: 'echec', erreur: 'destinataire invalide' };

  const modele = MODELES[envoi.modele];
  const params: Record<string, unknown> = { ...envoi.params };

  if (modele.regime === 'marketing') {
    if (!db) return { issue: 'echec', erreur: 'consentement invérifiable : db absente' };
    if (!(await aConsenti(db, envoi.to))) return { issue: 'sansConsentement' };

    // Le lien vient du module, jamais de l'appelant : un appelant qui l'oublierait
    // produirait un courrier marketing sans retrait, ce qui est illégal.
    const t = RETRAIT[envoi.langue];
    params.desabonnement = `${await lienDesabonnement(env, envoi.to)}&l=${envoi.langue}`;
    params.raison = t.raison;
    params.libelleDesabonnement = t.libelle;
  }

  try {
    const reponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': env.BREVO_API_KEY,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        to: [{ email: envoi.to }],
        templateId: modele[envoi.langue],
        params,
      }),
    });
    if (reponse.ok) return { issue: 'envoye' };
    const corps = await reponse.text();
    return { issue: 'echec', erreur: `${reponse.status} ${corps.slice(0, 140)}` };
  } catch (error: unknown) {
    return { issue: 'echec', erreur: error instanceof Error ? error.message : String(error) };
  }
}
