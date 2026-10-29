import type { PopupId } from './rules';
import type { EntrySource } from './entrySource';
import { placer, type Espace } from '../espaces';

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
  /**
   * Les espaces où la fenêtre a le droit de vivre (kit v3 : un compte, trois espaces).
   *
   * Les chemins du registre sont LOGIQUES (`/formations/x`), et `lib/espaces.ts` dit sur quel
   * hôte chacun est servi : `formationExit` ne peut donc s'ouvrir que sur edu., et le dire ici
   * ne change rien pour elle. Le champ compte pour les règles qui ne regardent PAS le chemin —
   * la reprise de panier, la découverte — et qui, sans lui, auraient suivi le visiteur partout,
   * jusque sur le Club où elles parlent d'une autre offre que celle de la page.
   */
  espaces: readonly Espace[];
  trigger: PopupTrigger;
  /** Surface sous `lg`. `sheet` est OBLIGATOIRE partout où le trafic organique domine. */
  mobileSurface: 'modal' | 'sheet';
  /** Vrai si la pop-up a un sens dans ce contexte. Les plafonds sont évalués ailleurs. */
  eligible: (ctx: PopupContext) => boolean;
}

/** L'espace qui sert un chemin logique — d'après la table unique `lib/espaces.ts`. */
export function espaceDe(path: string): Espace {
  return placer(path).espace;
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
/* Les deux anciennes adresses restent listées : elles sont redirigées, mais un devis partagé
   en WhatsApp voyage longtemps, et pendant le vol de la redirection le chemin est encore
   l'ancien. Une pop-up par-dessus un devis est précisément ce que cette liste interdit. */
const QUOTE_PATHS: readonly string[] = [
  '/conception/commerces-et-tpe/devis',
  '/presence-digitale/devis',
  '/agence/devis',
];

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
  /* Toute la piste Conception d'un coup — `isUnder` couvre ses quatre pages. C'était deux
     lignes, `/agence` et `/presence-digitale`, quand les deux offres vivaient à la racine. */
  '/conception',
  '/agence',
  '/presence-digitale',
];

/** Les pages publiques du Club, en chemins logiques. `/adhesion` compris : c'est elle qui mène au mur. */
const CLUB_PUBLIC_PATHS: readonly string[] = [
  '/club-des-digitos',
  '/club-des-digitos/sessions',
  '/club-des-digitos/adhesion',
];

