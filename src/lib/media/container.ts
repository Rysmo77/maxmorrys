/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * QUEL CONTENEUR LE NAVIGATEUR A-T-IL RÉELLEMENT PRODUIT, ET SOUS QUEL NOM L'ÉCRIRE.
 *
 * `MediaRecorder` ne rend pas le même conteneur partout. Chrome et Firefox rendent du WebM ;
 * Safari — donc tout iPhone — rend du MP4. Le code qui enregistrait un témoignage affirmait
 * `video/webm` EN DUR, pour le type du Blob comme pour l'extension de la clé R2.
 *
 * Sur Safari, l'objet écrit portait donc des octets MP4 sous une clé `.webm`, avec un
 * `Content-Type: video/webm` — trois mensonges cohérents entre eux, donc invisibles : la
 * relecture locale marche (le `<video>` lit le Blob, pas son type), le téléversement réussit
 * (le Worker media ne valide que le préfixe `video/`), et c'est chez la personne qui MODÈRE,
 * ou chez le visiteur, que la vidéo ne démarre pas. Sans erreur, six mois plus tard.
 *
 * Ces trois décisions — quoi demander, quoi déclarer, sous quel nom écrire — sont séparées du
 * composant pour la même raison que `shouldCompress` l'est du canevas : ce sont des tables de
 * correspondance, elles se vérifient sans navigateur, et c'est le seul endroit d'où la
 * cohérence entre le type MIME et l'extension peut être tenue.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Conteneurs proposés au navigateur, du plus souhaitable au plus universel.
 *
 * L'ordre n'est pas cosmétique : WebM/Opus est plus léger à qualité égale et se lit partout
 * sauf sur Safari, qui ne sait produire que du MP4. On demande donc le meilleur, et le MP4
 * ferme la liste — c'est lui que Safari retiendra, et c'est très bien.
 */
export const VIDEO_CANDIDATES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
  'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
  'video/mp4',
] as const;

export const AUDIO_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
] as const;

/** Extension correspondant au conteneur réellement encodé. */
const EXTENSIONS: Record<string, string> = {
  'video/webm': 'webm',
  'video/mp4': 'mp4',
  'video/x-matroska': 'mkv',
  'video/quicktime': 'mov',
  'audio/webm': 'webm',
  'audio/mp4': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/ogg': 'ogg',
  'audio/aac': 'aac',
  'audio/wav': 'wav',
};

/** `video/webm;codecs=vp9` → `video/webm`. Le conteneur seul, sans ses codecs ni ses espaces. */
export function baseType(mimeType: string): string {
  return mimeType.split(';')[0].trim().toLowerCase();
}

/**
 * Extension à donner à la clé R2 pour un type MIME donné.
 *
 * `fallback` ne sert QUE lorsque le type est inexploitable (vide, sans barre oblique) — un
 * `Blob` sans type en est le cas réel : certains navigateurs en rendent un pour un fichier
 * importé depuis un gestionnaire qui ne reconnaît pas l'extension.
 */
export function extensionFor(mimeType: string, fallback: string): string {
  const base = baseType(mimeType);
  const known = EXTENSIONS[base];
  if (known) return known;
  const sub = base.split('/')[1];
  // `video/x-flv` → `x-flv` n'est pas une extension : on ne garde que ce qui en a la forme.
  return sub && /^[a-z0-9]{2,5}$/.test(sub) ? sub : fallback;
}

/**
 * Premier conteneur que ce navigateur sait produire, ou `undefined` pour le laisser choisir.
 *
 * ⚠️ La valeur rendue ici est un SOUHAIT. La spec autorise le navigateur à retenir autre
 * chose : c'est `recorder.mimeType`, relu après coup, qui dit ce qui a été encodé.
 */
export function pickMimeType(mode: 'audio' | 'video'): string | undefined {
  if (typeof window === 'undefined' || typeof window.MediaRecorder === 'undefined') return undefined;
  // `isTypeSupported` est optionnel dans la spec — un navigateur qui ne l'expose pas
  // choisira seul, et `recorder.mimeType` nous dira quoi.
  if (typeof window.MediaRecorder.isTypeSupported !== 'function') return undefined;
  const candidates = mode === 'video' ? VIDEO_CANDIDATES : AUDIO_CANDIDATES;
  return candidates.find((type) => window.MediaRecorder.isTypeSupported(type));
}
