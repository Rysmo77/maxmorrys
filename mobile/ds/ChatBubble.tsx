import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { useToken } from './theme';

/**
 * LA BULLE DE CONVERSATION — et la raison pour laquelle elle n'a AUCUN flou.
 *
 * Le kit la cite nommément dans sa leçon de revue : « répétée ET dans un fil qui défile — elle
 * violait les deux volets de la règle 1 à elle seule ». Elle portait `blur(14px)` en ligne, ce
 * qui coûtait un recompositing par bulle et par image. Elle a perdu le flou, et son voile a
 * été relevé pour compenser.
 *
 * `typing` rend les trois points. Ils ne CLIGNOTENT pas ici : `prefers-reduced-motion` est
 * câblé une fois pour toutes au web, et le natif n'a pas d'équivalent global — animer trois
 * points sur un appareil à 2 Go, pour dire « ça arrive », coûte plus que le repos ne coûte de
 * clarté. Les trois points statiques disent la même chose.
 */
export function ChatBubble({
  from = 'ai', typing, children, style,
}: { from?: 'me' | 'ai'; typing?: boolean; children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useToken();
  const me = from === 'me';

  const base: ViewStyle = {
    maxWidth: '82%',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 20,
  };

  if (typing) {
    return (
      <View
        accessibilityLabel="Réponse en cours d'écriture"
        style={[base, {
          width: 64, borderBottomLeftRadius: 7,
          backgroundColor: t('bubbleBg'), borderWidth: 1, borderColor: t('bubbleBrd'),
          flexDirection: 'row', alignItems: 'center', gap: 4,
        }, style]}
      >
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t('mmViolet'), opacity: 0.35 }} />
        ))}
      </View>
    );
  }

  return (
    <View
      style={[base, me
        ? { alignSelf: 'flex-end', backgroundColor: t('mmViolet'), borderBottomRightRadius: 7 }
        : { alignSelf: 'flex-start', backgroundColor: t('bubbleBg'), borderWidth: 1, borderColor: t('bubbleBrd'), borderBottomLeftRadius: 7 },
        style]}
    >
      {typeof children === 'string' ? (
        <Text style={{
          fontFamily: 'SchibstedGrotesk', fontSize: 14, lineHeight: 20,
          color: me ? t('paperFixed') : t('textBody'),
        }}>
          {children}
        </Text>
      ) : children}
    </View>
  );
}
