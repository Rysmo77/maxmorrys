/**
 * Upload des médias vers Cloudflare R2 via le Worker `media-api`.
 *
 * Remplace les appels directs à `firebase/storage`. Le Worker vérifie l'identité
 * de l'appelant à partir de son Firebase ID token, écrit le fichier dans R2 et
 * renvoie l'URL publique de lecture (domaine `media.maxmorrys.me`).
 *
 * On utilise XMLHttpRequest (et non `fetch`) pour bénéficier des événements de
 * progression d'upload, attendus par les barres de progression existantes.
 */
import { auth } from '../config/firebase';

const MEDIA_API_URL =
  import.meta.env.VITE_MEDIA_API_URL?.replace(/\/$/, '') || 'https://media-api.maxmorrys.me';

/** Construit un nom de fichier unique en conservant l'extension d'origine. */
export function randomFilename(originalName: string, fallbackExt = 'jpg'): string {
  const ext = originalName.split('.').pop()?.toLowerCase() || fallbackExt;
  return `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
}

/**
 * Téléverse un fichier vers R2 sous la clé `key` (ex. `uploads/articles/123.jpg`).
 * Renvoie l'URL publique de lecture.
 *
 * @param onProgress callback de progression (0–100), optionnel.
 */
export async function uploadMedia(
  file: Blob,
  key: string,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentification requise pour téléverser un fichier.');
  const token = await user.getIdToken();

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${MEDIA_API_URL}/upload?key=${encodeURIComponent(key)}`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }

    xhr.onload = () => {
      let body: { url?: string; error?: string } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* réponse non-JSON */
      }
      if (xhr.status >= 200 && xhr.status < 300 && body.url) {
        resolve(body.url);
      } else {
        reject(new Error(body.error || `Échec de l'upload (HTTP ${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Échec réseau lors de l'upload."));

    xhr.send(file);
  });
}
