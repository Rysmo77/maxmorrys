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

  /** Endpoint de création de charges Bictorys (test ou production). */
  BICTORYS_API_URL: string;
  /** Base publique servant à construire les URL de retour après paiement. */
  APP_BASE_URL: string;
  /** Base de ce Worker, pour construire les liens de téléchargement d'export. */
  API_BASE_URL: string;
  /** Domaine public de lecture des médias. */
  PUBLIC_MEDIA_BASE: string;

  /** Bucket R2 : exports RGPD et purge des médias à la suppression de compte. */
  EXPORTS?: R2Bucket;

  /**
   * Base de l'API Gemini. Pointer sur AI Gateway apporte cache, budgets et
   * observabilité des coûts sans changer une ligne d'appel.
   */
  GEMINI_BASE_URL: string;

  // ── Secrets par fonction migrée ──
  SPOTIFY_CLIENT_ID?: string;
  SPOTIFY_CLIENT_SECRET?: string;
  YOUTUBE_API_KEY?: string;
  GOOGLE_AI_API_KEY?: string;
  TYPESENSE_URL?: string;
  TYPESENSE_ADMIN_KEY?: string;
  BICTORYS_API_KEY?: string;
  BICTORYS_WEBHOOK_SECRET?: string;
  META_ACCESS_TOKEN?: string;
  /** Secret de signature des liens de téléchargement d'export. */
  EXPORT_SIGNING_KEY?: string;
  /** Secret partagé avec le Worker media pour signer les liens de lecture. */
  MEDIA_SIGNING_KEY?: string;
}
