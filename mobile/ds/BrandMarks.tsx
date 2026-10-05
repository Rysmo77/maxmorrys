import Svg, { Path } from 'react-native-svg';
import { useToken } from './theme';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LES MARQUES TIERCES — LE SEUL ENDROIT DU PORT QUI ÉCRIT DES COULEURS HORS JETONS.
 *
 * Et c'est délibéré, pour la raison exactement inverse de celle qui interdit les couleurs en
 * dur partout ailleurs. La règle du port existe parce qu'une valeur figée NE BASCULE PAS en
 * mode sombre : sur 206 jetons, 78 changent, donc un hexadécimal écrit à la main est un défaut
 * de mode sombre garanti.
 *
 * **UNE MARQUE TIERCE, ELLE, NE DOIT PAS BASCULER.** Google impose ses quatre couleurs et
 * interdit de recolorer son logo ; Apple impose son propre asset et son noir. Les faire suivre
 * notre thème serait une infraction à leurs directives — et un motif de rejet en revue, sur
 * l'écran de connexion, c'est-à-dire au seul endroit où ces marques apparaissent.
 *
 * Ce fichier est donc DÉCLARÉ dans `tests/unit/mobile-ds.test.ts`, à côté du pont de jetons et
 * de `Surface`. Trois fichiers, trois raisons nommées.
 *
 * ── APPLE : LE DESSIN CI-DESSOUS EST UN EMPLACEMENT RÉSERVÉ ──────────────────────────────
 * ⚠️ La pomme d'Apple ne se redessine PAS : son usage impose l'asset officiel qu'Apple fournit
 * (Human Interface Guidelines, « Sign in with Apple »). Le glyphe ici tient la place, la taille
 * et l'alignement — il DOIT être remplacé par l'asset officiel avant toute soumission. C'est
 * l'un des trois points que le transfert liste comme « à trancher avant soumission ».
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * Le « G » officiel, tracé pour tracé depuis `assets/icons/google.svg` du transfert.
 *
 * Les quatre codes ci-dessous portent `ok-ds` et le garderont : ce sont les couleurs de
 * marque de Google, imposées par ses directives d'identité. Les remplacer par des jetons de
 * NOTRE palette ne rendrait pas le composant plus cohérent — il rendrait le « G » faux, et
 * son usage non conforme. AD-2 protège l'encre du produit, pas les marques de tiers.
 */
export function GoogleMark({ size = 19 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path fill="#4285F4" d="M22 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.6a4.8 4.8 0 01-2.1 3.1v2.6h3.4c2-1.8 3.1-4.5 3.1-7.6z" /> {/* ok-ds */}
      <Path fill="#34A853" d="M12 22c2.8 0 5.2-.9 6.9-2.5l-3.4-2.6c-.9.6-2.1 1-3.5 1a6.1 6.1 0 01-5.7-4.2H2.8v2.6A10 10 0 0012 22z" /> {/* ok-ds */}
      <Path fill="#FBBC05" d="M6.3 13.7a6 6 0 010-3.8V7.3H2.8a10 10 0 000 9l3.5-2.6z" /> {/* ok-ds */}
      <Path fill="#EA4335" d="M12 5.9c1.5 0 2.9.5 4 1.6l3-3A10 10 0 002.8 7.3l3.5 2.6A6.1 6.1 0 0112 5.9z" /> {/* ok-ds */}
    </Svg>
  );
}

/**
 * ⚠️ EMPLACEMENT RÉSERVÉ — à remplacer par l'asset officiel d'Apple avant soumission.
 * La couleur suit l'encre du bouton (fond noir, marque blanche), ce que la directive impose
 * aussi : la pomme est monochrome, blanche sur fond sombre.
 */
export function AppleMark({ size = 19 }: { size?: number }) {
  const t = useToken();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={t('paperFixed')}
        d="M17.05 12.94c-.02-2.2 1.8-3.26 1.88-3.31-1.02-1.5-2.61-1.7-3.18-1.72-1.35-.14-2.64.79-3.33.79-.69 0-1.75-.77-2.87-.75-1.48.02-2.84.86-3.6 2.18-1.53 2.66-.39 6.6 1.1 8.76.73 1.06 1.6 2.25 2.74 2.2 1.1-.04 1.52-.71 2.85-.71 1.33 0 1.7.71 2.87.69 1.18-.02 1.93-1.08 2.65-2.14.83-1.22 1.18-2.41 1.2-2.47-.03-.01-2.3-.88-2.31-3.52zM14.9 6.2c.61-.74 1.02-1.77.9-2.8-.88.04-1.94.59-2.57 1.32-.56.65-1.05 1.7-.92 2.7.98.08 1.98-.5 2.59-1.22z"
      />
    </Svg>
  );
}
