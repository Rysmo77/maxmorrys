import { onDocumentDeleted } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

/**
 * Extract Storage object path from a download URL.
 * Firebase Storage URLs look like:
 *   https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?alt=media&token=...
 */
function extractStoragePath(url: string | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  try {
    const match = url.match(/\/o\/([^?]+)/);
    if (!match) return null;
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

async function deleteStorageFile(url: string | undefined, context: string): Promise<void> {
  const path = extractStoragePath(url);
  if (!path) return;
  try {
    await admin.storage().bucket().file(path).delete();
    console.log(`${context}: deleted storage file`, path);
  } catch (error: unknown) {
    const err = error as { code?: number };
    if (err.code === 404) return;
    console.warn(`${context}: failed to delete storage file`, path, error);
  }
}

/**
 * Delete the cover image of a blog post when the Firestore doc is removed.
 */
export const onBlogDeleted = onDocumentDeleted('blog/{postId}', async (event) => {
  const data = event.data?.data();
  if (!data) return;
  await deleteStorageFile(data.coverImage, 'onBlogDeleted');
});

/**
 * Delete formation cover + lesson videos when a formation is removed.
 */
export const onFormationDeleted = onDocumentDeleted('formations/{formationId}', async (event) => {
  const data = event.data?.data();
  if (!data) return;
  await deleteStorageFile(data.coverImage, 'onFormationDeleted');
  const modules = Array.isArray(data.modules) ? data.modules : [];
  for (const mod of modules) {
    const lessons = Array.isArray(mod?.lessons) ? mod.lessons : [];
    for (const lesson of lessons) {
      if (lesson?.videoUrl) {
        await deleteStorageFile(lesson.videoUrl, 'onFormationDeleted');
      }
    }
  }
});

/**
 * Delete video thumbnail when a video doc is removed.
 */
export const onVideoDeleted = onDocumentDeleted('videos/{videoId}', async (event) => {
  const data = event.data?.data();
  if (!data) return;
  await deleteStorageFile(data.thumbnail, 'onVideoDeleted');
  await deleteStorageFile(data.coverImage, 'onVideoDeleted');
});

/**
 * Delete podcast cover when a podcast doc is removed.
 */
export const onPodcastDeleted = onDocumentDeleted('podcasts/{podcastId}', async (event) => {
  const data = event.data?.data();
  if (!data) return;
  await deleteStorageFile(data.coverImage, 'onPodcastDeleted');
  await deleteStorageFile(data.thumbnail, 'onPodcastDeleted');
});
