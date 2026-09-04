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
import { compressImage, withExtension } from './images/compress';

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

  /*
    LES IMAGES PASSENT EN WEBP AVANT DE PARTIR, ET L'EXTENSION DE LA CLÉ SUIT.

    Les couvertures d'article servies aujourd'hui sont des PNG de 643 à 847 Ko (mesuré le
    03/09/2026) ; les mêmes en WebP tiennent autour de 100 Ko. Une couverture est téléchargée
    par la lectrice, par chaque robot qui construit l'aperçu du lien, puis par chaque
    plateforme où il est partagé — l'écart se paie trois fois, sur des forfaits comptés.

    `compressImage` rend TOUJOURS quelque chose d'envoyable : un GIF, un SVG, une image déjà
    légère ou un navigateur sans encodeur WebP ressortent inchangés. Le téléversement ne peut
    donc pas échouer à cause de la compression.

    Renommer la clé n'est pas cosmétique : sans cela, R2 servirait des octets WebP sous une
    adresse en `.png`.
  */
  const { blob: payload, extension, converted } = await compressImage(file);
  const finalKey = converted ? withExtension(key, extension) : key;

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${MEDIA_API_URL}/upload?key=${encodeURIComponent(finalKey)}`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Content-Type', payload.type || 'application/octet-stream');

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

    xhr.send(payload);
  });
}
