import { View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { Eyebrow } from './Type';
import { Texte } from './Texte';

/**
 * ══ L'ESPACEMENT, PAR INTENTION ══ — `Pile`, `Rangee`, `Section`.
 *
 * L'audit a compté 743 `marginTop` / `padding` libres, sur onze valeurs (6, 7, 9, 10, 11, 13,
 * 14, 15, 17, 19, 22) que rien ne reliait. Une marge dit « combien » ; un écart nommé dit
 * « pourquoi » — et c'est le pourquoi qui reste cohérent d'un écran à l'autre.
 *
 *   inline   8    deux éléments d'une même ligne
 *   group    12   les éléments d'un même bloc
 *   block    16   deux blocs voisins
 *   section  24   deux sections
 */
export const ECART = { inline: 8, group: 12, block: 16, section: 24 } as const;
export type Ecart = keyof typeof ECART;

export function Pile({ gap = 'block', style, children }: { gap?: Ecart; style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  return <View style={[{ gap: ECART[gap] }, style]}>{children}</View>;
}

export function Rangee({
  gap = 'inline', align = 'center', wrap, style, children,
}: { gap?: Ecart; align?: ViewStyle['alignItems']; wrap?: boolean; style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: align, gap: ECART[gap], flexWrap: wrap ? 'wrap' : 'nowrap' }, style]}>
      {children}
    </View>
  );
}

/** Une section : son sourcil, son titre éventuel, puis son contenu à l'écart d'un groupe. */
export function Section({
  eyebrow, titre, style, children,
}: { eyebrow?: string; titre?: string; style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  return (
    <View style={[{ marginTop: ECART.section, gap: ECART.group }, style]}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      {titre ? <Texte variant="title" header>{titre}</Texte> : null}
      {children}
    </View>
  );
}
