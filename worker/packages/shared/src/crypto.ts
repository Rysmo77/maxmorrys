/**
 * Remplacements WebCrypto des usages de `node:crypto` des Cloud Functions.
 *
 * Correspondances :
 *   createHash('sha256')  → sha256Hex        (translate.ts, meta-capi.ts)
 *   createHmac('sha256')  → hmacSha256Hex    (payment.ts, webhook Bictorys)
 *   timingSafeEqual       → constantTimeEqual
 */

const encoder = new TextEncoder();

function toHex(bytes: Uint8Array): string {
  let hex = '';
  for (const byte of bytes) hex += byte.toString(16).padStart(2, '0');
  return hex;
}

/** SHA-256 hexadécimal d'une chaîne UTF-8. */
export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(input));
  return toHex(new Uint8Array(digest));
}

async function importHmacKey(secret: string, usage: 'sign' | 'verify'): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage],
  );
}

/** HMAC-SHA256 hexadécimal, calculé sur les octets exacts du message. */
export async function hmacSha256(secret: string, message: string): Promise<string> {
  const key = await importHmacKey(secret, 'sign');
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return toHex(new Uint8Array(signature));
}

/**
 * Vérifie une signature HMAC hexadécimale.
 *
 * Passe par `crypto.subtle.verify`, qui est à temps constant par construction —
 * préférable à une comparaison de chaînes, même prudente.
 */
export async function verifyHmacSha256(
  secret: string,
  message: string,
  signatureHex: string,
): Promise<boolean> {
  if (!/^[0-9a-fA-F]+$/.test(signatureHex) || signatureHex.length % 2 !== 0) return false;

  const signature = new Uint8Array(signatureHex.length / 2);
  for (let i = 0; i < signature.length; i += 1) {
    signature[i] = Number.parseInt(signatureHex.slice(i * 2, i * 2 + 2), 16);
  }

  const key = await importHmacKey(secret, 'verify');
  return crypto.subtle.verify('HMAC', key, signature, encoder.encode(message));
}

/**
 * Comparaison de chaînes à temps constant.
 *
 * `timingSafeEqual` n'existe pas sur Workers. Pour les signatures, préférer
 * `verifyHmacSha256` ; cette fonction sert aux comparaisons de jetons partagés
 * (p. ex. l'en-tête `X-Render-Key`).
 */
export function constantTimeEqual(a: string, b: string): boolean {
  // La divulgation de la longueur est sans conséquence ici, et éviter de la
  // masquer garde la fonction simple et vérifiable.
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
