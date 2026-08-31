import type { CSSProperties } from 'react';

/**
 * Un jeu unique, à trait. 109 glyphes, boîte de 24, fill: none, stroke: currentColor,
 * trait 2,2 px pour le jeu maison (2,4 pour la loupe, le cadenas et les chevrons ; 3,4 pour
 * la coche), 2 px pour les glyphes empruntés.
 *
 * D'OÙ ILS VIENNENT. Le kit source dessine ses SVG EN LIGNE — sans police d'icônes, sans
 * sprite, sans fichiers. Ses 33 glyphes sont repris ici VERBATIM : aucun n'a été redessiné.
 *
 * DEUX GLYPHES PLEINS SEULEMENT : `play` et `star`.
 *
 * ══ LA RÈGLE, ET CE QU'ELLE A COÛTÉ ═══════════════════════════════════════════════════
 *
 * POUR UN GLYPHE ABSENT : prendre Lucide (même boîte, même trait, mêmes caps rondes) et le
 * poser à 2 px de trait. NE JAMAIS MÉLANGER DEUX FAMILLES D'ICÔNES SUR UN MÊME ÉCRAN.
 *
 * Cette règle était écrite, et elle était contredite par le dépôt : **61 fichiers importaient
 * encore `lucide-react` directement**, pour 107 glyphes distincts. Le jeu maison en couvrait
 * 49. Ce n'était pas une cohabitation décidée, c'était une dérive — chaque écran qui manquait
 * d'un glyphe en important un d'ailleurs, avec son propre trait, sa propre boîte, et sans que
 * rien ne le signale.
 *
 * 76 EMPRUNTS DÉCLARÉS, DONC, et non plus 16. Ils entrent ici plutôt que dans les écrans,
 * parce que c'est l'ENDROIT qui fait la cohérence, pas la provenance : un glyphe qui passe
 * par `MM_ICONS` hérite de la boîte de 24, des caps rondes et de la discipline de trait du
 * système. Un glyphe importé dans un écran n'hérite de rien.
 *
 * Ce qui a été rendu à un glyphe maison plutôt qu'emprunté : `X → close`, `Trash2 → trash`,
 * `ArrowRight → forward`, `ArrowLeft → back`, `FileText → doc`, `BookOpen → book`,
 * `CreditCard → card`, `MapPin → pin`, `Briefcase → case`, `BarChart3 → bars`,
 * `MessageSquare → comment`, `ChevronDown → chevron`, `Edit3 → pencil`, `BookMarked →
 * bookmark`, `CheckCircle2 → check-circle`. Un emprunt qui double un glyphe existant est une
 * dérive, pas un ajout.
 *
 * ══ CE QUI N'ENTRE PAS ════════════════════════════════════════════════════════════════
 *
 * UN GLYPHE VOLONTAIREMENT ABSENT : `Loader2`, le rond de chargement — 14 fichiers
 * l'importaient. Le contrat de `Button` tranche : « le libellé RESTE pendant le chargement
 * […] Un liseré le balaie. Jamais de rond qui tourne. » Il ne se remplace pas par un autre
 * glyphe, il disparaît au profit de `.mm-loading` et des squelettes.
 *
 * LES MARQUES TIERCES N'ENTRENT PAS NON PLUS. `Linkedin`, `Facebook`, `Instagram`, `Youtube`,
 * `Twitter` : une marque tierce n'est pas une icône d'interface — elle a ses couleurs, ses
 * proportions et ses conditions d'usage. Elles suivent le chemin de `GoogleIcon` et vivent
 * dans `components/shared/SocialIcons.tsx`, qui portait déjà `XIcon` et `TikTokIcon`.
 *
 * AUCUN EMOJI, AUCUN CARACTÈRE UNICODE UTILISÉ COMME ICÔNE, nulle part.
 *
 * ⚠️ LE CAS QUE CETTE RÈGLE NE COUVRE PAS : dans le Club, certains emoji sont de la DONNÉE.
 * L'humeur d'une publication est stockée en base comme le caractère lui-même, sur des
 * enregistrements qui existent. La règle porte sur l'ÉCRAN, pas sur la base : la donnée reste,
 * et `MOOD_LABEL_KEYS` (`pages/lms/hooks/useClubData.ts`) la traduit en mot à l'affichage.
 */
import { MM_ICONS, type IconName } from '../../icons';

export type { IconName };

export { iconNames } from '../../icons';

export interface IconProps {
  name?: IconName;
  /** 13–14 px dans une puce de liste, 17–19 dans un bouton rond, 21 dans la barre d'onglets. */
  size?: number;
  strokeWidth?: number;
  color?: string;
  style?: CSSProperties;
  /**
   * Passe-plat de classe. Il existe pour UNE raison : les utilitaires de COULEUR du produit
   * (`text-forme`, `text-ink-2`, `text-white`) posent une `color`, dont le glyphe hérite par
   * `currentColor`. Sans lui, la sortie de `lucide-react` aurait dû convertir chaque teinte
   * en prop `color`, c'est-à-dire recopier à la main une valeur que la cascade donnait déjà.
   *
   * Il ne sert PAS à dimensionner : la taille est `size`, en pixels, parce que le glyphe est
   * un SVG à boîte fixe et qu'une classe `w-4` sur un `<svg width>` laisse les deux valeurs
   * diverger sans que rien ne le dise.
   */
  className?: string;
  /**
   * Une icône est décorative PAR DÉFAUT — `aria-hidden`, parce qu'elle accompagne presque
   * toujours un libellé déjà lu. Quand elle porte à elle seule le sens, on lui donne un
   * titre, et elle devient une image nommée.
   */
  title?: string;
}

export function Icon({ name = 'check', size = 19, strokeWidth, color = 'currentColor', style, title, className }: IconProps) {
  const ic = MM_ICONS[name] ?? MM_ICONS.check;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke={ic.solid ? 'none' : color}
      strokeWidth={strokeWidth ?? ic.w ?? 2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title && <title>{title}</title>}
      {ic.solid && ic.fill && <path d={ic.fill} fill={color} />}
      {(ic.r ?? []).map((r, i) => <rect key={`r${i}`} x={r[0]} y={r[1]} width={r[2]} height={r[3]} rx={r[4]} />)}
      {(ic.c ?? []).map((c, i) => <circle key={`c${i}`} cx={c[0]} cy={c[1]} r={c[2]} />)}
      {(ic.p ?? []).map((d, i) => <path key={`p${i}`} d={d} />)}
    </svg>
  );
}
