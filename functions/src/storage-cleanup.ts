import { onDocumentDeleted } from 'firebase-functions/v2/firestore';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';

/**
 * Nettoyage des médias lors de la suppression d'un contenu.
 *
 * Les objets vivent désormais sur Cloudflare R2, mais ces triggers tournent sur
 * GCP et n'ont aucun accès à R2 : ils délèguent la suppression au Worker
 * `media-api`, qui possède le binding. Les URLs Firebase Storage historiques
 * restent supprimées directement.
 *
 * ⚠️ Historique du bug corrigé ici : l'extraction de chemin ne reconnaissait que
 * la forme `firebasestorage…/o/{path}` et retournait `null` sur une URL R2, sans
 * erreur ni log. Depuis la bascule des uploads vers R2, chaque suppression de
 * contenu laissait donc un objet orphelin — silencieusement.
 */

const mediaDeleteKey = defineSecret('MEDIA_DELETE_KEY');

const MEDIA_API_URL = 'https://media-api.maxmorrys.me';
const R2_PUBLIC_HOST = 'media.maxmorrys.me';

/** Objet à supprimer, avec le stockage qui l'héberge. */
type Target = { store: 'gcs' | 'r2'; path: string };

/**
 * Reconnaît les trois formes d'URL rencontrées en base.
 *
 * - `https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?…` (historique)
 * - `https://storage.googleapis.com/{bucket}/{path}` (écrites par renderSocialCard)
 * - `https://media.maxmorrys.me/{key}` (R2, forme actuelle)
 */
export function extractTarget(url: unknown): Target | null {
  if (typeof url !== 'string' || !url) return null;
  try {
    const parsed = new URL(url);

    if (parsed.hostname === R2_PUBLIC_HOST) {
      const key = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
      return key ? { store: 'r2', path: key } : null;
    }

    if (parsed.hostname === 'firebasestorage.googleapis.com') {
      const match = parsed.pathname.match(/\/o\/(.+)$/);
      return match ? { store: 'gcs', path: decodeURIComponent(match[1]) } : null;
    }

    if (parsed.hostname === 'storage.googleapis.com') {
      // /{bucket}/{path…} — on retire le segment de bucket.
      const segments = parsed.pathname.replace(/^\/+/, '').split('/');
      segments.shift();
      const path = decodeURIComponent(segments.join('/'));
      return path ? { store: 'gcs', path } : null;
    }

    return null;
  } catch {
    return null;
  }
}

async function deleteFromR2(keys: string[], context: string): Promise<void> {
  if (keys.length === 0) return;

  const key = mediaDeleteKey.value();
  if (!key) {
    console.warn(`${context}: MEDIA_DELETE_KEY absent, ${keys.length} objet(s) R2 non supprimé(s)`);
    return;
  }

  try {
    const response = await fetch(`${MEDIA_API_URL}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Internal-Key': key },
      body: JSON.stringify({ keys }),
    });
    if (!response.ok) {
      console.warn(`${context}: suppression R2 refusée (${response.status})`, keys);
      return;
    }
    console.log(`${context}: ${keys.length} objet(s) R2 supprimé(s)`, keys);
  } catch (error: unknown) {
    console.warn(`${context}: suppression R2 impossible`, error);
  }
}

async function deleteFromGcs(paths: string[], context: string): Promise<void> {
  for (const path of paths) {
    try {
      await admin.storage().bucket().file(path).delete();
      console.log(`${context}: objet GCS supprimé`, path);
    } catch (error: unknown) {
      const err = error as { code?: number };
      if (err.code === 404) continue;
      console.warn(`${context}: suppression GCS impossible`, path, error);
    }
  }
}

/** Supprime tous les objets référencés par les URLs fournies, quel que soit leur stockage. */
async function deleteMedia(urls: unknown[], context: string): Promise<void> {
  const targets = urls.map(extractTarget).filter((t): t is Target => t !== null);
  if (targets.length === 0) return;

  await Promise.all([
    deleteFromR2(
      targets.filter((t) => t.store === 'r2').map((t) => t.path),
      context,
    ),
    deleteFromGcs(
      targets.filter((t) => t.store === 'gcs').map((t) => t.path),
      context,
    ),
  ]);
}

export const onBlogDeleted = onDocumentDeleted(
  { document: 'blog/{postId}', secrets: [mediaDeleteKey] },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;
    await deleteMedia([data.coverImage, data.ogImage, data.twitterImage], 'onBlogDeleted');
  },
);

export const onFormationDeleted = onDocumentDeleted(
  { document: 'formations/{formationId}', secrets: [mediaDeleteKey] },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const urls: unknown[] = [data.coverImage, data.ogImage];
    const modules = Array.isArray(data.modules) ? data.modules : [];
    for (const mod of modules) {
      const lessons = Array.isArray(mod?.lessons) ? mod.lessons : [];
      for (const lesson of lessons) {
        urls.push(lesson?.videoUrl);
        const resources = Array.isArray(lesson?.resources) ? lesson.resources : [];
        for (const resource of resources) urls.push(resource?.url ?? resource);
      }
    }
    await deleteMedia(urls, 'onFormationDeleted');
  },
);

export const onVideoDeleted = onDocumentDeleted(
  { document: 'videos/{videoId}', secrets: [mediaDeleteKey] },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;
    // `thumbnail` n'existe pas sur ces documents — le champ réel est `thumbnailUrl`.
    // Il était seul référencé ici, donc aucune vignette n'était jamais supprimée.
    await deleteMedia([data.thumbnailUrl, data.coverImage, data.ogImage], 'onVideoDeleted');
  },
);

export const onPodcastDeleted = onDocumentDeleted(
  { document: 'podcasts/{podcastId}', secrets: [mediaDeleteKey] },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;
    await deleteMedia([data.coverImage, data.ogImage, data.thumbnailUrl], 'onPodcastDeleted');
  },
);
