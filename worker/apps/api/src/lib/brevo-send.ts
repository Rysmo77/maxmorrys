/**
 * LE TRANSPORT BREVO — le canal MARKETING, et lui seul.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DEUX CANAUX, ET LA FRONTIÈRE EST LE RÉGIME (décision de Max, 29/10/2026, « option 2 »)
 *
 * `email.ts` envoie par le binding Cloudflare `EMAIL`, sans clé, depuis
 * `facture@mail.maxmorrys.me` : TOUT le transactionnel (facture, confirmations, rappels
 * d'échéance, accusés, certificat, bienvenue n°1, panier…). Ce module-ci envoie par Brevo,
 * depuis `lettre@lettre.maxmorrys.me` (domaine authentifié chez Brevo : SPF, DKIM `brevo1`,
 * DMARC) : la lettre et les séquences marketing.
 *
 * Pourquoi deux fournisseurs : la FAQ Cloudflare répond « No. Email Service supports
 * transactional email only » à la question du marketing. Une suspension pour usage interdit
 * couperait AUSSI la facture et les rappels — même binding, même compte. Brevo autorise le
 * marketing (c'est son métier) et isole la réputation : un incident marketing ne touche plus
 * le courrier promis par contrat.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DEUX API BREVO, CHACUNE POUR CE QU'ELLE EST
 *
 *  · CAMPAGNES (`/emailCampaigns`) pour la lettre : l'envoi groupé est l'usage prévu des
 *    campagnes par les CGU de Brevo, le lien de retrait `{{ unsubscribe }}` et l'en-tête
 *    `List-Unsubscribe` sont gérés par Brevo, et le retrait remonte chez nous (lecture des
 *    contacts en liste noire avant chaque envoi — `brevo-contacts.ts`).
 *  · ENVOI UNITAIRE (`/smtp/email`) pour ce qui est DÉCLENCHÉ par une personne : la bienvenue
 *    n°2/n°3 (Brevo range lui-même la série de bienvenue parmi ses usages transactionnels) et
 *    l'épreuve d'une campagne envoyée à Max. Notre lien de retrait signé et les en-têtes
 *    RFC 8058 y sont posés par `envoi-modele.ts`.
 *
 * Le HTML envoyé est TOUJOURS celui de nos gabarits (`email-design.ts`, `blocs.ts`,
 * `modeles.ts`) : aucun modèle ne vit chez Brevo, la copie se relit en revue de code.
 *
 * ⚠️ LE PLAFOND : le plan gratuit Brevo autorise 300 envois par jour, toutes API confondues.
 * `reserverQuotaBrevo` le tient côté Worker (`MARKETING_PLAFOND_JOUR`), avant tout appel.
 *
 * Aucune fonction ici ne LÈVE : un appel qui échoue rend `{ ok: false }`, et `reseau: true`
 * quand on ne sait pas si Brevo a reçu la requête (le cas où l'on ne doit PAS réessayer).
 */
import type { Firestore } from '@mm/firestore-rest';

import type { Env } from '../env';
import { fenetreJournaliere, UN_JOUR } from './rate-limit';

const API = 'https://api.brevo.com/v3';
const PLAFOND_JOUR_DEFAUT = 300;

/** Brevo est-il branché ? Clé, liste et expéditeur : sans l'un des trois, rien ne part. */
export function brevoConfigure(env: Pick<Env, 'BREVO_API_KEY' | 'BREVO_LIST_ID' | 'BREVO_SENDER_EMAIL'>): boolean {
  return Boolean(env.BREVO_API_KEY) && Number(env.BREVO_LIST_ID) > 0 && Boolean(env.BREVO_SENDER_EMAIL?.includes('@'));
}

export function listePrincipale(env: Pick<Env, 'BREVO_LIST_ID'>): number {
  return Number(env.BREVO_LIST_ID);
}

/** L'expéditeur marketing — une adresse du domaine authentifié chez Brevo, jamais `mail.`. */
export function expediteurBrevo(env: Env): { email: string; name: string } {
  return { email: env.BREVO_SENDER_EMAIL as string, name: env.EMAIL_FROM_NAME || 'Max-Morrys' };
}

export interface ReponseBrevo {
  ok: boolean;
  status: number;
  corps: Record<string, unknown>;
  erreur?: string;
  /** `true` : la requête a pu partir sans qu'on sache si Brevo l'a traitée. */
  reseau?: boolean;
}

