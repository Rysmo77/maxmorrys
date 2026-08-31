import type { CSSProperties } from 'react';
import type { Territory } from '../types';

/**
 * LE FOND DU PRODUIT. Trois lobes flous par territoire, en dérive désynchronisée.
 *
 * C'est ce qui remplace la vidéo d'accueil en autoplay de 2 à 6 Mo : POIDS ZÉRO OCTET. Sur
 * un marché où le panier de données 2 Go coûte en médiane 4,2 % du revenu national brut par
 * habitant, ce n'est pas une élégance, c'est la décision de conception la plus rentable du
 * système.
 *
 * Les lobes sont animés en `transform` uniquement, sur 25 à 38 secondes, désynchronisés par
 * des délais négatifs — deux lobes qui repartent ensemble se voient immédiatement.
 *
 * Le voile de lisibilité vit dans le CSS (`.mesh::after`), remonté à 60/78/90 % par AD-18.
 * Sans lui, le maillage remonte sous le texte.
 *
 * ⚠️ COROLLAIRE DE MISE EN PAGE (AD-18) : aucun texte de corps ne se place dans le premier
 * tiers d'un écran à maillage. Le haut d'écran est réservé aux titres d'affichage, qui sont
 * du grand texte et tiennent 3:1 là où le corps ne tiendrait pas 4,5:1.
 */
export interface MeshProps {
  /** `nuit` est le maillage de la console d'administration, sur #0A0D11. */
  territory?: Territory | 'nuit';
  /** Diamètre des lobes. 340 px sur mobile, 460–520 sur écran large. */
  size?: number;
  style?: CSSProperties;
}

export function Mesh({ territory = 'forme', size, style }: MeshProps) {
  const s = size ? { width: `${size}px`, height: `${size}px` } : undefined;
  return (
    // aria-hidden : c'est une couleur de fond, pas un contenu. Un lecteur d'écran n'a rien
    // à en dire, et trois <b> vides annoncés seraient du bruit à chaque écran.
    <div className={`mesh m-${territory}`} style={style} aria-hidden="true">
      <b style={s} />
      <b style={s} />
      <b style={s} />
    </div>
  );
}
