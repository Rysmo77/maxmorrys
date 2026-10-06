import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { POLICE } from './police';
import type { ReactNode } from 'react';
import { Onde } from './Onde';
import { Revele } from './Pressoir';
import { useScheme, useToken } from './theme';

/**
 * LA BULLE DE CONVERSATION — et la raison pour laquelle elle n'a AUCUN flou.
 *
 * Le kit la cite nommément dans sa leçon de revue : « répétée ET dans un fil qui défile — elle
 * violait les deux volets de la règle 1 à elle seule ». Elle portait `blur(14px)` en ligne, ce
 * qui coûtait un recompositing par bulle et par image. Elle a perdu le flou, et son voile a
 * été relevé pour compenser.
 *
 * `typing` rend l'ONDE DE RÉFLEXION (`ds/Onde.tsx`) et le nom de qui écrit. Les trois points
 * statiques qui la précédaient disaient « en attente » sans dire « ça travaille ».
 *
 * ── CE QUE LIT UN LECTEUR D'ÉCRAN ─────────────────────────────────────────────────────
 * Une bulle sans locuteur se lit comme une phrase sans auteur : on ne sait plus qui a dit
 * quoi. `auteur` est annoncé en tête. L'appui long ouvre « Copier » (`onAppuiLong`).
 *
 * ⚠️ EN SOMBRE, la bulle « moi » prend l'encre SOMBRE fixe : du blanc sur le violet nuit
 * (#B98CFF) tombait à 2,5:1.
 */
export function ChatBubble({
  from = 'ai', typing, auteur, onAppuiLong, children, style,
}: {
  from?: 'me' | 'ai';
  typing?: boolean;
  /** Qui parle — « Toi », ou le nom du répétiteur. Annoncé en tête de la bulle. */
  auteur?: string;
  onAppuiLong?: () => void;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useToken();
  const scheme = useScheme();
  const me = from === 'me';

  const base: ViewStyle = {
    maxWidth: '82%',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 20,
  };

  if (typing) {
    return (
      <Revele>
        <View
          accessible
          accessibilityLabel={`${auteur ?? 'Le répétiteur'} écrit une réponse`}
          accessibilityLiveRegion="polite"
          style={[base, {
            alignSelf: 'flex-start', borderBottomLeftRadius: 7,
            backgroundColor: t('bubbleBg'), borderWidth: 1, borderColor: t('bubbleBrd'),
            flexDirection: 'row', alignItems: 'center', gap: 10,
          }, style]}
        >
          <Onde actif taille={16} />
          <Text style={{ fontFamily: POLICE.corps, fontSize: 13.5, color: t('textMuted') }}>
            {auteur ?? 'Le répétiteur'} réfléchit…
          </Text>
        </View>
      </Revele>
    );
  }

  const encreMoi = scheme === 'dark' ? t('inkFixed') : t('paperFixed');

  return (
    <Pressable
      accessible
      accessibilityLabel={auteur && typeof children === 'string' ? `${auteur} : ${children}` : undefined}
      accessibilityHint={onAppuiLong ? 'Appui long pour copier' : undefined}
      onLongPress={onAppuiLong}
      delayLongPress={350}
      style={[base, me
        ? { alignSelf: 'flex-end', backgroundColor: t('mmViolet'), borderBottomRightRadius: 7 }
        : { alignSelf: 'flex-start', backgroundColor: t('bubbleBg'), borderWidth: 1, borderColor: t('bubbleBrd'), borderBottomLeftRadius: 7 },
        style]}
    >
      {typeof children === 'string' ? (
        <Text style={{
          fontFamily: POLICE.corps, fontSize: 14, lineHeight: 20,
          color: me ? encreMoi : t('textBody'),
        }}>
          {children}
        </Text>
      ) : children}
    </Pressable>
  );
}
