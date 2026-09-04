/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LA PORTE DES DONNÉES — un écran importe d'ici, jamais d'ailleurs.
 *
 * Le même principe que `ds/index.ts` pour les primitives, et pour la même raison : tant
 * qu'il y a une porte, on peut changer ce qu'il y a derrière. Un écran qui importerait
 * `contenu/demo` ou `firebase/firestore` en direct figerait sa source, et il faudrait
 * retrouver les quarante-deux le jour où elle change.
 *
 * Chaque hook renvoie un `Etat<T>` — les six situations que `SansDonnees` sait rendre —
 * et compose déjà la réplique de démonstration là où elle existe. Un écran n'a donc rien
 * à savoir de tout ça : il teste `valeur === null`, exactement comme avant.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
import type { Etat } from '../ds';
import {
  CLASSEMENT, CLUB, CLUB_FIL, CLUB_MISSION, DISCUSSIONS, ECHANGE, EPISODE, FORMATION,
  FORMATION_2, MEMBRE, MEMOIRE, MOI, NOTES, NOTES_TOTAL, OPPORTUNITES, PROGRAMME, PROSPECT,
  QUOTA, SUPPORT_COMPTES, VIDEO,
} from '../contenu/demo';
import { composer, composerListe } from './etat';
export { provenance } from './etat';
import type {
  VueCertificats, VueClassement, VueClub, VueClubFil, VueConsole, VueCours, VueDiscussion,
  VueEspace, VueLecon, VueMedia, VueMembre, VueMoi, VueNotes, VueOpportunite, VueRepetiteur,
} from './types';
import { useVue } from './vue';

export { SessionProvider, useSession, useUid } from './session';
export { connexionEmail, creationEmail, deconnexion, reinitialiser, ErreurIdentite } from './identite';
export { exporterMesDonnees } from './rgpd';
export { appeler, ErreurAppel } from './appel';
import { appeler } from './appel';
export { viderLesVues } from './vue';
export type {
  VueCertificat, VueCertificats, VueClub, VueClubFil, VueClubMessage, VueClubMission,
  VueClassement, VueConsole, VueCours, VueDiscussion, VueEpisode, VueEspace, VueLecon,
  VueLeconLigne, VueMedia, VueMembre, VueMoi, VueNote, VueNotes, VueOpportunite,
  VueRepetiteur, VueVideo,
} from './types';

/** Qui regarde : prénom, initiale, date d'ouverture du compte. */
export function useMoi(): Etat<VueMoi> {
  const brut = useVue<VueMoi>('appMoi');
  /*
   * La réplique porte les mêmes champs que la vue, moins ceux que le transfert ne
   * connaissait pas. Le `null` de `tuteur` n'est pas un manque : le nom du répétiteur
   * vient du profil, et le kit n'en avait pas.
   */
  return composer(brut, MOI === null ? null : {
    prenom: MOI.prenom,
    nom: MOI.nom,
    initiale: MOI.initiale,
    email: MOI.email,
    ouvertureCompte: MOI.ouvertureCompte,
    tuteur: null,
    role: 'student',
    xp: 0,
  });
}

/** La reprise : la formation la plus récemment touchée, et où on en est. */
export function useEspace(): Etat<VueEspace> {
  const brut = useVue<VueEspace>('appEspace');
  return composer(brut, FORMATION === null ? null : {
    slug: FORMATION.slug,
    titre: FORMATION.titre,
    titreCourt: FORMATION.titreCourt,
    meta: FORMATION.meta,
    lecons: FORMATION.lecons,
    leconsFaites: FORMATION.leconsFaites,
    progression: FORMATION.progression,
    arret: FORMATION.arret,
    moduleEnCours: FORMATION.moduleEnCours,
    leconEnCours: FORMATION.leconEnCours,
  });
}

