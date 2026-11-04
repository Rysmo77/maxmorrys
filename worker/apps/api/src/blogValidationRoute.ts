import { constantTimeEqual, json } from '@mm/shared';

import { getFirestore } from './context';
import type { Env } from './env';
import { executerValidation, validerDemande, type ErreurValidation } from './lib/blog-validation';

/**
 * LA ROUTE DE VALIDATION D'ARTICLE — `POST https://api.maxmorrys.me/blog/validation`.
 *
 * Pour une seule machine : n8n (WF-TG-ROUTER), quand Max clique ✅ Publier / ❌ Refuser sous
 * la carte Telegram d'un brouillon. Ce n'est PAS une callable — pas de jeton Firebase, pas de
 * CORS, pas d'enveloppe `{data}` — mais un JSON simple, authentifié par un secret partagé dans
 * l'en-tête `X-Blog-Key` (même forme que `marketing/campagne`).
 *
 *   { "id": "<docId>", "decision": "publier" | "refuser" | "raison", "raison"?: "…" }
 *   { "decision": "lister" }                       → brouillons soumis dont la carte n'est pas partie
 *   { "id": "<docId>", "decision": "marquer", "messageId": "…", "documentMessageId": "…" }
 *
 * `lister` et `marquer` servent WF-BLOG-NOTIFY (l'envoi de la carte) : le credential Google de
 * n8n n'a pas les droits Firestore, le compte de service du Worker les a.
 *
 * Le secret vit dans le Worker (`wrangler secret put BLOG_VALIDATION_KEY`) et dans le coffre
 * d'identifiants de n8n (credential « MM Blog Validation »). Absent ⇒ 503 : une route qui
 * publie et qui accepterait tout le monde parce qu'on a oublié sa clé est le pire défaut
 * possible ici.
 *
 * La logique — gardes, simulation des articles de test, notification des abonnés — vit dans
 * `lib/blog-validation.ts`.
 */

const STATUT: Record<ErreurValidation, number> = {
  introuvable: 404,
  pasUnBrouillon: 409,
  nonSoumis: 409,
  sansSlug: 409,
  pasRefuse: 409,
  conflit: 409,
};

const PAS_DE_CACHE = { 'cache-control': 'no-store' };

export async function handleBlogValidation(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ ok: false, erreur: 'methode' }, 405, { ...PAS_DE_CACHE, allow: 'POST' });

  if (!env.BLOG_VALIDATION_KEY) {
    console.error('Validation article : BLOG_VALIDATION_KEY absente — route fermée');
    return json({ ok: false, erreur: 'nonConfigure' }, 503, PAS_DE_CACHE);
  }
  const cle = request.headers.get('X-Blog-Key') ?? '';
  if (!cle || !constantTimeEqual(cle, env.BLOG_VALIDATION_KEY)) {
    return json({ ok: false, erreur: 'nonAutorise' }, 401, PAS_DE_CACHE);
  }

  let corps: unknown;
  try {
    corps = await request.json();
  } catch {
    return json({ ok: false, erreur: 'json', erreurs: ['corps JSON illisible'] }, 400, PAS_DE_CACHE);
  }

  const v = validerDemande(corps);
  if (!v.ok) return json({ ok: false, erreur: 'invalide', erreurs: v.erreurs }, 400, PAS_DE_CACHE);

  try {
    const bilan = await executerValidation(getFirestore(env), v.demande);
    // `lister` renvoie le corps des articles : on ne journalise que le compte.
    console.log('Validation article', v.demande.id, v.demande.decision,
      'articles' in bilan ? `${bilan.articles.length} article(s)` : JSON.stringify(bilan));
    return json(bilan, bilan.ok ? 200 : STATUT[bilan.erreur], PAS_DE_CACHE);
  } catch (error: unknown) {
    console.error('Validation article', v.demande.id, ': interrompue —', error);
    return json({ ok: false, erreur: 'interne' }, 500, PAS_DE_CACHE);
  }
}
