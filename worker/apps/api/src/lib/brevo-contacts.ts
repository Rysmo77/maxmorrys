/**
 * LA SYNCHRONISATION D'AUDIENCE — Firestore vers Brevo.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * POURQUOI BREVO SEUL, ET PLUS LISTMONK
 *
 * Listmonk a été installé puis retiré, et l'erreur mérite d'être écrite plutôt qu'effacée.
 * Il RELAYAIT vers Brevo : il n'apportait donc rien sur le plafond de 300 envois par jour,
 * qui est la contrainte dure du programme. Brevo ne facture pas au contact — la raison
 * classique d'auto-héberger tombait aussi. Et surtout, Listmonk envoie des campagnes mais
 * ne sait pas faire de SÉQUENCES, alors que le plan en contient deux : la bienvenue en
 * trois e-mails et le nurture de devis. L'outil ne savait pas faire la moitié du plan.
 *
 * L'argument restant — « les données restent chez nous » — était plus faible qu'il n'en
 * avait l'air : la preuve du consentement vit dans Firestore (`newsletter.consentAt`,
 * exigée par les règles serveur), pas dans l'outil d'envoi. Listmonk n'était qu'une copie
 * intermédiaire de plus, susceptible de diverger de la source.
 *
 * ── POURQUOI UNE POUSSÉE, ET NON UN IMPORT ──
 * Brevo sait importer depuis une URL. On ne s'en sert pas : cela demanderait d'exposer une
 * liste d'adresses consentantes derrière une URL joignable. Le Worker pousse contact par
 * contact ; rien n'est exposé.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * ⚠️ CE QUI N'ENTRE JAMAIS DANS CETTE SYNCHRONISATION
 *
 * Le dépôt porte SEPT collections qui contiennent des adresses e-mail. Une seule recueille un
 * consentement marketing. Les six autres sont donc exclues, définitivement :
 *
 *   · `appointments`, `messages`  — l'adresse sert à répondre, pas à démarcher. La liste
 *     blanche de `firestore.rules` n'accepte même pas de champ `consent`.
 *   · `agency_leads`, `engagement_leads` — aucun consentement collecté ; l'adresse y est
 *     même optionnelle, parce que le canal réel de ce segment est WhatsApp.
 *   · `transactions`, `club_subscriptions` — un achat n'est pas un consentement marketing.
 *     C'est précisément la confusion que `purchase.ts` interdit en toutes lettres.
 *   · `waitlist` — engagement OPPOSABLE écrit dans `waitlist-mail.ts` : « Un seul e-mail, le
 *     jour de l'ouverture. Pas de lettre, pas de relance. » Ces adresses ne sont pas
 *     démarchables, quelle que soit l'envie qu'on en ait.
 *
 * Restent DEUX sources, et elles seules : la collection `newsletter` (case cochée, horodatée,
 * exigée par les règles Firestore) et `users.preferences.newsletter === true`, qui est un
 * opt-in strict — `undefined` vaut NON, comme `notifyOnPublish`.
 */
import type { Firestore } from '@mm/firestore-rest';

import type { Env } from '../env';
import { normaliserAdresse } from './unsubscribe';

/**
 * Un contact tel que Brevo l'attend.
 *
 * ⚠️ Les clés d'attributs sont en MAJUSCULES et doivent avoir été DÉCLARÉES dans le compte
 * (Contacts → Attributs) avant tout envoi. Brevo rejette un attribut inconnu au lieu de
 * l'ignorer : un champ ajouté ici sans être déclaré là-bas fait échouer le contact entier,
 * silencieusement du point de vue de l'appelant.
 */
export interface ContactBrevo {
  email: string;
  /** `false` — le contact reçoit ; `true` pour un désabonné, que Brevo met en liste noire. */
  bloque: boolean;
  attributes: Record<string, unknown>;
}

export interface BilanSync {
  candidats: number;
  pousses: number;
  bloques: number;
  echecs: number;
  erreurs: string[];
}

/**
 * Rassemble les adresses réellement démarchables.
 *
 * DÉDUPLIQUE PAR ADRESSE NORMALISÉE. Une même personne peut s'être inscrite à la lettre
 * ET avoir coché la préférence de son compte ; deux entrées produiraient deux envois, et
 * c'est le genre de doublon qu'un destinataire remarque immédiatement.
 *
 * La version du compte l'emporte sur celle de la lettre : elle porte un nom, une langue et
 * une ancienneté, là où l'inscription anonyme n'a que l'adresse.
 */
/**
 * Une date au format que Brevo attend : `YYYY-MM-DD`, jamais un horodatage complet.
 *
 * Brevo REJETTE le contact entier si un attribut de type date ne parse pas — il ne l'ignore
 * pas. Nos valeurs sont des ISO 8601 avec l'heure ; les passer telles quelles ferait échouer
 * chaque contact portant une date, c'est-à-dire tous.
 */
function jour(valeur: unknown): string {
  const s = typeof valeur === 'string' ? valeur.slice(0, 10) : '';
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
}