/** Le catalogue publié, avec ce qu'on possède déjà — jamais un prix. */
export function useCours(): Etat<readonly VueCours[]> {
  const brut = useVue<readonly VueCours[]>('appCours');
  const replique = [FORMATION, FORMATION_2]
    .filter((f): f is NonNullable<typeof f> => f !== null)
    .map((f) => ({
      id: f.slug,
      slug: f.slug,
      titre: f.titre,
      titreCourt: 'titreCourt' in f ? f.titreCourt : f.titre,
      meta: f.meta,
      /* Le transfert ne disait pas ce qui est acquis. La première l'est — c'est elle que
         l'accueil propose de reprendre —, la seconde non : la différence entre les deux
         états EST l'information de cet écran, et l'aplatir la ferait disparaître. */
      acquise: f === FORMATION,
    }));
  return composerListe(brut, replique);
}

/** Les certificats émis, et la date qui permet de dater le zéro. */
export function useCertificats(): Etat<VueCertificats> {
  const brut = useVue<VueCertificats>('appCertificats');
  return composer(brut, MOI === null ? null : {
    ouvertureCompte: MOI.ouvertureCompte,
    certificats: [],
    incomplets: 0,
  });
}

/**
 * L'abonnement au Club, ou `null` — et `null` veut dire « pas membre », pas « erreur ».
 *
 * Le serveur ne jette pas `permission-denied` pour quelqu'un sans abonnement actif : il
 * répond une vue vide. La nuance décide de ce qu'on lit après avoir laissé expirer son
 * accès — « le Club est réservé aux membres » plutôt qu'un écran d'erreur.
 */
export function useClub(): Etat<VueClub> {
  const brut = useVue<VueClub>('appClub');
  return composer(brut, CLUB === null ? null : {
    echeance: CLUB.echeance,
    depuis: CLUB.depuis,
    bilan: CLUB.bilan.map((b) => ({ n: b.n as number | null, l: b.l })),
  });
}

/** Les notes, et les deux nombres qui les résument. */
export function useNotes(): Etat<VueNotes> {
  const brut = useVue<VueNotes>('appNotes');
  return composer(brut, NOTES_TOTAL === null ? null : {
    total: { notes: NOTES_TOTAL.notes, lecons: NOTES_TOTAL.lecons },
    notes: NOTES.map((n, i) => ({ id: String(i), texte: n.texte, date: n.date })),
  });
}

/** Le programme du module en cours, avec l'état de chaque leçon. */
export function useLecon(formationId?: string): Etat<VueLecon> {
  const brut = useVue<VueLecon>('appLecon', formationId ? { formationId } : {});
  return composer(brut, PROGRAMME.length === 0 ? null : {
    moduleTitre: FORMATION?.moduleEnCours ?? null,
    programme: PROGRAMME.map((l, i) => ({
      id: String(i),
      titre: l.titre,
      meta: l.meta,
      etat: l.etat as 'done' | 'current' | 'todo',
      doc: 'doc' in l ? Boolean(l.doc) : false,
    })),
  });
}

/** Le fil du Club, et la mission en tête. Vide tant que l'abonnement n'est pas actif. */
export function useClubFil(): Etat<VueClubFil> {
  const brut = useVue<VueClubFil>('appClubFil');
  const replique = CLUB_FIL.length === 0 && CLUB_MISSION === null ? null : {
    mission: CLUB_MISSION === null ? null : {
      meta: CLUB_MISSION.meta,
      titre: CLUB_MISSION.titre,
      budget: CLUB_MISSION.budget,
      note: CLUB_MISSION.note,
    },
    fil: CLUB_FIL.map((m, i) => ({
      id: String(i),
      auteur: m.auteur,
      initiales: m.initiales,
      categorie: m.categorie,
      quand: m.quand,
      texte: m.texte,
      aime: m.aime,
      republie: m.republie,
      commente: m.commente,
    })),
  };
  return composer(brut, replique);
}

