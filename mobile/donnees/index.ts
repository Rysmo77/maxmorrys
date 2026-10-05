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
  AGENDA, CLASSEMENT, CLUB, CLUB_FIL, CLUB_MISSION, DISCUSSIONS, ECHANGE, EPISODE, FORMATION, FORMATION_2, MEMBRE, MEMOIRE, MODULES_MUR, MOI, NOTES, NOTES_TOTAL, OPPORTUNITES, PARRAINAGE, PROGRAMME, PROSPECT, QUOTA, SUPPORT_COMPTES, TRANSCRIPTION, VIDEO,
} from '../contenu/demo';
import { composer, composerIdentite, composerListe } from './etat';
export { provenance } from './etat';
import type {
  VueCertificats, VueClassement, VueClub, VueClubFil, VueConsole, VueCours, VueFormation, VueBlocages, VueParrainage, VueDiscussion,
  VueEspace, VueLecon, VueMedia, VueMembre, VueMoi, VueNotes, VueOpportunite, VueRepetiteur,
  VueSeance,
} from './types';
import { useVue } from './vue';

export { SessionProvider, useSession, useUid } from './session';
export { connexionEmail, creationEmail, deconnexion, reinitialiser, ErreurIdentite } from './identite';
export { exporterMesDonnees } from './rgpd';
export { appeler, ErreurAppel } from './appel';
import { useEffect, useState } from 'react';
import { ErreurAppel, appeler } from './appel';
import { ecrire, perimerVues } from './cache';
import { identifiant } from './file';
import { estUnEchecDeTransport, mettreEnFile } from './hors-ligne';
export { viderLesVues } from './vue';
export type {
  VueCertificat, VueCertificats, VueClub, VueClubFil, VueClubMessage, VueClubMission,
  VueClassement, VueConsole, VueCours, VueDiscussion, VueEpisode, VueEspace, VueLecon,
  VueLeconLigne, VueMedia, VueMembre, VueMoi, VueNote, VueNotes, VueOpportunite,
  VueRepetiteur, VueSeance, VueVideo,
} from './types';

