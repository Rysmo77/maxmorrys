import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { POLICE } from './police';
import { Pressoir } from './Pressoir';
import { Gradient } from './Gradient';
import { ProgressBar } from './ProgressBar';
import { useTeinteDe, type Espace } from './espace';
import { useToken, veil } from './theme';

/**
 * LA CARTE DE REPRISE DU KIT v4.5 — `mm-r-resume`. Le premier objet de l'accueil et
 * d'Apprendre : dégradé de l'espace, 24 px, surtitre en capitales, titre d'affichage, barre
 * blanche, et la pastille d'encre « Reprendre ».
 *
 * Le chiffre de progression arrive TOUT FAIT (`meta`, en général un `<Num>` sourcé) : cette
 * carte ne compte rien elle-même.
 */
export function Reprise({
  espace = 'edu', surtitre, titre, progression, meta, action = 'Reprendre', onPress, style,
}: {
  espace?: Espace;
  surtitre?: string;
  titre: string;
  /** 0 à 100, ou `null` quand le serveur ne l'a pas dite — la barre ne s'affiche pas. */
  progression: number | null;
  meta?: ReactNode;
  action?: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useToken();
  const teinte = useTeinteDe(espace);
  const couleurs = teinte.degrade.length > 1 ? teinte.degrade : [t('surfaceInk'), t('surfaceInk')];
  return (
    <Pressoir
      accessibilityRole="button"
      accessibilityLabel={[surtitre, titre, action].filter(Boolean).join(', ')}
      onPress={onPress}
      style={[{
        borderRadius: 24,
        shadowColor: teinte.rv, shadowOpacity: 0.28, shadowRadius: 20, shadowOffset: { width: 0, height: 18 },
      }, style]}
    >
      <Gradient colors={couleurs} radius={24} style={{ padding: 18, gap: 12 }}>
        {surtitre ? (
          <Text style={{
            fontFamily: POLICE.mono, fontSize: 11, letterSpacing: 0.9, textTransform: 'uppercase',
            color: veil(t('paperFixed'), 0.8),
          }}>
            {surtitre}
          </Text>
        ) : null}
        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={1.3}
          style={{ fontFamily: 'Fraunces', fontWeight: '900', fontSize: 23, lineHeight: 25.5, color: t('paperFixed') }}
        >
          {titre}
        </Text>
        {progression === null ? null : <ProgressBar value={progression} surFond />}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1, minWidth: 0 }}>{meta}</View>
          <View style={{
            height: 38, paddingHorizontal: 16, borderRadius: 999, justifyContent: 'center',
            backgroundColor: t('inkFixed'),
          }}>
            <Text style={{ fontFamily: POLICE.corps, fontWeight: '600', fontSize: 14, color: t('paperFixed') }}>{action}</Text>
          </View>
        </View>
      </Gradient>
    </Pressoir>
  );
}
