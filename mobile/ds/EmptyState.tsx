import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { useToken } from './theme';

/**
 * UN ÉCRAN VIDE EST UNE INVITATION À AGIR, PAS UNE EXCUSE.
 *
 * La règle du système, mot pour mot. Trois conséquences qui se voient dans le contrat :
 *
 *   • `action` n'est pas décoratif : un vide sans sortie laisse quelqu'un devant un mur.
 *   • On n'écrit JAMAIS « oups », et on ne s'excuse pas. On dit quoi, et quoi faire ensuite.
 *   • **Un zéro DATÉ est une information** — « 0 certificat émis · relevé du 30/08 » s'affiche.
 *     Un tiret, un « — », un « N/A » n'en sont pas. Le compte daté passe par `<Num>`, dans
 *     `body`, plutôt que d'être annoncé ici comme une absence.
 */
export function EmptyState({
  glyph, glyphBackground, title, body, action, style,
}: {
  glyph?: ReactNode;
  glyphBackground?: string;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useToken();
  return (
    <View style={[{ alignItems: 'center', paddingVertical: 34, paddingHorizontal: 20 }, style]}>
      {glyph !== undefined && (
        <View style={{
          width: 64, height: 64, borderRadius: 22, marginBottom: 16,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: glyphBackground ?? t('fill1'),
        }}>
          {glyph}
        </View>
      )}
      <Text style={{
        fontFamily: 'Fraunces', fontWeight: '900', fontSize: 22,
        letterSpacing: -0.7, lineHeight: 24, textAlign: 'center', color: t('textBody'),
      }}>
        {title}
      </Text>
      {body !== undefined && (
        typeof body === 'string' ? (
          <Text style={{
            fontFamily: 'SchibstedGrotesk', fontSize: 13.5, lineHeight: 20, marginTop: 9,
            textAlign: 'center', maxWidth: 300, color: t('textMuted'),
          }}>
            {body}
          </Text>
        ) : <View style={{ marginTop: 9, maxWidth: 300 }}>{body}</View>
      )}
      {action !== undefined && <View style={{ marginTop: 18, alignSelf: 'stretch' }}>{action}</View>}
    </View>
  );
}
