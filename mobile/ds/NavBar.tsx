import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { POLICE } from './police';
import type { ReactNode } from 'react';
import { isIOS, ripple } from './platform';
import { useToken } from './theme';
import { Icon } from './Icon';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LES DEUX BARRES HAUTES — le seul endroit du produit où le CONTENU est écrit deux fois.
 *
 * Le kit natif énonce sa règle en une phrase : « le contenu d'un écran est identique sur les
 * deux plateformes ; seul le châssis diffère ». La barre haute EST le châssis. Elle diffère
 * sur trois points, et aucun n'est décoratif :
 *
 *   · LA HAUTEUR.  44 sur iOS, 64 sur Android (Material 3). Ce sont des hauteurs SYSTÈME que
 *     la personne reconnaît sans les nommer ; les uniformiser ferait paraître l'application
 *     étrangère des deux côtés à la fois.
 *   · LE TITRE.    Centré sur iOS, aligné à gauche et plus gros sur Android.
 *   · LE RETOUR.   Chevron **et libellé** sur iOS — le libellé dit OÙ l'on revient. Flèche
 *     seule sur Android, parce que le retour système peut venir d'ailleurs et qu'un libellé
 *     faux est pire que pas de libellé.
 *
 * Les valeurs viennent de `css/brand/native.css` du transfert (`--navbar-ios`, `--navbar-andro`).
 * Elles ne sont pas dans la table de jetons : cette table est générée depuis le CSS du SITE,
 * qui n'a pas de barre native. Elles vivent donc ici, nommées, plutôt qu'écrites dans douze
 * écrans.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export const NAVBAR_H = isIOS ? 44 : 64;

export function NavBar({
  retour, onRetour, titre, glyphe, droite, style,
}: {
  /**
   * Le libellé de retour. Sur iOS il s'AFFICHE à côté du chevron ; sur Android il ne sert
   * que de nom accessible, parce que Material n'affiche pas de libellé de retour.
   */
  retour?: string;
  onRetour?: () => void;
  titre?: string;
  /** Un glyphe devant le titre — l'onde au repos du répétiteur, sa signature. */
  glyphe?: ReactNode;
  droite?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useToken();

  const bouton = retour !== undefined && onRetour !== undefined;

  if (isIOS) {
    return (
      <View style={[{
        height: NAVBAR_H, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', gap: 10, paddingHorizontal: 12,
      }, style]}>
        <View style={{ minWidth: 88, alignItems: 'flex-start' }}>
          {bouton ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Retour à ${retour}`}
              onPress={onRetour}
              hitSlop={8}
              style={({ pressed }: { pressed: boolean }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 3,
                minHeight: 44, paddingHorizontal: 6,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Icon name="back" size={19} color={t('mmBleu')} strokeWidth={2.6} />
              <Text
                numberOfLines={1}
                style={{ fontFamily: POLICE.corps, fontSize: 16, fontWeight: '500', color: t('mmBleu') }}
              >
                {retour}
              </Text>
            </Pressable>
          ) : null}
        </View>
        {titre ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 1 }}>
            {glyphe}
            <Text
              numberOfLines={1}
              accessibilityRole="header"
              maxFontSizeMultiplier={1.3}
              style={{ fontFamily: POLICE.corps, fontSize: 16, fontWeight: '600', color: t('textBody'), flexShrink: 1 }}
            >
              {titre}
            </Text>
          </View>
        ) : null}
        <View style={{ minWidth: 88, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
          {droite}
        </View>
      </View>
    );
  }

  return (
    <View style={[{
      height: NAVBAR_H, flexDirection: 'row', alignItems: 'center',
      gap: 6, paddingLeft: 4, paddingRight: 8,
    }, style]}>
      {bouton ? (
        <Pressable
          accessibilityRole="button"
          /* Le libellé n'est pas AFFICHÉ ici, mais il reste dit : un lecteur d'écran a besoin
             de savoir où mène ce bouton, et Material ne l'écrit pas à l'écran. */
          accessibilityLabel={`Retour à ${retour}`}
          onPress={onRetour}
          android_ripple={ripple(t('ink3'), true)}
          style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="back" size={22} color={t('textBody')} strokeWidth={2.4} />
        </Pressable>
      ) : null}
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: bouton ? 4 : 12 }}>
        {glyphe}
        <Text
          numberOfLines={1}
          accessibilityRole="header"
          maxFontSizeMultiplier={1.3}
          style={{
            flexShrink: 1, fontFamily: POLICE.corps, fontSize: 19, fontWeight: '600',
            color: t('textBody'),
          }}
        >
          {titre ?? ''}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>{droite}</View>
    </View>
  );
}
