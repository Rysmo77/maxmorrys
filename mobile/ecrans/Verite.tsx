import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Body, Eyebrow, Surface } from '../ds';

/**
 * L'ENCART DE VÉRITÉ des maquettes v3 (`mm-r-truth`) : un surtitre en capitales mono, puis ce
 * que l'écran ne fait pas, ou pourquoi il est vide. Il figure sur presque tous les écrans du
 * canevas Rysmo ; le recopier à la main vingt fois aurait fait dériver ses marges.
 */
export function Verite({ titre, children, style }: { titre: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <Surface level="truth" style={[{ marginTop: 16, padding: 15 }, style]}>
      <Eyebrow>{titre}</Eyebrow>
      <Body muted style={{ marginTop: 6, fontSize: 13.5, lineHeight: 20 }}>{children}</Body>
    </Surface>
  );
}
