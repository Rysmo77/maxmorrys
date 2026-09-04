/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LES FORMES QUE LE SERVEUR RENVOIE — redéclarées ici, et c'est délibéré.
 *
 * Le web possède déjà ces types dans `src/types/index.ts`. Les importer serait la première
 * chose à tenter, et c'est exactement ce qu'il ne faut pas faire :
 * `tests/unit/mobile-ds.test.ts` interdit à tout fichier de `mobile/` d'importer au-dessus
 * de `mobile/`, parce que ça a déjà rendu l'application INCONSTRUCTIBLE avec un typecheck
 * vert — Metro refuse un chemin que `tsc` résout sans broncher.
 *
 * C'est donc une duplication assumée, et c'est la bonne : ces types ne décrivent pas les
 * documents du web mais les VUES que le Worker compose pour le natif. Elles ont leur propre
 * forme, plus courte, et elles peuvent évoluer sans toucher au web.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

export interface VueMoi {
  prenom: string;
  nom: string;
  initiale: string;
  email: string | null;
  ouvertureCompte: string | null;
  tuteur: string | null;
  role: string;
  xp: number;
}

export interface VueEspace {
  slug: string;
  titre: string;
  titreCourt: string;
  meta: string;
  lecons: number;
  leconsFaites: number;
  progression: number;
  arret: string | null;
  moduleEnCours: string | null;
  leconEnCours: string | null;
}

export interface VueCours {
  id: string;
  slug: string;
  titre: string;
  titreCourt: string;
  meta: string;
  acquise: boolean;
}

export interface VueCertificat {
  code: string;
  titulaire: string;
  formation: string;
  emisLe: string;
  lecons: number;
}

export interface VueCertificats {
  ouvertureCompte: string | null;
  certificats: VueCertificat[];
  incomplets: number;
}

export interface VueClub {
  echeance: string | null;
  depuis: string | null;
  bilan: ReadonlyArray<{ n: number | null; l: string }>;
}

export interface VueNote {
  id: string;
  texte: string;
  date: string | null;
}

export interface VueNotes {
  total: { notes: number; lecons: number };
  notes: VueNote[];
}

export interface VueLeconLigne {
  id: string;
  titre: string;
  meta: string | null;
  etat: 'done' | 'current' | 'todo';
  doc: boolean;
}

export interface VueLecon {
  moduleTitre: string | null;
  programme: VueLeconLigne[];
}

export interface VueClubMessage {
  id: string;
  auteur: string;
  initiales: string;
  categorie: string;
  quand: string | null;
  texte: string;
  aime: number;
  republie: number;
  commente: number;
}

export interface VueClubMission {
  meta: string;
  titre: string;
  budget: number | null;
  note: string;
}

export interface VueClubFil {
  mission: VueClubMission | null;
  fil: VueClubMessage[];
}

export interface VueEpisode {
  titre: string;
  titreCourt: string;
  invitee: string | null;
  eyebrow: string;
  chapo: string | null;
  duree: string | null;
  lien: string | null;
}

export interface VueVideo {
  titre: string;
  eyebrow: string;
  lien: string | null;
  cout: string[];
}

export interface VueMedia {
  episode: VueEpisode | null;
  video: VueVideo | null;
}

export interface VueDiscussion {
  id: string;
  categorie: string;
  titre: string;
  auteur: string;
  initiales: string;
  quand: string | null;
  reponses: number;
  resolu: boolean;
}

export interface VueOpportunite {
  id: string;
  type: string;
  titre: string;
  lieu: string | null;
  quand: string | null;
  budget: number | null;
  par: string | null;
}

export interface VueMembre {
  nom: string;
  initiales: string;
  metier: string | null;
  ville: string | null;
  depuis: string | null;
  presentation: string | null;
  formations: string[];
  contributions: number;
}

export interface VueClassement {
  vague: string;
  rang: number | null;
  surCombien: number;
  points: number;
  semaine: number;
  lignes: ReadonlyArray<{
    rang: number;
    nom: string;
    initiales: string;
    points: number;
    moi: boolean;
  }>;
}