export const POPUP_REGISTRY: readonly PopupDefinition[] = [
  /*
    La reprise de panier passe en premier : un visiteur qui a laissé un paiement en route est le
    plus proche de l'achat de tout le site. Elle est indépendante du chemin, sauf les tunnels.
  */
  {
    id: 'cartRecovery',
    /* Le hub et l'école. PAS le Club : ses pages vendent l'adhésion, et une formation laissée
       au paiement y ferait deux offres sur un écran — la faute que `isQuotePath` documente. */
    espaces: ['hub', 'edu'],
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
    espaces: ['edu'],
    trigger: 'exitIntent',
    mobileSurface: 'modal',
    eligible: (c) => isUnder(c.path, '/formations') && c.path !== '/formations',
  },

  /*
    Accueil et catalogue de l'école — NOUVELLE le 2026-10-29, avec les sous-domaines.

    edu.maxmorrys.me a ouvert sans aucune fenêtre sur ses pages publiques : la découverte
    (`formationsEntry`) n'y a pas de sens — le visiteur est déjà à l'école — et la retenue
    formation ne vise qu'une fiche. Or l'accueil d'edu. est la page la plus fréquentée de
    l'espace, et ses formations sont annoncées « Bientôt ».

    Elle ne vend donc rien : elle nomme ce qu'un compte gratuit ouvre DÈS AUJOURD'HUI — la place
    gardée à l'ouverture et les questions quotidiennes à l'assistant (`RYSMO_BASE_DAILY`). Deux
    faits vérifiables, aucune promesse sur le catalogue.

    `sheet` sous `lg` : l'accueil d'edu. reçoit le trafic de recherche.
  */
  {
    id: 'eduExit',
    espaces: ['edu'],
    trigger: 'exitIntent',
    mobileSurface: 'sheet',
    eligible: (c) =>
      !c.isSignedIn
      && (c.path === '/apprendre' || isUnder(c.path, '/apprendre/methode') || c.path === '/formations'),
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
    espaces: ['club'],
    trigger: 'exitIntent',
    mobileSurface: 'modal',
    /* Étendue le 2026-10-29 aux trois pages publiques du Club. La marche qu'elle nomme a
       DÉMÉNAGÉ : le bouton de l'accueil mène désormais à `/adhesion`, page publique, et c'est
       le bouton d'`/adhesion` qui mène à l'espace gardé. Ne la monter que sur l'accueil la
       retirait précisément de la page où le mur se dresse. */
    eligible: (c) => CLUB_PUBLIC_PATHS.includes(c.path) && !c.isSignedIn,
  },

  /*
    Aiguilleur d'audience sur la page mère de la piste Conception (ex-/agence). Voir
    `AudienceRouterPopup` : ce n'est pas une mise en avant d'offre mais une question d'audience,
    pour ne pas abîmer un positionnement high-ticket.

    ⚠️ Elle vise la page MÈRE, pas la piste entière : `/conception/commerces-et-tpe` a déjà ses
    deux fenêtres, et `/conception/projets-sur-mesure` est elle-même la réponse que
    l'aiguilleur donnerait.
  */
  {
    id: 'agencyExit',
    espaces: ['hub'],
    trigger: 'exitIntent',
    mobileSurface: 'modal',
    eligible: (c) => c.path === '/conception',
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
    espaces: ['hub'],
    trigger: 'exitIntent',
    mobileSurface: 'modal',
    eligible: (c) => c.path === '/conception/commerces-et-tpe' && c.hasStartedQuote,
  },

  /*
    Miroir commerçant. Surface `modal` UNIQUEMENT : `/presence-digitale` porte déjà `StickyWhatsApp`
    en bas d'écran sous `lg`, un bandeau entrerait en collision avec lui.
  */
  {
    id: 'presenceExit',
    espaces: ['hub'],
    trigger: 'exitIntent',
    mobileSurface: 'modal',
    eligible: (c) => c.path === '/conception/commerces-et-tpe',
  },

  /*
    Réalisations — NOUVELLE le 2026-10-29.

    Le portfolio est la page où un décideur vérifie qu'on a déjà fait ce qu'il cherche ; il
    n'avait AUCUNE fenêtre (la découverte l'exclut, à raison : `/conception` entier lui est
    fermé). Elle propose l'action principale que le kit v3 donne au site personnel —
    « Réserver un appel », une par écran — vers le même `/contact?rdv=1` que le bouton de la
    page. Vouvoiement : c'est la piste Conception.

    ⚠️ Pas sur `/conception/projets-sur-mesure` : cette page EST l'appel, la retenir dessus
    répéterait son propre bouton. `sheet` sous `lg` : une modale sur un portfolio haut de gamme
    abîmerait ce qu'il cherche à prouver.
  */
  {
    id: 'projectExit',
    espaces: ['hub'],
    trigger: 'exitIntent',
    mobileSurface: 'sheet',
    eligible: (c) => isUnder(c.path, '/conception/realisations'),
  },

  /*
    Fin d'article. `sheet` sur mobile est IMPÉRATIF : le trafic blog est très majoritairement
    organique, et une modale y tomberait sous la pénalité « interstitiel intrusif » de Google.

    ⚠️ Le contenu doit rester la CAPTURE EMAIL, jamais une formation : `FormationCTA` occupe déjà
    le bas d'article. Deux fois la même offre à deux secondes d'intervalle serait absurde.
  */
  {
    id: 'blogEnd',
    espaces: ['hub'],
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
    espaces: ['hub'],
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
    /* Le hub seulement. Sur edu. le visiteur est déjà à l'école (`eduExit` y parle à sa
       place) ; sur club. elle détournerait vers une autre offre que celle de la page. */
    espaces: ['hub'],
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
  const espace = espaceDe(ctx.path);
  return POPUP_REGISTRY.find((def) => def.espaces.includes(espace) && def.eligible(ctx)) ?? null;
}

export function getDefinition(id: PopupId): PopupDefinition | undefined {
  return POPUP_REGISTRY.find((def) => def.id === id);
}
