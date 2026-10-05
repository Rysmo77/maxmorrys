import { useId, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import type { ReactNode } from 'react';
import { useToken } from './theme';
import type { TokenName } from './tokens.generated';
import { analyserDegrade, ligneDeDegrade, type Degrade } from './degrade';

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
 * SVG veut deux points, ici en pixels de la boîte mesurée. La conversion est faite ici, pour que
 * les écrans continuent d'écrire l'angle du système et pas un vecteur.
 */
export type GradientStop = string;

export function Gradient({
  colors, offsets, angle = 135, radius = 0, style, children,
}: {
  /** Deux arrêts ou plus, déjà résolus par `useToken()` ou `useDegrade()` chez l'appelant. */
  colors: readonly GradientStop[];
  /** Positions en fraction, une par couleur. Réparties également si absentes. */
  offsets?: readonly number[];
  /** L'angle du système, en degrés CSS. @default 135 */
  angle?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  /* La ligne dépend de la TAILLE, inconnue avant la mise en page : on la mesure. Avant la
     première mesure, rien n'est peint — une image d'aplat vaut mieux qu'un angle faux. */
  const [taille, setTaille] = useState<{ w: number; h: number } | null>(null);
  /* Un identifiant STABLE par instance. Un compteur de module en changerait à chaque rendu —
     le `<Defs>` serait remplacé pour rien ; deux instances partageant le leur se peindraient
     pareil. `useId` donne les deux garanties, et il faut nettoyer ses deux-points : ils sont
     valides en React, pas dans une référence `url(#…)`. */
  const id = `mmg${useId().replace(/:/g, '')}`;
  const v = taille ? ligneDeDegrade(angle, taille.w, taille.h) : null;

  return (
    <View
      style={[{ borderRadius: radius, overflow: 'hidden', backgroundColor: colors[0] }, style]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (!taille || taille.w !== width || taille.h !== height) setTaille({ w: width, h: height });
      }}
    >
      {v ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}>
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id={id} gradientUnits="userSpaceOnUse" x1={v.x1} y1={v.y1} x2={v.x2} y2={v.y2}>
                {colors.map((c, i) => (
                  <Stop
                    key={i}
                    offset={offsets?.[i] ?? i / Math.max(1, colors.length - 1)}
                    stopColor={c}
                  />
                ))}
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
          </Svg>
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** Un dégradé du système, dans le mode COURANT : `<Gradient {...useDegrade('arc')} />`. */
export function useDegrade(name: TokenName): Degrade {
  const t = useToken();
  return analyserDegrade(t(name));
}

/**
 * Les quatre dégradés d'action du système, résolus dans le mode courant.
 *
 * Les quatre `action*` sont LUS dans leur chaîne CSS, pas reconstruits par leurs teintes :
 * ils sont fixes dans les deux modes, et les teintes ne le sont pas (voir `analyserDegrade`).
 */
export function useActionGradient() {
  const t = useToken();
  const action = (n: TokenName) => analyserDegrade(t(n)).colors;
  return {
    forme: action('actionForme'),
    informe: action('actionInforme'),
    transforme: action('actionTransforme'),
    digitalise: action('actionDigitalise'),
    /* Les deux compositions suivantes ne sont pas des jetons du système : ce sont les aplats
       d'art du kit natif (vignette média, art de leçon), écrits en teintes. Elles suivent donc
       le mode comme leurs teintes — c'est leur définition, pas un contournement. */
    /** L'art des médias : la coulée des trois teintes, comme sur la vignette du kit. */
    media: [t('mmViolet'), t('mmBleu'), t('mmTeal')],
    /** L'art d'une leçon : bleu → violet → orange, l'ordre des verbes. */
    lecon: [t('mmBleu'), t('mmViolet'), t('mmOrange')],
  } as const;
}
