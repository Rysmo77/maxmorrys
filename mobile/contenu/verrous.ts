import { REMISE_FILLEUL_PCT } from './termes';
import type { OngletClub } from './club';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * L'ÉCRAN VERROUILLÉ DU CLUB — UN CORPS, HUIT CONTENUS (`NatClubVerrouille` du kit).
 *
 * ⛔ IL N'AVAIT JAMAIS ÉTÉ PORTÉ : chaque onglet rendait un état vide générique à quelqu'un
 * qui n'est pas membre. Ce corps s'adresse à quelqu'un qui a déjà un compte et qui vient de
 * toucher un onglet PRÉCIS — c'est la seule information qu'on ait en plus, et l'écran est
 * construit autour d'elle. (Table de la réécriture Kotlin, reprise.)
 *
 * ⚠️ AUCUN NOMBRE N'EST ÉCRIT ICI. Le kit écrit les comptes en toutes lettres (« Sept
 * publications et quarante-et-une réponses depuis lundi », « DEUX SESSIONS CE MOIS-CI. ») :
 * écrits en lettres, ce sont quand même des relevés, présentés comme actuels à quelqu'un
 * qu'on cherche à convaincre. Ils redescendent dans les compteurs, que sert `appApercuClub`
 * avec leur date. « 15 % » reste : c'est un TERME de l'offre (`termes.ts`).
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export interface Verrou {
  titre: readonly string[];
  quoi: string;
  /** Les libellés du kit, montés tant que `appApercuClub` n'a pas répondu (« non relevé »). */
  compteurs: readonly string[];
  apercuTitre: string;
  /** Ce que l'aperçu montrerait — DIT, tant qu'il ne peut pas être montré sans inventer. */
  apercuQuoi: string;
}

export const VERROUS: Readonly<Record<OngletClub['libelle'], Verrou>> = {
  Fil: {
    titre: ['CE QUI SE DIT', 'CETTE SEMAINE.'],
    quoi: "Des gens qui vendent vraiment quelque chose, et qui racontent ce qui a marché. Le fil se lit dans l'ordre, sans algorithme.",
    compteurs: ['publications', 'réponses', 'catégories'],
    apercuTitre: 'Une publication, en entier',
    apercuQuoi: 'Une publication de membre : son avatar, son nom, sa catégorie, le texte entier et ses trois compteurs de réaction.',
  },
  Discussions: {
    titre: ['LES QUESTIONS', "QU'ON SE POSE."],
    quoi: 'Des sujets ouverts, classés par catégorie. La question bête se pose ici, et quelqu’un y répond.',
    compteurs: ['sujets', 'catégories', 'réponses au plus long'],
    apercuTitre: 'Un sujet, en entier',
    apercuQuoi: 'Un sujet avec sa catégorie, son nombre de réponses et sa question telle qu’elle a été posée.',
  },
  Membres: {
    titre: ['QUI FAIT QUOI,', 'ET OÙ.'],
    quoi: "Le métier et le quartier, parce qu'ils servent à se trouver. Jamais le numéro de téléphone : on s'écrit dans le Club.",
    compteurs: ['fiches remplies', 'dans ta vague', 'quartiers'],
    apercuTitre: 'Une fiche, en entier',
    apercuQuoi: "Une fiche de membre : le nom, le métier, le quartier, la vague d'arrivée et le niveau.",
  },
  Agenda: {
    titre: ['LES SESSIONS', 'DU MOIS.'],
    quoi: "Des directs en ligne et des ateliers à Dakar. L'agenda est publié un mois à l'avance, et une session annoncée a lieu même si nous sommes quatre.",
    compteurs: ['sessions ce mois', 'places restantes', 'ateliers à Dakar'],
    apercuTitre: 'Une session, en entier',
    apercuQuoi: "Une session avec son jour, son horaire, son lieu et ce qui s'y fait.",
  },
  Classement: {
    titre: ['TA VAGUE,', 'PAS UN PALMARÈS.'],
    quoi: "Tu serais comparée aux personnes arrivées en même temps que toi. Pas à celles qui ont deux ans d'avance — il n'y a aucun classement général, et il n'y en aura pas.",
    compteurs: ['dans ta vague', 'vues de progression', 'classement absolu'],
    apercuTitre: 'Ce que tu verrais',
    apercuQuoi: 'Ta place dans ta vague d’arrivée, et une seconde vue qui ne te compare qu’à toi-même, semaine après semaine.',
  },
  Opportunités: {
    titre: ['LES MISSIONS', 'OUVERTES.'],
    quoi: "Des budgets annoncés par la personne qui publie. Ils ne sont pas vérifiés par la plateforme, et c'est écrit sur l'écran plutôt que caché dans les CGV.",
    compteurs: ['ouvertes', 'budget le plus bas', 'le plus haut'],
    apercuTitre: 'Une mission, en entier',
    apercuQuoi: 'Une mission avec son lieu, sa date de publication et son budget annoncé.',
  },
  Informations: {
    titre: ['LE DIGEST', 'DE LA SEMAINE.'],
    quoi: "Ce qui s'est passé, ce qui arrive, et ce que je n'ai pas fait. Un par semaine, quand il y a de quoi le remplir — pas un calendrier tenu à vide.",
    compteurs: ['digests publiés', 'par semaine', 'e-mail envoyé'],
    apercuTitre: 'Un extrait, en entier',
    apercuQuoi: 'Un extrait du digest de la semaine, section comprise.',
  },
  Parrainage: {
    titre: ['FAIS-LUI', `GAGNER ${REMISE_FILLEUL_PCT} %.`],
    quoi: "Un code à toi, qui fait baisser le prix du Club pour la personne que tu parraines. Toi, tu ne gagnes rien en argent — et c'est écrit dans l'onglet, pas en bas de page.",
    compteurs: ['partages', 'inscrits', 'commission pour toi'],
    apercuTitre: 'Ce que tu aurais',
    apercuQuoi: 'Ton code, et la phrase qui dit que la remise est calculée côté serveur : elle ne dépend pas du lien sur lequel la personne a cliqué.',
  },
};
