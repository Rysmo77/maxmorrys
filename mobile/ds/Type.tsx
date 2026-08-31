import { Text, type StyleProp, type TextStyle } from 'react-native';
import type { ReactNode } from 'react';
import { useToken, px } from './theme';

/**
 * LA TYPOGRAPHIE. Trois familles, trois rôles — et le troisième n'est pas un style.
 *
 *   Fraunces 900          affichage. JAMAIS sous 22 px.
 *   Schibsted Grotesk     corps.
 *   JetBrains Mono        les nombres VÉRIFIABLES, et rien d'autre (voir Num.tsx).
 *
 * ⚠️ Les trois familles doivent être chargées par `expo-font` avant le premier rendu. Tant
 * qu'elles ne le sont pas, `fontFamily` retombe sur la police système : c'est laid, mais
 * lisible, et ça ne casse aucune mise en page. Ne pas bloquer le démarrage pour ça — sur le
 * réseau visé, un écran blanc en attendant une police est pire que la police système.
 */
type Props = { children: ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number };
/* Un titre d'affichage se donne SOIT en enfants, SOIT en lignes écrites — jamais les deux.
   L'union le rend impossible à confondre, plutôt que de rendre `children` optionnel partout. */
type DisplayProps =
  | { children: ReactNode; lines?: never; size?: DisplaySize; style?: StyleProp<TextStyle> }
  | { children?: never; lines: string[]; size?: DisplaySize; style?: StyleProp<TextStyle> };
type DisplaySize = 'xxl' | 'xl' | 'md' | 'sm' | 'xs';

/** Titre d'affichage. `lines` rend chaque ligne séparément — voir la note plus bas. */
export function Display({ children, size = 'md', lines, style }: DisplayProps) {
  const t = useToken();
  const key = { xxl: 'fsDspXxl', xl: 'fsDspXl', md: 'fsDsp', sm: 'fsDspSm', xs: 'fsDspXs' } as const;
  const base: TextStyle = {
    fontFamily: 'Fraunces',
    fontWeight: '900',
    color: t('textBody'),
    fontSize: px(t(key[size])),
    letterSpacing: -1.2,
    lineHeight: px(t(key[size])) * 0.94,
  };

  /*
   * LES TITRES D'AFFICHAGE SONT ÉCRITS PAR LANGUE, PAS TRADUITS, et rendus LIGNE PAR LIGNE.
   *
   * Le français court environ 18 % plus long : un titre calé sur trois lignes en français en
   * fait deux en anglais, et le bloc perd sa masse. On ne laisse donc jamais un titre
   * d'affichage se replier tout seul — chaque ligne est une chaîne, décidée à l'écriture.
   *
   *   FR : JE TE FORME (11) / AU DIGITAL. (11) / DEPUIS DAKAR. (13)
   *   EN : I'LL TRAIN YOU (14) / TO GO DIGITAL. (14) / FROM DAKAR. (11)
   */
  if (lines) {
    return (
      <>
        {lines.map((l, i) => (
          <Text key={i} numberOfLines={1} style={[base, style]}>{l}</Text>
        ))}
      </>
    );
  }
  return <Text style={[base, style]}>{children}</Text>;
}

export function Body({ children, muted, style, numberOfLines }: Props & { muted?: boolean }) {
  const t = useToken();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{
        fontFamily: 'SchibstedGrotesk',
        // `textMuted`, jamais `textFaint` : l'encre tertiaire ne porte pas de texte (AD-18).
        color: muted ? t('textMuted') : t('textBody'),
        fontSize: px(t('fsBody')),
        lineHeight: px(t('fsBody')) * 1.45,
      }, style]}
    >
      {children}
    </Text>
  );
}

/** Sourcil monospace en capitales. C'est un LIBELLÉ — un nombre dedans passe par <Num>. */
export function Eyebrow({ children, style }: Props) {
  const t = useToken();
  return (
    <Text style={[{
      fontFamily: 'JetBrainsMono',
      color: t('textEyebrow'),
      fontSize: px(t('fsEyebrow')),
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    }, style]}>
      {children}
    </Text>
  );
}
