/**
 * LE REPLI « APPAREIL MODESTE » — règle 5 du design system.
 *
 * Ce n'est PAS un cas limite. `deviceMemory <= 2` EST le profil du marché visé : 24 % de
 * possession de smartphone, et un panier de données de 2 Go qui coûte en médiane 4,2 % du
 * revenu national brut par habitant en Afrique. C'est l'appareil courant, pas l'exception.
 *
 * `.lowfi` coupe `backdrop-filter` partout et FIGE la dérive du maillage. C'est une mesure de
 * PERFORMANCE, pas de lisibilité : elle ne touche pas aux voiles, qui sont des décisions de
 * conception et doivent survivre au repli.
 *
 * LE POINT QUI A ÉTÉ MANQUÉ UNE FOIS : le repli doit LIRE LE THÈME. Une règle qui force un
 * fond blanc à 90 % sans regarder le mode affiche, sur un téléphone d'entrée de gamme réglé
 * en sombre, TOUTES ses surfaces de verre en blanc. Les pendants `.lowfi .dk` vivent dans
 * `css/brand/fallback.css` — et toute nouvelle surface de verre doit avoir le sien.
 *
 * À appeler AU PLUS TÔT, avant le premier rendu : après, la première image est déjà composée
 * avec les flous, ce qui est précisément le coût qu'on cherche à éviter.
 */
interface NavigatorWithHints extends Navigator {
  deviceMemory?: number;
}

export function applyLowFiIfModestDevice(): boolean {
  if (typeof navigator === 'undefined' || typeof document === 'undefined') return false;

  const m = (navigator as NavigatorWithHints).deviceMemory;
  const c = navigator.hardwareConcurrency;

  // `deviceMemory` n'existe pas sur Safari ni Firefox : l'absence n'est pas une valeur
  // basse, et on ne dégrade pas un appareil sur une information qu'on n'a pas.
  const modest = (m !== undefined && m <= 2) || (c !== undefined && c <= 4);
  if (modest) document.documentElement.classList.add('lowfi');
  return modest;
}
