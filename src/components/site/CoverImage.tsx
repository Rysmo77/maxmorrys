import type { CSSProperties } from 'react';

/**
 * LA VIGNETTE D'UN CONTENU — un seul endroit qui sait comment elle se charge.
 *
 * ── L'EXCEPTION EST ASSUMÉE, ET ELLE A UN PRIX ──────────────────────────────────────
 * Le kit interdit les vignettes sur l'index éditorial : « aucune vignette photo : la
 * couleur de la carte dit le type de contenu, et ne coûte rien à charger »
 * (`reference/screens-editorial.jsx:29`). L'argument est le coût des données — sur le
 * marché visé, le panier de 2 Go vaut 4,2 % du revenu national brut par habitant.
 *
 * Le porteur a tranché le 01/09/2026 : les images s'affichent, sur l'article ET sur
 * l'index. Ce composant existe pour que l'exception coûte le moins possible :
 *
 *   · `loading="lazy"` par défaut — une carte hors écran ne télécharge rien. Seule la
 *     vignette d'en-tête d'article passe `priority`, parce qu'elle est le plus grand
 *     élément du premier écran, donc la mesure de LCP : la différer la dégraderait.
 *   · `aspect-ratio` posé en CSS plutôt que `width`/`height` en attributs : la boîte est
 *     réservée AVANT le chargement — donc aucun saut de mise en page — sans supposer une
 *     dimension source que le modèle ne déclare pas.
 *   · `alt=""` : ce sont des illustrations, et sur une carte le lien porte déjà le titre.
 *     Un `alt` qui répète le titre le fait annoncer deux fois par un lecteur d'écran.
 *   · rien du tout quand `src` est vide — pas de cadre gris. Une carte sans image reprend
 *     simplement la silhouette que le kit lui donne.
 *
 * ⚠️ CE QUE CE COMPOSANT NE PEUT PAS FAIRE. Les fichiers en base pèsent ~750 Ko pièce
 * (relevé du 01/09/2026 sur les 40 articles publiés : des JPEG 1408×768 nommés `.png`,
 * servis depuis un bucket R2 public). Aucun attribut HTML ne réduit ces octets, et le
 * redimensionnement d'images Cloudflare n'est pas actif sur la zone (`/cdn-cgi/image/…`
 * répond 404). Tant que ces deux points tiennent, une grille de douze cartes visibles
 * coûte plusieurs mégaoctets. La correction est en amont — conversion en AVIF/WebP au
 * téléversement, ou activation du redimensionnement — pas ici.
 */
export interface CoverImageProps {
  src?: string;
  /**
   * Rayon du kit : `media` (26 px) pour une vignette, `m` (16 px) dans une carte dense,
   * `none` quand un conteneur porte déjà l'arrondi et le `overflow: hidden` — le cas d'une
   * image à fond perdu, qui n'arrondit que les coins de la carte qu'elle occupe.
   */
  radius?: 'media' | 'm' | 'l' | 'none';
  /** Vignette d'en-tête : chargée tout de suite parce qu'elle est le LCP. */
  priority?: boolean;
  /**
   * La vignette prend la HAUTEUR qu'on lui donne au lieu d'imposer la sienne.
   *
   * À réserver au cas où elle est posée à côté d'un texte dans une carte dont la hauteur
   * est fixée par ailleurs — une rangée de grille, par exemple. Avec le ratio, l'image
   * décide de sa hauteur et laisse le reste de la carte vide en dessous ; en `fill`, c'est
   * la carte qui décide, et `object-fit: cover` recadre. Le plancher évite qu'elle
   * disparaisse si la rangée se retrouve sans hauteur définie.
   */
  fill?: boolean;
  className?: string;
  style?: CSSProperties;
}

const RADIUS = { media: 'var(--r-media)', m: 'var(--r-m)', l: 'var(--r-l)', none: '0' } as const;

export function CoverImage({ src, radius = 'media', priority = false, fill = false, className = '', style }: CoverImageProps) {
  if (!src) return null;

  return (
    <img
      src={src}
      alt=""
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={`block w-full object-cover ${className}`}
      style={{
        ...(fill ? { height: '100%', minHeight: '150px' } : { aspectRatio: '16 / 9' }),
        borderRadius: RADIUS[radius],
        ...style,
      }}
    />
  );
}
