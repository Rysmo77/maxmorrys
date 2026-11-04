import type { DocSnapshot, Firestore } from '@mm/firestore-rest';

import { notifierAbonnes } from '../handlers/notifyOnPublish';

/**
 * LA VALIDATION D'UN ARTICLE DEPUIS TELEGRAM — la logique, sans le transport.
 *
 * Le circuit : `blog-publish.mjs --apply` dépose un brouillon marqué `pretAValider: true` ;
 * n8n (WF-BLOG-NOTIFY) envoie la carte à Max ; son clic ✅ / ❌ arrive dans WF-TG-ROUTER, qui
 * appelle `POST /blog/validation` (route `blogValidationRoute.ts`). Rien d'autre n'appelle
 * cette logique : elle est le seul chemin, hors de l'admin, qui fait passer un article en
 * `published` — et elle ne le fait que sur un clic.
 *
 * ⚠️ L'ACCÈS REST PAR COMPTE DE SERVICE CONTOURNE `firestore.rules`. Toutes les gardes sont ici.
 */

export type Decision = 'publier' | 'refuser' | 'raison' | 'lister' | 'marquer';

export interface Demande {
  /** Vide pour `lister`, obligatoire sinon. */
  id: string;
  decision: Decision;
  raison?: string;
  /** `marquer` : identifiants Telegram de la carte et de la pièce jointe. */
  messageId?: string;
  documentMessageId?: string;
}

/** Ce que la carte Telegram montre d'un brouillon (`lister`). */
export interface ArticleAValider {
  id: string;
  title: string;
  slug: string;
  category: string;
  focusKeyword: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  content: string;
  coverImage: string;
  readTime: number | null;
  test: boolean;
}

export type ErreurValidation =
  | 'introuvable'
  | 'pasUnBrouillon'
  | 'nonSoumis'
  | 'sansSlug'
  | 'pasRefuse'
  | 'conflit';

export type Bilan =
  | {
      ok: true;
      decision: Decision;
      id: string;
      titre: string;
      slug: string;
      url: string;
      /** Article publié : nombre d'abonnés prévenus (0 si déjà prévenus). */
      notified?: number;
      alreadyNotified?: boolean;
      /** L'article était déjà en ligne : rien n'a été réécrit. */
      dejaPublie?: boolean;
      /** Article de test (`test: true`) : tout a été vérifié, RIEN n'a été écrit. */
      simulation?: boolean;
      /** Simulation : combien d'abonnés auraient été prévenus. */
      abonnes?: number;
      /** La notification a échoué APRÈS la publication (l'article est bien en ligne). */
      erreurNotification?: string;
    }
  | { ok: false; erreur: ErreurValidation; id: string; titre?: string };

export type BilanListe = { ok: true; decision: 'lister'; articles: ArticleAValider[] };

const SITE = 'https://maxmorrys.me';
const RAISON_MAX = 500;

/** Valide le corps reçu. Renvoie la demande, ou la liste des erreurs. */
export function validerDemande(corps: unknown): { ok: true; demande: Demande } | { ok: false; erreurs: string[] } {
  const c = (corps ?? {}) as Record<string, unknown>;
  const erreurs: string[] = [];
  const id = typeof c.id === 'string' ? c.id.trim() : '';
  const decision = c.decision;
  if (!['publier', 'refuser', 'raison', 'lister', 'marquer'].includes(decision as string)) {
    erreurs.push("decision doit valoir 'publier', 'refuser', 'raison', 'lister' ou 'marquer'");
  }
  // Un identifiant de document Firestore : jamais de `/`, sinon on sortirait de `blog/`.
  if (decision !== 'lister' && (!id || !/^[A-Za-z0-9_-]{1,128}$/.test(id))) erreurs.push('id invalide');
  const ident = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? String(v).slice(0, 32) : undefined);
  let raison: string | undefined;
  if (c.raison !== undefined) {
    if (typeof c.raison !== 'string') erreurs.push('raison doit être une chaîne');
    else raison = c.raison.trim().slice(0, RAISON_MAX);
  }
  if (decision === 'raison' && !raison) erreurs.push('raison vide');
  if (erreurs.length) return { ok: false, erreurs };
  return {
    ok: true,
    demande: { id, decision: decision as Decision, raison, messageId: ident(c.messageId), documentMessageId: ident(c.documentMessageId) },
  };
}

/** La date du jour au format que l'admin écrit dans `publishedAt` (`AAAA-MM-JJ`). */
export function dateDuJour(maintenant: Date): string {
  return maintenant.toISOString().split('T')[0];
}

const texte = (v: unknown): string => (typeof v === 'string' ? v : '');

/** Écriture conditionnée à la version lue : deux clics rapprochés ne publient pas deux fois. */
async function ecrireSiInchange(db: Firestore, doc: DocSnapshot, data: Record<string, unknown>): Promise<void> {
  const write = db.buildWrite(doc.path, data, { mask: true });
  await db.commit([{ ...write, currentDocument: doc.updateTime ? { updateTime: doc.updateTime } : { exists: true } }]);
}

