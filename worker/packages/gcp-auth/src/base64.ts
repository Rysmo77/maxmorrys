/**
 * Helpers base64 / base64url sans `Buffer` (indisponible sur Workers).
 */

/**
 * Encode des octets en base64 standard.
 *
 * Le découpage en tranches est délibéré : `String.fromCharCode(...bytes)` sur un
 * tableau de plusieurs centaines de milliers d'octets dépasse la limite d'arguments
 * du moteur et lève un RangeError. 0x8000 est la taille de tranche usuelle.
 */
export function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

/** Décode du base64 standard en octets. */
export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

/** Encode des octets en base64url (sans padding) — l'encodage des JWT. */
export function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Encode une chaîne UTF-8 en base64url. */
export function stringToBase64Url(value: string): string {
  return bytesToBase64Url(new TextEncoder().encode(value));
}
