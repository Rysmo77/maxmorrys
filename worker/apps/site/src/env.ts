export interface Env {
  /** Origine Firebase Hosting, hors zone Cloudflare (`https://max-morrys.web.app`). */
  ORIGIN: string;

  /** Cache des métadonnées SEO et du shell. */
  SEO: KVNamespace;

  /** JSON du compte de service GCP (secret). */
  GCP_SA_JSON: string;

  /**
   * Base de l'API Gemini. Pointer sur AI Gateway apporte cache, budgets et
   * observabilité sans changer une ligne d'appel.
   */
  GEMINI_BASE_URL: string;

  /** Clé de l'API Gemini (secret). Absente = pas de traduction, repli sur le FR. */
  GOOGLE_AI_API_KEY?: string;

}
