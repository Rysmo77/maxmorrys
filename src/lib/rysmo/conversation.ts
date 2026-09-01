/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LA CONVERSATION DU RÉPÉTITEUR — UNE SEULE CLÉ, DEUX LECTEURS.
 *
 * Elle vivait entièrement dans `RysmoWidget`, avec sa clé de stockage en constante
 * de module. Le panneau permanent du tableau de bord doit lire la même chose : sans
 * ce fichier, la chaîne `'rysmo_conversation'` serait écrite à deux endroits, et un
 * renommage en casserait un des deux sans que rien ne le dise.
 *
 * ⚠️ `sessionStorage`, PAS `localStorage`, ET C'EST DÉLIBÉRÉ. La conversation meurt
 * avec l'onglet. C'est ce qui est écrit dans le produit aujourd'hui ; le changer
 * ferait survivre les échanges d'une personne sur un poste partagé — un cybercafé
 * est un lieu de connexion courant sur ce marché. Ne pas « corriger » en localStorage.
 *
 * LA MÉMOIRE DURABLE EST AILLEURS, et c'est une autre chose : l'écran de mémoire du
 * répétiteur (`/mon-espace/repetiteur?tab=memoire`) porte le profil, côté serveur.
 * Ce fichier ne gère que le fil visible de la session en cours.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export interface RysmoMessage {
  role: 'user' | 'assistant';
  content: string;
}

const STORAGE_KEY = 'rysmo_conversation';

/** Au-delà, on tronque : le stockage de session est petit et partagé par l'onglet. */
const MAX_MESSAGES = 50;

export function loadConversation(uid: string): RysmoMessage[] {
  try {
    const raw = sessionStorage.getItem(`${STORAGE_KEY}_${uid}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RysmoMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Stockage indisponible (navigation privée, quota) — le fil repart vide.
    return [];
  }
}

export function persistConversation(uid: string, messages: RysmoMessage[]): void {
  try {
    sessionStorage.setItem(`${STORAGE_KEY}_${uid}`, JSON.stringify(messages.slice(-MAX_MESSAGES)));
  } catch {
    // Stockage plein ou indisponible : l'échange reste à l'écran, il ne survit pas.
  }
}

export function clearConversation(uid: string): void {
  try {
    sessionStorage.removeItem(`${STORAGE_KEY}_${uid}`);
  } catch {
    // Rien à faire : il n'y avait déjà rien à effacer.
  }
}

/**
 * ── OUVRIR LE RÉPÉTITEUR DEPUIS AILLEURS ────────────────────────────────────────
 *
 * `RysmoWidget` est monté une fois pour toute l'application (`App.tsx`), et son état
 * d'ouverture est interne. Le panneau du tableau de bord doit pouvoir le déplier avec
 * une question déjà écrite.
 *
 * POURQUOI UN ÉVÉNEMENT ET PAS UN CONTEXTE. Un contexte aurait obligé à remonter
 * l'état d'ouverture au-dessus du routeur, donc à re-rendre l'arbre entier à chaque
 * ouverture du widget. L'événement ne traverse rien : il est émis, le seul composant
 * qui écoute réagit. C'est aussi ce qui permet au panneau de ne rien savoir du widget.
 */
export const RYSMO_OPEN_EVENT = 'rysmo:open';

export interface RysmoOpenDetail {
  /** Question à pré-remplir. Vide = simple ouverture. */
  question?: string;
}

export function openRysmo(question?: string): void {
  window.dispatchEvent(
    new CustomEvent<RysmoOpenDetail>(RYSMO_OPEN_EVENT, { detail: { question } }),
  );
}
