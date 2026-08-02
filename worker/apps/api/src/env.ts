export interface Env {
  /** JSON du compte de service GCP (secret). */
  GCP_SA_JSON: string;

  /** Identifiant du projet Firebase, audience des ID tokens. */
  FIREBASE_PROJECT_ID: string;

  /** Origines autorisées à appeler l'API (CORS), séparées par des virgules. */
  ALLOWED_ORIGINS: string;

  /**
   * Noms de callables servis localement, séparés par des virgules.
   *
   * Tout nom absent de cette liste est relayé vers Cloud Functions : c'est le
   * mécanisme de bascule fonction par fonction, et son rollback.
   */
  MIGRATED: string;

  /** Base des Cloud Functions encore en place, cible du relais. */
  FUNCTIONS_ORIGIN: string;

  // ── Secrets par fonction migrée ──
  SPOTIFY_CLIENT_ID?: string;
  SPOTIFY_CLIENT_SECRET?: string;
  YOUTUBE_API_KEY?: string;
}