/** Le dernier épisode et la dernière vidéo publiés. */
export function useMedia(): Etat<VueMedia> {
  const brut = useVue<VueMedia>('appMedia');
  const replique = EPISODE === null && VIDEO === null ? null : {
    episode: EPISODE === null ? null : {
      titre: EPISODE.titre,
      titreCourt: EPISODE.titreCourt,
      invitee: EPISODE.invitee,
      eyebrow: EPISODE.eyebrow,
      chapo: EPISODE.chapo,
      duree: EPISODE.duree,
      lien: null,
    },
    video: VIDEO === null ? null : {
      titre: VIDEO.titre,
      eyebrow: VIDEO.eyebrow,
      lien: null,
      cout: [...VIDEO.cout],
    },
  };
  return composer(brut, replique);
}

/** Les sujets de discussion du Club. */
export function useDiscussions(): Etat<readonly VueDiscussion[]> {
  const brut = useVue<readonly VueDiscussion[]>('appClubListe', { onglet: 'discussions' });
  return composerListe(brut, DISCUSSIONS.map((d, i) => ({
    id: String(i),
    categorie: d.categorie,
    titre: d.titre,
    auteur: d.auteur,
    initiales: d.initiales,
    quand: d.quand,
    reponses: d.reponses,
    resolu: d.resolu,
  })));
}

/** Les missions et appels d'offres qui circulent. */
export function useOpportunites(): Etat<readonly VueOpportunite[]> {
  const brut = useVue<readonly VueOpportunite[]>('appClubListe', { onglet: 'opportunites' });
  return composerListe(brut, OPPORTUNITES.map((o, i) => ({
    id: String(i),
    type: o.type,
    titre: o.titre,
    lieu: o.lieu,
    quand: o.quand,
    budget: o.budget,
    par: o.par,
  })));
}

/**
 * La fiche d'un membre.
 *
 * ⚠️ Ni téléphone ni adresse n'arrivent jamais ici : le serveur ne les envoie pas, même
 * s'il les connaît. Ce qui ne quitte pas le serveur ne fuite pas.
 */
export function useMembre(id?: string): Etat<VueMembre> {
  const brut = useVue<VueMembre>('appClubListe', id ? { onglet: 'membre', id } : { onglet: 'membre' });
  return composer(brut, MEMBRE === null ? null : {
    nom: MEMBRE.nom,
    initiales: MEMBRE.initiales,
    metier: MEMBRE.metier,
    ville: MEMBRE.ville,
    depuis: MEMBRE.depuis,
    presentation: MEMBRE.presentation,
    formations: [...MEMBRE.formations],
    contributions: MEMBRE.contributions,
  });
}

/**
 * Le classement de ta vague — jamais absolu.
 *
 * Un classement absolu mesurerait l'ancienneté : quelqu'un arrivé en novembre ne
 * rattraperait jamais quelqu'un arrivé en février. La règle est appliquée côté serveur ;
 * l'écran l'énonce.
 */
export function useClassement(): Etat<VueClassement> {
  const brut = useVue<VueClassement>('appClubClassement');
  return composer(brut, CLASSEMENT === null ? null : {
    vague: CLASSEMENT.vague,
    rang: CLASSEMENT.rang,
    surCombien: CLASSEMENT.surCombien,
    points: CLASSEMENT.points,
    semaine: CLASSEMENT.semaine,
    lignes: CLASSEMENT.lignes.map((l) => ({
      rang: l.rang, nom: l.nom, initiales: l.initiales, points: l.points, moi: l.moi,
    })),
  });
}

/** Le quota du répétiteur, sa mémoire, et l'échange en cours. */
export function useRepetiteur(): Etat<VueRepetiteur> {
  const brut = useVue<VueRepetiteur>('appRepetiteur');
  return composer(brut, QUOTA === null ? null : {
    quota: { utilise: QUOTA.utilise, total: QUOTA.total },
    memoire: MEMOIRE.map((m, i) => ({ id: String(i), fait: m.fait, depuis: m.depuis })),
    echange: ECHANGE.map((e, i) => ({ id: String(i), de: e.de, texte: e.texte })),
  });
}

