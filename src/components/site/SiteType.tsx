import type { CSSProperties, ReactNode } from 'react';

/**
 * LE TITRE D'AFFICHAGE — écrit ligne par ligne, jamais replié.
 *
 * C'est AD-13 rendu exécutable. Le système pose la règle et donne le calcul :
 *
 *   FR : JE TE FORME (11) / AU DIGITAL. (11) / DEPUIS DAKAR. (13)
 *   EN : I'LL TRAIN YOU (14) / TO GO DIGITAL. (14) / FROM DAKAR. (11)
 *
 * Le français court environ 18 % plus long. Un titre calé sur trois lignes en français en fait
 * deux en anglais, et le bloc perd sa masse — d'où des titres qui ne sont pas traduits mais
 * ÉCRITS par langue, avec leurs propres coupures.
 *
 * Le type l'impose : `lines` est un tableau. Il n'y a pas de prop `children` en texte libre,
 * donc pas de moyen de laisser un titre se replier tout seul. Chaque ligne est `nowrap`.
 *
 * Chaque ligne devient un `<span class="rv-l">` avec son propre `--i` : la révélation se fait
 * ligne à ligne, décalée de `--stagger-line` (90 ms), sous un masque `clip-path`.
 */
export interface SiteDisplayProps {
  /** Une entrée = une ligne. Écrite, pas calculée. */
  lines: string[];
  /** Taille en pixels. Jamais sous 22 : en dessous, Fraunces 900 devient illisible. */
  size?: number;
  /** `h1` par défaut ; `h2` pour un titre de section. */
  as?: 'h1' | 'h2' | 'h3';
  /** Décalage de départ de la cascade, quand un sourcil la précède. */
  from?: number;
  /**
   * LE TITRE VIENT DE LA BASE, PAS D'UN AUTEUR — et il a donc le droit de se replier.
   *
   * AD-13 interdit le repli automatique d'un titre ÉCRIT : un titre calé sur trois lignes en
   * français en fait deux en anglais, et le bloc perd sa masse. Cette règle suppose quelqu'un
   * qui choisit les coupures — un rédacteur, un traducteur. Le titre d'un article, d'une
   * formation, d'un épisode n'a personne : il arrive de Firestore en une seule chaîne, et
   * `nowrap` le fait alors déborder de l'écran. Mesuré : « Pourquoi ta boutique n'apparaît pas
   * sur Google Maps », 46 px de Fraunces 900, réclame ~1 270 px sur un écran de 390.
   *
   * D'où un opt-in explicite plutôt qu'un assouplissement de la règle : le défaut reste
   * `nowrap`, et un titre qui se replie doit le DIRE — ce qui rend la question « ce titre
   * est-il écrit ou lu ? » répondable en un grep, au lieu de dépendre de l'origine de la
   * chaîne passée à `lines`.
   */
  wrap?: boolean;
  id?: string;
  style?: CSSProperties;
}

export function SiteDisplay({ lines, size = 64, as: Tag = 'h1', from = 0, wrap = false, id, style }: SiteDisplayProps) {
  return (
    <Tag
      id={id}
      style={{
        fontFamily: 'var(--f-display)',
        fontWeight: 900,
        fontSize: `${size}px`,
        letterSpacing: '-.038em',
        lineHeight: 0.9,
        margin: 0,
        ...style,
      }}
    >
      {lines.map((line, i) => (
        <span
          key={line}
          className="rv-l"
          style={{
            '--i': from + i + 1,
            display: 'block',
            whiteSpace: wrap ? 'normal' : 'nowrap',
            // Un mot plus long que la colonne — une URL, un nom composé — déborde même en
            // repli. `balance` répartit les lignes d'un titre court, ce que le kit obtient
            // à la main en écrivant ses coupures.
            ...(wrap ? { overflowWrap: 'break-word', textWrap: 'balance' } : null),
          } as CSSProperties}
        >
          {line}
        </span>
      ))}
    </Tag>
  );
}

/**
 * LE SOURCIL — monospace, capitales, interlettré.
 *
 * ⚠️ Il lit les JETONS, pas les valeurs du kit. Le kit site code 11 px / .16em en dur, alors
 * que `tokens/typography.css` déclare `--fs-eyebrow: 10.5px` et `--ls-eyebrow: .14em`. Et il
 * ne le fait pas une fois : le kit pratique quatre recettes de sourcil différentes — 11/.16
 * dans `SiteEyebrow`, 10/.16 dans le pied de page, 10/.14 dans les emplacements d'« à propos »,
 * 11/.16 en ligne ailleurs. Aucune ne lit ses propres jetons.
 *
 * Un système de design dont les composants n'utilisent pas ses jetons n'a pas de jetons, il a
 * une documentation. On prend les jetons.
 */
export function SiteEyebrow({
  children,
  className,
  style,
}: {
  children: ReactNode;
  /**
   * Une classe de plus, jamais à la place des deux autres. Elle existe pour la seule chose
   * qu'un sourcil peut légitimement changer : sa COULEUR — `text-corail-txt` sur `/agence`,
   * qui vit hors des quatre verbes et porte l'entrée corail (AD-20). Écrire la teinte en
   * `style` marcherait aussi ; passer par la classe garde la question « qui écrit du corail
   * dans ce dépôt ? » répondable en un grep sur le nom du jeton.
   */
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <p className={['rv mm-eyebrow', className].filter(Boolean).join(' ')} style={{ margin: '0 0 10px', ...style }}>
      {children}
    </p>
  );
}
