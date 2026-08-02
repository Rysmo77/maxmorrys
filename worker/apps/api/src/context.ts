import {
  CLOUD_PLATFORM_SCOPE,
  createAccessTokenProvider,
  createSelfSignedTokenProvider,
  parseServiceAccount,
} from '@mm/gcp-auth';
import {
  AuthAdmin,
  createIdTokenVerifier,
  type DecodedIdToken,
  type IdTokenVerifier,
} from '@mm/firebase-auth-rest';
import { Firestore } from '@mm/firestore-rest';
import { HttpsError } from '@mm/shared';

import type { Env } from './env';

/**
 * Ressources partagées, mémoïsées par isolate : le parsing du compte de service
 * et l'import de la clé privée sont coûteux et ne dépendent pas de la requête.
 */
let firestore: Firestore | null = null;
let verifier: IdTokenVerifier | null = null;

export function getFirestore(env: Env): Firestore {
  if (!firestore) {
    const serviceAccount = parseServiceAccount(env.GCP_SA_JSON);
    firestore = new Firestore({
      projectId: serviceAccount.project_id,
      token: createSelfSignedTokenProvider(serviceAccount),
    });
  }
  return firestore;
}

export function getVerifier(env: Env): IdTokenVerifier {
  if (!verifier) verifier = createIdTokenVerifier(env.FIREBASE_PROJECT_ID);
  return verifier;
}

/**
 * Administration Firebase Auth.
 *
 * Contrairement à Firestore, Identity Toolkit n'accepte pas le JWT auto-signé :
 * il faut un vrai access token OAuth avec le scope `cloud-platform`.
 */
let authAdmin: AuthAdmin | null = null;

export function getAuthAdmin(env: Env): AuthAdmin {
  if (!authAdmin) {
    const serviceAccount = parseServiceAccount(env.GCP_SA_JSON);
    authAdmin = new AuthAdmin(
      serviceAccount.project_id,
      createAccessTokenProvider(serviceAccount, [CLOUD_PLATFORM_SCOPE]),
    );
  }
  return authAdmin;
}

/** Contexte transmis à chaque handler. */
export interface CallContext {
  env: Env;
  ctx: ExecutionContext;
  db: Firestore;
  /** `null` si la requête n'est pas authentifiée. */
  auth: DecodedIdToken | null;
  /** Corps brut, pour les vérifications de signature. */
  raw: string;
}

/**
 * Exige une requête authentifiée.
 *
 * ⚠️ L'accès REST par compte de service contourne `firestore.rules` : chaque
 * handler doit refaire ses contrôles explicitement, il n'y a pas de filet.
 */
export function requireAuth(context: CallContext): DecodedIdToken {
  if (!context.auth) throw new HttpsError('unauthenticated', 'Authentification requise.');
  return context.auth;
}

/**
 * Exige un appelant administrateur.
 *
 * Le rôle est lu dans `users/{uid}.role`, comme les Cloud Functions. Le custom
 * claim `admin` est accepté en premier : il évite une lecture Firestore et
 * deviendra la source unique une fois les claims posés (phase de durcissement).
 */
export async function requireAdmin(context: CallContext): Promise<DecodedIdToken> {
  const auth = requireAuth(context);
  if (auth.admin) return auth;

  const user = await context.db.get(`users/${auth.uid}`);
  if (!user || user.data.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Accès réservé aux administrateurs.');
  }
  return auth;
}
