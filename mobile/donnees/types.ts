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
