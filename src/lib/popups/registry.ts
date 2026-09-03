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
  /** Le simulateur de devis a été engagé sans être envoyé. */
  hasStartedQuote: boolean;
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

/**
 * Devis nominatifs. Ce ne sont pas des tunnels de paiement, mais ils s'en protègent pareil.
 *
 * ⚠️ Corrigé le 2026-09-02. `cartRecovery` n'excluait que `isCheckoutPath()` : un commerçant
 * qui avait un jour abandonné un panier FORMATION recevait, en ouvrant son DEVIS agence, une
 * fenêtre lui parlant d'une formation en marketing digital. Deux territoires et deux offres sur
 * le même écran — exactement la faute de couleur que `PresenceDevis.tsx` documente avoir
 * corrigée dans sa mise en page, et qui repassait par la fenêtre.
 *
 * Un devis est un document contractuel qu'on lit sur WhatsApp. Rien ne s'y superpose.
 */
const QUOTE_PATHS: readonly string[] = ['/presence-digitale/devis', '/agence/devis'];

export function isQuotePath(path: string): boolean {
  return QUOTE_PATHS.some((root) => isUnder(path, root));
}

/**
 * Contextes d'arrivée qui justifient de présenter l'offre de formation à un inconnu.
 *
 * ⚠️ `social` a été AJOUTÉ le 2026-09-02, et son absence était un angle mort, pas une décision.
 * `entrySource.ts` entretient une liste `SOCIAL_HOSTS` à la main pour détecter les arrivées
 * depuis YouTube, Instagram et TikTok — c'est-à-dire le canal de publication principal — et
 * aucune règle de ce registre ne s'en servait. Le seul segment que la seule règle pilotée par
 * la source excluait était donc l'audience la plus chaude du site : des gens qui arrivent
 * parce qu'ils connaissent déjà l'auteur.
 *
 * Ce que `social` ne recouvre PAS : un partage de lien entre deux personnes sur WhatsApp est
 * classé `direct` faute de référent, et reste donc hors découverte. C'est voulu — on ne sait
 * rien de son intention.
 */
const DISCOVERY_SOURCES: readonly EntrySource[] = ['search', 'clientFooter', 'social'];

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
    eligible: (c) => c.hasPendingCart && !isCheckoutPath(c.path) && !isQuotePath(c.path),
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
    Club des Digitos. Ajoutée le 2026-09-02, et c'est la seule pop-up du registre adossée à une
    offre RÉELLEMENT achetable aujourd'hui : au relevé du 30 août 2026 la base porte 0 formation
    publiée, tandis que l'abonnement — sessions en direct, ateliers, quota de tuteur — ne dépend
    pas du catalogue.

    ⚠️ Elle ne redit PAS le prix, ni ce que contient l'abonnement : la page les affiche déjà
    trois fois. Son seul objet est de nommer l'étape que la page CACHE — le bouton « Je rejoins
    le Club » pointe vers `/mon-espace/club`, qui est gardé. Un visiteur déconnecté y rencontre
    un mur de connexion sans avoir été prévenu, et c'est là qu'il se perd.

    Modale assumée à toutes les tailles : le visiteur a cliqué pour venir sur cette page, la
    fenêtre ne s'invite pas dans une arrivée organique.
  */
  {
    id: 'clubExit',
    trigger: 'exitIntent',
    mobileSurface: 'modal',
    eligible: (c) => c.path === '/club-des-digitos' && !c.isSignedIn,
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
    Devis commencé, jamais envoyé. C'est la reprise de panier, transposée à la seule offre
    high-ticket que le produit sache encaisser aujourd'hui : quelqu'un qui a nommé son commerce
    et choisi un pack est très loin devant un visiteur qui passe.

    ⚠️ Elle passe AVANT `presenceExit`, et c'est tout l'intérêt. Les deux visent la même page et
    le même déclencheur, mais celle-ci s'adresse à un sous-segment beaucoup plus chaud et peut
    donc lui parler autrement — reprendre là où il s'est arrêté, plutôt que présenter l'offre.
    Sans cette priorité, la fenêtre générique gagnerait toujours la course.

    ⚠️ Modale, comme sa voisine, et pour la même raison : `StickyWhatsApp` occupe déjà le bas
    de l'écran sous `lg` sur cette page. Un bandeau entrerait en collision avec lui.
  */
  {
    id: 'quoteAbandon',
    trigger: 'exitIntent',
    mobileSurface: 'modal',
    eligible: (c) => c.path === '/presence-digitale' && c.hasStartedQuote,
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
    Fin d'un podcast ou d'une vidéo. Ces deux fiches sont des CULS-DE-SAC : contrairement à
    l'article de blog, qui porte `FormationCTA` en bas, `VideoDetail` et `PodcastDetail` ne
    proposent AUCUNE suite — leur seul bouton renvoie vers le pôle média d'où l'on vient.

    ⚠️ Elle envoie vers la page publique du Club, jamais vers l'abonnement. Quelqu'un qui vient
    de regarder une vidéo gratuite n'est pas à un clic d'un engagement de douze mois.

    ⚠️ `sheet` sous `lg`, et déclencheur `scroll` : ces fiches reçoivent du trafic social et de
    recherche, et `MediaPole` pose une règle que cette fenêtre respecte — « le Club EN BAS,
    jamais devant ». À 90 % de lecture, on est en bas.
  */
  {
    id: 'mediaEnd',
    trigger: 'scroll',
    mobileSurface: 'sheet',
    eligible: (c) =>
      !c.isSignedIn
      && (isUnder(c.path, '/podcasts') || isUnder(c.path, '/videos'))
      && c.path !== '/podcasts'
      && c.path !== '/videos',
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
