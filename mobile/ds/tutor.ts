import { useSyncExternalStore } from 'react';

/**
 * LE NOM DU TUTEUR — une donnée de profil, pas une constante d'interface.
 *
 * Le kit l'écrit sans détour : le troisième onglet de la barre est nommé par `tutorNom()`,
 * et la valeur par défaut est « Répétiteur ». Ce n'est pas une coquetterie : une personne
 * peut renommer son tuteur, et c'est ce nom-là qui doit apparaître dans SA barre.
 *
 * Écrire « Rysmo » en dur ici casserait ce renommage — et confondrait deux choses que
 * l'architecture de marque sépare : « Rysmo » est le nom de CETTE APPLICATION, « Répétiteur »
 * est le nom par défaut du tuteur qu'elle contient.
 *
 * ── LE DÉFAUT QUI RENDAIT LE RENOMMAGE INVISIBLE ────────────────────────────────────────
 *
 * La valeur vivait dans un `let` de module, lu par `tutorNom()` au rendu. Renommer depuis
 * l'écran de mémoire changeait donc la variable — et RIEN ne redemandait à la barre d'onglets
 * de se rendre. Quelqu'un qui venait d'appeler son tuteur « Coach » lisait « Coach » sur
 * l'écran qu'il quittait et « Répétiteur » dans la barre juste en dessous. C'est le même
 * défaut, à la lettre, que celui trouvé au web sur l'écran du renommage.
 *
 * `useSyncExternalStore` le ferme : le magasin prévient ses abonnés, et tout composant qui
 * lit par `useTutorNom()` se rend à nouveau. Aucune dépendance ajoutée — c'est du React.
 *
 * ── CE QUI N'EST PAS PERSISTÉ, ET POURQUOI CE N'EST PAS UN OUBLI ─────────────────────────
 *
 * Le nom ne survit pas à un redémarrage de l'application, et il ne DOIT PAS être rangé dans
 * un stockage local. Le web le garde dans le PROFIL — `users/<uid>.tutorName`, lu par
 * `src/lib/naming` — et c'est la seule source qui vaille : un nom rangé localement divergerait
 * du profil dès la première ouverture sur un autre appareil, et personne ne saurait lequel des
 * deux fait foi.
 *
 * Ce module est donc un CACHE DE SESSION, alimenté par le profil quand le SDK Firebase sera
 * branché (`setTutorNom(profil.tutorName)` au démarrage, une fois). Y ajouter un
 * `AsyncStorage` aujourd'hui créerait le second magasin qu'il faudrait ensuite réconcilier.
 */
export const TUTOR_DEFAUT = 'Répétiteur';

let nom = TUTOR_DEFAUT;
const abonnes = new Set<() => void>();

export function tutorNom(): string {
  return nom;
}

/** Une chaîne vide ramène au défaut : un onglet sans libellé n'est pas une option. */
export function setTutorNom(n: string | null | undefined): void {
  const suivant = (n ?? '').trim() || TUTOR_DEFAUT;
  if (suivant === nom) return;   // pas de rendu pour une écriture qui ne change rien
  nom = suivant;
  for (const prevenir of abonnes) prevenir();
}

function abonner(prevenir: () => void): () => void {
  abonnes.add(prevenir);
  return () => { abonnes.delete(prevenir); };
}

/**
 * À utiliser PARTOUT où le nom s'affiche — barre d'onglets, en-tête de conversation, champ
 * de renommage, ligne de suppression de compte. `tutorNom()` reste disponible pour le code
 * qui n'est pas un composant ; dans un composant, il ne se rendrait pas à nouveau.
 */
export function useTutorNom(): string {
  return useSyncExternalStore(abonner, tutorNom, tutorNom);
}
