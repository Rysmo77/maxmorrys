/**
 * LA SESSION TRANSMISE D'UN ESPACE À L'AUTRE — une seule connexion pour les trois hôtes.
 *
 * Firebase Auth range la session par ORIGINE : connecté·e sur maxmorrys.me, on arriverait
 * anonyme sur edu.maxmorrys.me. Le passage se fait donc par un code :
 *
 *   1. au clic sur un lien vers un autre espace, si quelqu'un est connecté, l'API émet un
 *      code à usage unique (60 s) contre l'ID token (`POST /session/emettre`) ;
 *   2. la navigation part vers `https://<hôte><chemin>#h=<code>` — dans le FRAGMENT, qui ne
 *      part ni au serveur, ni dans les journaux, ni dans le `Referer` ;
 *   3. à l'arrivée, avant que l'état d'authentification ne soit publié, le code est retiré
 *      de l'adresse, échangé contre un custom token (`POST /session/echanger`) et passé à
 *      `signInWithCustomToken`.
 *
 * Un lien suivi par quelqu'un d'anonyme reste un lien absolu ordinaire.
 *
 * ⚠️ LIMITE CONNUE — LA DÉCONNEXION EST LOCALE À L'HÔTE. Se déconnecter sur l'Edu ne
 * déconnecte pas le hub ni le Club : chaque origine garde sa session jusqu'à sa propre
 * déconnexion ou l'expiration du jeton. Rien ne casse — l'autre hôte reste simplement
 * connecté. Un clic de transfert ne fait que transmettre la session COURANTE ; une personne
 * déconnectée ici suit un lien simple.
 */
