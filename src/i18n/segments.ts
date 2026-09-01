import type { Lang } from './routing';

/**
 * Dictionnaire de localisation des SEGMENTS d'URL.
 * Clé = segment canonique FR (celui des routes par défaut). Valeur = traduction par langue.
 * Le français est canonique : les URLs FR ne changent jamais.
 *
 * ⚠️ Chaque valeur EN doit être UNIQUE (pas deux segments FR → même EN) pour permettre
 * le remappage inverse sans ambiguïté. Notamment `formations→courses` et `cours→learn`
 * (sinon collision `/en/courses/:slug` entre la fiche formation et le lecteur de cours).
 */
const SEGMENTS: Record<string, { fr: string; en: string }> = {
  // Public
  'a-propos': { fr: 'a-propos', en: 'about' },
  formations: { fr: 'formations', en: 'courses' },
  blog: { fr: 'blog', en: 'blog' },
  /*
   * LE PÔLE MÉDIA — une page pour les deux formats.
   *
   * Le kit fusionne podcast et vidéos sous « Je te transforme » : le blog donne une MÉTHODE,
   * le pôle donne une VOIX — quelqu'un qui raconte ce qu'il a fait. Les deux anciennes routes
   * redirigent ici ; leurs fiches de détail, elles, restent séparées, parce qu'un épisode et
   * une vidéo ne se lisent pas pareil (transcription d'un côté, chapitres et choix de qualité
   * de l'autre).
   */
  'podcast-et-videos': { fr: 'podcast-et-videos', en: 'podcast-and-videos' },
  /*
   * L'AUTRE ÉTAGE DU MÊME TERRITOIRE. Le pôle média est le gratuit ouvert, le Club est le
   * payant fermé ; les deux vivent sous « Je te transforme » et se montrent ensemble par la
   * sous-navigation. Le segment anglais est celui de la table du design system : `digitos-club`.
   */
  'club-des-digitos': { fr: 'club-des-digitos', en: 'digitos-club' },
  podcasts: { fr: 'podcasts', en: 'podcasts' },
  videos: { fr: 'videos', en: 'videos' },
  faq: { fr: 'faq', en: 'faq' },
  contact: { fr: 'contact', en: 'contact' },
  agence: { fr: 'agence', en: 'agency' },
  /*
   * `local-presence`, et non `digital-presence` : c'est la valeur de la table du design
   * system. L'écart était SILENCIEUX — ni commentaire, ni test — sur une URL publique.
   *
   * Le kit ne choisit pas « local » par hasard : l'offre s'adresse à un commerce de quartier
   * qu'on trouve sur une carte, pas à une transformation numérique d'entreprise.
   * « Digital presence » est le terme de la plaquette ; « local presence » est ce que le
   * client vient chercher. La voix anglaise du kit tranche pareil ailleurs — « I'll get you
   * online », jamais « I digitize you ».
   *
   * L'ancienne URL part en 301 depuis `firebase.json`. Elle a été indexée : la casser sans
   * redirection ferait payer le changement à qui arrive par une recherche.
   */
  'presence-digitale': { fr: 'presence-digitale', en: 'local-presence' },
  devis: { fr: 'devis', en: 'quote' },
  legal: { fr: 'legal', en: 'legal' },
  'mentions-legales': { fr: 'mentions-legales', en: 'legal-notice' },
  confidentialite: { fr: 'confidentialite', en: 'privacy' },
  cgv: { fr: 'cgv', en: 'terms-of-sale' },
  cgu: { fr: 'cgu', en: 'terms-of-use' },
  cookies: { fr: 'cookies', en: 'cookies' },
  // LMS
  /*
   * `my-learning`, valeur de la table du design system, et non `my-space`. « Space » ne dit
   * rien de ce qu'on y fait ; l'espace est celui d'un ÉLÈVE, et c'est ce que le kit nomme.
   * Aucune collision avec `cours → learn` : les deux chaînes diffèrent, et l'assertion
   * d'unicité plus bas le vérifie à chaque chargement.
   */
  'mon-espace': { fr: 'mon-espace', en: 'my-learning' },
  'tableau-de-bord': { fr: 'tableau-de-bord', en: 'dashboard' },
  cours: { fr: 'cours', en: 'learn' },
  notes: { fr: 'notes', en: 'notes' },
  messages: { fr: 'messages', en: 'messages' },
  succes: { fr: 'succes', en: 'achievements' },
  profil: { fr: 'profil', en: 'profile' },
  parametres: { fr: 'parametres', en: 'settings' },
  club: { fr: 'club', en: 'club' },
  // AD-12 — le tuteur s'appelle « Répétiteur » par défaut, et chaque personne peut le
  // renommer. La ROUTE, elle, ne suit pas le renommage : elle est un contrat, pas un
  // libellé. `/mon-espace/rysmo` est redirigé de façon permanente vers `/mon-espace/repetiteur`.
  repetiteur: { fr: 'repetiteur', en: 'tutor' },
  // Les deux écrans de la version installable. « notifications » est le SEUL canal sortant
  // du produit : il n'existe aucun envoi d'e-mail, et aucun écran ne doit en promettre un.
  'hors-connexion': { fr: 'hors-connexion', en: 'offline' },
  notifications: { fr: 'notifications', en: 'notifications' },
  temoignages: { fr: 'temoignages', en: 'testimonials' },
  checkout: { fr: 'checkout', en: 'checkout' },
  paiement: { fr: 'paiement', en: 'payment' },
  paiements: { fr: 'paiements', en: 'payments' },
  retour: { fr: 'retour', en: 'return' },
  certificat: { fr: 'certificat', en: 'certificate' },
  // Le contrôle d'un code, sans compte. Segment anglais de la table du design system.
  verifier: { fr: 'verifier', en: 'verify' },
  // Auth
  /* `sign-in`, valeur de la table du design system. Deux mots plutôt qu'un jargon : c'est
     le registre du kit, qui écrit « I'll train you » et pas « I educate you ». */
  connexion: { fr: 'connexion', en: 'sign-in' },
  inscription: { fr: 'inscription', en: 'signup' },
  'mot-de-passe-oublie': { fr: 'mot-de-passe-oublie', en: 'forgot-password' },
  // Admin
  admin: { fr: 'admin', en: 'admin' },
  articles: { fr: 'articles', en: 'articles' },
  utilisateurs: { fr: 'utilisateurs', en: 'users' },
  analytics: { fr: 'analytics', en: 'analytics' },
  annonces: { fr: 'annonces', en: 'announcements' },
  transactions: { fr: 'transactions', en: 'transactions' },
  coupons: { fr: 'coupons', en: 'coupons' },
  'rendez-vous': { fr: 'rendez-vous', en: 'appointments' },
  'club-digitos': { fr: 'club-digitos', en: 'club-digitos' },
  'prospects-agence': { fr: 'prospects-agence', en: 'agency-leads' },
  projets: { fr: 'projets', en: 'projects' },
  redirections: { fr: 'redirections', en: 'redirects' },
};

