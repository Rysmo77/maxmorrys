/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * L'AUTEUR DE LA MAISON — son nom, son portrait, et la question « est-ce bien lui ? ».
 *
 * Le portrait a longtemps manqué au dépôt, et c'était VOULU : celui qui occupait le héros
 * de « Je suis Max-Morrys » était une image générée, sur la seule page dont le métier est
 * d'inspirer confiance. `About.tsx` l'a retiré au profit d'un emplacement déclaré (FR-084),
 * et `Avatar` porte encore la phrase « aucune photographie n'existe au dépôt ».
 *
 * Elle existe depuis le 01/09/2026 : une photographie réelle, retouchée, en 4:5. Ce module
 * est le SEUL endroit qui en connaît le chemin — trois écrans la lisent déjà, et trois
 * chaînes `'/max-morrys-…webp'` recopiées à la main finiraient par pointer sur deux
 * fichiers différents le jour du prochain shooting.
 *
 * ── POURQUOI DEUX DÉCOUPES, ET PAS UNE SEULE IMAGE REDIMENSIONNÉE ─────────────────────
 *
 * Le héros montre le buste ; la pastille d'un article montre un visage. Servir le 4:5 dans
 * un rond de 40 px donnerait une tête minuscule au milieu d'une chemise — et 37 Ko pour
 * 1 600 pixels affichés. La découpe carrée est cadrée sur les yeux, à 41 % de la hauteur,
 * ce qui est la place où un rond les attend.
 *
 * ── REFAIRE LES TROIS FICHIERS ────────────────────────────────────────────────────────
 *
 * Le master est `Max-Morrys_BrandKit_Complet/08_Sources_Reference/Max-Morrys_portrait_original_1086.png`
 * (1086 × 1448). Les cadrages ne sont pas des « à peu près » : ils sont mesurés sur CE
 * fichier, et un nouveau shooting les invalide tous les trois.
 *
 *   M=Max-Morrys_BrandKit_Complet/08_Sources_Reference/Max-Morrys_portrait_original_1086.png
 *   cwebp -crop 0 40 1086 1357  -resize 800 1000 -q 82 -m 6 "$M" -o public/max-morrys-portrait-800.webp
 *   cwebp -crop 0 40 1086 1357  -resize 400 500  -q 84 -m 6 "$M" -o public/max-morrys-portrait-400.webp
 *   cwebp -crop 212 140 800 800 -resize 192 192  -q 86 -m 6 "$M" -o public/max-morrys-avatar-192.webp
 *
 * Inutile de viser le dernier kilo-octet à la main : `vite-plugin-image-optimizer` reprend
 * les trois au build et leur retire encore 15 à 19 %.
 *
 * ── POURQUOI `isHouseAuthor`, ET PAS `<img src={portrait.avatar}>` EN DUR ─────────────
 *
 * `BlogPost` affiche `post.author || 'Max-Morrys'` : le champ existe sur le modèle, et un
 * article signé par quelqu'un d'autre affiche bien son nom depuis qu'il est lu. Poser le
 * visage en dur à côté remettrait le défaut à l'identique, en pire — un nom qui se trompe
 * est une coquille, un VISAGE qui se trompe attribue le texte à la mauvaise personne.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/** La signature par défaut d'un contenu de la plateforme. */
export const HOUSE_AUTHOR = 'Max-Morrys';

/** Le nom civil, pour les données structurées — jamais pour une signature à l'écran. */
export const HOUSE_AUTHOR_FULL_NAME = 'Max-Morrys Eyoum';

/**
 * Les deux découpes servies depuis `public/`. Les dimensions sont déclarées parce qu'un
 * `<img>` sans `width`/`height` réserve zéro pixel : le texte sous lui saute au chargement,
 * et ce saut est compté par le CLS.
 */
export const portrait = {
  /** 4:5, le buste. Le repli des navigateurs sans WebP n'existe pas : la cible est 2026. */
  src: '/max-morrys-portrait-800.webp',
  srcSet: '/max-morrys-portrait-400.webp 400w, /max-morrys-portrait-800.webp 800w',
  width: 800,
  height: 1000,
  /** 1:1, cadré sur le visage. 192 px couvre la pastille de 40 px jusqu'à trois fois. */
  avatar: '/max-morrys-avatar-192.webp',
  avatarSize: 192,
} as const;

/**
 * Est-ce que cette signature est celle de la maison ?
 *
 * Tolérante sur ce qui ne distingue pas deux personnes — la casse, les espaces autour, le
 * nom de famille écrit ou non, le trait d'union oublié — et stricte sur le reste. Un
 * « Marie Max-Morrys » qui n'existe pas encore ne passerait pas, et c'est l'intention.
 */
export function isHouseAuthor(name?: string | null): boolean {
  if (!name) return true; // Absence de signature = la maison, comme le repli affiché.
  const normalized = name.trim().toLowerCase().replace(/[\s-]+/g, '');
  return normalized === 'maxmorrys' || normalized === 'maxmorryseyoum';
}