export async function rassemblerAudience(db: Firestore): Promise<ContactBrevo[]> {
  const par_adresse = new Map<string, ContactBrevo>();

  // ── Source 1 : la collection `newsletter` ──
  const abonnes = await db.query({
    collection: 'newsletter',
    where: [{ field: 'consent', op: '==', value: true }],
  });
  for (const a of abonnes) {
    const email = normaliserAdresse(String(a.data.email ?? ''));
    if (!email.includes('@')) continue;
    // Un désabonné n'est pas OMIS : il est poussé avec `emailBlacklisted`, pour que Brevo le
    // connaisse et refuse de l'inclure. L'omettre le laisserait ressortir au prochain import.
    par_adresse.set(email, {
      email,
      bloque: Boolean(a.data.unsubscribedAt),
      attributes: {
        SOURCE: String(a.data.source ?? 'inconnue'),
        LOCALE: String(a.data.locale ?? 'fr'),
        CONSENTI_LE: jour(a.data.consentAt ?? a.data.subscribedAt),
        COMPTE: false,
      },
    });
  }

  // ── Source 2 : les comptes ayant coché la préférence ──
  const comptes = await db.query({
    collection: 'users',
    where: [{ field: 'preferences.newsletter', op: '==', value: true }],
  });
  for (const u of comptes) {
    const email = normaliserAdresse(String(u.data.email ?? ''));
    if (!email.includes('@')) continue;

    /*
     * LE PERSONNEL N'EST PAS UNE AUDIENCE. Un compte `admin` ou `support` recevrait ses
     * propres campagnes, fausserait chaque taux d'ouverture, et un test grandeur nature
     * finirait par partir depuis un compte de service.
     */
    const role = String(u.data.role ?? 'student');
    if (role !== 'student') continue;

    const prefs = (u.data.preferences ?? {}) as Record<string, unknown>;
    par_adresse.set(email, {
      email,
      bloque: false,
      attributes: {
        PRENOM: String(u.data.firstName ?? u.data.displayName ?? '').trim() || email.split('@')[0],
        NOM: String(u.data.lastName ?? '').trim(),
        SOURCE: 'compte',
        LOCALE: prefs.language === 'en' ? 'en' : 'fr',
        COMPTE: true,
        VILLE: String(u.data.city ?? ''),
        INSCRIT_LE: jour(u.data.createdAt),
        /* Sert aux segments : « les inscrits qui n'ont jamais commencé », par exemple. */
        ONBOARDING: Boolean(u.data.onboardingCompleted),
      },
    });
  }

  return [...par_adresse.values()];
}

/**
 * Pousse un contact vers Brevo.
 *
 * `POST /v3/contacts` avec `updateEnabled` : Brevo crée ou met à jour selon l'adresse. Sans
 * ce drapeau, une deuxième synchronisation échouerait sur chaque contact déjà connu, et le
 * bilan ne montrerait plus que des erreurs — l'état où l'on cesse de lire les journaux.
 *
 * ⚠️ `emailBlacklisted` est envoyé DANS LES DEUX SENS, jamais seulement à `true`. Un contact
 * qui se réabonne après s'être retiré doit voir son drapeau retomber ; ne l'écrire qu'au
 * retrait le laisserait bloqué à vie, sans que rien ne le signale.
 */
async function pousser(env: Env, contact: ContactBrevo): Promise<{ ok: boolean; erreur?: string }> {
  try {
    const reponse = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        'api-key': env.BREVO_API_KEY as string,
      },
      body: JSON.stringify({
        email: contact.email,
        attributes: contact.attributes,
        listIds: [Number(env.BREVO_LIST_ID ?? 0)],
        emailBlacklisted: contact.bloque,
        updateEnabled: true,
      }),
    });
    // 201 = créé, 204 = mis à jour. Les deux sont des succès.
    if (reponse.ok || reponse.status === 204) return { ok: true };
    const corps = await reponse.text();
    return { ok: false, erreur: `${reponse.status} ${corps.slice(0, 120)}` };
  } catch (error: unknown) {
    return { ok: false, erreur: error instanceof Error ? error.message : String(error) };
  }
}

export async function synchroniserAudience(db: Firestore, env: Env): Promise<BilanSync> {
  const bilan: BilanSync = { candidats: 0, pousses: 0, bloques: 0, echecs: 0, erreurs: [] };

  if (!env.BREVO_API_KEY || !env.BREVO_LIST_ID) {
    // Absence de configuration : ce n'est pas une panne, c'est un canal non branché. On le
    // dit et on sort, comme `sendEmail` le fait quand son binding manque.
    bilan.erreurs.push('Brevo non configuré (BREVO_API_KEY ou BREVO_LIST_ID absent)');
    return bilan;
  }

  const audience = await rassemblerAudience(db);
  bilan.candidats = audience.length;

  for (const contact of audience) {
    const r = await pousser(env, contact);
    if (r.ok) {
      if (contact.bloque) bilan.bloques += 1;
      else bilan.pousses += 1;
    } else {
      bilan.echecs += 1;
      // On garde les cinq premiers motifs : au-delà, c'est le même défaut répété, et une
      // journalisation qui déborde ne se lit plus.
      if (bilan.erreurs.length < 5) bilan.erreurs.push(`${contact.email} — ${r.erreur}`);
    }
  }

  return bilan;
}
