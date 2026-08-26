import type { PopupId } from './rules';
import type { EntrySource } from './entrySource';

/**
 * Registre déclaratif des pop-ups — quelle fenêtre, sur quelle page, à quel déclencheur.
 *
 * ⚠️ Avec deux pop-ups, `PopupManager` empilait des conditions en dur ; à six, cela devenait
 * illisible et chaque ajout risquait d'en casser une autre. La pertinence vit désormais ICI, sous
 * forme de données ; `PopupManager` ne fait plus qu'appliquer la première règle qui correspond.
 *
 * ⚠️ **L'ordre du tableau EST la priorité.** Deux pop-ups peuvent être éligibles sur la même page
 * — la reprise de panier peut par exemple croiser la fin d'un article. La première l'emporte, et
 * le plafond d'une pop-up par session écarte l'autre. Ranger de la plus commercialement engageante
 * à la plus large.
 *
 * ⚠️ Ce module ne porte AUCUN texte affichable : les libellés vivent dans `shared.json`,
 * sous `popups.<id>`.
 */

export type PopupTrigger =
  /** La souris quitte le document par le haut (desktop seulement). */
  | 'exitIntent'
  /** Le visiteur tente de quitter la page par une navigation interne. */
  | 'navigation'
  /** Temps de présence, ou profondeur de lecture — la première des deux. */
  | 'dwell'
  /** Profondeur de lecture seule, pour les fins d'article. */
  | 'scroll'
  /** Dès l'arrivée sur une page, quand un état antérieur le justifie. */
  | 'return';

/** Ce que `PopupManager` sait du visiteur au moment d'évaluer une règle. */
export interface PopupContext {
  /** Chemin canonique FR, sans préfixe de langue ni `/` final. */
  path: string;
  entrySource: EntrySource;
  isSignedIn: boolean;
  /** Une formation a été laissée dans un tunnel de paiement non abouti. */
  hasPendingCart: boolean;
}

export interface PopupDefinition {
  id: PopupId;
  trigger: PopupTrigger;
  /** Surface sous `lg`. `sheet` est OBLIGATOIRE partout où le trafic organique domine. */
  mobileSurface: 'modal' | 'sheet';
  /** Vrai si la pop-up a un sens dans ce contexte. Les plafonds sont évalués ailleurs. */
  eligible: (ctx: PopupContext) => boolean;
}

/** Vrai si `path` est le chemin exact ou l'un de ses descendants. */
export function isUnder(path: string, root: string): boolean {
  return path === root || path.startsWith(`${root}/`);
}

/**
 * Tunnels de paiement. Rien ne doit JAMAIS s'y afficher : interrompre quelqu'un en train de payer
 * est le pire résultat que ce dispositif puisse produire.
 */
const CHECKOUT_PATHS: readonly string[] = ['/checkout', '/paiement'];

export function isCheckoutPath(path: string): boolean {
  return CHECKOUT_PATHS.some((root) => isUnder(path, root));
}

/** Contextes d'arrivée qui justifient de présenter l'offre de formation à un inconnu. */
const DISCOVERY_SOURCES: readonly EntrySource[] = ['search', 'clientFooter'];

/**
 * Pages où « Je te forme » ne doit pas s'inviter : le visiteur y est déjà, ou il est dans un
 * tunnel commercial concurrent qu'on ne détourne pas.
 */
const FORMATIONS_ENTRY_EXCLUDED: readonly string[] = [
  '/formations',
  '/agence',
  '/presence-digitale',
];

export const POPUP_REGISTRY: readonly PopupDefinition[] = [
  /*
    La reprise de panier passe en premier : un visiteur qui a laissé un paiement en route est le
    plus proche de l'achat de tout le site. Elle est indépendante du chemin, sauf les tunnels.
  */
  {
    id: 'cartRecovery',
    trigger: 'return',
    mobileSurface: 'sheet',
    eligible: (c) => c.hasPendingCart && !isCheckoutPath(c.path),
  },

  /*
    Fiche formation : le moment de plus forte intention d'achat du site. Modale assumée — le
    visiteur a cliqué pour venir ici, ce n'est pas une interruption d'arrivée.
  */
  {
    id: 'formationExit',
    trigger: 'exitIntent',
    mobileSurface: 'modal',
    eligible: (c) => isUnder(c.path, '/formations') && c.path !== '/formations',
  },

  /*
    Aiguilleur d'audience sur /agence. Voir `AudienceRouterPopup` : ce n'est pas une mise en avant
    d'offre mais une question d'audience, pour ne pas abîmer un positionnement high-ticket.
  */
  {
    id: 'agencyExit',
    trigger: 'exitIntent',
    mobileSurface: 'modal',
    eligible: (c) => c.path === '/agence',
  },

  /*
    Miroir commerçant. Surface `modal` UNIQUEMENT : `/presence-digitale` porte déjà `StickyWhatsApp`
    en bas d'écran sous `lg`, un bandeau entrerait en collision avec lui.
  */
  {
    id: 'presenceExit',
    trigger: 'exitIntent',
    mobileSurface: 'modal',
    eligible: (c) => c.path === '/presence-digitale',
  },

  /*
    Fin d'article. `sheet` sur mobile est IMPÉRATIF : le trafic blog est très majoritairement
    organique, et une modale y tomberait sous la pénalité « interstitiel intrusif » de Google.

    ⚠️ Le contenu doit rester la CAPTURE EMAIL, jamais une formation : `FormationCTA` occupe déjà
    le bas d'article. Deux fois la même offre à deux secondes d'intervalle serait absurde.
  */
  {
    id: 'blogEnd',
    trigger: 'scroll',
    mobileSurface: 'sheet',
    eligible: (c) => isUnder(c.path, '/blog') && c.path !== '/blog' && !c.isSignedIn,
  },

  /*
    Découverte des formations, en dernier : c'est la règle la plus large, elle ne doit ramasser que
    ce qu'aucune autre n'a pris.
  */
  {
    id: 'formationsEntry',
    trigger: 'dwell',
    mobileSurface: 'sheet',
    eligible: (c) =>
      !c.isSignedIn
      && DISCOVERY_SOURCES.includes(c.entrySource)
      && !isCheckoutPath(c.path)
      && !FORMATIONS_ENTRY_EXCLUDED.some((excluded) => isUnder(c.path, excluded)),
  },
];

/** La première pop-up pertinente dans ce contexte, ou `null`. Les plafonds sont vus ailleurs. */
export function findEligible(ctx: PopupContext): PopupDefinition | null {
  return POPUP_REGISTRY.find((def) => def.eligible(ctx)) ?? null;
}

export function getDefinition(id: PopupId): PopupDefinition | undefined {
  return POPUP_REGISTRY.find((def) => def.id === id);
}
