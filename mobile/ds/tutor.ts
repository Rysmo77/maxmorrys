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
 */
export const TUTOR_DEFAUT = 'Répétiteur';

let nom = TUTOR_DEFAUT;

export function tutorNom(): string {
  return nom;
}

/** Une chaîne vide ramène au défaut : un onglet sans libellé n'est pas une option. */
export function setTutorNom(n: string | null | undefined): void {
  nom = (n ?? '').trim() || TUTOR_DEFAUT;
}
