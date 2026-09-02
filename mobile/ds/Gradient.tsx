import { useId } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import type { ReactNode } from 'react';
import { useToken } from './theme';

/**
 * LE DÉGRADÉ, ENFIN PORTÉ — et par le seul moyen qui ne coûte rien par image.
 *
 * Le système en pose quatre (`--action-forme` et ses trois voisins) plus les aplats d'art des
 * médias et des héros. React Native ne comprend pas `linear-gradient(...)` : jusqu'ici le port
 * posait le PREMIER ARRÊT en aplat. C'était honnête, mais ça retirait au produit la seule
 * chose qui fait qu'un bouton de marque se reconnaît avant d'être lu.
 *
 * `react-native-svg` est déjà là — c'est lui qui rend le maillage. Un `LinearGradient` SVG est
 * un objet de rendu FIXE : il se compose une fois, pas à chaque image, contrairement à un flou.
 * Le coût est celui du maillage, déjà accepté (AD-10).
 *
 * L'ANGLE EST CELUI DU CSS, converti. `135deg` en CSS part du haut-gauche vers le bas-droite ;
 * SVG veut deux points en fraction de boîte. La conversion est faite ici, une fois, pour que
 * les écrans continuent d'écrire l'angle du système et pas un vecteur.
 */
export type GradientStop = string;

/** `135deg` CSS → { x1,y1,x2,y2 } en fractions, dans le repère de la boîte. */
function vecteur(deg: number) {
  // CSS mesure depuis le NORD, dans le sens horaire ; le repère SVG a son Y vers le bas.
  const rad = ((deg - 90) * Math.PI) / 180;
  const x = Math.cos(rad);
  const y = Math.sin(rad);
  // On normalise pour que la diagonale touche les deux coins, comme le fait le CSS.
  const n = Math.max(Math.abs(x), Math.abs(y)) || 1;
  const dx = x / n / 2;
  const dy = y / n / 2;
  return { x1: 0.5 - dx, y1: 0.5 - dy, x2: 0.5 + dx, y2: 0.5 + dy };
}

export function Gradient({
  colors, angle = 135, radius = 0, style, children,
}: {
  /** Deux arrêts ou plus, déjà résolus par `useToken()` chez l'appelant. */
  colors: readonly GradientStop[];
  /** L'angle du système, en degrés CSS. @default 135 */
  angle?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  const v = vecteur(angle);
  /* Un identifiant STABLE par instance. Un compteur de module en changerait à chaque rendu —
     le `<Defs>` serait remplacé pour rien ; deux instances partageant le leur se peindraient
     pareil. `useId` donne les deux garanties, et il faut nettoyer ses deux-points : ils sont
     valides en React, pas dans une référence `url(#…)`. */
  const id = `mmg${useId().replace(/:/g, '')}`;

  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden' }, style]}>
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}>
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id={id} x1={v.x1} y1={v.y1} x2={v.x2} y2={v.y2}>
              {colors.map((c, i) => (
                <Stop key={i} offset={`${(i / Math.max(1, colors.length - 1)) * 100}%`} stopColor={c} />
              ))}
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
        </Svg>
      </View>
      {children}
    </View>
  );
}

/**
 * Les quatre dégradés d'action du système, résolus dans le mode courant.
 *
 * `--action-forme` vaut `linear-gradient(135deg,#0057BC,#6C23DD)` : ses deux arrêts SONT les
 * teintes `mmBleu` et `mmViolet`. On les relit donc par leur jeton plutôt que d'analyser la
 * chaîne CSS — même valeur, et le mode sombre suit sans parseur.
 */
export function useActionGradient() {
  const t = useToken();
  return {
    forme: [t('mmBleu'), t('mmViolet')],
    informe: [t('mmOrange'), t('mmCorail')],
    transforme: [t('mmViolet'), t('mmBleu')],
    digitalise: [t('mmTeal'), t('mmBleu')],
    /** L'art des médias : la coulée des trois teintes, comme sur la vignette du kit. */
    media: [t('mmViolet'), t('mmBleu'), t('mmTeal')],
    /** L'art d'une leçon : bleu → violet → orange, l'ordre des verbes. */
    lecon: [t('mmBleu'), t('mmViolet'), t('mmOrange')],
  } as const;
}
