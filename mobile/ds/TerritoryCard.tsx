import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { useToken, px } from './theme';

/**
 * LA CARTE DE TERRITOIRE — et les DEUX AXES qu'il ne faut pas confondre.
 *
 * Le système les porte séparément, et le kit explique pourquoi :
 *
 *   • LE CHEVAUCHEMENT (−14 px) n'existe QU'EN PILE. C'est lui qui fait mordre chaque carte
 *     sur la précédente et dessine le M en défilant.
 *   • LE CHEVRON, l'encoche du haut, SURVIT au-delà de la pile : « une encoche prise dans une
 *     carte large et isolée ne rappelle plus rien, mais quatre chevrons côte à côte redonnent
 *     exactement la silhouette du logo ».
 *
 * ⚠️ LE CHEVRON N'EST PAS RENDU ICI. Il demande un `clip-path`, qui n'existe pas en React
 * Native ; le dessiner exigerait un `Svg` avec un tracé en polygone par carte. La carte porte
 * donc, à sa place, LA POIGNÉE — la barre de 34 × 4 que le kit pose au sommet du chevron — qui
 * suffit à dire « ça s'empile » sans mentir sur la découpe. C'est un manque déclaré, pas un
 * oubli : le jour où le chevron sera dessiné, il se pose ici et nulle part ailleurs.
 */
export type Territory = 'forme' | 'informe' | 'transforme' | 'digitalise';
export type CardLayout = 'stack' | 'grid' | 'plain';

export function TerritoryCard({
  territory = 'forme', layout = 'stack', first, meta, title, titleSize, big, bigLabel,
  onPress, children, style,
}: {
  territory?: Territory;
  layout?: CardLayout;
  /** Première de la pile : elle ne mord sur rien. */
  first?: boolean;
  meta?: string;
  title?: ReactNode;
  titleSize?: number;
  /** Le grand nombre de droite. Il passe par `<Num>` chez l'appelant — jamais une chaîne. */
  big?: ReactNode;
  bigLabel?: string;
  onPress?: () => void;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useToken();
  const ink = {
    forme: t('mmBleu'), informe: t('mmOrange'),
    transforme: t('mmViolet'), digitalise: t('mmTeal'),
  }[territory];

  const stacked = layout === 'stack';
  const showGrip = layout !== 'plain';

  const body = (
    <View
      style={[{
        position: 'relative',
        borderRadius: px(t('rL')),
        paddingTop: showGrip ? 24 : 20,
        paddingHorizontal: 20,
        paddingBottom: stacked ? 36 : 28,
        marginTop: stacked && !first ? px(t('stackOverlap')) : 0,
        backgroundColor: t('surfaceCardFlat'),
        borderWidth: 1,
        borderColor: t('borderGlass'),
        // La teinte du territoire est portée par un LISERÉ, pas par un dégradé : les quatre
        // dégradés du kit sont des valeurs CSS que React Native ne comprend pas, et un aplat
        // saturé sur toute la carte rendrait son texte illisible dans un des deux modes.
        borderLeftWidth: 3,
        borderLeftColor: ink,
      }, style]}
    >
      {showGrip && (
        <View style={{
          position: 'absolute', top: 8, left: '50%', marginLeft: -17,
          width: 34, height: 4, borderRadius: 3, backgroundColor: t('cardGrip'),
        }} />
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ flex: 1 }}>
          {meta ? (
            <Text style={{ fontFamily: 'JetBrainsMono', fontSize: 11, color: t('textMuted') }}>{meta}</Text>
          ) : null}
          {title !== undefined && (
            typeof title === 'string' ? (
              <Text style={{
                fontFamily: 'Fraunces', fontWeight: '900', marginTop: 4,
                fontSize: titleSize ?? 23, letterSpacing: -0.8, color: t('textBody'),
              }}>
                {title}
              </Text>
            ) : <View style={{ marginTop: 4 }}>{title}</View>
          )}
        </View>
        {big !== undefined && (
          <View style={{ alignItems: 'flex-end' }}>
            {big}
            {bigLabel ? (
              <Text style={{
                fontFamily: 'SchibstedGrotesk', fontSize: 10, fontWeight: '600',
                letterSpacing: 1, textTransform: 'uppercase', color: t('textMuted'), marginTop: 3,
              }}>
                {bigLabel}
              </Text>
            ) : null}
          </View>
        )}
      </View>
      {children}
    </View>
  );

  if (!onPress) return body;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => ({
        transform: [{ scale: pressed ? Number.parseFloat(t('pressScale')) || 0.975 : 1 }],
      })}
    >
      {body}
    </Pressable>
  );
}
