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
/**
 * `art` est le ton des étiquettes POSÉES SUR UN APLAT DE MARQUE — le « Aperçu · 4 min
 * gratuit » sur la vignette d'une formation. Sa surface ne suit pas le mode : un aplat de
 * territoire est saturé dans les deux, donc son étiquette doit rester papier blanc sur encre
 * fixe. Sans ce ton, `neutral` y écrivait du gris clair sur du blanc en mode sombre — 2,2:1,
 * sur le seul texte de la vignette.
 */
export type TagTone = 'ok' | 'warn' | 'stop' | 'neutral' | 'art';

const VEIL: Record<TagTone, number> = { ok: 0.13, warn: 0.18, stop: 0.13, neutral: 1, art: 1 };

export function Tag({
  tone = 'neutral', children, style,
}: { tone?: TagTone; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useToken();
  const ink = tone === 'art' ? t('inkFixed') : tone === 'neutral' ? t('textMuted') : t(tone);
  const bg = tone === 'art' ? t('paperFixed') : tone === 'neutral' ? t('fillTag') : veil(ink, VEIL[tone]);

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
