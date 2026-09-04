import { contact, publicProfiles, socialLinks } from '../../lib/brand';

export const SITE_URL = 'https://maxmorrys.me';
export const SITE_NAME = 'Max-Morrys';
/*
 * 56 CARACTÈRES, ET IL TUTOIE — les deux pour la même raison.
 *
 * L'ancienne valeur (« Maîtrisez le digital, accélérez votre croissance ») faisait 61
 * caractères : au-delà de 60, un moteur tronque, et c'est la chaîne LA PLUS VUE du site
 * qui partait coupée. Elle vouvoyait aussi, seule contre tout le reste — le H1 prérendu
 * de l'accueil dit déjà « Maîtrise le digital, accélère ta croissance ». Un titre de
 * résultat de recherche qui ne parle pas comme la page qu'il annonce se paie au clic.
 */
export const DEFAULT_TITLE = 'Max-Morrys | Maîtrise le digital, accélère ta croissance';
export const DEFAULT_DESCRIPTION =
  'Formations, articles, podcasts et vidéos pour maîtriser le marketing digital, le SEO et l\'IA. Par Max-Morrys depuis Dakar.';
// Image OG par défaut, servie depuis Cloudflare R2 (média migré depuis Firebase Storage).
export const DEFAULT_OG_IMAGE = 'https://media.maxmorrys.me/Je-te-forme/2252.jpg';
export const TWITTER_HANDLE = '@max_morrys';

/**
 * Coordonnées de contact — réexportées depuis `lib/brand/company.ts`.
 *
 * Ce numéro était recopié dans neuf fichiers sous trois formats différents. Un numéro
 * de téléphone dupliqué finit toujours par diverger : passer par ces constantes.
 *   - `CONTACT_PHONE_RAW` : format wa.me (indicatif sans « + » ni séparateur)
 *   - `CONTACT_PHONE_E164` : format des données structurées et des liens `tel:`
 *   - `CONTACT_PHONE_DISPLAY` : format lisible à l'écran
 *
 * Ces alias sont conservés parce qu'ils sont consommés dans tout le dépôt ; la valeur,
 * elle, ne vit plus qu'à un seul endroit.
 */
export const CONTACT_PHONE_RAW = contact.phoneRaw;
export const CONTACT_PHONE_E164 = contact.phoneE164;
export const CONTACT_PHONE_DISPLAY = contact.phoneDisplay;
export const CONTACT_EMAIL = contact.email;
export const WHATSAPP_BASE_URL = `https://wa.me/${CONTACT_PHONE_RAW}`;

/**
 * DEUX LISTES, ET LA DIFFÉRENCE EST VOLONTAIRE.
 *
 * `SOCIAL_LINKS` reste les seuls profils sociaux : le pied de page les rend par une table
 * d'icônes indexée par nom, et un nom hors table y casserait la rangée.
 *
 * `SOCIAL_URLS` alimente `sameAs`, qui n'a pas cette contrainte et accepte toute page publique
 * tenue par la même personne — la plateforme d'écoute du podcast comprise, le jour où elle
 * existe. Elle lit donc `publicProfiles`, et le JSON-LD des trois pages la reçoit sans qu'on y
 * touche.
 */
export const SOCIAL_LINKS = socialLinks;

export const SOCIAL_URLS = publicProfiles.map((s) => s.url);

export function buildCanonical(path: string): string {
  const clean = path.split('?')[0].split('#')[0];
  return `${SITE_URL}${clean}`;
}

export function truncateDescription(text: string, max = 160): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3).trimEnd() + '...';
}