export async function appelBrevo(env: Env, methode: 'GET' | 'POST' | 'PUT' | 'DELETE', chemin: string, corps?: unknown): Promise<ReponseBrevo> {
  if (!env.BREVO_API_KEY) return { ok: false, status: 0, corps: {}, erreur: 'BREVO_API_KEY absente' };
  try {
    const r = await fetch(`${API}${chemin}`, {
      method: methode,
      headers: {
        'api-key': env.BREVO_API_KEY,
        accept: 'application/json',
        ...(corps === undefined ? {} : { 'content-type': 'application/json' }),
      },
      ...(corps === undefined ? {} : { body: JSON.stringify(corps) }),
    });
    const brut = r.status === 204 ? '' : await r.text();
    let json: Record<string, unknown> = {};
    try { json = brut ? (JSON.parse(brut) as Record<string, unknown>) : {}; } catch { json = { brut: brut.slice(0, 200) }; }
    if (r.ok) return { ok: true, status: r.status, corps: json };
    return { ok: false, status: r.status, corps: json, erreur: `${r.status} ${String(json.message ?? json.code ?? brut).slice(0, 160)}` };
  } catch (error: unknown) {
    return { ok: false, status: 0, corps: {}, reseau: true, erreur: error instanceof Error ? error.message : String(error) };
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   LE PLAFOND JOURNALIER — 300 envois Brevo par jour UTC (plan gratuit)
   ────────────────────────────────────────────────────────────────────────── */

export function plafondJour(env: Pick<Env, 'MARKETING_PLAFOND_JOUR'>): number {
  const n = Number(env.MARKETING_PLAFOND_JOUR);
  return Number.isInteger(n) && n > 0 ? n : PLAFOND_JOUR_DEFAUT;
}

const cleQuota = () => `_ratelimits/marketing_jour_${fenetreJournaliere()}`;

/**
 * Réserve jusqu'à `n` envois sur le plafond du jour, AVANT d'appeler Brevo. Renvoie combien
 * sont accordés. Partagé par les campagnes, la bienvenue et les épreuves : Brevo compte les
 * trois sur le même quota.
 */
export async function reserverQuotaBrevo(db: Firestore, n: number, plafond: number): Promise<number> {
  return db.runTransaction<number>(async (tx) => {
    const snap = await tx.get(cleQuota());
    const deja = Number(snap?.data.count) || 0;
    const accorde = Math.max(0, Math.min(n, plafond - deja));
    if (accorde > 0) {
      tx.set(cleQuota(), { count: deja + accorde, expireAt: new Date(Date.now() + 2 * UN_JOUR).toISOString() }, { merge: true });
    }
    return accorde;
  });
}

/** Rend des envois réservés mais certainement pas partis (Brevo a refusé la requête). */
export async function libererQuotaBrevo(db: Firestore, n: number): Promise<void> {
  if (n <= 0) return;
  await db.runTransaction<void>(async (tx) => {
    const snap = await tx.get(cleQuota());
    const deja = Number(snap?.data.count) || 0;
    tx.set(cleQuota(), { count: Math.max(0, deja - n) }, { merge: true });
  });
}

/* ─────────────────────────────────────────────────────────────────────────────
   ENVOI UNITAIRE — bienvenue n°2/n°3, épreuves de campagne
   ────────────────────────────────────────────────────────────────────────── */

export interface MessageBrevo {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
  tags?: string[];
}

export async function envoyerUnitaireBrevo(env: Env, msg: MessageBrevo): Promise<{ sent: boolean; error?: string }> {
  if (!brevoConfigure(env)) return { sent: false, error: 'Brevo non configuré' };
  const r = await appelBrevo(env, 'POST', '/smtp/email', {
    sender: expediteurBrevo(env),
    to: [{ email: msg.to }],
    subject: msg.subject,
    htmlContent: msg.html,
    textContent: msg.text,
    ...(msg.headers && Object.keys(msg.headers).length ? { headers: msg.headers } : {}),
    ...(msg.tags?.length ? { tags: msg.tags } : {}),
  });
  return r.ok ? { sent: true } : { sent: false, error: r.erreur };
}

/* ─────────────────────────────────────────────────────────────────────────────
   CONTACTS ET LISTES
   ────────────────────────────────────────────────────────────────────────── */

export interface ContactLu {
  email: string;
  /** En liste noire e-mail (retrait global, plainte, rebond dur). */
  bloque: boolean;
  /** Désinscrit de la liste principale sans être en liste noire. */
  desinscritListe: boolean;
}

/**
 * Lit TOUS les contacts de la liste principale, page par page (500 par page, maximum de l'API).
 * Une lecture complète plutôt qu'incrémentale : c'est elle qui fait remonter les retraits, et
 * une lecture incrémentale mal bornée en manquerait un sans que rien ne le signale.
 */
export async function lireContactsListe(env: Env, maxPages = 40): Promise<{ ok: true; contacts: ContactLu[] } | { ok: false; erreur: string }> {
  const liste = listePrincipale(env);
  const contacts: ContactLu[] = [];
  for (let page = 0; page < maxPages; page++) {
    const r = await appelBrevo(env, 'GET', `/contacts/lists/${liste}/contacts?limit=500&offset=${page * 500}`);
    if (!r.ok) return { ok: false, erreur: r.erreur ?? 'lecture impossible' };
    const lus = Array.isArray(r.corps.contacts) ? (r.corps.contacts as Array<Record<string, unknown>>) : [];
    for (const c of lus) {
      const email = String(c.email ?? '').trim().toLowerCase();
      if (!email.includes('@')) continue;
      const desinscrits = Array.isArray(c.listUnsubscribed) ? (c.listUnsubscribed as unknown[]).map(Number) : [];
      contacts.push({ email, bloque: c.emailBlacklisted === true, desinscritListe: desinscrits.includes(liste) });
    }
    if (lus.length < 500) return { ok: true, contacts };
  }
  return { ok: true, contacts };
}

/**
 * Crée ou met à jour un contact (`updateEnabled`) et l'ajoute aux listes données.
 *
 * AUCUN ATTRIBUT n'est envoyé : la segmentation se fait chez nous (`audience.ts`), Brevo ne
 * détient que l'adresse, l'appartenance aux listes et l'état de retrait. Moins de données chez
 * un tiers, et plus d'échec silencieux sur un attribut non déclaré dans le compte (Brevo
 * rejette le contact entier dans ce cas).
 *
 * `bloque` : `true` met en liste noire, `false` l'en retire (réabonnement explicite), et
 * `undefined` laisse l'état de Brevo tel quel — le défaut, parce qu'on ne lève jamais une liste
 * noire sans savoir pourquoi elle a été posée.
 */
export async function ecrireContact(env: Env, contact: { email: string; listIds?: number[]; bloque?: boolean }): Promise<ReponseBrevo> {
  return appelBrevo(env, 'POST', '/contacts', {
    email: contact.email,
    updateEnabled: true,
    ...(contact.listIds?.length ? { listIds: contact.listIds } : {}),
    ...(contact.bloque === undefined ? {} : { emailBlacklisted: contact.bloque }),
  });
}

/** Crée une liste dans le dossier de la liste principale. Renvoie son identifiant. */
export async function creerListe(env: Env, nom: string): Promise<{ ok: true; id: number } | { ok: false; erreur: string }> {
  const principale = await appelBrevo(env, 'GET', `/contacts/lists/${listePrincipale(env)}`);
  if (!principale.ok) return { ok: false, erreur: principale.erreur ?? 'liste principale illisible' };
  const folderId = Number(principale.corps.folderId);
  if (!(folderId > 0)) return { ok: false, erreur: 'dossier de la liste principale inconnu' };
  const r = await appelBrevo(env, 'POST', '/contacts/lists', { name: nom.slice(0, 120), folderId });
  const id = Number(r.corps.id);
  return r.ok && id > 0 ? { ok: true, id } : { ok: false, erreur: r.erreur ?? 'liste non créée' };
}

/* ─────────────────────────────────────────────────────────────────────────────
   CAMPAGNES
   ────────────────────────────────────────────────────────────────────────── */

/** Le jeton de retrait que Brevo remplace, dans une campagne, par son lien de désinscription. */
export const JETON_RETRAIT_BREVO = '{{ unsubscribe }}';

export async function creerCampagne(
  env: Env,
  c: { nom: string; objet: string; preheader: string; html: string; listeId: number; tag: string },
): Promise<{ ok: true; id: number } | { ok: false; erreur: string }> {
  const r = await appelBrevo(env, 'POST', '/emailCampaigns', {
    name: c.nom.slice(0, 120),
    subject: c.objet,
    previewText: c.preheader,
    sender: expediteurBrevo(env),
    htmlContent: c.html,
    recipients: { listIds: [c.listeId] },
    tag: c.tag,
    inlineImageActivation: false,
  });
  const id = Number(r.corps.id);
  return r.ok && id > 0 ? { ok: true, id } : { ok: false, erreur: r.erreur ?? 'campagne non créée' };
}

export async function envoyerCampagneMaintenant(env: Env, id: number): Promise<ReponseBrevo> {
  return appelBrevo(env, 'POST', `/emailCampaigns/${id}/sendNow`);
}
