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
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../config/firebase';
import { captureError } from './sentry';
import { estAutreEspace } from './hosts';

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
  if (!m) return;
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
      if (typeof token === 'string') await signInWithCustomToken(auth, token);
    } catch (error: unknown) {
      captureError(error, { context: 'Session transfer redeem failed' });
    }
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
