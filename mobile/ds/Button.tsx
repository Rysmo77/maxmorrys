import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { useToken, px } from './theme';

/**
 * Le bouton. Cinq tons, un par territoire, plus deux neutres.
 *
 * DEUX CHOSES QUE LE NATIF DOIT REPRENDRE TELLES QUELLES :
 *
 *   • L'APPUI À 120 ms, `scale(.975)`. C'est le retour principal du système — « j'ai senti
 *     ton doigt » — et il y en a TOUJOURS un. `Pressable` le donne sans animation à écrire.
 *   • L'ENCRE DU TON ORANGE EST FIXE. Elle ne suit pas le mode : `--ink-fixed`, jamais
 *     `--ink`, qui deviendrait blanc en nuit et donnerait du blanc sur orange clair.
 *
 * LE DÉGRADÉ N'EST PAS PORTÉ ICI. Les quatre dégradés d'action sont des valeurs CSS
 * (`linear-gradient(...)`) que React Native ne comprend pas ; les rendre demanderait
 * `react-native-linear-gradient` et un parseur. En attendant, le ton pose son premier arrêt
 * en aplat — la teinte du territoire, donc la bonne couleur, sans le fondu.
 */
type Tone = 'primary' | 'forme' | 'informe' | 'transforme' | 'digitalise' | 'ghost' | 'quiet';

export function Button({
  tone = 'primary', label, onPress, disabled, icon, style,
}: {
  tone?: Tone; label: string; onPress?: () => void; disabled?: boolean;
  icon?: ReactNode; style?: StyleProp<ViewStyle>;
}) {
  const t = useToken();

  const fill: Record<Tone, { bg: string; fg: string }> = {
    primary: { bg: t('actionPrimary'), fg: t('textOnPrimary') },
    /*
      `paperFixed`, et surtout PAS `textOnPrimary`. Les deux valent #FFFFFF en clair, ce qui
      les rend interchangeables à l'œil — mais `textOnPrimary` bascule à #0B0E13 en nuit,
      parce que le ton `primary` inverse son fond. Ces trois tons-ci ne l'inversent pas : leur
      fond reste la teinte saturée du territoire dans les deux modes, et leur encre doit donc
      rester blanche. `paperFixed` est le blanc invariant du système, pendant exact de
      l'`inkFixed` que le ton orange emploie juste au-dessus.
    */
    forme: { bg: t('mmBleu'), fg: t('paperFixed') },
    informe: { bg: t('mmOrange'), fg: t('inkFixed') },
    transforme: { bg: t('mmViolet'), fg: t('paperFixed') },
    digitalise: { bg: t('mmTeal'), fg: t('paperFixed') },
    ghost: { bg: t('btnGhostBg'), fg: t('ink') },
    quiet: { bg: t('surfaceQuiet'), fg: t('ink') },
  };
  const c = disabled ? { bg: t('btnOffBg'), fg: t('ink3') } : fill[tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      onPress={disabled ? undefined : onPress}
      // `scale(.975)` sur les boutons — la valeur du système, pas une approximation.
      style={({ pressed }: { pressed: boolean }) => [
        {
          minHeight: px(t('touchBtn')),
          paddingHorizontal: 22,
          borderRadius: 999,
          backgroundColor: c.bg,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          transform: [{ scale: pressed && !disabled ? 0.975 : 1 }],
        },
        style,
      ]}
    >
      {icon ? <View style={{ marginRight: 8 }}>{icon}</View> : null}
      <Text style={{ fontFamily: 'SchibstedGrotesk', fontWeight: '700', fontSize: 15, color: c.fg }}>
        {label}
      </Text>
    </Pressable>
  );
}
