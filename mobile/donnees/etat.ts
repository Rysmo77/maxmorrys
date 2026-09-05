import type { Etat, NumSource } from '../ds';
import { RELEVE, SOURCE } from '../contenu/demo';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * FAIRE COHABITER LE SERVEUR ET LA DÉMONSTRATION — sans affaiblir la garantie.
 *
 * Une seule règle, et elle tient en une ligne : **le serveur gagne, toujours.** Une réponse
 * arrivée — même vide — n'est jamais remplacée par du contenu de transfert. C'est ce qui
 * permet à un build `preview` connecté sur un vrai compte de montrer les vraies données,
 * alors qu'il porte pourtant le drapeau de démonstration.
 *
 * La réplique ne comble QUE les trous : rien n'est branché, ou personne n'est connecté.
 *
 * ── POURQUOI LA GARANTIE DE PRODUCTION N'EST PAS AFFAIBLIE ───────────────────────────
 * Parce que `replique` vient de `contenu/demo.ts`, dont les 33 sorties valent `null` en
 * production PAR CONSTRUCTION — le compilateur le prouve, et Metro replie la condition dans
 * le module où elle est littérale. Cette fonction n'ajoute donc aucune porte : elle ne peut
 * emprunter sa branche que là où l'interrupteur est déjà ouvert.
 *
 * ── ET JAMAIS DE MÉLANGE ─────────────────────────────────────────────────────────────
 * On renvoie un côté OU l'autre, jamais une fusion. C'est la règle qu'`app/certificat.tsx`
 * énonce déjà pour lui-même : « moitié serveur, moitié démonstration produirait un document
 * au nom de quelqu'un avec le code d'un autre ».
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export function composer<T>(brut: Etat<T>, replique: T | null): Etat<T> {
  return composerSelon(brut, replique, true);
}

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * UNE IDENTITÉ NE SE COMBLE PAS — et c'est la nuance qui manquait à la première version.
 *
 * Combler un CATALOGUE vide avec un exemple est utile : personne ne croit posséder les
 * cours d'une planche de démonstration. Combler une IDENTITÉ vide avec un nom fait croire
 * à une session ouverte — l'application affiche « Bonjour Aïssatou » à quelqu'un qui n'est
 * connecté à rien, et il n'a aucun moyen de faire la différence.
 *
 * Le défaut a été trouvé en regardant le premier APK : la question posée était « est-ce
 * que l'application est connectée à un compte Aïssatou ? ». Elle ne l'était pas. Mais la
 * poser prouve que l'écran le laissait croire, et c'est le même genre de confusion que
 * l'interrupteur de contenu avait été posé pour supprimer.
 *
 * `anonyme` n'est PAS un trou : c'est une réponse définitive — il n'y a personne. Une
 * réplique comble ce qui manque, pas ce qui est nul par nature.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export function composerIdentite<T>(brut: Etat<T>, replique: T | null): Etat<T> {
  return composerSelon(brut, replique, false);
}

function composerSelon<T>(brut: Etat<T>, replique: T | null, comblerAnonyme: boolean): Etat<T> {
  // Le serveur a parlé — même pour dire qu'il n'y a rien.
  if (brut.phase === 'servie' || brut.phase === 'vide') return brut;

  // Une panne reste une panne : masquer un échec par du contenu de démonstration
  // ferait croire l'application en bon état alors qu'elle ne lit rien.
  if (brut.phase === 'panne') return brut;

  // Personne n'est connecté : sur une identité, on ne prête pas un nom à ce vide-là.
  if (brut.phase === 'anonyme' && !comblerAnonyme) return brut;

  if (replique !== null) {
    return { phase: 'replique', valeur: replique, source: SOURCE, asOf: RELEVE };
  }
  return brut;
}

/** Même chose pour une liste : `[]` compte comme une absence de réplique. */
export function composerListe<T>(brut: Etat<readonly T[]>, replique: readonly T[]): Etat<readonly T[]> {
  return composer(brut, replique.length === 0 ? null : replique);
}

/**
 * La provenance d'un état, prête pour `<Num source asOf>`.
 *
 * `Num` EXIGE une date — c'est sa règle, et c'est ce qui l'empêche d'écrire un chiffre que
 * personne n'a relevé. Mais quatre des six phases n'en ont pas : rien n'est encore arrivé.
 * On rend alors l'instant présent AVEC une valeur nulle : `Num` affiche son repli, la date
 * n'est jamais lue, et l'appelant n'a pas à écrire une ternaire de trois lignes sur chacun
 * des quarante écrans — ce que la première version de cet appel faisait, et c'était illisible.
 */
export function provenance(etat: Etat<unknown>): { source: NumSource; asOf: Date } {
  if (etat.phase === 'servie' || etat.phase === 'vide' || etat.phase === 'replique') {
    return { source: etat.source, asOf: etat.asOf };
  }
  return { source: 'server', asOf: new Date() };
}
