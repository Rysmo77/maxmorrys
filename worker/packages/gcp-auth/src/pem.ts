import { base64ToBytes } from './base64';

const PEM_HEADER = '-----BEGIN PRIVATE KEY-----';
const PEM_FOOTER = '-----END PRIVATE KEY-----';

/**
 * Importe la clé privée PKCS#8 d'un compte de service GCP en `CryptoKey` RS256.
 *
 * Deux pièges concentrés ici :
 *  - selon la façon dont le JSON du compte de service a transité (shell, secret
 *    wrangler, variable d'env), les sauts de ligne peuvent être des `\n` littéraux
 *    à deux caractères. On normalise avant tout parsing.
 *  - la `CryptoKey` obtenue n'est pas sérialisable : elle se mémoïse en variable
 *    de module, jamais dans KV ni dans le Cache.
 */
export async function importServiceAccountKey(privateKeyPem: string): Promise<CryptoKey> {
  const normalized = privateKeyPem.replace(/\\n/g, '\n');
  const start = normalized.indexOf(PEM_HEADER);
  const end = normalized.indexOf(PEM_FOOTER);
  if (start === -1 || end === -1) {
    throw new Error('Clé privée invalide : bloc PKCS#8 introuvable');
  }

  const body = normalized.slice(start + PEM_HEADER.length, end).replace(/\s+/g, '');
  return crypto.subtle.importKey(
    'pkcs8',
    base64ToBytes(body),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}
