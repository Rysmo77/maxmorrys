/**
 * LA SYNCHRONISATION D'AUDIENCE — Firestore ⇄ Brevo, dans cet ordre.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * FIRESTORE EST LA SOURCE, BREVO UNE COPIE — SAUF POUR LES RETRAITS
 *
 * La preuve du consentement vit dans Firestore (`newsletter.consentAt`, exigée par les règles
 * serveur) et `audience.ts` décide seul qui est démarchable. Brevo ne reçoit que l'adresse et
 * l'appartenance à la liste. MAIS une personne peut se retirer CHEZ BREVO (lien
 * `{{ unsubscribe }}` d'une campagne, bouton « se désabonner » de Gmail, plainte) : ce retrait
 * doit remonter, sinon le lendemain la synchronisation la ferait revenir. D'où deux temps :
 *
 *   1. `resynchroniserRetraits` — lit les contacts de la liste ; chaque contact en liste noire
 *      (ou désinscrit de la liste) est retiré dans Firestore par la MÊME fonction que notre
 *      lien signé (`desabonner` : `newsletter.unsubscribedAt`, `preferences.newsletter=false`).
 *      Appelé avant CHAQUE envoi réel de campagne, et chaque matin par le cron.
 *   2. `synchroniserAudience` — pousse ce qui manque à Brevo. INCRÉMENTAL : on compare à
 *      l'instantané lu en 1, et on n'écrit que les différences. Jamais avant 1 : pousser sans
 *      connaître les retraits de Brevo, c'est risquer de lever une liste noire légitime.
 *
 * ── LE RÉABONNEMENT, SEUL CAS OÙ L'ON LÈVE UNE LISTE NOIRE ──
 * Un retrait repris de Brevo laisse une trace `brevo_retraits/{empreinte}`. Si la même adresse
 * redevient audience APRÈS cette trace (le titulaire d'un compte recoche la préférence : c'est
 * un nouvel accord explicite), on pousse `emailBlacklisted: false` et on efface la trace. Sans
 * trace, on ne touche jamais à une liste noire de Brevo : elle peut venir d'une plainte ou d'un
 * rebond dur, et la lever dégraderait la délivrabilité de tous les autres.
 * (Un abonné SANS compte ne peut pas se réabonner : un document `newsletter` retiré exclut
 * l'adresse à vie, règle de `audience.ts` — inchangée.)
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * ⚠️ CE QUI N'ENTRE JAMAIS DANS CETTE SYNCHRONISATION
 *
 * Le dépôt porte SEPT collections qui contiennent des adresses e-mail. Deux sources seulement
 * recueillent un consentement marketing — `newsletter` et `users.preferences.newsletter` — et
 * c'est `audience.ts` qui les lit. Restent exclues, définitivement : `appointments`,
 * `messages` (l'adresse sert à répondre), `agency_leads`, `engagement_leads` (aucun
 * consentement), `transactions`, `club_subscriptions` (un achat n'est pas un consentement,
 * cf. `purchase.ts`) et `waitlist` (« Un seul e-mail, le jour de l'ouverture. Pas de lettre,
 * pas de relance. » — `waitlist-mail.ts`).
 *
 * ── POURQUOI UNE POUSSÉE, ET NON UN IMPORT ──
 * Brevo sait importer depuis une URL. On ne s'en sert pas : il faudrait exposer une liste
 * d'adresses consentantes derrière une URL joignable. Le Worker pousse contact par contact,
 * et seulement les différences ; rien n'est exposé.
 */
import type { Firestore } from '@mm/firestore-rest';
import { sha256Hex } from '@mm/shared';

import type { Env } from '../env';
import { lireAudience } from './audience';
import { brevoConfigure, ecrireContact, lireContactsListe, listePrincipale, type ContactLu } from './brevo-send';
import { desabonner } from './unsubscribe';

const TRACES = 'brevo_retraits';

export async function cheminTraceRetrait(email: string): Promise<string> {
  return `${TRACES}/${(await sha256Hex(email)).slice(0, 32)}`;
}

/** Les adresses dont un retrait a été repris de Brevo (et pas encore levé par un réabonnement). */
export async function adressesRetireesChezBrevo(db: Firestore): Promise<Set<string>> {
  const traces = await db.query({ collection: TRACES });
  return new Set(traces.map((t) => String(t.data.email ?? '')).filter((e) => e.includes('@')));
}

export type BilanRetraits =
  | { ok: true; lus: number; repris: number; instantane: Map<string, ContactLu> }
  | { ok: false; erreur: string };

