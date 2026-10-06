import { router } from 'expo-router';
import {
  Body, Button, Display, Eyebrow, MediaCard, SansDonnees, Screen, SubNav, Tag, useToken,
} from '../ds';
import { useMedia } from '../donnees';
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
 * déclaré (`UIBackgroundModes: audio` côté iOS, un service de premier plan côté Android).
 *
 * LE MINI-LECTEUR A DONC ÉTÉ RETIRÉ DE CET ÉCRAN, et ce n'est pas un renoncement. Il exigeait
 * `position` — « 08:12 » — une valeur que seul un lecteur peut produire, et qu'il prenait au
 * contenu de démonstration. Un lecteur au repos affichant une position inventée n'est pas un
 * état de repos : c'est une lecture en cours qui n'existe pas. Il revient avec le lecteur,
 * chantier n° 1 de ce pôle.
 *
 * ── CET ÉCRAN LIT LE SERVEUR ─────────────────────────────────────────────────────────────
 * `useMedia()` était défini, `appMedia` était servi, et AUCUN écran ne les appelait : le seul
 * hook orphelin de toute la porte. L'écran lisait `contenu/demo` en direct, donc il était vide
 * en production — et il se rendait vide sur un seul des deux médias manquant, alors que le
 * podcast et la vidéo se publient indépendamment.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export default function Media() {
  const t = useToken();
  const media = useMedia();
  const episode = media.valeur?.episode ?? null;
  const video = media.valeur?.video ?? null;

  /* Les deux médias se publient INDÉPENDAMMENT : un podcast sans vidéo de la semaine est un
     état normal, pas une panne. On ne referme donc l'écran que si les DEUX manquent. */
  if (episode === null && video === null) {
    return (
      <Screen territory="transforme" retour="Profil">
        <Display size={27} lines={['Rien à écouter', 'pour l’instant.']} style={{ marginTop: 10 }} />
        <SansDonnees
          quoi="le pôle média"
          degat="Un épisode inventé porte le nom d'un invité qui n'a rien enregistré, et un poids en mégaoctets qui déciderait de charger ou pas."
          etat={media}
          style={{ marginTop: 20 }}
        />
      </Screen>
    );
  }

  return (
    <Screen territory="transforme" retour="Profil">
      <SubNav
        items={[{ label: 'Écouter & regarder' }, { label: 'Le Club', color: t('mmViolet') }]}
        active="Écouter & regarder"
        onSelect={(l) => { if (l === 'Le Club') router.push('/(tabs)/club'); }}
      />

      <Eyebrow style={{ marginTop: 18 }}>Je te transforme</Eyebrow>
      <Display size={27} lines={["DES GENS D'ICI", 'QUI RACONTENT']} style={{ marginTop: 8 }} />
      <Body muted style={{ marginTop: 12, fontSize: 14.5, lineHeight: 22 }}>
        Pas de méthode, pas de tutoriel — ça, c'est le blog. Ici, des gens qui vendent vraiment
        quelque chose racontent ce qui a marché.
      </Body>

      {/* « Continue écran verrouillé » est parti : le binaire n'a aucun lecteur audio. Et
          « sans compte » était faux — la vue exige une session. */}
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
        <Tag tone="ok">Inclus avec ton compte</Tag>
        <Tag>Transcription lisible sans charger l'audio</Tag>
      </View>

      {episode === null ? null : (
        <MediaCard
          format="audio"
          artHeight={150}
          titleSize={20}
          eyebrow={episode.eyebrow}
          title={episode.titre}
          body={episode.chapo ?? undefined}
          cost={episode.cout}
          style={{ marginTop: 18 }}
          actions={(
            <>
              <Button tone="transforme" size="sm" label="Ouvrir l'épisode" onPress={() => router.push('/episode')} />
            </>
          )}
        />
      )}

      {/* Pas de `badge` : le kit en dessinait un (« Vidéo · 16:9 ») que le modèle ne porte
          nulle part. Un format d'image affirmé sans le connaître se trompe une fois sur deux. */}
      {video === null ? null : (
        <MediaCard
          format="video"
          artHeight={126}
          eyebrow={video.eyebrow}
          title={video.titre}
          cost={video.cout}
          style={{ marginTop: 12 }}
          /* La fiche vidéo reçoit ce qu'elle affiche. Ouverte sans paramètre, elle ne savait
             ni quoi lancer ni comment s'appelait ce qu'on venait de toucher : un cul-de-sac. */
          actions={(
            <Button
              tone="quiet"
              size="sm"
              label="Regarder"
              onPress={() => router.push({
                pathname: '/video',
                params: {
                  titre: video.titre,
                  ...(video.lien ? { video: video.lien } : {}),
                  ...(media.phase === 'servie' ? { releve: media.asOf.toISOString() } : {}),
                },
              })}
            />
          )}
        />
      )}
    </Screen>
  );
}
