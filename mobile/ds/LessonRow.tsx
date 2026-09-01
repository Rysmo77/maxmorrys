import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { ripple } from './platform';
import type { ReactNode } from 'react';
import { useToken, veil } from './theme';
import { Icon } from './Icon';

/**
 * LA LIGNE DE LISTE — la primitive la plus répétée du produit.
 *
 * Leçon, entrée d'espace, réglage, note, ligne de classement, tâche d'administration : une
 * vingtaine d'écrans du kit la posent. C'est précisément ce qui la rend dangereuse — le kit
 * en tire lui-même la leçon de revue : « un flou n'est jamais coûteux à l'endroit où on
 * l'écrit ; il le devient là où le composant est RÉPÉTÉ, et l'auteur du composant ne voit pas
 * cet endroit. »
 *
 * Donc, ici comme au web : **aucun flou, aucune ombre, aucun fond propre.** La ligne vit dans
 * une `Surface level="flat"` qui porte le voile une seule fois pour toute la liste.
 *
 * LES QUATRE ÉTATS ne sont pas décoratifs, ils portent l'information :
 *   done     pastille verte à coche — c'est fait
 *   current  fond dégradé et coin arrondi — c'est ici que tu en es
 *   todo     anneau vide — ça reste à faire
 *   plain    aucune puce — la ligne n'a pas d'état, c'est une entrée
 *
 * `onPress` rend la ligne cliquable ET pressable : l'enfoncement à 120 ms est le seul retour
 * systématique du système, et une ligne qui réagit au doigt sans le dire est une ligne qu'on
 * croit inerte.
 */
export type LessonState = 'done' | 'current' | 'todo' | 'plain';

export function LessonRow({
  state = 'plain', icon, iconBackground, title, meta, trailing, onPress, last, style,
}: {
  state?: LessonState;
  /** Remplace la puce d'état. Un glyphe de 13–14 px, jamais une image. */
  icon?: ReactNode;
  iconBackground?: string;
  title: ReactNode;
  /** Métadonnée : durée, compte, date. Monospace, comme au web. */
  meta?: ReactNode;
  /** Étiquette, chevron, nombre. UNE seule action par ligne — voir le motif de la console. */
  trailing?: ReactNode;
  onPress?: () => void;
  last?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useToken();

  let left: ReactNode = null;
  if (icon !== undefined) {
    left = (
      <View style={{
        width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
        backgroundColor: iconBackground ?? t('fill1'),
      }}>
        {icon}
      </View>
    );
  } else if (state === 'done') {
    left = (
      <View style={{
        width: 25, height: 25, borderRadius: 999, alignItems: 'center', justifyContent: 'center',
        // Un VOILE de l'encre verte, pas l'encre pleine : un disque vert saturé sous une
        // coche verte ne se lit pas. Le voile suit son encre quand le mode bascule.
        backgroundColor: veil(t('ok'), 0.16),
      }}>
        <Icon name="check" size={13} color={t('ok')} strokeWidth={3.4} />
      </View>
    );
  } else if (state === 'todo') {
    left = <View style={{ width: 26, height: 26, borderRadius: 999, borderWidth: 2.5, borderColor: t('fill3') }} />;
  }

  const current = state === 'current';

  const body = (
    <View
      style={[{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 13,
        paddingHorizontal: current ? 18 : 0,
        marginHorizontal: current ? -18 : 0,
        borderRadius: current ? 14 : 0,
        // La ligne courante prend le voile de son territoire, pas une couleur pleine : c'est
        // un repère de position, pas une sélection.
        backgroundColor: current ? t('surfaceCard') : 'transparent',
        borderBottomWidth: last || current ? 0 : 1,
        borderBottomColor: t('borderHair'),
      }, style]}
    >
      {left}
      <View style={{ flex: 1, minWidth: 0 }}>
        {typeof title === 'string' ? (
          <Text style={{
            fontFamily: 'SchibstedGrotesk', fontWeight: '600', fontSize: 14, color: t('textBody'),
          }}>
            {title}
          </Text>
        ) : title}
        {meta !== undefined && meta !== null && (
          typeof meta === 'string' ? (
            <Text style={{ fontFamily: 'JetBrainsMono', fontSize: 12, color: t('textMuted'), marginTop: 2 }}>
              {meta}
            </Text>
          ) : <View style={{ marginTop: 2 }}>{meta}</View>
        )}
      </View>
      {trailing}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      /* L'onde reste DANS la ligne (`borderless: false`) : débordante, dans une liste
         dense, elle donne l'impression d'avoir touché la ligne voisine. */
      android_ripple={ripple(t('ink3'))}
      // `scale(.975)` — la valeur du système. Ni rebond, ni couleur : le geste est arrivé.
      style={({ pressed }: { pressed: boolean }) => ({
        transform: [{ scale: pressed ? Number.parseFloat(t('pressScale')) || 0.975 : 1 }],
      })}
    >
      {body}
    </Pressable>
  );
}
