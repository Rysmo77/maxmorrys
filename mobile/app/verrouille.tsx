import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Body, Button, Display, Gradient, SansDonnees, Screen, ThemeScope, Wordmark, isIOS, useActionGradient, useToken, veil,
} from '../ds';
import { EPISODE } from '../contenu/demo';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * ══ 3 · L'ÉCRAN VERROUILLÉ ══ — LA SURFACE LA PLUS NATIVE DU KIT.
 *
 * **UN NAVIGATEUR NE PEUT PAS Y ÉCRIRE.** C'est tout : il n'y a aucun équivalent web, aucune
 * dégradation possible, aucune façon de l'approcher depuis un site. C'est, avec le widget, ce
 * que le virage natif achète réellement.
 *
 * ── ET LES DEUX PLATEFORMES LA TRAITENT DIFFÉREMMENT ─────────────────────────────────────
 * C'est l'une des rares surfaces où le châssis ne se contente pas de changer de gabarit :
 *
 *   iOS      une horloge géante CENTRÉE, et un lecteur pleine largeur sous elle.
 *   Android  l'horloge alignée à gauche avec sa date, et une CARTE de notification média,
 *            portant l'icône de l'application et sa propre découpe.
 *
 * Les imiter est le sujet : cet écran n'est pas une page du produit, c'est ce que le SYSTÈME
 * affichera. S'en écarter ferait une maquette jolie et fausse.
 *
 * ⚠️ CE QUE CET ÉCRAN EST. Le vrai écran verrouillé est peint par l'OS à partir des
 * métadonnées `MPNowPlayingInfoCenter` / `MediaSession` que publie le lecteur audio. Il ne se
 * rend pas depuis React Native. Cette page est donc l'APERÇU fidèle de ce que ces métadonnées
 * produiront — la maquette de référence contre laquelle brancher `expo-audio`, pas une
 * imitation qui se ferait passer pour la chose.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export default function Verrouille() {
  if (EPISODE === null) {
    return (
      <Screen territory="transforme" retour="Écouter" titre="Écran verrouillé">
        <Display size={27} lines={['Rien ne joue', 'en ce moment.']} style={{ marginTop: 10 }} />
        <SansDonnees
          quoi="la lecture en cours"
          origine="du lecteur"
          degat="Cet écran montre ce que le système affichera pendant une écoute. Sans lecture réelle, il n'y a rien à montrer — et une pochette inventée ferait croire à un son qui ne joue pas."
          style={{ marginTop: 20 }}
        />
      </Screen>
    );
  }

  /* Le rétrécissement de type ne survit pas à une closure quand la liaison vient d'un
     autre module : `onPress={() => X.y}` reperd le `non null` que la garde vient
     d'établir. Une constante LOCALE le porte jusque dans les rappels. */
  return (
    /* La portée nuit est OUVERTE ici : cet écran est sombre sur un téléphone en mode clair,
       exactement comme un vrai écran verrouillé la nuit. */
    <ThemeScope scheme="dark">
      {/* L'épisode est PASSÉ, pas re-lu : `Corps` reçoit une valeur déjà prouvée non nulle
          par la garde ci-dessus. Une assertion `!` aurait rendu la garantie invisible — et
          c'est exactement la forme du défaut qu'on vient de corriger ailleurs. */}
      <Corps episode={EPISODE} />
    </ThemeScope>
  );
}

