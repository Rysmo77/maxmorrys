import { useEffect, useRef } from 'react';
import { POLICE } from './police';
import { Animated, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useBascule } from './mouvement';
import { Pressoir } from './Pressoir';
import { Icon, type IconName } from './Icon';
import { haptique } from './haptique';
import { useToken, px } from './theme';

/**
 * LES PUCES DE FILTRE — et pourquoi elles DÉFILENT ici alors qu'elles sont coupées au web.
 *
 * Le kit pose `overflow: hidden` sur sa rangée : à cinq puces dans un cadre de 390 px, les
 * dernières sont rognées. C'est supportable sur une maquette, pas dans la main de quelqu'un —
 * une puce rognée est une puce absente, et c'est le même défaut que celui relevé sur le
 * `Pipeline` de la console.
 *
 * `ScrollView` horizontal, sans barre : on garde la coupe visuelle qui indique qu'il y a une
 * suite, et on rend cette suite atteignable.
 *
 * ── LA PUCE ACTIVE EST TOUJOURS DANS LE CHAMP ─────────────────────────────────────────
 * Sur la bande des huit onglets du Club, l'onglet ouvert était souvent hors de l'écran, à
 * droite : on ne voyait pas où l'on était. La rangée défile jusqu'à lui à chaque changement.
 *
 * `debord` prolonge la rangée jusqu'aux bords de l'écran (la gouttière est rendue en marge
 * intérieure) : une puce coupée AU BORD de l'écran dit « il y a une suite » ; coupée à 18 px
 * du bord, elle a l'air rognée par erreur.
 */
export function ChipRow({
  options, value, onChange, height = 44, icones, debord, style,
}: {
  options: readonly string[];
  value?: string;
  onChange?: (option: string) => void;
  height?: number;
  /** Un glyphe devant certaines puces — le cadenas d'un onglet fermé. */
  icones?: Partial<Record<string, IconName>>;
  /** La gouttière de l'écran, pour faire déborder la rangée jusqu'au bord. */
  debord?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const defilement = useRef<ScrollView>(null);
  const positions = useRef<Record<string, number>>({});
  const actif = value === undefined ? options[0] : value;

  useEffect(() => {
    const x = positions.current[actif ?? ''];
    if (x !== undefined) defilement.current?.scrollTo({ x: Math.max(0, x - 24), animated: true });
  }, [actif]);

  return (
    <ScrollView
      ref={defilement}
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingVertical: 2, paddingHorizontal: debord ?? 0 }}
      style={[debord ? { marginHorizontal: -debord } : null, style]}
    >
      {options.map((o) => (
        <View
          key={o}
          onLayout={(e) => {
            positions.current[o] = e.nativeEvent.layout.x;
            if (o === actif && e.nativeEvent.layout.x > 0) {
              defilement.current?.scrollTo({ x: Math.max(0, e.nativeEvent.layout.x - 24), animated: false });
            }
          }}
        >
          <Pilule
            libelle={o}
            on={actif === o}
            height={height}
            icone={icones?.[o]}
            onPress={onChange ? () => { haptique.selection(); onChange(o); } : undefined}
          />
        </View>
      ))}
    </ScrollView>
  );
}

/**
 * UNE PILULE — 220 ms, « l'état a changé ». Le fond actif apparaît en fondu ; le libellé
 * bascule par DEUX couches superposées, parce qu'une couleur de texte ne s'anime pas sur le
 * pilote natif — et qu'un changement sec laisserait, le temps du fondu, un texte blanc sur un
 * fond encore clair. Enfoncement .94 : celui des pilules.
 *
 * ⚠️ LES DEUX COUCHES SONT DÉCORATIVES. Elles étaient lues toutes les deux : un lecteur
 * d'écran annonçait « Fil, Fil ». Le libellé est porté UNE fois, par le contrôle.
 *
 * La bordure inactive est `fill4`, pas `ctlOffBrd` : un voile blanc à 60 % sur un fond clair
 * donnait une bordure à 1:1, invisible — une puce sans contour ne se lit pas comme touchable.
 */
function Pilule({ libelle, on, height, icone, onPress }: {
  libelle: string; on: boolean; height: number; icone?: IconName; onPress?: () => void;
}) {
  const t = useToken();
  const b = useBascule(on);
  const texte = { fontFamily: POLICE.corps, fontSize: 13 } as const;
  return (
    <Pressoir
      echelle="sm"
      accessibilityRole="tab"
      accessibilityLabel={icone === 'lock' ? `${libelle}, réservé aux membres` : libelle}
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={{
        height, paddingHorizontal: 16, justifyContent: 'center', overflow: 'hidden',
        borderRadius: px(t('rPill')), borderWidth: 1,
        backgroundColor: t('ctlOffBg'),
        borderColor: on ? t('ink') : t('fill4'),
      }}
    >
      <Animated.View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: t('ink'), opacity: b }} />
      <View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
      >
        {icone ? (
          <View>
            <Animated.View style={{ opacity: b.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }}>
              <Icon name={icone} size={12} color={t('textMuted')} strokeWidth={2.6} />
            </Animated.View>
            <Animated.View style={{ position: 'absolute', opacity: b }}>
              <Icon name={icone} size={12} color={t('textOnPrimary')} strokeWidth={2.6} />
            </Animated.View>
          </View>
        ) : null}
        <View>
          <Animated.Text style={[texte, { fontWeight: '500', color: t('textMuted'), opacity: b.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
            {libelle}
          </Animated.Text>
          <Animated.Text style={[texte, { position: 'absolute', left: 0, fontWeight: '600', color: t('textOnPrimary'), opacity: b }]}>
            {libelle}
          </Animated.Text>
        </View>
      </View>
    </Pressoir>
  );
}