/** Qui regarde : prénom, initiale, date d'ouverture du compte. */
export function useMoi(): Etat<VueMoi> {
  const brut = useVue<VueMoi>('appMoi');
  /*
   * ⚠️ `composerIdentite`, PAS `composer`. Un catalogue vide se comble d'un exemple ;
   * une identité vide, non — prêter un nom à qui n'est connecté à rien fait croire à une
   * session ouverte. Voir l'en-tête de `composerIdentite` dans `etat.ts`.
   *
   * La réplique porte les mêmes champs que la vue, moins ceux que le transfert ne
   * connaissait pas. Le `null` de `tuteur` n'est pas un manque : le nom du répétiteur
   * vient du profil, et le kit n'en avait pas.
   */
  return composerIdentite(brut, MOI === null ? null : {
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
    formationId: FORMATION.slug,
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
      /* Le niveau se DÉRIVE du dernier segment de `meta` (« SEO · 6 modules · 47 leçons ·
         débutant »), il ne s'invente pas : la réplique dit ce que le transfert dit, et rien
         de plus. Le serveur, lui, le renvoie comme un champ à part. */
      niveau: f.meta.split(' · ').at(-1) ?? null,
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

/**
 * La fiche d'une formation, et son programme.
 *
 * ⚠️ Le `slug` vient de la ROUTE, et il ne sert qu'à CHOISIR. C'est le serveur qui décide de
 * ce qu'il publie : il refait `status == 'published'` de son côté, et rend une vue nulle pour
 * un slug inconnu comme pour un brouillon — l'écran n'a donc jamais à distinguer les deux.
 */
export function useFormation(slug?: string): Etat<VueFormation> {
  const brut = useVue<VueFormation>('appFormation', slug ? { slug } : {});
  const replique = FORMATION === null ? null : {
    titre: FORMATION.titre,
    titreCourt: FORMATION.titreCourt,
    meta: FORMATION.meta,
    lecons: FORMATION.lecons,
    modules: MODULES_MUR.map((m) => ({ titre: m.titre, meta: m.meta, ouvert: m.ouvert })),
  };
  return composer(brut, replique);
}

/** Le code de parrainage et son compte de filleuls. Nul tant que l'abonnement n'est pas actif. */
export function useParrainage(): Etat<VueParrainage> {
  const brut = useVue<VueParrainage>('appClubParrainage');
  return composer(brut, PARRAINAGE === null ? null : {
    code: PARRAINAGE.code,
    lien: PARRAINAGE.lien,
    filleuls: PARRAINAGE.filleuls,
  });
}

/**
 * Les comptes bloqués, et le geste pour défaire.
 *
 * Aucune réplique de démonstration : une liste de blocage inventée montrerait des noms de
 * personnes qu'on n'a jamais bloquées. C'est le seul endroit du produit où une simulation
 * accuserait quelqu'un.
 */
export function useBlocages(): Etat<VueBlocages> {
  return composer(useVue<VueBlocages>('appClubBlocages'), null);
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
      cout: [...EPISODE.cout],
      /* Le transfert donne la transcription en lignes horodatées ; le serveur la donne en
         texte. La réplique recompose donc le texte à partir des lignes, pour que l'écran
         n'ait qu'une seule forme à rendre. */
      transcription: TRANSCRIPTION.map((l) => `${l.t} — ${l.l}`).join('\n\n') || null,
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
export function useMembre(id?: string, message?: string): Etat<VueMembre> {
  /* ⚠️ DEUX FAÇONS DE DÉSIGNER, ET LA SECONDE EST CELLE QUI MANQUAIT. Aucun écran ne passait
     d'`id` : le fil, l'onglet Club et la planche poussaient tous vers `/club/membre` nu. La
     vue jetait `invalid-argument`, l'écran sortait par sa branche courte, et le bouton
     « Signaler ce profil » n'était jamais rendu.
     `message` désigne un CONTENU ; le serveur en résout l'auteur. L'uid ne circule pas. */
  const params = id ? { onglet: 'membre', id }
    : message ? { onglet: 'membre', message }
      : { onglet: 'membre' };
  const brut = useVue<VueMembre>('appClubListe', params);
  return composer(brut, MEMBRE === null ? null : {
    nom: MEMBRE.nom,
    initiales: MEMBRE.initiales,
    metier: MEMBRE.metier,
    ville: MEMBRE.ville,
    depuis: MEMBRE.depuis,
    presentation: MEMBRE.presentation,
    formations: [...MEMBRE.formations],
    contributions: MEMBRE.contributions,
    bloque: false,
    id: 'demo',
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
  await ecrire('clearRysmoMemory');
}

/**
 * Signale un membre.
 *
 * Le motif est FACULTATIF — l'écran le promet, et exiger une explication pour signaler,
 * c'est filtrer les signalements par la capacité à les argumenter. Le serveur écrit un
 * document déterministe : toucher deux fois ne crée pas deux entrées.
 */
export async function signalerLeMembre(membreId: string, motif?: string): Promise<void> {
  await ecrire('signalerMembre', { membreId, motif });
}

/**
 * Bloque ou débloque l'auteur d'un contenu — exigence App Store 1.2.
 *
 * ⚠️ ON DÉSIGNE UN CONTENU, PAS UNE PERSONNE. Le serveur résout l'auteur lui-même, pour que
 * l'uid d'un auteur croisé dans une liste ne circule jamais côté client. La seule exception
 * est la fiche qu'on regarde : elle porte son `id`, parce qu'on ne peut pas la débloquer sans
 * la désigner.
 */
export async function bloquerLeMembre(
  cible: { type: 'membre' | 'message' | 'discussion' | 'opportunite'; id: string },
  bloquer: boolean,
): Promise<{ bloque: boolean; combien: number }> {
  return ecrire('bloquerMembre', { cible, bloquer }) as Promise<{ bloque: boolean; combien: number }>;
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
): Promise<{ id: string; texte: string; date: string | null; enFile?: true }> {
  /* `idClient` TOUJOURS : c'est lui qui rend la note rejouable par la file sans doublon. */
  const params = { texte, lessonId: lecon?.id, lessonLabel: lecon?.label, idClient: identifiant() };
  try {
    const { note } = await ecrire<{ note: { id: string; texte: string; date: string | null } }>('ecrireUneNote', params);
    return note;
  } catch (e: unknown) {
    /* Le transport a lâché : la note n'est PAS perdue, elle part au retour du réseau. Un
       refus du serveur, lui, remonte tel quel — le remettre en file ne le changerait pas. */
    if (!estUnEchecDeTransport(e)) throw e;
    await mettreEnFile(`Note${lecon ? ` · ${lecon.label}` : ''}`, { type: 'ecrireUneNote', params });
    return { id: params.idClient, texte, date: 'en attente d’envoi', enFile: true };
  }
}

export interface BilanLecon {
  progression: number;
  leconsFaites: number;
  lecons: number;
  complete: boolean;
  titre: string | null;
}

/**
 * Coche ou décoche une leçon, et renvoie la progression RECALCULÉE par le serveur.
 *
 * Le pourcentage n'est jamais envoyé : il est déduit côté serveur du nombre de leçons de
 * la formation. Un `progress` transmis par le client serait un curseur qu'on lui tend —
 * il n'aurait qu'à écrire 100 pour obtenir son certificat.
 */
export async function marquerLecon(
  formationId: string, leconId: string, faite: boolean, titre?: string,
): Promise<BilanLecon | { enFile: true }> {
  const params = { formationId, leconId, faite };
  try {
    return await ecrire<BilanLecon>('marquerLecon', params);
  } catch (e: unknown) {
    /* Hors réseau, la coche RESTE : elle part au retour, et la file la montre en attendant.
       Seul le dernier état d'une leçon part (`file.ts`) — cocher puis décocher ne rejoue rien. */
    if (!estUnEchecDeTransport(e)) throw e;
    await mettreEnFile(`${titre ?? 'Une leçon'} · ${faite ? 'terminée' : 'à refaire'}`, { type: 'marquerLecon', params });
    return { enFile: true };
  }
}

/**
 * Publie un message sur le mur du Club.
 *
 * ⚠️ NI LE NOM NI LES COMPTEURS NE SONT TRANSMIS. Le serveur lit le nom d'affichage dans
 * le profil — l'accepter du client, ce serait accepter qu'il choisisse sous quel nom il
 * parle — et initialise `likes`/`reposts` à zéro, que la règle Firestore interdit à
 * l'auteur de réécrire : c'est la seule personne qui a intérêt à les gonfler.
 */
export async function posterAuClub(
  texte: string, categorie?: string,
): Promise<import('./types').VueClubMessage> {
  const { message } = await ecrire<{ message: import('./types').VueClubMessage }>(
    'posterAuClub', { texte, categorie },
  );
  return message;
}

/** Les séances à venir — directs et ateliers fusionnés, triés par date. */
export function useAgenda(): Etat<readonly VueSeance[]> {
  const brut = useVue<readonly VueSeance[]>('appClubAgenda');
  return composerListe(brut, AGENDA.map((s, i) => ({
    id: String(i),
    collection: 'club_sessions',
    jour: s.jour,
    titre: s.titre,
    horaire: s.horaire,
    glyphe: s.glyphe,
    territoire: s.territoire,
    inscrite: s.inscrite,
    places: 'places' in s ? s.places : null,
  })));
}

/**
 * Réserve une place, ou la libère.
 *
 * Le document d'inscription porte l'uid comme IDENTIFIANT : réserver deux fois ne crée
 * pas deux places, et la règle Firestore s'appuie sur ce même identifiant pour savoir à
 * qui la ligne appartient. L'écran promettait déjà que « se réinscrire ne crée pas de
 * doublon » — c'est vrai parce que le chemin l'impose, pas par attention.
 */
export async function reserverSession(
  collection: string, seanceId: string, inscrite: boolean,
): Promise<void> {
  await ecrire('reserverSession', { collection, seanceId, inscrite });
}

/**
 * ⛔ LA SEULE LECTURE SANS SESSION : vérifier un certificat (`appVerifierCertificat`).
 *
 * Elle ne passe PAS par `useVue`, qui court-circuite toute lecture quand personne n'est
 * connecté — or un certificat se vérifie précisément par quelqu'un qui n'a pas de compte.
 * `appeler` n'ajoute le jeton que s'il existe.
 *
 * TROIS RÉPONSES, PAS DEUX : `trouve`, `inconnu` (`vue: null`, une RÉPONSE du serveur) et une
 * erreur levée (la vérification n'a pas abouti). Confondre les deux dernières ferait conclure
 * à un faux document sur une simple coupure réseau.
 */
export type Verification =
  | { verdict: 'trouve'; certificat: import('./contrat.generated').CertificatPublic; releveA: Date }
  | { verdict: 'inconnu'; releveA: Date };

export async function verifierCertificat(code: string): Promise<Verification> {
  const r = await appeler<{ vue: import('./contrat.generated').CertificatPublic | null; releveA?: string }>(
    'appVerifierCertificat', { code },
  );
  const releveA = r.releveA ? new Date(r.releveA) : new Date();
  return r.vue === null ? { verdict: 'inconnu', releveA } : { verdict: 'trouve', certificat: r.vue, releveA };
}

/**
 * Ce qu'il y a derrière chaque cadenas du Club, COMPTÉ (`appApercuClub`). Lu pour quelqu'un
 * qui n'est pas membre ; le type est celui du contrat, sans copie écrite à la main.
 */
export function useApercuClub(): Etat<import('./contrat.generated').ApercuClub> {
  return useVue<import('./contrat.generated').ApercuClub>('appApercuClub');
}

/**
 * ══ L'ACCÈS OUVERT APRÈS UN RÈGLEMENT SUR LE SITE (`appTransaction`) ══
 *
 * Pas de cache : l'état CHANGE pendant qu'on regarde. Tant que la transaction est en attente,
 * ou réglée sans que l'accès soit encore ouvert, on relit toutes les 4 s, deux minutes au
 * plus — le webhook peut arriver après la personne. Passé ce délai, l'écran le DIT au lieu de
 * tourner pour toujours.
 *
 * Dès que l'accès est constaté, les vues qu'il change sont périmées : sinon l'Espace et le
 * catalogue montreraient l'état d'AVANT pendant trente secondes.
 */
export type SuiviAcces =
  | { etape: 'lecture' }
  | { etape: 'attente'; transaction: import('./contrat.generated').TransactionVue; abandon: boolean }
  | { etape: 'ouvert'; transaction: import('./contrat.generated').TransactionVue }
  | { etape: 'echec'; transaction: import('./contrat.generated').TransactionVue }
  | { etape: 'inconnue' }
  | { etape: 'panne'; motif: string };

const RELIRE_MS = 4_000;
const ABANDON_MS = 120_000;

export function useAcces(transactionId: string | null): SuiviAcces {
  const [suivi, setSuivi] = useState<SuiviAcces>({ etape: 'lecture' });

  useEffect(() => {
    if (!transactionId) { setSuivi({ etape: 'inconnue' }); return; }
    let vivant = true;
    let minuteur: ReturnType<typeof setTimeout> | null = null;
    const debut = Date.now();

    const lire = async () => {
      try {
        const r = await appeler<{ vue: import('./contrat.generated').TransactionVue | null }>(
          'appTransaction', { transactionId },
        );
        if (!vivant) return;
        const t = r.vue;
        if (t === null) { setSuivi({ etape: 'inconnue' }); return; }
        if (t.statut === 'failed') { setSuivi({ etape: 'echec', transaction: t }); return; }
        if (t.statut === 'completed' && t.acces) {
          perimerVues(['appMoi', 'appEspace', 'appCours', 'appFormation', 'appLecon', 'appClub', 'appCertificats']);
          setSuivi({ etape: 'ouvert', transaction: t });
          return;
        }
        const abandon = Date.now() - debut > ABANDON_MS;
        setSuivi({ etape: 'attente', transaction: t, abandon });
        if (!abandon) minuteur = setTimeout(() => { void lire(); }, RELIRE_MS);
      } catch (e: unknown) {
        if (vivant) setSuivi({ etape: 'panne', motif: e instanceof ErreurAppel ? e.motif : 'La lecture a échoué.' });
      }
    };
    void lire();
    return () => { vivant = false; if (minuteur) clearTimeout(minuteur); };
  }, [transactionId]);

  return suivi;
}

/**
 * Le contenu d'UNE leçon (`appLeconContenu`). Hors connexion, c'est l'écran qui retombe sur
 * la copie GARDÉE (`hors-ligne.ts`) — pas ce hook, qui ne lit que le serveur.
 */
export function useLeconContenu(formationId: string | null, leconId?: string | null): Etat<import('./contrat.generated').LeconContenu> {
  /* Sans formation, rien à demander : le serveur refuserait (`invalid-argument`). */
  return useVue<import('./contrat.generated').LeconContenu>(
    'appLeconContenu',
    formationId ? { formationId, ...(leconId ? { leconId } : {}) } : {},
    formationId !== null,
  );
}
