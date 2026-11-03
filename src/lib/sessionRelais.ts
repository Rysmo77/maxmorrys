/**
 * LE RELAIS DE SESSION — quand on arrive sur un espace SANS avoir cliqué depuis un autre.
 *
 * `lib/sessionHandoff.ts` transmet la session au clic sur un lien inter-espaces. Il ne couvre
 * pas ce qui n'est pas un clic : adresse tapée, favori, nouvel onglet, lien reçu par e-mail.
 * C'est exactement ce que l'audit du 03/11/2026 (E1) a relevé : connecté·e sur l'Edu, on
 * ouvrait maxmorrys.me/compte et l'on tombait sur `/connexion`.
 *
 * Le relais fait un aller-retour de document, sans rien de neuf côté serveur :
 *
 *   1. chaque hôte note dans le cookie commun `.maxmorrys.me` (`lib/sharedStore`) s'il a une
 *      session — le NOM de l'espace, rien d'autre : ni uid, ni e-mail ;
 *   2. une garde (`ProtectedRoute`) qui ne trouve personne, alors qu'un autre espace est noté
 *      connecté, part vers `https://<cet espace>/#relais=<adresse demandée>` au lieu de
 *      `/connexion` ;
 *   3. l'espace sollicité attend son état d'authentification : connecté, il renvoie vers
 *      l'adresse demandée PAR `allerVers` — donc avec un code à usage unique de 60 s dans le
 *      fragment, le même chemin que le clic ; anonyme, il renvoie sans code et s'efface de
 *      la liste.
 *
 * Ce qui tient la sécurité :
 *   · l'adresse de retour n'est suivie que si elle désigne un AUTRE de nos trois espaces : le
 *     relais n'est pas une redirection ouverte ;
 *   · le code n'est émis que contre l'ID token de la personne connectée, et ne s'échange que
 *     depuis l'origine désignée (`worker/apps/api/src/sessionTransfer.ts`) — quiconque force
 *     un relais ne fait que reconnecter quelqu'un à SON propre compte, sur un hôte à nous ;
 *   · aucun jeton dans une adresse durable : le fragment ne part ni au serveur ni dans le
 *     `Referer`, et il est retiré avant le premier rendu.
 *
 * Contre la boucle : une marque par onglet et par origine (`sessionStorage`) n'autorise qu'un
 * relais toutes les deux minutes ; sans `sessionStorage` lisible, pas de relais du tout.
 */
import { ESPACES, origineEspace, type Espace } from './espaces';

/** Clé du cookie commun : les espaces où une session est ouverte, séparés par des virgules. */
export const CLE_ESPACES_CONNECTES = 'mm_espaces_connectes';
/** Durée de vie de cette indication. Fausse, elle coûte un aller-retour, puis se corrige. */
export const DUREE_INDICATION_S = 30 * 24 * 60 * 60;
/** Clé `sessionStorage` de la marque anti-boucle. */
export const CLE_MARQUE_RELAIS = 'mm_relais_tente';
/** Un relais au plus par onglet, par origine, dans cette fenêtre. */
export const FENETRE_RELAIS_MS = 2 * 60 * 1000;

const PARAM_RELAIS = /(^|&)relais=([^&]*)/;

/** Lit la valeur du cookie : les espaces connus, sans doublon, dans l'ordre canonique. */
export function analyserEspaces(valeur: string | null): Espace[] {
  if (!valeur) return [];
  const lus = new Set(valeur.split(',').map((s) => s.trim()));
  return ESPACES.filter((e) => lus.has(e));
}

/** La nouvelle valeur après avoir noté `espace` connecté ou non. `null` : plus rien à garder. */
export function noterEspace(valeur: string | null, espace: Espace, connecte: boolean): string | null {
  const ensemble = new Set(analyserEspaces(valeur));
  if (connecte) ensemble.add(espace);
  else ensemble.delete(espace);
  const liste = ESPACES.filter((e) => ensemble.has(e));
  return liste.length ? liste.join(',') : null;
}

