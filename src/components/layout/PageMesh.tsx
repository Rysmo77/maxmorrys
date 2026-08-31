import { useLocation } from 'react-router-dom';
import { Mesh } from '../../design-system';
import { universeFromPath, universeThemes } from '../../lib/sectionThemes';

/**
 * LE FOND DU SITE PUBLIC — un maillage par territoire, posé une seule fois.
 *
 * POIDS : ZÉRO OCTET. C'est ce qui remplace la vidéo d'accueil en autoplay de 2 à 6 Mo. Sur un
 * marché où le panier de données de 2 Go coûte en médiane 4,2 % du revenu national brut par
 * habitant, ce n'est pas une élégance : c'est la décision de conception la plus rentable du
 * système.
 *
 * IL NE CHANGE PAS ENTRE UNE LISTE ET SON DÉTAIL. `universeFromPath` répond `blog` pour
 * `/blog` comme pour `/blog/mon-article` : le maillage est le repère de continuité, celui qui
 * dit « tu es toujours dans Je t'informe ». Un maillage qui changerait à l'ouverture d'un
 * article ferait croire à un changement de site.
 *
 * IL EST EN `position: fixed`, ET C'EST UNE DÉCISION. Le kit le pose en `absolute` dans un
 * cadre de page de 780 à 880 px qui ne défile pas ; ici, un article fait dix écrans de haut.
 * Étiré sur toute la hauteur du document, le voile de lisibilité — 60 % en haut, 90 % en bas —
 * laisserait trois mille pixels de couleur saturée sous du texte de corps. Fixé à la fenêtre,
 * le dégradé retrouve exactement la géométrie sur laquelle AD-18 a été mesuré.
 *
 * `agency` n'a PAS de maillage (`mesh: null`) : l'agence vit hors des quatre verbes, et son
 * héros est une dalle d'encre. Lui poser un maillage de territoire serait la ranger dans un
 * territoire — ce que sectionThemes refuse explicitement.
 */
export default function PageMesh() {
  const { pathname } = useLocation();
  const mesh = universeThemes[universeFromPath(pathname)].mesh;

  if (!mesh) return null;

  // `zIndex: 0` et non `-1` : la pile de peinture d'un z-index négatif dépend du premier
  // ancêtre qui crée un contexte d'empilement, ce qu'aucune page ne contrôle. À 0, la règle
  // est explicite et locale — le contenu se pose au-dessus en `relative z-[1]`.
  return <Mesh territory={mesh} style={{ position: 'fixed', zIndex: 0 }} />;
}
