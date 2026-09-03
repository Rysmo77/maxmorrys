import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  Body, Button, Display, Eyebrow, Gradient, Screen, Wordmark, useActionGradient, useToken,
} from '../ds';

/**
 * ══ 2 · ONBOARDING ══
 *
 * Trois écrans, passables — et surtout : **aucun compte demandé.** Exiger un compte avant
 * d'avoir montré quoi que ce soit, c'est perdre la personne au deuxième écran. Le catalogue,
 * le pôle média et le module d'ouverture de chaque formation se parcourent sans rien signer.
 *
 * LES TROIS PROMESSES SONT LES TROIS GAINS RÉELS DU NATIF, dans l'ordre où le transfert les
 * établit — le hors réseau, la relance, la lecture qui survit au verrouillage. Aucune n'est
 * un argument d'emballage : chacune correspond à une chose que le web NE POUVAIT PAS faire.
 */
const PAS = [
  {
    eyebrow: '1 sur 3',
    titre: ['APPRENDS', 'QUAND TU PEUX.', 'HORS RÉSEAU AUSSI.'],
    chapo: "Télécharge une leçon en Wi-Fi, regarde-la dans le taxi. Ta progression part toute seule au retour du réseau — tu n'as rien à relancer.",
  },
  {
    eyebrow: '2 sur 3',
    titre: ['UN RÉPÉTITEUR', 'QUI SAIT OÙ', 'TU EN ES.'],
    chapo: "Il connaît ta leçon en cours et ce que tu lui as dit de toi. Tu peux le renommer, et effacer sa mémoire quand tu veux — sans passer par le support.",
  },
  {
    eyebrow: '3 sur 3',
    titre: ['ÉCOUTE', 'ÉCRAN', 'VERROUILLÉ.'],
    chapo: "Dans un navigateur, un épisode s'arrête quand tu verrouilles ton téléphone. Ici il continue, et les commandes restent sur l'écran verrouillé.",
  },
] as const;

export default function Onboarding() {
  const t = useToken();
  const g = useActionGradient();
  const [pas, setPas] = useState(0);
  const courant = PAS[pas];
  const dernier = pas === PAS.length - 1;

  function suivant() {
    if (dernier) router.replace('/permissions');
    else setPas(pas + 1);
  }

  return (
    <Screen
      territory="forme"
      droite={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Passer la présentation"
          onPress={() => router.replace('/(tabs)')}
          hitSlop={8}
          style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 10 }}
        >
          <Text style={{ fontFamily: 'SchibstedGrotesk', fontSize: 15, fontWeight: '600', color: t('textMuted') }}>
            Passer
          </Text>
        </Pressable>
      }
      contentStyle={{ flexGrow: 1 }}
    >
      <Gradient
        colors={g.lecon}
        angle={140}
        radius={30}
        style={{ height: 220, marginTop: 10, alignItems: 'center', justifyContent: 'center' }}
      >
        <Wordmark brand="rysmo" size={34} night tail={t('paperFixed')} /> {/* ok-ds — posé sur un aplat de marque, pas en mode sombre */}
      </Gradient>

      <Eyebrow style={{ marginTop: 26 }}>{courant.eyebrow}</Eyebrow>
      <Display size={31} lines={courant.titre} style={{ marginTop: 8 }} />
      <Body muted style={{ marginTop: 12, fontSize: 14.5, lineHeight: 22 }}>{courant.chapo}</Body>

      <View style={{ flex: 1, minHeight: 24 }} />

      {/* Le pas courant s'étire au lieu de changer de couleur : la position se voit du coin de
          l'œil, sans avoir à comparer trois teintes proches. */}
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 1, max: PAS.length, now: pas + 1 }}
        style={{ flexDirection: 'row', gap: 7, justifyContent: 'center', marginBottom: 16 }}
      >
        {PAS.map((p, i) => (
          <View
            key={p.eyebrow}
            style={{
              width: i === pas ? 22 : 7, height: 7, borderRadius: 4,
              backgroundColor: i === pas ? t('ink') : t('fill3'),
            }}
          />
        ))}
      </View>

      <Button tone="forme" label={dernier ? 'Commencer' : 'Continuer'} onPress={suivant} />

      <Body muted style={{ fontSize: 11.5, textAlign: 'center', marginTop: 10, color: t('textFaint') }}>
        Aucun compte demandé pour l'instant. Tu peux tout parcourir avant de décider.
      </Body>
    </Screen>
  );
}