/**
 * Les brouillons dont la carte n'est pas encore partie : soumis (`pretAValider: true`), encore
 * brouillons (un article publié depuis l'admin entre-temps n'a plus besoin de carte), et sans
 * `telegramNotifiedAt`. Requête d'égalité sur un seul champ : aucun index composite.
 */
export async function listerAValider(db: Firestore): Promise<BilanListe> {
  const docs = await db.query({
    collection: 'blog',
    where: [{ field: 'pretAValider', op: '==', value: true }],
    limit: 20,
  });
  const articles = docs
    .filter((d) => d.data.status === 'draft' && !texte(d.data.telegramNotifiedAt))
    .map((d) => ({
      id: d.id,
      title: texte(d.data.title),
      slug: texte(d.data.slug),
      category: texte(d.data.category),
      focusKeyword: texte(d.data.focusKeyword),
      metaTitle: texte(d.data.metaTitle),
      metaDescription: texte(d.data.metaDescription),
      excerpt: texte(d.data.excerpt),
      content: texte(d.data.content),
      coverImage: texte(d.data.coverImage),
      readTime: typeof d.data.readTime === 'number' ? d.data.readTime : null,
      test: d.data.test === true,
    }));
  return { ok: true, decision: 'lister', articles };
}

export async function executerValidation(
  db: Firestore,
  demande: Demande,
  maintenant = new Date(),
): Promise<Bilan | BilanListe> {
  const { id, decision } = demande;
  if (decision === 'lister') return listerAValider(db);

  const doc = await db.get(`blog/${id}`);
  if (!doc) return { ok: false, erreur: 'introuvable', id };

  const d = doc.data;
  const titre = texte(d.title);
  const slug = texte(d.slug);
  const base = { ok: true as const, decision, id, titre, slug, url: slug ? `${SITE}/blog/${slug}` : '' };
  const iso = maintenant.toISOString();

  if (decision === 'marquer') {
    // La carte est partie : on le note, pour qu'elle ne reparte pas au passage suivant.
    if (d.status !== 'draft') return { ok: false, erreur: 'pasUnBrouillon', id, titre };
    await db.update(`blog/${id}`, {
      telegramNotifiedAt: iso,
      telegramMessageId: demande.messageId ?? '',
      telegramDocumentMessageId: demande.documentMessageId ?? '',
    });
    return base;
  }

  if (decision === 'raison') {
    if (!texte(d.refusedAt)) return { ok: false, erreur: 'pasRefuse', id, titre };
    await db.update(`blog/${id}`, { refusReason: demande.raison ?? '' });
    return base;
  }

  if (decision === 'refuser') {
    if (d.status !== 'draft') return { ok: false, erreur: 'pasUnBrouillon', id, titre };
    if (d.test === true) return { ...base, simulation: true };
    await db.update(`blog/${id}`, { refusedAt: iso, pretAValider: false });
    return base;
  }

  // ── publier ──
  if (d.status === 'published') {
    // Déjà en ligne (publié depuis l'admin, ou second clic) : on ne réécrit rien, mais la
    // notification — idempotente — est rejouée au cas où le premier envoi aurait échoué.
    const n = await notifierAbonnes(db, 'article', id);
    return { ...base, dejaPublie: true, notified: n.notified, alreadyNotified: n.alreadyNotified };
  }
  if (d.status !== 'draft') return { ok: false, erreur: 'pasUnBrouillon', id, titre };
  // Seul un brouillon SOUMIS à validation se publie d'ici : un brouillon de travail, ou un
  // article refusé puis rouvert, ne passe pas par un vieux bouton resté dans la conversation.
  if (d.pretAValider !== true) return { ok: false, erreur: 'nonSoumis', id, titre };
  if (!slug) return { ok: false, erreur: 'sansSlug', id, titre };

  if (d.test === true) {
    // ARTICLE DE TEST : toutes les gardes sont passées, rien n'est écrit, personne n'est prévenu.
    const abonnes = await db.count({
      collection: 'users',
      where: [{ field: 'preferences.notifyOnPublish', op: '==', value: true }],
    });
    return { ...base, simulation: true, abonnes };
  }

  try {
    await ecrireSiInchange(db, doc, {
      status: 'published',
      publishedAt: dateDuJour(maintenant),
      updatedAt: iso,
      pretAValider: false,
      validatedAt: iso,
      validatedVia: 'telegram',
    });
  } catch (error: unknown) {
    // Précondition échouée : quelqu'un a écrit entre la lecture et l'écriture (second clic,
    // admin). Rien n'est publié par CET appel ; le rejouer relira l'état réel.
    console.error('Validation article', id, ': écriture refusée —', error);
    return { ok: false, erreur: 'conflit', id, titre };
  }

  /*
   * L'article est en ligne : c'est acquis. Si la notification casse, on le DIT sans défaire
   * la publication — le marqueur `publishNotifiedAt` n'étant pas posé, un second clic ✅
   * (branche `dejaPublie`) rejouera l'envoi.
   */
  try {
    const n = await notifierAbonnes(db, 'article', id);
    return { ...base, notified: n.notified, alreadyNotified: n.alreadyNotified };
  } catch (error: unknown) {
    console.error('Validation article', id, ': notification en échec —', error);
    return { ...base, notified: 0, erreurNotification: error instanceof Error ? error.message : String(error) };
  }
}
