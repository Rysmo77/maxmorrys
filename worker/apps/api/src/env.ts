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
   * Cloudflare Email Service — le premier canal sortant du produit.
   *
   * Optionnel à dessein : absent en développement local et dans les tests, où `sendEmail`
   * répond « binding EMAIL absent » plutôt que de lever. Un canal manquant se journalise,
   * il ne fait pas tomber le webhook de paiement.
   */
  EMAIL?: { send(message: { to: string; from: { email: string; name?: string }; subject: string; html?: string; text?: string }): Promise<unknown> };

  /** Adresse d'expédition. Sous-domaine `mail.maxmorrys.me`, jamais la racine : la réputation
   *  d'envoi transactionnel reste séparée de celle du domaine principal. */
  EMAIL_FROM: string;
  /** Nom affiché de l'expéditeur. */
  EMAIL_FROM_NAME: string;
  /**
   * Mention de TVA portée par les factures. VIDE tant que le régime fiscal de MY ONOMA SARL
   * n'est pas confirmé par son comptable : une facture qui n'affirme rien se corrige, une
   * facture qui affirme faux se recopie chez le client.
   */
  INVOICE_TAX_NOTICE?: string;

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
  /* ── Brevo : le canal MARKETING ────────────────────────────────────────────
     Distinct du transactionnel de bout en bout. Le transactionnel passe par le binding
     `EMAIL` de Cloudflare, sans aucune clé ; le marketing passe par Brevo, avec la sienne.
     Autre fournisseur, autre sous-domaine d'envoi (`lettre.` et non `mail.`), autre
     réputation — un incident sur l'un laisse l'autre intact. Et Cloudflare Email Sending
     interdit de toute façon le marketing sur son propre canal.

     Listmonk a occupé cette place quelques heures puis a été retiré : il relayait vers
     Brevo, n'apportait donc rien sur le plafond d'envoi, et ne savait pas exécuter de
     séquences — voir l'en-tête de `brevo-contacts.ts`. */
  /** Clé API v3. Secret : `npx wrangler secret put BREVO_API_KEY`. */
  BREVO_API_KEY?: string;
  /** Identifiant de la liste cible dans Brevo (Contacts → Listes). */
  BREVO_LIST_ID?: string;

  /** Secret partagé avec le Worker media pour signer les liens de lecture. */
  MEDIA_SIGNING_KEY?: string;
}
