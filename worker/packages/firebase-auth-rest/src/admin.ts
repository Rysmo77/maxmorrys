import type { TokenProvider } from '@mm/gcp-auth';

/**
 * Opérations d'administration Firebase Auth via Identity Toolkit.
 *
 * Remplace les deux seuls usages de `admin.auth()` des Cloud Functions :
 * `adminCreateUser` (functions/src/admin.ts) et `deleteUserAccount` (functions/src/gdpr.ts).
 *
 * ⚠️ Piège classique : ce sont les endpoints **admin** (`/v1/projects/{id}/accounts…`,
 * authentifiés par un access token OAuth et identifiant l'utilisateur par `localId`),
 * à ne pas confondre avec les endpoints **client** (`/v1/accounts:signUp?key=API_KEY`,
 * qui prennent un `idToken`).
 */

const IDENTITY_TOOLKIT = 'https://identitytoolkit.googleapis.com/v1';

export interface UserRecord {
  uid: string;
  email?: string;
  displayName?: string;
  disabled: boolean;
  customClaims: Record<string, unknown>;
}

interface RawUser {
  localId?: string;
  email?: string;
  displayName?: string;
  disabled?: boolean;
  customAttributes?: string;
}

export class AuthError extends Error {
  constructor(
    message: string,
    readonly httpStatus: number,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class AuthAdmin {
  constructor(
    private readonly projectId: string,
    /** Doit porter le scope `cloud-platform` : le JWT auto-signé n'est pas accepté ici. */
    private readonly token: TokenProvider,
  ) {}

  private async call<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${IDENTITY_TOOLKIT}/projects/${this.projectId}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await this.token()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new AuthError(
        `Identity Toolkit ${path} a échoué (${response.status}) : ${detail.slice(0, 200)}`,
        response.status,
      );
    }
    return (await response.json()) as T;
  }

  /** Crée un compte et renvoie son UID. */
  async createUser(params: {
    email: string;
    password: string;
    displayName?: string;
    emailVerified?: boolean;
  }): Promise<string> {
    const created = await this.call<{ localId?: string }>('/accounts', {
      email: params.email,
      password: params.password,
      displayName: params.displayName,
      emailVerified: params.emailVerified ?? false,
    });
    if (!created.localId) throw new AuthError('Création de compte sans localId', 500);
    return created.localId;
  }

  /** Supprime un compte. */
  async deleteUser(uid: string): Promise<void> {
    await this.call('/accounts:delete', { localId: uid });
  }

  /** Lit un compte. Renvoie `null` s'il n'existe pas. */
  async getUser(uid: string): Promise<UserRecord | null> {
    const found = await this.call<{ users?: RawUser[] }>('/accounts:lookup', { localId: [uid] });
    const user = found.users?.[0];
    if (!user?.localId) return null;

    let customClaims: Record<string, unknown> = {};
    if (user.customAttributes) {
      try {
        customClaims = JSON.parse(user.customAttributes) as Record<string, unknown>;
      } catch {
        // Attributs illisibles : on préfère un objet vide à une exception.
      }
    }

    return {
      uid: user.localId,
      email: user.email,
      displayName: user.displayName,
      disabled: user.disabled === true,
      customClaims,
    };
  }

  /**
   * Remplace les custom claims d'un compte.
   *
   * ⚠️ `customAttributes` est une **chaîne JSON**, pas un objet — passer un objet
   * est rejeté. Les claims ne sont visibles qu'au prochain rafraîchissement de
   * l'ID token (jusqu'à une heure), ou après un `getIdToken(true)` côté client.
   */
  async setCustomClaims(uid: string, claims: Record<string, unknown>): Promise<void> {
    await this.call('/accounts:update', {
      localId: uid,
      customAttributes: JSON.stringify(claims),
    });
  }
}
