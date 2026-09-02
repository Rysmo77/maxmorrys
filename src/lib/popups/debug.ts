import { blockedBy, clearAllPopupState, type PopupId, type PopupBlocker } from './rules';

/**
 * Aperçu forcé et diagnostic des pop-ups.
 *
 * ⚠️ **Ce module existe parce que son absence a coûté une panne entière.** Les pop-ups ont été
 * livrées en production avec quatre verrous silencieux, aucun observable : impossible de savoir
 * lequel bloquait, ni de forcer un affichage pour juger le rendu. Résultat, elles n'ont jamais pu
 * être vues ni testées. Toute pop-up ajoutée doit rester atteignable par `?popup=<id>`.
 *
 * Deux entrées, volontairement disponibles AUSSI en production — le besoin de vérifier ce que voit
 * un visiteur ne s'arrête pas au développement :
 *
 *   - `?popup=<id>`   force l'affichage immédiat en contournant tous les verrous ;
 *   - `?popup=reset`  efface plafonds, délais et suppressions, puis laisse la page se recharger.
 *
 * Et `window.__mmPopups.why()` en console, qui nomme le verrou fermé pour chaque pop-up.
 *
 * ⚠️ Un affichage forcé ne consomme AUCUN plafond et n'émet AUCUN événement de mesure : il
 * fausserait les statistiques que la partie mesure cherche justement à rendre fiables.
 */

const PARAM = 'popup';
const RESET_VALUE = 'reset';

const KNOWN_IDS: readonly PopupId[] = [
  'agencyExit',
  'formationsEntry',
  'formationExit',
  'presenceExit',
  'blogEnd',
  'cartRecovery',
  'clubExit',
  'mediaEnd',
];

function isPopupId(value: string): value is PopupId {
  return (KNOWN_IDS as readonly string[]).includes(value);
}

/**
 * Lit `?popup=` et agit.
 *
 * Retourne la pop-up à forcer, ou `null`. `reset` efface l'état et retourne `null` : la page
 * continue de vivre normalement, avec des compteurs remis à zéro.
 */
export function readPopupOverride(search: string): PopupId | null {
  let value: string | null = null;
  try {
    value = new URLSearchParams(search).get(PARAM);
  } catch {
    // Query string illisible — aucun forçage.
    return null;
  }
  if (!value) return null;

  if (value === RESET_VALUE) {
    clearAllPopupState();
    return null;
  }
  return isPopupId(value) ? value : null;
}

/** Motif de blocage de chaque pop-up, `null` signifiant « peut s'afficher ». */
export type PopupDiagnosis = Record<PopupId, PopupBlocker | 'eligible'>;

function diagnose(): PopupDiagnosis {
  const out = {} as PopupDiagnosis;
  KNOWN_IDS.forEach((id) => {
    out[id] = blockedBy(id) ?? 'eligible';
  });
  return out;
}

/**
 * Expose le diagnostic sur `window`. Appelé une fois au montage de `PopupManager`.
 *
 * Les verrous de `rules.ts` sont couverts intégralement. Ceux qui dépendent du contexte de la page
 * — chemin courant, contexte d'arrivée, réglages d'administration, groupe témoin — sont injectés
 * par `PopupManager` via `context`, qui seul les connaît.
 */
export function installPopupDebug(context: () => Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  (window as unknown as { __mmPopups?: unknown }).__mmPopups = {
    why: () => ({ ...diagnose(), ...context() }),
    reset: () => { clearAllPopupState(); },
    ids: KNOWN_IDS,
  };
}
