/**
 * TROIS NOMS, TROIS CHOSES.  (AD-12)
 *
 * Ce module est la SEULE source de ces trois noms dans le dépôt. Il existe parce que le nom
 * du répétiteur est renommable par chaque personne, et qu'un seul écran qui l'écrit en dur
 * casse le renommage silencieusement — sans erreur de type, sans test rouge, sans rendu
 * cassé. Juste un mot qui ne suit pas, à un endroit sur treize.
 *
 *   « Hello ! »      le mot-symbole des PAGES WEB — barre haute du site. Rendu par
 *                    <Wordmark brand="hello">, en type pur, pour 0 octet. Le PIED DE PAGE
 *                    signe « Max-Morrys » (variant `signature`) : c'est une signature, pas
 *                    une deuxième barre de navigation.
 *   « Rysmo »        le nom de l'APPLICATION — écran de lancement, bannière d'installation,
 *                    connexion, création de compte, /403.
 *   « Répétiteur »   le RÉPÉTITEUR IA qui vit dans l'application. Valeur par DÉFAUT :
 *                    chaque personne peut le renommer.
 *
 * « Max-Morrys » survit, mais seulement comme PERSONNE : la page « Je suis Max-Morrys », la
 * signature d'article, les mentions légales, et « Max-Morrys Agency » qui est un nom de
 * practice. Ce n'est plus un nom de produit — d'où le variant `signature` de <Wordmark>
 * plutôt qu'une suppression.
 */

/** Le nom de l'application installable. Une constante : personne ne le renomme. */
export const APP_NAME = 'Rysmo';

/** L'entité qui opère la plateforme. Mentions légales, CGV, pied de page. */
export const LEGAL_ENTITY = 'MY ONOMA SARL';

/** La personne. Signature d'article, page « à propos », nom de la practice agence. */
export const PERSON_NAME = 'Max-Morrys';
export const AGENCY_NAME = 'Max-Morrys Agency';

/** Le nom par défaut du répétiteur, avant tout renommage. */
export const TUTOR_DEFAULT_NAME = 'Répétiteur';

/**
 * Quatre suggestions plutôt qu'un champ vide.
 *
 * Un champ vide fait hésiter : il demande d'inventer un nom au moment précis où on venait
 * faire autre chose. Quatre propositions donnent un point de départ à modifier, ce qui est
 * une décision beaucoup plus facile que d'en produire une.
 */
export const TUTOR_NAME_SUGGESTIONS = ['Répétiteur', 'Coach', 'Mentor', 'Binôme'] as const;

/** La forme minimale que ce module a besoin de connaître d'un profil. */
interface HasTutorName {
  tutorName?: string;
}

/**
 * LE SEUL ACCESSEUR AU NOM DU RÉPÉTITEUR. Treize emplacements le lisent.
 *
 * Il accepte `null` et `undefined` — pendant le chargement du profil, l'écran s'affiche
 * quand même, avec le nom par défaut, plutôt que de clignoter.
 */
export function tutorName(profile: HasTutorName | null | undefined): string {
  const n = profile?.tutorName?.trim();
  return n && n.length > 0 ? n : TUTOR_DEFAULT_NAME;
}

/**
 * Valide un nom choisi.
 *
 * Deux bornes seulement, et elles sont larges à dessein : c'est le nom que quelqu'un donne à
 * l'outil avec lequel il travaille tous les jours, pas un identifiant. Un nom trop long
 * casse la barre d'onglets ; un nom vide retomberait sur le défaut sans le dire.
 */
export const TUTOR_NAME_MAX = 24;

export function validateTutorName(raw: string): { ok: true; value: string } | { ok: false; reason: string } {
  const v = raw.trim();
  if (v.length === 0) return { ok: false, reason: 'Donne-lui un nom, ou garde celui par défaut.' };
  if (v.length > TUTOR_NAME_MAX) return { ok: false, reason: `${TUTOR_NAME_MAX} caractères au maximum — au-delà, le nom ne tient plus dans la barre d'onglets.` };
  return { ok: true, value: v };
}