// Tables inverses pré-calculées.
const FR_TO_EN: Record<string, string> = {};
const EN_TO_FR: Record<string, string> = {};
for (const { fr, en } of Object.values(SEGMENTS)) {
  FR_TO_EN[fr] = en;
  EN_TO_FR[en] = fr;
}

/**
 * L'ASSERTION QUI MANQUAIT.  (AD-15)
 *
 * Le commentaire en tête de ce fichier AVERTISSAIT déjà du risque — mais rien ne le
 * vérifiait, et c'est la moitié du problème : ce défaut-là n'a aucune manifestation qui
 * alerte. Deux segments français qui traduisent vers la même valeur anglaise produisent une
 * page inatteignable dans une langue et pas dans l'autre, SANS ERREUR DE COMPILATION, sans
 * test rouge, sans page blanche. Le remappage inverse choisit silencieusement l'une des
 * deux, et l'autre cesse d'exister en anglais.
 *
 * Le cas connu : `formations → courses` et `cours → learn`. S'ils avaient tous deux donné
 * `courses`, `/en/courses/:slug` aurait désigné à la fois la fiche formation et le lecteur
 * de cours — et le remappage aurait renvoyé les deux vers la même page française.
 *
 * Échec DUR en développement : c'est le seul moment où quelqu'un lit le message. En
 * production on journalise, parce qu'une page à moitié traduite vaut mieux qu'un écran
 * blanc pour la personne qui est en train de la lire.
 */
function assertEnglishSegmentsAreUnique(): void {
  const seen = new Map<string, string>();
  const collisions: string[] = [];
  for (const { fr, en } of Object.values(SEGMENTS)) {
    const first = seen.get(en);
    if (first !== undefined && first !== fr) collisions.push(`« ${en} » réclamé par « ${first} » et « ${fr} »`);
    else seen.set(en, fr);
  }
  if (collisions.length === 0) return;

  const message =
    `Table de segments : ${collisions.length} collision(s) anglaise(s). ` +
    `Une page devient inatteignable en anglais, sans autre signe. ${collisions.join(' ; ')}`;

  if (import.meta.env.DEV) throw new Error(message);
  console.error(message);
}

assertEnglishSegmentsAreUnique();

function mapSegment(seg: string, table: Record<string, string>): string {
  // Laisse intacts les paramètres de route (:slug), le wildcard (*), et les segments inconnus (slugs).
  if (!seg || seg.startsWith(':') || seg === '*') return seg;
  return table[seg] ?? seg;
}

/** Traduit les segments d'un chemin (sans préfixe de langue) du FR canonique vers `lang`. */
export function localizeSegments(path: string, lang: Lang): string {
  if (lang === 'fr') return path;
  return path.split('/').map((s) => mapSegment(s, FR_TO_EN)).join('/');
}

/** Remappe les segments EN vers le FR canonique (sans préfixe de langue). */
export function canonicalizeSegments(path: string): string {
  return path.split('/').map((s) => mapSegment(s, EN_TO_FR)).join('/');
}