/**
 * La console support — la seule vue où un RÔLE décide, pas un identifiant.
 *
 * Le serveur répond `permission-denied` à qui n'a pas le rôle, et non une vue vide :
 * le Club est un accès qu'on peut ne pas avoir souscrit, la console est une zone où
 * l'on n'a rien à faire. La différence décide de ce que l'écran affiche.
 */
export function useConsole(): Etat<VueConsole> {
  const brut = useVue<VueConsole>('appConsole');
  return composer(brut, SUPPORT_COMPTES === null ? null : {
    comptes: { ...SUPPORT_COMPTES },
    prospect: PROSPECT === null ? null : {
      titre: PROSPECT.titre, meta: PROSPECT.meta, statut: PROSPECT.statut,
    },
  });
}

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * PARLER AU RÉPÉTITEUR — la seule ÉCRITURE de cette porte, et elle mérite son commentaire.
 *
 * Le bouton d'envoi de l'onglet répétiteur n'avait AUCUN gestionnaire. Il avait tout d'un
 * contrôle — rôle d'accessibilité, libellé, dégradé, animation de pression, état désactivé
 * quand le champ est vide — et il ne faisait rien. Sur l'écran qui porte l'argument du
 * produit, c'était le pire endroit possible.
 *
 * ── L'HISTORIQUE PART AVEC LA QUESTION, ET C'EST OBLIGATOIRE ─────────────────────────
 * Le serveur ne garde pas la conversation entre deux appels : c'est le client qui la
 * transmet. Ne pas l'envoyer donnerait un répétiteur amnésique à chaque phrase — qui
 * redemanderait le prénom, reproposerait la même leçon, et se contredirait au troisième
 * échange.
 *
 * ── LE QUOTA REVIENT AVEC LA RÉPONSE ─────────────────────────────────────────────────
 * On ne le recalcule pas côté client : le serveur RÉSERVE la requête avant d'appeler le
 * modèle, donc lui seul connaît le compte exact. Un client qui décrémenterait son propre
 * compteur afficherait « il te reste 2 » pendant que le serveur en compte 1 — et c'est la
 * personne qui découvrirait l'écart en se faisant refuser.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export interface ReponseRepetiteur {
  reply: string;
  quota: { dailyLimit: number; dayCount: number };
}

export async function demanderAuRepetiteur(
  message: string,
  historique: ReadonlyArray<{ de: string; texte: string }>,
  prenom?: string | null,
): Promise<ReponseRepetiteur> {
  return appeler<ReponseRepetiteur>('rysmo', {
    message,
    conversationHistory: historique.map((m) => ({
      role: m.de === 'me' ? 'user' : 'assistant',
      content: m.texte,
    })),
    userContext: prenom ? { displayName: prenom } : undefined,
    language: 'fr',
  });
}

/** Efface ce que le répétiteur a retenu. Irréversible, et l'écran le dit avant. */
export async function effacerLaMemoire(): Promise<void> {
  await appeler('clearRysmoMemory');
}

/**
 * Signale un membre.
 *
 * Le motif est FACULTATIF — l'écran le promet, et exiger une explication pour signaler,
 * c'est filtrer les signalements par la capacité à les argumenter. Le serveur écrit un
 * document déterministe : toucher deux fois ne crée pas deux entrées.
 */
export async function signalerLeMembre(membreId: string, motif?: string): Promise<void> {
  await appeler('signalerMembre', { membreId, motif });
}

/**
 * Écrit une note et renvoie ce qui a été enregistré.
 *
 * On renvoie la note TELLE QU'ÉCRITE plutôt qu'un accusé : l'écran l'insère sans relire
 * toute la liste, et ce qu'il affiche est exactement ce qui est en base — pas une
 * reconstruction locale qui pourrait en différer d'un caractère ou d'une troncature.
 */
export async function ecrireUneNote(
  texte: string,
  lecon?: { id: string; label: string },
): Promise<{ id: string; texte: string; date: string | null }> {
  const { note } = await appeler<{ note: { id: string; texte: string; date: string | null } }>(
    'ecrireUneNote',
    { texte, lessonId: lecon?.id, lessonLabel: lecon?.label },
  );
  return note;
}
