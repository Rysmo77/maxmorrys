import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Gradient, useActionGradient } from './Gradient';
import { translucentTabBar } from './platform';
import { useScheme, useToken, px } from './theme';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LE MINI-LECTEUR — la surface que le web N'AVAIT PAS, et la raison du virage natif.
 *
 * Dans un navigateur, un podcast **s'arrête quand on verrouille le téléphone**. En natif il
 * continue. Pour 34 minutes écoutées dans un taxi, ce n'est pas une amélioration : c'est la
 * différence entre utilisable et inutilisable. Deux surfaces en découlent — celle-ci, et
 * l'écran verrouillé.
 *
 * IL VIT AU-DESSUS DE LA BARRE D'ONGLETS, et son `bottom` porte la hauteur de la barre PLUS
 * la zone de geste. C'est le même piège que `safeBottom` sur la barre elle-même : `bottom: 0`
 * se résout au bas de la boîte de rembourrage, donc aucun rembourrage d'ancêtre ne le
 * remonterait.
 *
 * LE FLOU N'EST POSÉ QUE SUR iOS. Le mini-lecteur est du chrome FIXE, donc il y a droit
 * (règle 1) — mais la convention translucide est iOS ; une surface Material se détache par
 * son élévation, et un flou de plus sur un appareil à 2 Go se paie sans rien rapporter.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export function MiniPlayer({
  titre, position, duree, enLecture = true, onPress, onToggle, tabbar = true,
}: {
  titre: string;
  /** « 08:12 » — écrit, pas calculé : c'est la position réelle du lecteur. */
  position: string;
  duree: string;
  enLecture?: boolean;
  onPress?: () => void;
  onToggle?: () => void;
  tabbar?: boolean;
}) {
  const t = useToken();
  const scheme = useScheme();
  const insets = useSafeAreaInsets();
  const g = useActionGradient();

  const bas = (tabbar ? px(t('tabbarH')) : 0) + insets.bottom;

  const contenu = (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 11,
      paddingVertical: 9, paddingHorizontal: 14,
    }}>
      <Gradient colors={g.media} angle={140} radius={10} style={{ width: 38, height: 38 }} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{
          fontFamily: 'SchibstedGrotesk', fontSize: 13, fontWeight: '600', color: t('textBody'),
        }}>
          {titre}
        </Text>
        <Text style={{ fontFamily: 'JetBrainsMono', fontSize: 10.5, color: t('textMuted') }}>
          {position} / {duree}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={enLecture ? 'Mettre en pause' : 'Reprendre la lecture'}
        onPress={onToggle}
        hitSlop={6}
        style={({ pressed }: { pressed: boolean }) => ({
          width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
          backgroundColor: t('actionPrimary'),
          transform: [{ scale: pressed ? Number.parseFloat(t('pressScaleSm')) || 0.94 : 1 }],
        })}
      >
        {enLecture ? (
          <View style={{ flexDirection: 'row', gap: 3 }}>
            <View style={{ width: 3, height: 13, borderRadius: 1, backgroundColor: t('textOnPrimary') }} />
            <View style={{ width: 3, height: 13, borderRadius: 1, backgroundColor: t('textOnPrimary') }} />
          </View>
        ) : (
          <View style={{
            width: 0, height: 0, marginLeft: 3,
            borderTopWidth: 7, borderBottomWidth: 7, borderLeftWidth: 11,
            borderTopColor: 'transparent', borderBottomColor: 'transparent',
            borderLeftColor: t('textOnPrimary'),
          }} />
        )}
      </Pressable>
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Lecture en cours : ${titre}. Ouvrir le lecteur.`}
      onPress={onPress}
      style={{
        position: 'absolute', left: 0, right: 0, bottom: bas,
        borderTopWidth: 1, borderTopColor: t('tabbarBrd'),
        backgroundColor: translucentTabBar ? t('tabbarBg') : t('surfacePage'),
        overflow: 'hidden',
      }}
    >
      {translucentTabBar ? (
        <BlurView intensity={24} tint={scheme === 'dark' ? 'dark' : 'light'}>{contenu}</BlurView>
      ) : contenu}
    </Pressable>
  );
}
