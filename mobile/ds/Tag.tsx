import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { useToken, px, veil } from './theme';

/**
 * L'ÉTIQUETTE D'ÉTAT — et son inversion en mode sombre, qui est le sujet.
 *
 * Les trois teintes sémantiques du système ne se transposent PAS d'un fond à l'autre : sur
 * `#0B0E13`, `--ok` #0F7B52 tombe à 3,4:1, `--warn` #8A4B00 à 4,1:1 et `--stop` #B4231F à
 * 2,6:1. Le système fournit donc des jetons NUIT distincts — et c'est exactement la famille
 * qu'on oublie, parce qu'elle ne fait pas partie de la marque.
 *
 * Ici, `useToken()` résout déjà `ok`, `warn` et `stop` dans le bon mode : il n'y a rien à
 * calculer, à condition de ne jamais écrire une valeur en dur.
 *
 * LE FOND EST DÉRIVÉ DE L'ENCRE, à 13–18 % — pas un second jeton. C'est ce qui garantit que
 * la pastille suit son encre quand le mode bascule, au lieu de dériver en silence.
 */
export type TagTone = 'ok' | 'warn' | 'stop' | 'neutral';

const VEIL: Record<TagTone, number> = { ok: 0.13, warn: 0.18, stop: 0.13, neutral: 1 };

export function Tag({
  tone = 'neutral', children, style,
}: { tone?: TagTone; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useToken();
  const ink = tone === 'neutral' ? t('textMuted') : t(tone);
  const bg = tone === 'neutral' ? t('fillTag') : veil(ink, VEIL[tone]);

  return (
    <View
      style={[{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        height: 27,
        paddingHorizontal: 11,
        borderRadius: px(t('rPill')),
        backgroundColor: bg,
      }, style]}
    >
      <Text style={{ fontFamily: 'SchibstedGrotesk', fontWeight: '600', fontSize: 11, color: ink }}>
        {children}
      </Text>
    </View>
  );
}
