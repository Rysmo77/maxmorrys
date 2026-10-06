import { Text, View } from 'react-native';
import { openBrowserAsync } from 'expo-web-browser';
import { Body, useToken } from '../ds';
import { blocs, type Segment } from './contenu';

/**
 * Le texte d'une leçon (Markdown ou HTML du site), dessiné avec les jetons du kit.
 *
 * `onLien` reçoit les liens INTERNES (`/formations/…`, `/blog/…`) : un chemin relatif n'a pas
 * de sens dans un navigateur ouvert depuis l'application. Le répétiteur les route vers ses
 * propres écrans. Sans lui, un lien interne s'ouvre sur le site.
 */
export function TexteDeLecon({ contenu, onLien, taille = 14.5 }: {
  contenu: string;
  onLien?: (chemin: string) => void;
  /** Le corps de texte — 14,5 dans une leçon, 14 dans une bulle de conversation. */
  taille?: number;
}) {
  const t = useToken();
  const interligne = Math.round(taille * 1.58);
  const ouvrir = (lien: string) => {
    if (lien.startsWith('/')) {
      if (onLien) onLien(lien);
      else void openBrowserAsync(`https://maxmorrys.me${lien}`);
      return;
    }
    void openBrowserAsync(lien);
  };
  const ligne = (segments: Segment[]) => segments.map((s, i) => (
    <Text
      key={i}
      onPress={s.lien ? () => ouvrir(s.lien as string) : undefined}
      accessibilityRole={s.lien ? 'link' : undefined}
      style={{
        fontWeight: s.gras ? '700' : undefined,
        fontStyle: s.italique ? 'italic' : undefined,
        color: s.lien ? t('mmBleu') : undefined,
        textDecorationLine: s.lien ? 'underline' : undefined,
      }}
    >
      {s.texte}
    </Text>
  ));

  return (
    <View style={{ gap: 12 }}>
      {blocs(contenu).map((b, i) => {
        if (b.type === 'titre') {
          return (
            <Body key={i} style={{ fontFamily: 'Fraunces', fontWeight: '700', fontSize: b.niveau === 1 ? 21 : b.niveau === 2 ? 18 : 16, lineHeight: b.niveau === 1 ? 27 : 23, marginTop: 6 }}>
              {ligne(b.segments)}
            </Body>
          );
        }
        if (b.type === 'citation') {
          return (
            <View key={i} style={{ borderLeftWidth: 3, borderLeftColor: t('borderHair'), paddingLeft: 12 }}>
              <Body muted style={{ fontSize: taille, lineHeight: interligne, fontStyle: 'italic' }}>{ligne(b.segments)}</Body>
            </View>
          );
        }
        if (b.type === 'liste') {
          return (
            <View key={i} style={{ gap: 6 }}>
              {b.items.map((item, j) => (
                <View key={j} style={{ flexDirection: 'row', gap: 8 }}>
                  <Body muted style={{ fontSize: taille, lineHeight: interligne, minWidth: 16 }}>{b.ordonnee ? `${j + 1}.` : '•'}</Body>
                  <Body style={{ flex: 1, fontSize: taille, lineHeight: interligne }}>{ligne(item)}</Body>
                </View>
              ))}
            </View>
          );
        }
        return <Body key={i} style={{ fontSize: taille, lineHeight: interligne }}>{ligne(b.segments)}</Body>;
      })}
    </View>
  );
}
