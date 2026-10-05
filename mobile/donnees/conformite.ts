import type { Vue } from './contrat.generated';
import type {
  VueBlocages, VueCertificats, VueClassement, VueClub, VueClubFil, VueConsole, VueCours,
  VueDiscussion, VueEspace, VueFormation, VueLecon, VueMedia, VueMembre, VueMoi, VueNotes,
  VueOpportunite, VueParrainage, VueRepetiteur, VueSeance,
} from './types';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LES TYPES ÉCRITS À LA MAIN NE PEUVENT PLUS DIVERGER DU CONTRAT — c'est le compilateur
 * qui le dit, sans une ligne exécutée.
 *
 * `donnees/types.ts` décrit ce que les écrans LISENT ; `contrat.generated.ts` décrit ce que
 * le serveur ENVOIE, généré depuis `vues.contrat.json` dont le Worker est lui-même tenu.
 * Chaque ligne ci-dessous exige que l'envoyé soit ASSIGNABLE au lu : un champ que l'écran
 * attend et que le serveur n'envoie pas, ou envoie sous un autre type, casse `tsc`.
 *
 * ⓘ La réécriture Kotlin générait ses types depuis le contrat, ce qui rendait la dérive
 * impossible. Le port React Native les écrivait à la main ; cette conformité est le moyen le
 * moins invasif de rendre la dérive impossible ici aussi. Ce fichier n'exporte rien d'utile
 * à l'exécution : il n'existe que pour être compilé.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
type Assignable<Lu, Envoye extends Lu> = Envoye;

export type Conformite = [
  Assignable<VueMoi, Vue<'appMoi'>>,
  Assignable<VueEspace, Vue<'appEspace'>>,
  Assignable<readonly VueCours[], Vue<'appCours'>>,
  Assignable<VueFormation, Vue<'appFormation'>>,
  Assignable<VueLecon, Vue<'appLecon'>>,
  Assignable<VueNotes, Vue<'appNotes'>>,
  Assignable<VueCertificats, Vue<'appCertificats'>>,
  Assignable<VueClub, Vue<'appClub'>>,
  Assignable<VueClubFil, Vue<'appClubFil'>>,
  Assignable<VueBlocages, Vue<'appClubBlocages'>>,
  Assignable<VueParrainage, Vue<'appClubParrainage'>>,
  Assignable<VueClassement, Vue<'appClubClassement'>>,
  Assignable<readonly VueSeance[], Vue<'appClubAgenda'>>,
  Assignable<readonly VueDiscussion[], Vue<'appClubListe.discussions'>>,
  Assignable<readonly VueOpportunite[], Vue<'appClubListe.opportunites'>>,
  Assignable<VueMembre, Vue<'appClubListe.membre'>>,
  Assignable<VueMedia, Vue<'appMedia'>>,
  Assignable<VueRepetiteur, Vue<'appRepetiteur'>>,
  Assignable<VueConsole, Vue<'appConsole'>>,
];
