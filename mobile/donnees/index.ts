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
  CLUB, CLUB_FIL, CLUB_MISSION, EPISODE, FORMATION, FORMATION_2, MOI, NOTES, NOTES_TOTAL,
  PROGRAMME, VIDEO,
} from '../contenu/demo';
import { composer, composerListe } from './etat';
export { provenance } from './etat';
import type {
  VueCertificats, VueClub, VueClubFil, VueCours, VueEspace, VueLecon, VueMedia, VueMoi,
  VueNotes,
} from './types';
import { useVue } from './vue';

export { SessionProvider, useSession, useUid } from './session';
export { connexionEmail, creationEmail, deconnexion, reinitialiser, ErreurIdentite } from './identite';
export { exporterMesDonnees } from './rgpd';
export { appeler, ErreurAppel } from './appel';
export { viderLesVues } from './vue';
export type {
  VueCertificat, VueCertificats, VueClub, VueClubFil, VueClubMessage, VueClubMission,
  VueCours, VueEpisode, VueEspace, VueLecon, VueLeconLigne, VueMedia, VueMoi, VueNote,
  VueNotes, VueVideo,
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
