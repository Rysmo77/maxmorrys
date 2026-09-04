/**
 * LA SYNCHRONISATION D'AUDIENCE — Firestore vers Listmonk.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * POURQUOI UNE POUSSÉE, ET NON UNE LECTURE
 *
 * Listmonk sait importer depuis un CSV ou une URL. On ne s'en sert pas : cela demanderait
 * d'exposer publiquement une liste d'adresses consentantes, ne serait-ce que derrière un
 * jeton. Le Worker pousse, Listmonk n'a rien à venir chercher, et aucune adresse ne transite
 * par une URL joignable de l'extérieur.
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

/** Un abonné tel que Listmonk l'attend. */
export interface AbonneListmonk {
  email: string;
  name: string;
  /** `enabled` — un abonné poussé ici a déjà consenti ; `blocklisted` pour un désabonné. */
  status: 'enabled' | 'blocklisted';
  /** Attributs libres, exploitables par les segments SQL de Listmonk. */
  attribs: Record<string, unknown>;
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
export async function rassemblerAudience(db: Firestore): Promise<AbonneListmonk[]> {
  const par_adresse = new Map<string, AbonneListmonk>();

  // ── Source 1 : la collection `newsletter` ──
  const abonnes = await db.query({
    collection: 'newsletter',
    where: [{ field: 'consent', op: '==', value: true }],
  });
  for (const a of abonnes) {
    const email = normaliserAdresse(String(a.data.email ?? ''));
    if (!email.includes('@')) continue;
    // Un désabonné n'est pas OMIS : il est poussé en `blocklisted`, pour que Listmonk le
    // connaisse et refuse de l'inclure. L'omettre le laisserait ressortir au prochain import.
    const sorti = Boolean(a.data.unsubscribedAt);
    par_adresse.set(email, {
      email,
      name: email.split('@')[0],
      status: sorti ? 'blocklisted' : 'enabled',
      attribs: {
        source: a.data.source ?? 'inconnue',
        locale: a.data.locale ?? 'fr',
        consenti_le: a.data.consentAt ?? a.data.subscribedAt ?? null,
        compte: false,
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
      name: String(u.data.displayName ?? u.data.firstName ?? email.split('@')[0]),
      status: 'enabled',
      attribs: {
        source: 'compte',
        locale: prefs.language === 'en' ? 'en' : 'fr',
        compte: true,
        ville: u.data.city ?? null,
        inscrit_le: u.data.createdAt ?? null,
        /* Sert aux segments : « les inscrits qui n'ont jamais commencé », par exemple. */
        onboarding: Boolean(u.data.onboardingCompleted),
      },
    });
  }

  return [...par_adresse.values()];
}

/**
 * Pousse un abonné vers Listmonk.
 *
 * `PUT /api/subscribers` avec `upsert` : Listmonk crée ou met à jour selon l'adresse. Sans
 * upsert, une deuxième synchronisation échouerait sur chaque abonné déjà connu, et le bilan
 * ne montrerait plus que des erreurs — l'état où l'on cesse de lire les journaux.
 */
async function pousser(env: Env, abonne: AbonneListmonk): Promise<{ ok: boolean; erreur?: string }> {
  const url = `${env.LISTMONK_URL}/api/subscribers`;
  try {
    const reponse = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `token ${env.LISTMONK_API_USER}:${env.LISTMONK_API_TOKEN}`,
      },
      body: JSON.stringify({
        email: abonne.email,
        name: abonne.name,
        status: abonne.status,
        lists: [Number(env.LISTMONK_LIST_ID ?? 1)],
        attribs: abonne.attribs,
        preconfirm_subscriptions: true,
        upsert: true,
      }),
    });
    if (reponse.ok) return { ok: true };
    const corps = await reponse.text();
    return { ok: false, erreur: `${reponse.status} ${corps.slice(0, 120)}` };
  } catch (error: unknown) {
    return { ok: false, erreur: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * La passe de synchronisation, appelée par le cron de 08:00.
 *
 * NE LÈVE JAMAIS. Elle partage le cron avec les rappels d'échéance et les relances de devis ;
 * une exception ici empêcherait les deux autres de s'exécuter — et ceux-là portent des
 * promesses contractuelles, pas du marketing.
 */
export async function synchroniserAudience(db: Firestore, env: Env): Promise<BilanSync> {
  const bilan: BilanSync = { candidats: 0, pousses: 0, bloques: 0, echecs: 0, erreurs: [] };

  if (!env.LISTMONK_URL || !env.LISTMONK_API_TOKEN) {
    // Absence de configuration : ce n'est pas une panne, c'est un canal non branché. On le
    // dit et on sort, comme `sendEmail` le fait quand son binding manque.
    bilan.erreurs.push('Listmonk non configuré (LISTMONK_URL ou LISTMONK_API_TOKEN absent)');
    return bilan;
  }

  const audience = await rassemblerAudience(db);
  bilan.candidats = audience.length;

  for (const abonne of audience) {
    const r = await pousser(env, abonne);
    if (r.ok) {
      if (abonne.status === 'blocklisted') bilan.bloques += 1;
      else bilan.pousses += 1;
    } else {
      bilan.echecs += 1;
      // On garde les cinq premiers motifs : au-delà, c'est le même défaut répété, et une
      // journalisation qui déborde ne se lit plus.
      if (bilan.erreurs.length < 5) bilan.erreurs.push(`${abonne.email} — ${r.erreur}`);
    }
  }

  return bilan;
}
