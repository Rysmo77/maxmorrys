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

  /**
   * Codes de transfert de session entre maxmorrys.me, edu. et club. (`sessionTransfer.ts`) :
   * usage unique, 60 s, clés hachées. Optionnel : absent, les deux routes répondent 503.
   */
  TRANSFERTS_SESSION?: KVNamespace;

  /** Bucket R2 : exports RGPD et purge des médias à la suppression de compte. */
  EXPORTS?: R2Bucket;

  /**
   * Cloudflare Email Service — le premier canal sortant du produit.
   *
   * Optionnel à dessein : absent en développement local et dans les tests, où `sendEmail`
   * répond « binding EMAIL absent » plutôt que de lever. Un canal manquant se journalise,
   * il ne fait pas tomber le webhook de paiement.
   */
  EMAIL?: {
    send(message: {
      to: string;
      from: { email: string; name?: string };
      subject: string;
      html?: string;
      text?: string;
      headers?: Record<string, string>;
    }): Promise<unknown>;
  };

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
  /** Clé PUBLIQUE : la seule que la doc Bictorys prescrit pour l'API `charges`. */
  BICTORYS_API_KEY?: string;
  /**
   * Clé SECRÈTE (privée) : clients, plans et abonnements — l'API de facturation récurrente.
   * Droits accordés : CheckoutsWr, CustomersWr, Subscription(Plan)Rd/Wr. PAS CustomersRd :
   * on ne relit jamais un client, on garde son id chez nous.
   */
  BICTORYS_SECRET_KEY?: string;
  /** Envoyé EN CLAIR par Bictorys dans l'en-tête `X-Secret-Key` de chaque webhook. */
  BICTORYS_WEBHOOK_SECRET?: string;
  META_ACCESS_TOKEN?: string;
  /** Secret de signature des liens de téléchargement d'export. */
  EXPORT_SIGNING_KEY?: string;
  /* ── Le courrier MARKETING — BREVO, jamais le binding `EMAIL` (décision du 29/10/2026) ──
     Transactionnel = Cloudflare Email Service (binding `EMAIL`, `EMAIL_FROM`). Marketing (la
     lettre, la bienvenue n°2/n°3) = Brevo, depuis `lettre.maxmorrys.me` (domaine authentifié
     chez Brevo). La FAQ Cloudflare : « Email Service supports transactional email only » —
     une suspension couperait aussi la facture. Voir `lib/brevo-send.ts` et
     `docs/growth-kb/08-emailing.md`.

     L'envoi réel exige DEUX conditions : Brevo configuré (`BREVO_API_KEY` + `BREVO_LIST_ID` +
     `BREVO_SENDER_EMAIL`) ET l'accord `MARKETING_ENVOI_REEL = "oui"`. Fermé par défaut. */
  /** Clé API v3 Brevo. Secret : `npx wrangler secret put BREVO_API_KEY`. */
  BREVO_API_KEY?: string;
  /** Identifiant de la liste principale de la lettre dans Brevo (Contacts → Listes). */
  BREVO_LIST_ID?: string;
  /** Expéditeur marketing, sur le domaine authentifié chez Brevo (`lettre@lettre.maxmorrys.me`). */
  BREVO_SENDER_EMAIL?: string;
  /** Secret partagé avec n8n et les agents, lu dans `X-Marketing-Key`.
   *  `npx wrangler secret put MARKETING_API_KEY`. Absent ⇒ la route répond 503. */
  MARKETING_API_KEY?: string;
  /** L'ACCORD : `oui` ouvre l'envoi marketing réel (campagnes, bienvenue n°2/n°3). Toute autre
   *  valeur le ferme ; le mode test reste ouvert. */
  MARKETING_ENVOI_REEL?: string;
  /** Adresses autorisées en mode test, séparées par des virgules. La première est le défaut. */
  MARKETING_TEST_TO?: string;
  /** Plafond d'envois Brevo par jour UTC, campagnes + bienvenue + épreuves (plan gratuit : 300). */
  MARKETING_PLAFOND_JOUR?: string;

  /** Secret partagé avec le Worker media pour signer les liens de lecture. */
  MEDIA_SIGNING_KEY?: string;
}