function Corps({ episode }: { episode: NonNullable<typeof EPISODE> }) {
  const t = useToken();
  const g = useActionGradient();
  const insets = useSafeAreaInsets();

  /* Le fond d'écran appartient à la PERSONNE : ce n'est pas notre maillage. Les encres sont
     donc fixes, comme sur le lecteur plein écran. */
  const blanc = t('paperFixed');
  const blanc2 = veil(blanc, 0.66);

  return (
    <View style={{ flex: 1, backgroundColor: t('night') }}>
      <StatusBar style="light" />
      <Gradient
        colors={[t('gTransforme1'), t('night'), t('gForme1')]}
        angle={170}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      />

      <View style={{
        flex: 1,
        paddingTop: insets.top + (isIOS ? 26 : 34),
        paddingBottom: insets.bottom + (isIOS ? 26 : 30),
        paddingHorizontal: isIOS ? 22 : 18,
      }}>
        {/* ── L'HORLOGE ──────────────────────────────────────────────────────────────── */}
        <View style={{ alignItems: isIOS ? 'center' : 'flex-start' }}>
          {isIOS ? null : (
            <Body style={{ fontFamily: 'JetBrainsMono', fontSize: 15, color: blanc2 }}>
              vendredi 4 septembre
            </Body>
          )}
          <Body style={{
            fontFamily: 'JetBrainsMono',
            fontSize: isIOS ? 82 : 62,
            fontWeight: isIOS ? '600' : '400',
            lineHeight: isIOS ? 86 : 68,
            letterSpacing: -2,
            color: blanc,
            marginTop: isIOS ? 0 : 4,
          }}>
            9:41
          </Body>
          {isIOS ? (
            <Body style={{ fontSize: 19, color: veil(blanc, 0.86), marginTop: 2 }}>
              vendredi 4 septembre
            </Body>
          ) : null}
        </View>

        <View style={{ flex: 1 }} />

        {/* ── LE LECTEUR, DANS LA LANGUE DE CHAQUE SYSTÈME ────────────────────────────── */}
        {isIOS ? (
          <View style={{ marginBottom: 26 }}>
            <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
              <Gradient colors={g.media} angle={140} radius={12} style={{ width: 58, height: 58 }} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Body numberOfLines={1} style={{ fontSize: 16, fontWeight: '600', color: blanc }}>
                  {episode.titreCourt}
                </Body>
                <Body style={{ fontSize: 14, color: blanc2, marginTop: 2 }}>Rysmo · {episode.invitee}</Body>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 }}>
              <Body style={{ fontFamily: 'JetBrainsMono', fontSize: 11, color: blanc2 }}>{episode.position}</Body>
              <View style={{ flex: 1, height: 7, borderRadius: 4, backgroundColor: veil(blanc, 0.24) }}>
                <View style={{ width: '24%', height: '100%', borderRadius: 4, backgroundColor: blanc }} />
              </View>
              <Body style={{ fontFamily: 'JetBrainsMono', fontSize: 11, color: blanc2 }}>{episode.restant}</Body>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginTop: 16 }}>
              <Body style={{ fontFamily: 'JetBrainsMono', fontSize: 13, fontWeight: '700', color: blanc }}>−15</Body>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <View style={{ width: 6, height: 30, borderRadius: 2, backgroundColor: blanc }} />
                <View style={{ width: 6, height: 30, borderRadius: 2, backgroundColor: blanc }} />
              </View>
              <Body style={{ fontFamily: 'JetBrainsMono', fontSize: 13, fontWeight: '700', color: blanc }}>+15</Body>
            </View>
          </View>
        ) : (
          <View style={{
            marginBottom: 30, borderRadius: 26, padding: 15,
            backgroundColor: veil(blanc, 0.11),
            borderWidth: 1, borderColor: veil(blanc, 0.14),
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 12 }}>
              <Wordmark brand="rysmo" size={13} night tail={blanc} /> {/* ok-ds — posé sur un voile sombre, pas en mode sombre */}
              <Body style={{ fontSize: 11.5, color: blanc2 }}>· maintenant</Body>
            </View>
            <View style={{ flexDirection: 'row', gap: 13, alignItems: 'center' }}>
              <Gradient colors={g.media} angle={140} radius={10} style={{ width: 50, height: 50 }} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Body numberOfLines={1} style={{ fontSize: 14.5, fontWeight: '600', color: blanc }}>
                  {episode.titreCourt}
                </Body>
                <Body style={{ fontSize: 12.5, color: blanc2, marginTop: 2 }}>{episode.invitee}</Body>
              </View>
              <View style={{
                width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center',
                backgroundColor: blanc,
              }}>
                <View style={{ flexDirection: 'row', gap: 3 }}>
                  <View style={{ width: 4, height: 15, borderRadius: 1, backgroundColor: t('inkFixed') }} />
                  <View style={{ width: 4, height: 15, borderRadius: 1, backgroundColor: t('inkFixed') }} />
                </View>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 13 }}>
              <Body style={{ fontFamily: 'JetBrainsMono', fontSize: 10.5, color: blanc2 }}>{episode.position}</Body>
              <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: veil(blanc, 0.24) }}>
                <View style={{ width: '24%', height: '100%', borderRadius: 2, backgroundColor: blanc }} />
              </View>
              <Body style={{ fontFamily: 'JetBrainsMono', fontSize: 10.5, color: blanc2 }}>{episode.duree}</Body>
            </View>
          </View>
        )}

        <Button tone="quiet" size="sm" label="Revenir à l'épisode" onPress={() => router.back()} />
      </View>
    </View>
  );
}
