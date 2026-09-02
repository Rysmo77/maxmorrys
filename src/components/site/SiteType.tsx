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
  /**
   * UN FRAGMENT DU TITRE SE REMPLIT DE L'ARC, à l'entrée puis au survol (AD-23).
   *
   * Le fragment est marqué DANS LA CHAÎNE, entre crochets — « AU [DIGITAL]. ». C'est le seul
   * endroit où il peut vivre : AD-13 pose que les titres ne sont pas traduits mais ÉCRITS par
   * langue, avec leurs propres coupures. La mise en valeur est une décision de rédaction au
   * même titre que la coupure, et elle change de place d'une langue à l'autre — « LE CLUB DES
   * / [DIGITOS.] » en français, « THE [DIGITOS] / CLUB. » en anglais. La sortir de la chaîne
   * aurait obligé à la maintenir en double, dans un tableau d'index que rien ne relie au texte.
   *
   * C'EST UN OPT-IN, ET PAS PAR PRUDENCE DE PRINCIPE. `lines` reçoit aussi des titres venus de
   * Firestore — un article, une formation, un épisode. Analyser toutes les lignes ferait
   * disparaître les crochets d'un titre qui en contient légitimement, sans que personne
   * l'écrive nulle part. Le défaut ne touche donc à rien, et les neuf héros du site le
   * demandent.
   */
  arc?: boolean;
  id?: string;
  style?: CSSProperties;
}

/**
 * Découpe une ligne sur ses crochets. Les segments d'index impair sont ceux qui étaient
 * entre crochets — `split` sur un groupe capturant les intercale, et une ligne commence
 * toujours par un segment nu, fût-il vide.
 */
function segments(line: string) {
  return line.split(/\[([^\]]*)\]/g);
}

export function SiteDisplay({ lines, size = 64, as: Tag = 'h1', from = 0, wrap = false, arc = false, id, style }: SiteDisplayProps) {
  /*
   * ── LA TAILLE EST FLUIDE, PARCE QUE LA COUPURE EST ÉCRITE ────────────────────────────
   *
   * `size` était servi tel quel, à toutes les largeurs. Sur un écran de 375, le héros de
   * l'accueil restait à 60 px et « DEPUIS DAKAR. » réclamait 477 px dans une colonne de 333.
   * Comme chaque ligne est en `nowrap` — c'est AD-13, et c'est ce qui protège les coupures
   * écrites —, elle ne se replie pas : elle déborde. Mesuré au navigateur, le document
   * s'élargissait à 495 px sur `/`, 509 sur `/agence`, 526 sur `/podcast-et-videos` et 564
   * sur `/presence-digitale` : SIX routes publiques sur huit défilaient latéralement.
   *
   * La règle et le débordement sont donc la même décision vue des deux côtés. `nowrap` est
   * juste — un titre calé sur trois lignes doit rester sur trois lignes. Ce qui manquait,
   * c'est que LA TAILLE suive la largeur, pour que la coupure écrite tienne toujours.
   *
   * ── LE CALCUL, ET D'OÙ VIENNENT SES DEUX NOMBRES ─────────────────────────────────────
   *
   * • `size / 10.8` en `vw` : à 1080 px — le point de rupture `wide` — cette expression vaut
   *   exactement `size`. Au-delà, la borne haute reprend la main : les grands écrans rendent
   *   le titre à la taille écrite, sans interpolation.
   * • Le plancher à 62 % : la pire ligne du site réclame 1,49 fois sa colonne
   *   (« Pourquoi il n'y a pas d'étoiles ici », `/presence-digitale`), soit un facteur
   *   maximal admissible de 0,671. 0,62 laisse la marge, et le `Math.max(22, …)` tient la
   *   limite que ce fichier posait déjà : sous 22 px, Fraunces 900 n'est plus lisible.
   *
   * Aucune valeur n'est devinée : les deux bornes viennent d'un relevé sur les onze routes
   * publiques, à 375 px, et `tests/unit/display-fit.test.ts` refuse qu'on les desserre.
   */
  const plancher = Math.max(22, Math.round(size * 0.62 * 10) / 10);
  return (
    <Tag
      id={id}
      style={{
        fontFamily: 'var(--f-display)',
        fontWeight: 900,
        fontSize: `clamp(${plancher}px, ${(size / 10.8).toFixed(2)}vw, ${size}px)`,
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
            /*
             * `--dsp-wrap` vaut `nowrap` partout, SAUF sous 360 px (voir `index.css`). En
             * dessous, même le plancher de 22 px ne fait pas tenir la plus longue ligne du
             * site, et il n'y a pas d'étage plus bas : le fichier pose 22 px comme limite de
             * lisibilité de Fraunces 900. Il reste alors deux issues, et une seule est bonne
             * — la coupure écrite se replie sur deux lignes visuelles, ou la page entière
             * défile latéralement. AD-13 protège les coupures VOULUES ; il ne demande pas
             * qu'on préfère un défilement horizontal à un repli.
             */
            whiteSpace: wrap ? 'normal' : 'var(--dsp-wrap, nowrap)',
            // Un mot plus long que la colonne — une URL, un nom composé — déborde même en
            // repli. `balance` répartit les lignes d'un titre court, ce que le kit obtient
            // à la main en écrivant ses coupures.
            ...(wrap ? { overflowWrap: 'break-word', textWrap: 'balance' } : null),
          } as CSSProperties}
        >
          {arc
            ? segments(line).map((part, j) =>
                // Impair = entre crochets. `.mm-arc` hérite du `--i` de la ligne : le
                // remplissage part quand sa ligne part, et dure aussi longtemps qu'elle.
                j % 2 === 1
                  ? <span key={j} className="mm-arc">{part}</span>
                  : part)
            : line}
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
