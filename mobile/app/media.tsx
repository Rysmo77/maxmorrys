import { useState } from 'react';
import { router } from 'expo-router';
import {
  Body, Button, Display, Eyebrow, Icon, IconButton, MediaCard, MiniPlayer, SansDonnees, Screen, SubNav, Surface, Tag, useToken,
} from '../ds';
import { EPISODE, VIDEO } from '../contenu/demo';
import { View } from 'react-native';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * ══ 1 · LE PÔLE MÉDIA ══ — ET LE GAIN QUI N'A RIEN À VOIR AVEC L'APPARENCE.
 *
 * **DANS UN NAVIGATEUR, UN PODCAST S'ARRÊTE QUAND ON VERROUILLE LE TÉLÉPHONE.** En natif il
 * continue. Pour un contenu de 34 minutes écouté dans un taxi, ce n'est pas une amélioration :
 * c'est la différence entre utilisable et inutilisable.
 *
 * Deux surfaces en découlent, qui n'existent nulle part côté web :
 *   · LE MINI-LECTEUR persistant, qui suit d'un écran à l'autre (`ds/MiniPlayer.tsx`) ;
 *   · L'ÉCRAN VERROUILLÉ, où un navigateur ne peut pas écrire (`/verrouille`).
 *
 * ── LE POIDS EST UNE DONNÉE DE PREMIER RANG ──────────────────────────────────────────────
 * Chaque carte porte sa durée ET son poids, et compare l'audio à sa transcription — « 31 Mo »
 * contre « 0 Mo ». Sur le marché visé, c'est ce chiffre-là qui décide d'écouter maintenant ou
 * d'attendre le Wi-Fi ; le cacher, c'est décider à la place de quelqu'un.
 *
 * ⚠️ LA LECTURE AUDIO N'EST PAS BRANCHÉE : elle demande `expo-audio` et un mode de fond
 * déclaré (`UIBackgroundModes: audio` côté iOS, un service de premier plan côté Android). Le
 * mini-lecteur est donc rendu dans son état de repos, et il dit ce qu'il fera. C'est le
 * chantier n° 1 de ce pôle, et il est nommé dans le README.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export default function Media() {
  const t = useToken();
  const [enLecture, setEnLecture] = useState(false);

  if (EPISODE === null || VIDEO === null) {
    return (
      <Screen territory="transforme" retour="Profil">
        <Display size={27} lines={['Rien à écouter', 'pour l’instant.']} style={{ marginTop: 10 }} />
        <SansDonnees
          quoi="le pôle média"
          degat="Un épisode inventé porte le nom d'un invité qui n'a rien enregistré, et un poids en mégaoctets qui déciderait de charger ou pas."
          style={{ marginTop: 20 }}
        />
      </Screen>
    );
  }

  /* Le rétrécissement de type ne survit pas à une closure quand la liaison vient d'un
     autre module : `onPress={() => X.y}` reperd le `non null` que la garde vient
     d'établir. Une constante LOCALE le porte jusque dans les rappels. */
  const episode = EPISODE;
  const video = VIDEO;
  return (
    <Screen
      territory="transforme"
      retour="Profil"
      droite={
        <IconButton label="Chercher un épisode">
          <Icon name="search" size={17} color={t('textBody')} strokeWidth={2.4} />
        </IconButton>
      }
      overlay={(
        <MiniPlayer
          titre={episode.titreCourt}
          position={episode.position}
          duree={episode.duree}
          enLecture={enLecture}
          tabbar={false}
          onToggle={() => setEnLecture(!enLecture)}
          onPress={() => router.push('/episode')}
        />
      )}
    >
      <SubNav
        items={[{ label: 'Écouter & regarder' }, { label: 'Le Club', color: t('mmViolet') }]}
        active="Écouter & regarder"
        onSelect={(l) => { if (l === 'Le Club') router.push('/(tabs)/club'); }}
      />

      <Eyebrow style={{ marginTop: 18 }}>Je te transforme · gratuit</Eyebrow>
      <Display size={27} lines={["DES GENS D'ICI", 'QUI RACONTENT']} style={{ marginTop: 8 }} />
      <Body muted style={{ marginTop: 12, fontSize: 14.5, lineHeight: 22 }}>
        Pas de méthode, pas de tutoriel — ça, c'est le blog. Ici, des gens qui vendent vraiment
        quelque chose racontent ce qui a marché.
      </Body>

      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
        <Tag tone="ok">Écoute gratuite, sans compte</Tag>
        <Tag tone="ok">Continue écran verrouillé</Tag>
      </View>

      <MediaCard
        format="audio"
        artHeight={150}
        titleSize={20}
        eyebrow={episode.eyebrow}
        title={episode.titre}
        body={episode.chapo}
        cost={episode.cout}
        style={{ marginTop: 18 }}
        actions={(
          <>
            <Button tone="transforme" size="sm" label="Écouter" onPress={() => router.push('/episode')} />
            <Button tone="quiet" size="sm" label="Transcription" onPress={() => router.push('/episode')} />
          </>
        )}
      />

      <MediaCard
        format="video"
        badge={video.badge}
        artHeight={126}
        eyebrow={video.eyebrow}
        title={video.titre}
        cost={video.cout}
        style={{ marginTop: 12 }}
        actions={<Button tone="quiet" size="sm" label="Regarder" onPress={() => router.push('/video')} />}
      />

      <Surface level="truth" style={{ marginTop: 16, marginBottom: 70, padding: 15 }}>
        <Eyebrow>Ce que l'app change ici</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          Sur le site, un épisode{' '}
          <Body style={{ fontWeight: '700', fontSize: 12.5 }}>s'arrête quand tu verrouilles ton téléphone</Body>.
          {' '}Ici il continue, et les commandes restent sur l'écran verrouillé. Pour 34 minutes
          écoutées dans un taxi, c'est la seule chose qui compte.
        </Body>
        <Button
          tone="quiet"
          size="sm"
          label="Voir l'écran verrouillé"
          style={{ marginTop: 12 }}
          onPress={() => router.push('/verrouille')}
        />
      </Surface>
    </Screen>
  );
}
