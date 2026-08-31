import { Skeleton } from '@ds';

export interface PageSkeletonProps {
  /**
   * Nombre de cartes sous le héros. Trois par défaut — la grille des pages d'index.
   * Quatre sur l'accueil, qui pose une rangée de quatre territoires.
   */
  cards?: number;
  /** La rangée de filtres (`ChipRow` / `SearchPill`) des pages d'index. */
  chips?: boolean;
  label?: string;
}

/**
 * ── LE SQUELETTE, ET POURQUOI IL A EXACTEMENT CETTE FORME ─────────────────────────────
 *
 * `ui_kits/plateforme/ScreensEtats.js`, écran `Chargement`, tient dans une phrase qu'il
 * écrit lui-même en pied : **« Quand le contenu arrive, rien ne saute. »**
 *
 * C'est une contrainte de GÉOMÉTRIE, pas de décoration. Un squelette dont les blocs n'ont
 * pas la taille du contenu réel est pire que rien : il promet une mise en page, puis la
 * remplace par une autre. Les mesures ci-dessous sont donc reprises du kit et alignées sur
 * ce que les pages rendent vraiment — sourcil, deux lignes de titre à 86 % et 64 %, bouton,
 * puce de filtres, cartes.
 *
 * CE QU'IL REMPLACE : `PageLoader`, un rond de 32 px en `animate-spin`, posé en repli des
 * soixante routes paresseuses. Deux défauts, chacun nommé par le système :
 *
 *   • Le contrat de `Button` tranche pour tout le produit — « Un liseré le balaie. **Jamais
 *     de rond qui tourne.** » Un rond qui tourne dit qu'on attend ; il ne dit pas ce qu'on
 *     attend, et il ne réserve pas la place.
 *   • Il portait `dark:bg-[color:var(--night-2)]`, une variante de couleur écrite à la main
 *     là où la portée `.dk` bascule seule (AD-3).
 *
 * IL N'ENVELOPPE PAS DANS `PageSite`, et c'est délibéré : le même repli sert les routes
 * publiques, la console et l'espace apprenant, dont les coquilles n'ont pas la même gouttière.
 * Il lit `--site-pad` avec un repli, ce qui le met d'accord avec les trois sans en imiter
 * aucune exactement.
 *
 * IL N'ANNONCE AUCUN NOMBRE. Un squelette ne sait pas combien d'articles vont arriver ; il
 * en dessine trois parce que trois est la forme de la grille, pas parce qu'il y en aura
 * trois. Aucun `<Num>` ici — il n'y a rien de mesuré à afficher.
 *
 * `Skeleton` porte déjà `aria-busy` et respecte `prefers-reduced-motion` (son miroitement
 * tombe à 1 ms dans `brand/fallback.css`) : rien à ajouter ici pour l'accessibilité, sinon
 * le nom de ce qui charge.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */
export default function PageSkeleton({ cards = 3, chips = false, label }: PageSkeletonProps) {
  return (
    <div
      className="mx-auto w-full max-w-[1180px]"
      style={{ padding: 'var(--site-pad, 18px)' }}
      aria-busy="true"
      aria-label={label}
    >
        <Skeleton width={110} height={11} label={label} />

        <div className="mt-[14px] grid gap-[10px]">
          <Skeleton height={34} width="86%" />
          <Skeleton height={34} width="64%" />
        </div>

        <Skeleton height={56} radius={999} style={{ marginTop: '20px', maxWidth: '260px' }} />

        {chips && (
          <div className="mt-4 flex gap-2">
            <Skeleton width={70} height={40} radius={999} />
            <Skeleton width={84} height={40} radius={999} />
            <Skeleton width={62} height={40} radius={999} />
          </div>
        )}

        <div
          className="mt-[22px] grid gap-3"
          style={{ gridTemplateColumns: `repeat(${Math.min(cards, 3)}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: cards }, (_, i) => (
            <Skeleton key={i} height={118} radius={24} />
          ))}
        </div>
    </div>
  );
}
