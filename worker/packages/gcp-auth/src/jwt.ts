import { bytesToBase64Url, stringToBase64Url } from './base64';

export type JwtClaims = Record<string, unknown>;

/** Signe un JWT compact RS256. */
export async function signJwtRs256(key: CryptoKey, claims: JwtClaims): Promise<string> {
  const header = stringToBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = stringToBase64Url(JSON.stringify(claims));
  const signingInput = `${header}.${payload}`;

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput),
  );

  return `${signingInput}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

/**
 * Lit la date d'expiration d'un JWT sans en vérifier la signature.
 *
 * Réservé à la gestion de cache de nos propres jetons — jamais pour une décision
 * d'autorisation.
 */
export function readJwtExpiry(token: string): number | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(atob(padded)) as { exp?: unknown };
    return typeof claims.exp === 'number' ? claims.exp : null;
  } catch {
    return null;
  }
}
