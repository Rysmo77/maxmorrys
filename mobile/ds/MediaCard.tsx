import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { useToken, px, veil } from './theme';
import { Gradient, useActionGradient } from './Gradient';
import { Icon } from './Icon';

/**
 * LA VIGNETTE D'UN MÉDIA — podcast ou vidéo, une seule carte.
 *
 * FAUX VERRE, AUCUN FLOU, et c'est la règle 1 appliquée à l'endroit où elle coûte le plus :
 * une carte de média vit toujours EN GRILLE. Un flou par carte, c'est un recompositing par
 * carte et par image, sur le profil d'appareil visé.
 *
 * `cost` N'EST PAS UNE DÉCORATION. Le poids en mégaoctets est la première chose que regarde
 * quelqu'un dont le forfait est compté — le kit le pose au même rang que la durée, en
 * monospace, et il compare toujours l'audio à sa transcription (« 31 Mo » contre « 0 Mo »).
 */
export function MediaCard({
  format = 'audio', eyebrow, title, body, cost = [], badge, artHeight = 150, titleSize = 17,
  actions, style,
}: {
  format?: 'audio' | 'video';
  eyebrow?: string;
  title: string;
  body?: string;
  /** Durée, poids, poids de la transcription. Monospace, dans cet ordre. */
  cost?: readonly string[];
  badge?: string;
  artHeight?: number;
  titleSize?: number;
  actions?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useToken();
  const g = useActionGradient();
  /*
   * L'ART EST UN APLAT DE MARQUE DANS LES DEUX MODES : ses encres ne suivent donc pas le
   * thème. `borderGlass` descend à 13 % de blanc en nuit — l'onde et le cadre y auraient
   * presque disparu, alors que le fond sous eux n'a pas changé d'un ton. On dérive du blanc
   * INVARIANT, comme le ton orange du bouton avec son encre fixe.
   */
  const surArt = veil(t('paperFixed'), 0.72);
  const surArtFaible = veil(t('paperFixed'), 0.28);
  /* L'onde du kit : seize barres, hauteurs relevées telles quelles. Elle dit « ça s'écoute »
     sans image à charger — le même raisonnement que le maillage. */
  const onde = [16, 30, 44, 24, 38, 14, 33, 44, 20, 36, 26, 42, 18, 30, 40, 22];

  return (
    <View style={[{
      borderRadius: px(t('rL')), overflow: 'hidden',
      backgroundColor: t('surfaceCardFlat'),
      borderWidth: 1, borderColor: t('borderGlass'),
    }, style]}>
      <Gradient
        colors={format === 'audio' ? g.media : [t('mmBleu'), t('mmViolet')]}
        angle={140}
        style={{
          height: artHeight, padding: 18,
          flexDirection: 'row', alignItems: 'center',
          justifyContent: format === 'audio' ? 'space-between' : 'center',
        }}
      >
        {format === 'audio' ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, height: 46 }}>
            {onde.map((h, i) => (
              <View key={i} style={{ width: 3, height: h, borderRadius: 2, backgroundColor: surArt }} />
            ))}
          </View>
        ) : null}
        {format === 'video' ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute', top: 14, right: 14, bottom: 14, left: 14,
              borderWidth: 2, borderColor: surArtFaible, borderRadius: 14,
            }}
          />
        ) : null}
        <View style={{
          width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center',
          backgroundColor: t('paperFixed'),
        }}>
          <Icon name="play" size={19} color={t('inkFixed')} />
        </View>
        {badge ? (
          <View style={{
            position: 'absolute', left: 14, bottom: 14, height: 25, paddingHorizontal: 10,
            borderRadius: px(t('rPill')), justifyContent: 'center', backgroundColor: t('surfaceInk'),
          }}>
            <Text style={{ fontFamily: 'SchibstedGrotesk', fontSize: 10.5, fontWeight: '600', color: t('paperFixed') }}>
              {badge}
            </Text>
          </View>
        ) : null}
      </Gradient>

      <View style={{ padding: 18 }}>
        {eyebrow ? (
          <Text style={{
            fontFamily: 'JetBrainsMono', fontSize: 10.5, letterSpacing: 1.5,
            textTransform: 'uppercase', color: t('textMuted'),
          }}>
            {eyebrow}
          </Text>
        ) : null}
        <Text style={{
          fontFamily: 'Fraunces', fontWeight: '900', fontSize: titleSize, letterSpacing: -0.6,
          lineHeight: titleSize * 1.12, marginTop: 7, color: t('textBody'),
        }}>
          {title}
        </Text>
        {body ? (
          <Text style={{
            fontFamily: 'SchibstedGrotesk', fontSize: 13.5, lineHeight: 20,
            marginTop: 9, color: t('textMuted'),
          }}>
            {body}
          </Text>
        ) : null}
        {cost.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 13 }}>
            {cost.map((c) => (
              <Text key={c} style={{ fontFamily: 'JetBrainsMono', fontSize: 11, color: t('textMuted') }}>{c}</Text>
            ))}
          </View>
        ) : null}
        {actions ? <View style={{ flexDirection: 'row', gap: 9, marginTop: 16 }}>{actions}</View> : null}
      </View>
    </View>
  );
}
