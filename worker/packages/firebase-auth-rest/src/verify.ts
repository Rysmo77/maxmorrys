import { createRemoteJWKSet, jwtVerify } from 'jose';

/**
 * Clés publiques Google pour les Firebase ID tokens.
 *
 * `createRemoteJWKSet` met les clés en cache en mémoire et gère leur rotation ;
 * il est donc défini au niveau du module, jamais dans un handler.
 */
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
);

export interface DecodedIdToken {
  uid: string;
  email?: string;
  emailVerified: boolean;
  /** Custom claim `admin`, posé via `AuthAdmin.setCustomClaims`. */
  admin: boolean;
  claims: Record<string, unknown>;
}

export type IdTokenVerifier = (bearer: string | null) => Promise<DecodedIdToken | null>;

/** Extrait le jeton d'un en-tête `Authorization: Bearer <token>`. */
export function bearerFrom(request: Request): string | null {
  const header = request.headers.get('Authorization') ?? '';
  const match = header.match(/^Bearer (.+)$/);
  return match ? match[1] : null;
}

/**
 * Construit un vérificateur d'ID token pour un projet Firebase.
 *
 * Renvoie `null` sur tout jeton invalide, expiré ou d'un autre projet — jamais
 * d'exception, pour que les appelants traitent l'absence d'auth comme un cas normal.
 *
 * Note : comme `firebase-admin` par défaut, la révocation de session n'est pas
 * vérifiée (elle exigerait un appel réseau par requête).
 */
export function createIdTokenVerifier(projectId: string): IdTokenVerifier {
  const issuer = `https://securetoken.google.com/${projectId}`;

  return async (bearer: string | null): Promise<DecodedIdToken | null> => {
    if (!bearer) return null;
    try {
      const { payload } = await jwtVerify(bearer, JWKS, { issuer, audience: projectId });

      const uid = typeof payload.sub === 'string' ? payload.sub : '';
      if (!uid) return null;

      return {
        uid,
        email: typeof payload.email === 'string' ? payload.email : undefined,
        emailVerified: payload.email_verified === true,
        admin: payload.admin === true,
        claims: payload as Record<string, unknown>,
      };
    } catch {
      return null;
    }
  };
}