import { onAuthStateChanged, signInWithCustomToken, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { captureError } from './sentry';
import { espaceCourant, estAutreEspace } from './hosts';
import { effacerPartage, ecrirePartage, lirePartage } from './sharedStore';
import {
  CLE_DEBUT_SESSION,
  CLE_DECONNEXION,
  CLE_DERNIERE_CONNEXION,
  CLE_ESPACES_CONNECTES,
  CLE_MARQUE_RELAIS,
  DUREE_INDICATION_S,
  analyserEspaces,
  espaceRelais,
  lireDemandeRelais,
  lireHorodatage,
  noterEspace,
  relaisApresDeconnexion,
  relaisPermis,
  sessionPerimee,
  urlDemandeRelais,
} from './sessionRelais';

const API = (import.meta.env.VITE_FUNCTIONS_ORIGIN || 'https://api.maxmorrys.me').replace(/\/$/, '');

/** Le paramètre du fragment. */
const PARAM = /(^|&)h=([A-Za-z0-9_-]{20,200})(?=&|$)/;

let reception: Promise<void> = Promise.resolve();

/**
 * Lit, retire et échange le code d'arrivée. À appeler AVANT le premier rendu : le code ne doit
 * jamais rester dans l'adresse, et `AuthProvider` attend la fin de l'échange (`attendreTransfert`)
 * pour ne pas renvoyer vers `/connexion` une personne en train d'arriver connectée.
 */
export function demarrerReceptionTransfert(): void {
  if (typeof window === 'undefined') return;
  const fragment = window.location.hash.slice(1);
  const m = PARAM.exec(fragment);
  if (!m) {
    // Pas de code : seulement fermer une session antérieure à une déconnexion volontaire,
    // avant que l'état ne soit publié (sinon elle s'afficherait un instant).
    reception = fermerSiPerimee();
    return;
  }
  const code = m[2];
  const reste = fragment.replace(PARAM, '').replace(/^&/, '');
  const { pathname, search } = window.location;
  window.history.replaceState(window.history.state, '', `${pathname}${search}${reste ? `#${reste}` : ''}`);

  reception = (async () => {
    try {
      const reponse = await fetch(`${API}/session/echanger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (!reponse.ok) return; // code expiré ou déjà servi : on arrive anonyme, sans plus
      const { token } = (await reponse.json()) as { token?: unknown };
      if (typeof token === 'string') {
        // Noté AVANT : l'écouteur d'état est appelé pendant la connexion elle-même.
        noterConnexionFraiche();
        await signInWithCustomToken(auth, token);
      }
    } catch (error: unknown) {
      captureError(error, { context: 'Session transfer redeem failed' });
    }
    await fermerSiPerimee();
  })();
}

/** Se résout quand un éventuel transfert d'arrivée est terminé (réussi ou non). */
export function attendreTransfert(): Promise<void> {
  return reception;
}

async function obtenirCode(cible: string): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  const idToken = await user.getIdToken();
  const reponse = await fetch(`${API}/session/emettre`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ cible }),
  });
  if (!reponse.ok) return null;
  const { code } = (await reponse.json()) as { code?: unknown };
  return typeof code === 'string' ? code : null;
}

/**
 * Navigue vers une URL, en transmettant la session si elle mène à un autre de nos espaces
 * et que quelqu'un est connecté. Un échec d'émission n'empêche jamais la navigation.
 */
export async function allerVers(href: string, remplacer = false): Promise<void> {
  const url = new URL(href, window.location.href);
  if (auth.currentUser && estAutreEspace(url.href)) {
    try {
      const code = await obtenirCode(url.origin);
      if (code) {
        const fragment = url.hash.slice(1);
        url.hash = fragment ? `${fragment}&h=${code}` : `h=${code}`;
      }
    } catch (error: unknown) {
      captureError(error, { context: 'Session transfer issue failed' });
    }
  }
  if (remplacer) window.location.replace(url.href);
  else window.location.assign(url.href);
}

/**
 * Intercepte, en phase de capture, les clics sur un lien vers un autre espace — quel que soit
 * le composant qui l'a rendu (`LocalizedLink`, primitives du design system, Markdown). Les
 * clics modifiés (nouvel onglet) gardent leur comportement natif, sans transfert.
 */
export function installerTransfertAuClic(): () => void {
  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!auth.currentUser) return;
    const lien = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!lien || lien.hasAttribute('download')) return;
    if (lien.target && lien.target !== '_self') return;
    if (!estAutreEspace(lien.href)) return;
    e.preventDefault();
    void allerVers(lien.href);
  };
  document.addEventListener('click', onClick, true);
  return () => document.removeEventListener('click', onClick, true);
}

/* ── LE RELAIS : arriver connecté·e SANS avoir cliqué (adresse tapée, favori, nouvel onglet).
   La mécanique et sa sécurité sont décrites dans `lib/sessionRelais.ts`. ─────────────────── */

function ecrireIndication(valeur: string | null): void {
  if (valeur) ecrirePartage(CLE_ESPACES_CONNECTES, valeur, 'durable', DUREE_INDICATION_S);
  else effacerPartage(CLE_ESPACES_CONNECTES);
}

function noterIci(connecte: boolean): void {
  ecrireIndication(noterEspace(lirePartage(CLE_ESPACES_CONNECTES), espaceCourant(), connecte));
}

function lireLocal(cle: string): string | null {
  try {
    return localStorage.getItem(cle);
  } catch {
    return null;
  }
}

/** Une connexion vient de s'ouvrir ICI : début de session local, dernière connexion commune. */
function noterConnexionFraiche(): void {
  const maintenant = String(Date.now());
  try {
    localStorage.setItem(CLE_DEBUT_SESSION, maintenant);
  } catch {
    // Sans début noté, la session sera réputée ancienne après une prochaine déconnexion.
  }
  ecrirePartage(CLE_DERNIERE_CONNEXION, maintenant, 'durable', DUREE_INDICATION_S);
}

/** La session locale date-t-elle d'avant la dernière déconnexion volontaire ? */
function sessionLocalePerimee(): boolean {
  return sessionPerimee(
    lireHorodatage(lireLocal(CLE_DEBUT_SESSION)),
    lireHorodatage(lirePartage(CLE_DECONNEXION)),
  );
}

/** Ferme la session locale si elle est antérieure à une déconnexion volontaire. */
async function fermerSiPerimee(): Promise<void> {
  try {
    await auth.authStateReady();
    if (auth.currentUser && sessionLocalePerimee()) {
      noterIci(false);
      await firebaseSignOut(auth);
    }
  } catch (error: unknown) {
    captureError(error, { context: 'Stale session sign-out failed' });
  }
}

/**
 * Note, dans le cookie commun, si l'espace courant a une session — le nom de l'espace, rien
 * d'autre. Le premier appel décrit la session RESTAURÉE ; un passage ensuite d'anonyme à
 * connecté·e est une connexion fraîche (formulaire, Google, transfert).
 */
export function suivreSessionLocale(): () => void {
  let premier = true;
  let precedent = false;
  return onAuthStateChanged(auth, (user) => {
    if (user && !premier && !precedent) noterConnexionFraiche();
    premier = false;
    precedent = !!user;
    noterIci(!!user && !sessionLocalePerimee());
  });
}

/**
 * Déconnexion volontaire : la marque horodatée ferme, à leur prochain chargement, les sessions
 * des autres espaces ouvertes avant elle, et bloque le relais jusqu'à une connexion fraîche.
 */
export function oublierSessionsNotees(): void {
  ecrireIndication(null);
  ecrirePartage(CLE_DECONNEXION, String(Date.now()), 'durable', DUREE_INDICATION_S);
}

let relaisLance = false;

/**
 * Appelée par une garde qui ne trouve personne. Si un autre espace est noté connecté et
 * qu'aucun relais n'a été tenté récemment dans cet onglet, part le solliciter et rend `true`
 * (la garde affiche alors son attente au lieu de `/connexion`). Idempotente pendant la vie de
 * la page : le double rendu de `StrictMode` ne doit pas renvoyer vers `/connexion` pendant
 * que la navigation part.
 */
export function tenterRelais(): boolean {
  if (relaisLance) return true;
  if (typeof window === 'undefined') return false;
  const cible = espaceRelais(espaceCourant(), analyserEspaces(lirePartage(CLE_ESPACES_CONNECTES)));
  if (!cible) return false;
  if (!relaisApresDeconnexion(
    lireHorodatage(lirePartage(CLE_DERNIERE_CONNEXION)),
    lireHorodatage(lirePartage(CLE_DECONNEXION)),
  )) return false;
  try {
    const maintenant = Date.now();
    if (!relaisPermis(sessionStorage.getItem(CLE_MARQUE_RELAIS), maintenant)) return false;
    sessionStorage.setItem(CLE_MARQUE_RELAIS, String(maintenant));
    // Sans marque relue, rien n'empêcherait une boucle : pas de relais.
    if (sessionStorage.getItem(CLE_MARQUE_RELAIS) !== String(maintenant)) return false;
  } catch {
    return false;
  }
  relaisLance = true;
  window.location.replace(urlDemandeRelais(cible, window.location.origin, window.location.href));
  return true;
}

/**
 * Côté espace sollicité, AVANT le premier rendu. Rend `true` s'il s'agit d'une demande de
 * relais valide : l'application ne se rend pas, la page renvoie vers l'adresse demandée —
 * avec un code de session si quelqu'un est connecté ici, sans sinon.
 */
export function traiterDemandeRelais(): boolean {
  if (typeof window === 'undefined') return false;
  const demande = lireDemandeRelais(window.location.hash.slice(1), window.location.origin);
  if (!demande) return false;
  const { pathname, search } = window.location;
  window.history.replaceState(window.history.state, '', `${pathname}${search}${demande.reste ? `#${demande.reste}` : ''}`);
  const retour = demande.retour;
  if (!retour) return false;

  void (async () => {
    let connu = false;
    try {
      connu = await Promise.race([
        auth.authStateReady().then(() => true),
        new Promise<boolean>((r) => setTimeout(() => r(false), 8000)),
      ]);
    } catch (error: unknown) {
      captureError(error, { context: 'Session relay auth wait failed' });
    }
    // État inconnu (délai dépassé) : on rend la main SANS s'effacer — on est peut-être connecté.
    if (!connu) {
      window.location.replace(retour);
      return;
    }
    if (auth.currentUser && !sessionLocalePerimee()) {
      await allerVers(retour, true);
      return;
    }
    // Personne, ou une session antérieure à une déconnexion volontaire : elle ne répond pas.
    noterIci(false);
    if (auth.currentUser) {
      try {
        await firebaseSignOut(auth);
      } catch (error: unknown) {
        captureError(error, { context: 'Stale session sign-out failed' });
      }
    }
    window.location.replace(retour);
  })();
  return true;
}
