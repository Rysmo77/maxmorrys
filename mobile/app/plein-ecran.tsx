import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Body, Gradient, Icon, useActionGradient, useToken, veil,
} from '../ds';
import { FORMATION } from '../contenu/reference';

/**
 * ══ 6 · LECTEUR PLEIN ÉCRAN ══
 *
 * LE SEUL ÉCRAN DU PRODUIT QUI NE PASSE PAS PAR LE CHÂSSIS. Il est en paysage, donc il n'a ni
 * barre haute, ni maillage, ni gouttière de 18 px : la vidéo occupe tout, et les commandes
 * flottent dessus.
 *
 * ⚠️ L'ORIENTATION N'EST PAS FORCÉE. `app.json` déclare `"orientation": "portrait"`, et la
 * lever demande `expo-screen-orientation` — une dépendance de plus. L'écran est donc dessiné
 * pour le paysage et TIENT en portrait : les commandes restent aux mêmes places relatives,
 * elles ne se replient pas. C'est un manque déclaré, pas un oubli — le jour où le paquet
 * entre, le verrou se pose ici, à l'entrée et à la sortie de cet écran, et nulle part ailleurs.
 *
 * LES COMMANDES DISPARAISSENT, LA TRANSCRIPTION RESTE ATTEIGNABLE. C'est elle qui permet de
 * suivre le cours quand le réseau lâche au milieu — et c'est pour ça qu'elle est dans le
 * chrome haut, à côté du titre, plutôt que sous le lecteur où elle sortirait du champ.
 */
export default function PleinEcran() {
  const t = useToken();
  const g = useActionGradient();
  const insets = useSafeAreaInsets();

  /*
   * L'ENCRE DE CET ÉCRAN NE SUIT PAS LE MODE, ET C'EST VOULU. Le fond n'est pas la page :
   * c'est une vidéo, donc une surface sombre dans les deux modes. `textMuted` y deviendrait
   * un gris foncé en mode clair — illisible sur l'aplat. On dérive donc les deux encres du
   * blanc INVARIANT, comme le fait le ton orange du bouton avec son encre fixe.
   */
  const surVideo = t('paperFixed');
  const surVideo2 = veil(surVideo, 0.7);
  const piste = veil(surVideo, 0.32);

  /* En paysage, l'encoche passe sur le CÔTÉ : la marge latérale doit l'absorber, sinon le
     bouton de fermeture tombe dessous. `insets.left` vaut 0 en portrait, 44 sous l'encoche. */
  const cote = Math.max(insets.left, insets.right, 20) + 4;

  const rond = (taille: number, label: string, contenu: React.ReactNode, onPress?: () => void) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => ({
        width: taille, height: taille, borderRadius: taille / 2,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: t('surfaceNight'),
        transform: [{ scale: pressed ? 0.94 : 1 }],
      })}
    >
      {contenu}
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t('night') }}>
      {/* La barre système passe en clair : le fond est une vidéo, pas la page. */}
      <StatusBar style="light" hidden />
      <Gradient colors={g.lecon} angle={140} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />

      <View style={{
        flex: 1, justifyContent: 'space-between',
        paddingTop: insets.top + 14, paddingBottom: insets.bottom + 14,
        paddingLeft: cote, paddingRight: cote,
      }}>
        {/* ── Chrome haut : sortir, savoir ce qu'on regarde, aller à la transcription ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          {rond(44, 'Fermer le plein écran',
            <Icon name="close" size={19} color={surVideo} strokeWidth={2.4} />,
            () => router.back())}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={{
              fontFamily: 'SchibstedGrotesk', fontSize: 14.5, fontWeight: '600', color: surVideo,
            }}>
              {FORMATION.leconEnCours}
            </Text>
            <Text style={{ fontFamily: 'JetBrainsMono', fontSize: 11, color: t('cardInk2') }}>
              module 3 · leçon 5 · 480p · 9 Mo
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ouvrir la transcription"
            onPress={() => router.back()}
            style={{
              minHeight: 44, paddingHorizontal: 14, justifyContent: 'center',
              borderRadius: 999, backgroundColor: t('surfaceNight'),
            }}
          >
            <Text style={{ fontFamily: 'SchibstedGrotesk', fontSize: 12.5, fontWeight: '600', color: surVideo }}>
              Transcription
            </Text>
          </Pressable>
        </View>

        {/* ── Les trois commandes. −15 / +15 en monospace : ce sont des SECONDES, pas des icônes ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 34 }}>
          {rond(52, 'Reculer de 15 secondes',
            <Text style={{ fontFamily: 'JetBrainsMono', fontSize: 11, fontWeight: '700', color: surVideo }}>−15</Text>)}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mettre en pause"
            style={({ pressed }: { pressed: boolean }) => ({
              width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center',
              backgroundColor: surVideo,
              transform: [{ scale: pressed ? 0.94 : 1 }],
            })}
          >
            <View style={{ flexDirection: 'row', gap: 5 }}>
              <View style={{ width: 6, height: 24, borderRadius: 2, backgroundColor: t('inkFixed') }} />
              <View style={{ width: 6, height: 24, borderRadius: 2, backgroundColor: t('inkFixed') }} />
            </View>
          </Pressable>
          {rond(52, 'Avancer de 15 secondes',
            <Text style={{ fontFamily: 'JetBrainsMono', fontSize: 11, fontWeight: '700', color: surVideo }}>+15</Text>)}
        </View>

        {/* ── Le fil de lecture, la vitesse, et la promesse qui rend l'écran supportable ── */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
            <Text style={{ fontFamily: 'JetBrainsMono', fontSize: 11, color: surVideo }}>03:12</Text>
            <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: piste }}>
              <View style={{ width: '38%', height: '100%', borderRadius: 2, backgroundColor: surVideo }} />
            </View>
            <Text style={{ fontFamily: 'JetBrainsMono', fontSize: 11, color: surVideo }}>08:24</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Vitesse de lecture : une fois"
              style={{
                minHeight: 34, paddingHorizontal: 10, justifyContent: 'center',
                borderRadius: 999, backgroundColor: t('surfaceNight'),
              }}
            >
              <Text style={{ fontFamily: 'JetBrainsMono', fontSize: 11, fontWeight: '700', color: surVideo }}>1×</Text>
            </Pressable>
          </View>
          <Body style={{ fontSize: 11.5, color: surVideo2, marginTop: 10 }}>
            Le réseau lâche ? La transcription reste lisible et ta position est gardée.
          </Body>
        </View>
      </View>

    </View>
  );
}
