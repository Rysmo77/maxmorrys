import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LA CRÉA D'UNE FORMATION — AD-24 APPLIQUÉ AUX FORMATIONS.
 *
 * `Formation.coverImage` est saisi dans la console (`ImageInput folder="formations"`), part
 * dans le flux produit Meta, sert d'image Open Graph, et s'affiche au bas de chaque article
 * de blog via `FormationCard`. Les DEUX surfaces qui vendent la formation, elles, le
 * jetaient : le catalogue n'affichait aucune image, et la fiche posait un dégradé de marque
 * à la place. On payait le stockage et la saisie d'une image montrée partout SAUF là où
 * quelqu'un décide d'acheter.
 *
 * C'est exactement l'écart que `MediaCard` a déjà tranché pour les podcasts et les vidéos :
 *
 *     « AD-24 · LA PHOTO ENTRE, LA SILHOUETTE RESTE. Le produit POSSÈDE les images et ne les
 *       montrait pas. Le dégradé devient un REPLI, pas un rebut. »
 *
 * Ce composant porte la même décision pour les formations, et le même repli.
 *
 * ─── POURQUOI UN COMPOSANT ET PAS TROIS `<img>` ────────────────────────────────────────
 *
 * Le repli sur URL cassée est la partie qu'on oublie. `FormationCard` posait un `<img>` nu :
 * une couverture supprimée de R2 affichait l'icône de lien brisé du navigateur au bas de
 * chaque article de blog, sur tout le trafic organique. Trois surfaces, une seule logique.
 *
 * ⚠️ LE REPLI EST PORTÉ PAR LA SOURCE, PAS PAR UN BOOLÉEN — même raison que `MediaCard` :
 * retenir « cassée » sans retenir LAQUELLE laisserait la carte suivante au dégradé alors que
 * sa propre image est bonne, dès que le filtre du catalogue réordonne sans démonter.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

interface FormationArtProps {
  /** `Formation.coverImage`. Absent, vide ou cassé : voir `fallback`. */
  src?: string;
  /**
   * Décorative par défaut. Le titre de la formation est l'étiquette de la même cible, et le
   * redire à voix haute ne fait que doubler l'annonce.
   */
  alt?: string;
  /** Rapport de la zone. Prime sur `height` — dans une grille fluide, une hauteur figée recadre. */
  ratio?: string;
  /** Hauteur fixe, quand la mise en page l'impose (la fiche pose 210 px). */
  height?: number;
  /**
   * Classes posées sur l'`<img>` elle-même.
   *
   * Le survol de `FormationCard` agrandit la photo, pas la carte. Le passer par une variante
   * arbitraire (`[&>img]:…`) aurait marché, mais le garde-fou « une classe qui ne génère
   * aucun CSS » de `ds:check` n'a aucune raison de savoir la résoudre : une prop explicite
   * dit la même chose sans rien demander à l'outillage.
   */
  imgClassName?: string;
  /**
   * Fond de la zone, et donc REPLI de l'image.
   *
   * ⚠️ Son absence a un sens : sans repli, le composant ne rend RIEN quand il n'y a pas
   * d'image utilisable. C'est ce qui permet au catalogue de n'ajouter une vignette que « s'il
   * y en a une », sans semer des rectangles vides sur les fiches qui n'en ont pas.
   */
  fallback?: string;
  radius?: string;
  /**
   * Image de première vue : chargée sans délai. À réserver à ce qui est AU-DESSUS de la
   * ligne de flottaison — la fiche. Le mettre sur une grille ferait courir toutes les
   * vignettes en même temps et retarderait précisément ce qu'on voulait accélérer.
   */
  priority?: boolean;
  /**
   * Voile sombre en pied de zone, pour ce qui se pose PAR-DESSUS l'image. Une photo est
   * imprévisible : sans lui, une étiquette claire atterrit parfois sur du blanc.
   */
  veil?: boolean;
  /** Ce qui se pose sur l'image — une étiquette, un badge. Aligné en bas. */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export default function FormationArt({
  src, alt = '', ratio, height, imgClassName, fallback, radius = 'var(--r-media)',
  priority, veil, children, className, style,
}: FormationArtProps) {
  const [broken, setBroken] = useState<string | null>(null);
  const montree = !!src?.trim() && broken !== src;

  // Ni image ni repli : la zone n'a rien à dire, et un cadre vide en dirait moins que rien.
  if (!montree && !fallback) return null;

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: radius,
        /*
         * UNE DIMENSION EST TOUJOURS DÉCLARÉE. Une zone sans hauteur se replie sur 0 px puis
         * saute à l'arrivée de l'image — le décalage que le budget CLS < 0,1 interdit.
         *
         * Trois façons de la tenir, dans cet ordre : le rapport (une grille fluide recadre
         * autrement à chaque largeur de colonne, donc il prime), une hauteur figée quand la
         * mise en page l'impose, ou la hauteur du parent quand c'est LUI qui porte le cadre —
         * le cas de `FormationCard`, dont l'enveloppe est aussi le repère des badges.
         */
        ...(ratio
          ? { aspectRatio: ratio }
          : height !== undefined
            ? { height: `${height}px` }
            // `inset: 0` et non `height: 100%` : une hauteur en pourcentage suppose que le
            // parent en ait une de définie, ce qui n'est vrai qu'une fois son `aspect-ratio`
            // résolu. Le calage absolu ne suppose rien et ne peut pas se replier sur zéro.
            : { position: 'absolute' as const, inset: 0 }),
        background: fallback,
        display: 'flex',
        alignItems: 'flex-end',
        ...style,
      }}
    >
      {montree && (
        <img
          src={src}
          alt={alt}
          aria-hidden={alt ? undefined : true}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          onError={() => setBroken(src ?? null)}
          className={imgClassName}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}

      {/* Le voile ne monte qu'à 42 % : assez pour tenir la rangée du bas, pas assez pour
          assombrir le sujet de l'image. Aucun flou — la règle 1 vaut ici aussi, ces zones
          vivent en grille. */}
      {montree && veil && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top,rgba(0,0,0,.58),rgba(0,0,0,0) 42%)',
          }}
        />
      )}

      {children && <div style={{ position: 'relative', width: '100%' }}>{children}</div>}
    </div>
  );
}