/** L'espace à solliciter depuis `courant`, ou `null` si aucun autre n'a de session. */
export function espaceRelais(courant: Espace, connectes: readonly Espace[]): Espace | null {
  return connectes.find((e) => e !== courant) ?? null;
}

/** La marque anti-boucle autorise-t-elle un relais maintenant ? */
export function relaisPermis(marque: string | null, maintenant: number): boolean {
  if (!marque) return true;
  const t = Number(marque);
  if (!Number.isFinite(t)) return true;
  return maintenant - t >= FENETRE_RELAIS_MS || t > maintenant;
}

/** L'URL qui demande à `cible` de renvoyer vers `retour` avec sa session. */
export function urlDemandeRelais(cible: Espace, origineCourante: string, retour: string): string {
  return `${origineEspace(cible, origineCourante)}/#relais=${encodeURIComponent(retour)}`;
}

/**
 * Lit une demande de relais dans un fragment (sans `#`). Rend l'adresse de retour, si elle
 * désigne un AUTRE de nos trois espaces, et le fragment à remettre en place ; `null` sinon.
 * Une demande invalide est quand même retirée de l'adresse (`retour: null`).
 */
export function lireDemandeRelais(
  fragment: string,
  origineCourante: string,
): { retour: string | null; reste: string } | null {
  const m = PARAM_RELAIS.exec(fragment);
  if (!m) return null;
  const reste = fragment.replace(PARAM_RELAIS, '').replace(/^&/, '');
  let retour: string | null = null;
  try {
    const url = new URL(decodeURIComponent(m[2]));
    const autres = ESPACES.map((e) => origineEspace(e, origineCourante)).filter((o) => o !== origineCourante);
    if (autres.includes(url.origin)) retour = url.href;
  } catch {
    retour = null;
  }
  return { retour, reste };
}

/* ── LA DÉCONNEXION QUI TIENT ────────────────────────────────────────────────────────────
   Sans elle, se déconnecter sur un espace ne servait à rien : les deux autres gardaient leur
   session, se notaient de nouveau connectés, et le relais reconnectait aussitôt.

   · une déconnexion VOULUE pose `CLE_DECONNEXION` (horodatage, cookie commun) ;
   · chaque espace range, PAR ORIGINE, le moment où SA session a commencé (`CLE_DEBUT_SESSION`) ;
     une session plus ancienne que la marque est fermée au chargement et ne répond à aucun relais ;
   · toute connexion fraîche pose `CLE_DERNIERE_CONNEXION` (cookie commun) : le relais n'est
     tenté que si elle est plus récente que la marque.

   Les deux horodatages viennent de la MÊME horloge — celle du navigateur — : aucun décalage
   avec le serveur ne peut fermer une session neuve. */

/** Cookie commun : quand la dernière déconnexion volontaire a eu lieu (ms epoch). */
export const CLE_DECONNEXION = 'mm_deconnexion_at';
/** Cookie commun : quand la dernière connexion fraîche a eu lieu, sur n'importe quel espace. */
export const CLE_DERNIERE_CONNEXION = 'mm_connexion_at';
/** `localStorage` de l'origine : quand la session de CET espace a commencé. */
export const CLE_DEBUT_SESSION = 'mm_session_debut';

/** Un horodatage lu, ou `null` s'il manque ou est illisible. */
export function lireHorodatage(valeur: string | null): number | null {
  if (!valeur) return null;
  const t = Number(valeur);
  return Number.isFinite(t) && t > 0 ? t : null;
}

/**
 * La session locale a-t-elle commencé avant la dernière déconnexion volontaire ? Une session
 * sans début connu est réputée ancienne : elle date d'avant ce mécanisme.
 */
export function sessionPerimee(debut: number | null, deconnexion: number | null): boolean {
  if (deconnexion === null) return false;
  return debut === null || debut < deconnexion;
}

/** Le relais est-il permis au regard de la dernière déconnexion ? */
export function relaisApresDeconnexion(derniereConnexion: number | null, deconnexion: number | null): boolean {
  if (deconnexion === null) return true;
  return derniereConnexion !== null && derniereConnexion > deconnexion;
}
