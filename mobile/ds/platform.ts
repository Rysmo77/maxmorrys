import { Platform } from 'react-native';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CE QUI DOIT DIFFÉRER ENTRE iOS ET ANDROID — et rien d'autre.
 *
 * L'application rendait exactement la même interface sur les deux systèmes :
 * `Platform.OS` et `Platform.select` étaient utilisés **zéro fois**. Barre d'onglets
 * translucide et floutée sur les deux, transition latérale sur les deux, aucun retour
 * tactile nulle part. Le châssis est soigné — zone sûre, thème système, attributs
 * d'accessibilité — mais il est iOS des deux côtés.
 *
 * ── CE QUI RESTE IDENTIQUE, ET POURQUOI ───────────────────────────────────────
 * Les jetons, les teintes, la typographie, le nom des choses, l'ordre des écrans.
 * C'est la marque, et elle ne change pas de système d'exploitation. Ce module ne
 * touche QUE ce que chaque plateforme s'attend à voir se comporter comme chez elle.
 *
 * ── CE QUI DIFFÈRE, ET POURQUOI ───────────────────────────────────────────────
 *
 * · **LE MOUVEMENT DE NAVIGATION.** iOS pousse latéralement — c'est l'idiome de
 *   `UINavigationController`, et le geste de retour au bord de l'écran en dépend :
 *   la page doit venir de la droite pour qu'on comprenne qu'on la renvoie à droite.
 *   Material n'a pas ce geste ; il décrit un fondu enchaîné sur l'axe Z. D'où
 *   `slide_from_right` d'un côté et `fade_from_bottom` de l'autre.
 *
 * · **LE GESTE DE RETOUR.** Attendu sur iOS, où il n'existe aucun bouton système.
 *   Sur Android, le système en fournit un — et un geste de bord concurrent entre en
 *   conflit avec le retour prédictif.
 *
 * · **LA BARRE D'ONGLETS.** Le flou translucide est une convention iOS : le contenu
 *   glisse dessous et transparaît. Une barre de navigation Material 3 est OPAQUE et
 *   se détache par son élévation. Garder le flou sur Android, ce n'est pas seulement
 *   étranger : c'est une couche de composition payée pour rien sur un appareil à 2 Go.
 *
 * · **L'ONDULATION.** Android répond au toucher par une onde partant du doigt ; iOS
 *   par un changement d'opacité. Les deux disent « j'ai senti », dans deux langues.
 *
 * ⚠️ LE RETOUR HAPTIQUE MANQUE ENCORE, et il n'est pas ici : il demande `expo-haptics`,
 * donc une dépendance de plus dans `package.json` — un fichier en cours de modification
 * pour le passage aux builds natifs. À ajouter quand ce chantier sera posé.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

/** Transition d'entrée d'un écran de détail. Voir le bloc ci-dessus. */
export const screenAnimation = Platform.select({
  ios: 'slide_from_right',
  default: 'fade_from_bottom',
}) as 'slide_from_right' | 'fade_from_bottom';

/**
 * Durée de la transition. Material recommande plus court pour un fondu que pour une
 * translation — un fondu long se lit comme une latence, pas comme un mouvement.
 */
export const screenAnimationDuration = Platform.select({ ios: 260, default: 200 })!;

/** Le geste de retour au bord : attendu sur iOS, concurrent du retour système ailleurs. */
export const edgeSwipeBack = isIOS;

/** La barre d'onglets est-elle translucide et floutée ? Convention iOS uniquement. */
export const translucentTabBar = isIOS;

/**
 * L'ondulation Android, à passer en `android_ripple` d'un `Pressable`.
 * Sans effet sur iOS, où le retour au toucher passe par l'opacité.
 *
 * `borderless: false` par défaut : une onde qui déborde de sa ligne dans une liste
 * dense donne l'impression d'avoir touché la ligne voisine.
 */
export function ripple(color: string, borderless = false) {
  return isAndroid ? { color, borderless, foreground: true } : undefined;
}

/**
 * L'élévation d'une barre de navigation Material. `elevation` est ignoré par iOS,
 * qui ne connaît que `shadow*` — les deux cohabitent donc sans condition.
 */
export const navBarElevation = Platform.select({ android: 3, default: 0 })!;