/**
 * Temps 1 — fait remonter dans Firestore les retraits faits chez Brevo.
 *
 * Idempotent : un retrait déjà repris (trace présente) n'est pas rejoué. Rend l'instantané de
 * la liste, que la poussée réutilise sans relire Brevo.
 */
export async function resynchroniserRetraits(db: Firestore, env: Env, maintenant = new Date()): Promise<BilanRetraits> {
  if (!brevoConfigure(env)) return { ok: false, erreur: 'Brevo non configuré (BREVO_API_KEY, BREVO_LIST_ID ou BREVO_SENDER_EMAIL absent)' };

  const lecture = await lireContactsListe(env);
  if (!lecture.ok) return { ok: false, erreur: `lecture des contacts Brevo impossible : ${lecture.erreur}` };

  const instantane = new Map(lecture.contacts.map((c) => [c.email, c]));
  const deja = await adressesRetireesChezBrevo(db);
  let repris = 0;

  for (const c of lecture.contacts) {
    if (!(c.bloque || c.desinscritListe) || deja.has(c.email)) continue;
    const bilan = await desabonner(db, c.email);
    await db.set(await cheminTraceRetrait(c.email), {
      email: c.email,
      motif: c.bloque ? 'liste noire Brevo' : 'désinscrit de la liste Brevo',
      reprisLe: maintenant.toISOString(),
      inscriptionsMarquees: bilan.marques,
      compteMisAJour: bilan.compteMisAJour,
    });
    repris += 1;
  }

  return { ok: true, lus: lecture.contacts.length, repris, instantane };
}

export interface BilanSync {
  lus: number;
  repris: number;
  ajoutes: number;
  bloques: number;
  reabonnes: number;
  echecs: number;
  erreurs: string[];
}

/**
 * Temps 1 puis temps 2. Appelé par le cron de 08:00.
 *
 * La POUSSÉE n'a lieu que si l'envoi marketing est accordé (`MARKETING_ENVOI_REEL = oui`) :
 * tant que Max n'a pas ouvert le canal, aucune adresse ne quitte Firestore. La reprise des
 * retraits, elle, tourne dès que Brevo est configuré — respecter un retrait n'attend personne.
 */
export async function synchroniserAudience(db: Firestore, env: Env, maintenant = new Date()): Promise<BilanSync> {
  const bilan: BilanSync = { lus: 0, repris: 0, ajoutes: 0, bloques: 0, reabonnes: 0, echecs: 0, erreurs: [] };

  const retraits = await resynchroniserRetraits(db, env, maintenant);
  if (!retraits.ok) {
    // Absence de configuration ou Brevo injoignable : on ne pousse RIEN sans connaître ses retraits.
    bilan.erreurs.push(retraits.erreur);
    return bilan;
  }
  bilan.lus = retraits.lus;
  bilan.repris = retraits.repris;
  if (env.MARKETING_ENVOI_REEL !== 'oui') return bilan;

  const { audience, retires } = await lireAudience(db);
  const reprises = await adressesRetireesChezBrevo(db);
  const liste = listePrincipale(env);
  const noter = (email: string, erreur?: string) => {
    bilan.echecs += 1;
    if (bilan.erreurs.length < 5) bilan.erreurs.push(`${email} — ${erreur ?? 'échec'}`);
  };

  for (const d of audience) {
    const chez = retraits.instantane.get(d.email);
    const reabonnement = reprises.has(d.email);
    if (chez && !reabonnement) continue; // déjà dans la liste, rien à changer
    const r = await ecrireContact(env, { email: d.email, listIds: [liste], ...(reabonnement ? { bloque: false } : {}) });
    if (!r.ok) { noter(d.email, r.erreur); continue; }
    if (reabonnement) {
      await db.delete(await cheminTraceRetrait(d.email));
      bilan.reabonnes += 1;
    } else bilan.ajoutes += 1;
  }

  // Un retiré CHEZ NOUS que Brevo connaît encore sans liste noire : on l'y met. Un retiré que
  // Brevo ne connaît pas n'est PAS envoyé — aucune raison de confier son adresse à un tiers.
  for (const email of retires) {
    const chez = retraits.instantane.get(email);
    if (!chez || chez.bloque) continue;
    const r = await ecrireContact(env, { email, bloque: true });
    if (r.ok) bilan.bloques += 1;
    else noter(email, r.erreur);
  }

  return bilan;
}
