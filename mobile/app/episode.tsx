import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import {
  Body, Button, Display, Eyebrow, Gradient, Icon, IconButton, LessonRow, Num, SansDonnees, Screen, Segmented, Surface, isIOS, useActionGradient, useToken, veil,
} from '../ds';
import { EPISODE, RELEVE, SOURCE, TRANSCRIPTION } from '../contenu/demo';

/**
 * ══ 2 · L'ÉPISODE ══
 *
 * **LA TRANSCRIPTION EST AFFICHÉE PAR DÉFAUT.** C'est la décision du web, et elle tient
 * exactement pour la même raison ici : elle se lit sans charger l'audio —
 * <b>0 Mo contre 31</b>. Sur un forfait compté, c'est la différence entre lire l'épisode
 * maintenant et le remettre à un Wi-Fi qu'on n'aura peut-être pas.
 *
 * CE QUE LE NATIF AJOUTE, ET QU'UN NAVIGATEUR NE GARDE PAS D'UNE SESSION À L'AUTRE :
 *   · LE TÉLÉCHARGEMENT, avec son poids écrit sur le bouton — 31 Mo, avant de le toucher.
 *   · LA VITESSE DE LECTURE, qui reste choisie au prochain épisode.
 *
 * Et, surtout, la lecture qui SURVIT au verrouillage — c'est le sujet de tout le pôle.
 */
const VUES = ['Transcription', 'Chapitres', 'Notes'] as const;

export default function Episode() {
  const t = useToken();
  const g = useActionGradient();
  const [vue, setVue] = useState<string>('Transcription');
  const [vitesse, setVitesse] = useState(1);

  const vitesses = [1, 1.25, 1.5, 2];

  if (EPISODE === null) {
    return (
      <Screen territory="transforme" retour="Écouter">
        <Display size={27} lines={['Cet épisode', 'n’est pas chargé.']} style={{ marginTop: 10 }} />
        <SansDonnees
          quoi="cet épisode"
          degat="Une transcription fabriquée met des phrases dans la bouche de quelqu'un. C'est le seul contenu du produit où l'invention se lit comme une citation."
          style={{ marginTop: 20 }}
        />
      </Screen>
    );
  }

  /* Le rétrécissement de type ne survit pas à une closure quand la liaison vient d'un
     autre module : `onPress={() => X.y}` reperd le `non null` que la garde vient
     d'établir. Une constante LOCALE le porte jusque dans les rappels. */
  const episode = EPISODE;
  return (
    <Screen
      territory="transforme"
      retour="Écouter"
      titre={isIOS ? undefined : 'Épisode 1'}
      droite={
        <IconButton disabled label="Partager cet épisode">
          <Icon name="share" size={17} color={t('textBody')} strokeWidth={2} />
        </IconButton>
      }
    >
      <Eyebrow style={{ marginTop: 6 }}>Podcast · épisode 1</Eyebrow>
      <Display size={27} lines={['Vendre sans', 'budget pub.']} style={{ marginTop: 8 }} />
      <Num
        value={`${episode.date} · ${episode.duree} · ${episode.invitee}`}
        source={SOURCE}
        asOf={RELEVE}
        style={{ fontSize: 11.5, color: t('textFaint'), marginTop: 10 }}
      />

      {/* ── LE LECTEUR ─────────────────────────────────────────────────────────────────── */}
      <Gradient
        colors={g.media}
        angle={140}
        radius={26}
        style={{
          marginTop: 16, padding: 18,
          shadowColor: t('mmViolet'), shadowOpacity: 0.28, shadowRadius: 17,
          shadowOffset: { width: 0, height: 14 }, elevation: 6,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, justifyContent: 'center' }}>
          <View style={{
            width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
            backgroundColor: veil(t('paperFixed'), 0.22),
          }}>
            <Body style={{ fontFamily: 'JetBrainsMono', fontSize: 10, fontWeight: '700', color: t('paperFixed') }}>−15</Body>
          </View>
          <View style={{
            width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center',
            backgroundColor: t('paperFixed'),
          }}>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <View style={{ width: 5, height: 21, borderRadius: 2, backgroundColor: t('inkFixed') }} />
              <View style={{ width: 5, height: 21, borderRadius: 2, backgroundColor: t('inkFixed') }} />
            </View>
          </View>
          <View style={{
            width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
            backgroundColor: veil(t('paperFixed'), 0.22),
          }}>
            <Body style={{ fontFamily: 'JetBrainsMono', fontSize: 10, fontWeight: '700', color: t('paperFixed') }}>+15</Body>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 16 }}>
          <Body style={{ fontFamily: 'JetBrainsMono', fontSize: 11, color: t('paperFixed') }}>{episode.position}</Body>
          <View style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: veil(t('paperFixed'), 0.35) }}>
            <View style={{ width: '24%', height: '100%', borderRadius: 2, backgroundColor: t('paperFixed') }} />
          </View>
          <Body style={{ fontFamily: 'JetBrainsMono', fontSize: 11, color: t('paperFixed') }}>{episode.duree}</Body>
        </View>
      </Gradient>

      {/* Ce que le navigateur ne garde pas d'une session à l'autre. */}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
        <Button
          tone="quiet"
          size="sm"
          fullWidth
          label={`Télécharger · ${episode.poids}`}
          icon="download"
          disabled
          style={{ flex: 1 }}
        />
        <Button
          tone="quiet"
          size="sm"
          label={`${vitesse}×`}
          onPress={() => setVitesse(vitesses[(vitesses.indexOf(vitesse) + 1) % vitesses.length])}
        />
      </View>

      <Segmented options={VUES} value={vue} onChange={setVue} style={{ marginTop: 16 }} />

      {vue === 'Transcription' ? (
        <>
          <Body muted style={{ fontSize: 12, lineHeight: 18, marginTop: 12 }}>
            Affichée par défaut : elle se lit sans charger l'audio —{' '}
            <Num value="0 Mo" source={SOURCE} asOf={RELEVE} style={{ fontSize: 12 }} /> contre{' '}
            {episode.poids}.
          </Body>
          <Surface level="flat" style={{ marginTop: 12, paddingHorizontal: 16 }}>
            {TRANSCRIPTION.map((l, i) => (
              <LessonRow
                key={l.t}
                meta={l.t}
                title={l.l}
                last={i === TRANSCRIPTION.length - 1}
              />
            ))}
          </Surface>
        </>
      ) : null}

      {vue === 'Chapitres' ? (
        <Surface level="flat" style={{ marginTop: 12, paddingHorizontal: 16 }}>
          {TRANSCRIPTION.map((l, i) => (
            <LessonRow
              key={l.t}
              icon={<Icon name="play" size={12} color={t('mmVioletT')} />}
              iconBackground={veil(t('mmViolet'), 0.12)}
              title={l.l}
              meta={l.t}
              last={i === TRANSCRIPTION.length - 1}
            />
          ))}
        </Surface>
      ) : null}

      {vue === 'Notes' ? (
        <Surface level="flat" style={{ marginTop: 12, padding: 18 }}>
          <Body style={{ fontWeight: '700' }}>Rien de noté sur cet épisode</Body>
          <Body muted style={{ marginTop: 8, lineHeight: 21 }}>
            Une note prise ici se range avec celles de tes cours, et te suit d'un appareil à
            l'autre.
          </Body>
          <Button
            tone="quiet"
            size="sm"
            label="Voir mes notes"
            style={{ marginTop: 12 }}
            onPress={() => router.push('/notes')}
          />
        </Surface>
      ) : null}
    </Screen>
  );
}
