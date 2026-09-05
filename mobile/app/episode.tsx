import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import {
  Body, Button, Display, Eyebrow, Gradient, Icon, IconButton, Num, SansDonnees, Screen, Segmented, Surface, isIOS, useActionGradient, useToken, veil,
} from '../ds';
import { provenance, useMedia } from '../donnees';

/**
 * ══ 2 · L'ÉPISODE ══
 *
 * **LA TRANSCRIPTION EST AFFICHÉE PAR DÉFAUT.** C'est la décision du web, et elle tient
 * exactement pour la même raison ici : elle se lit sans charger l'audio —
 * <b>0 Mo contre 31</b>. Sur un forfait compté, c'est la différence entre lire l'épisode
 * maintenant et le remettre à un Wi-Fi qu'on n'aura peut-être pas.
 *
 * CE QUE LE NATIF AJOUTE, ET QU'UN NAVIGATEUR NE GARDE PAS D'UNE SESSION À L'AUTRE :
 *   · LE TÉLÉCHARGEMENT, avec son poids écrit sur le bouton — quand ce poids existera.
 *   · LA VITESSE DE LECTURE, qui reste choisie au prochain épisode.
 *
 * Et, surtout, la lecture qui SURVIT au verrouillage — c'est le sujet de tout le pôle.
 *
 * ── CE QUE CET ÉCRAN A CESSÉ D'AFFIRMER (05/09/2026) ─────────────────────────────────────
 * Il lisait `contenu/demo` en direct, donc il était VIDE en production. Pire : son titre,
 * son sourcil et son numéro d'épisode étaient écrits EN DUR — « Podcast · épisode 1 »,
 * « Vendre sans / budget pub. » — c'est-à-dire le titre de l'épisode de démonstration,
 * affiché quel que soit l'épisode réellement publié.
 *
 * ⚠️ L'ONGLET « CHAPITRES » A ÉTÉ RETIRÉ. Il réutilisait les lignes de la transcription en
 * leur mettant une icône de lecture — donc il affirmait des chapitres qui n'existent nulle
 * part, ni dans le modèle ni dans le kit. Un chapitrage se produit ; il ne se déduit pas
 * d'une transcription.
 *
 * ⚠️ LA TRANSCRIPTION EST DU TEXTE, PAS DES LIGNES HORODATÉES. Le kit la dessinait en
 * « 00:42 · … » ; `Podcast.transcript` est une chaîne markdown. On rend donc des paragraphes
 * plutôt que d'inventer des minutages qu'aucun champ ne porte.
 */
const VUES = ['Transcription', 'Notes'] as const;

export default function Episode() {
  const t = useToken();
  const g = useActionGradient();
  const [vue, setVue] = useState<string>('Transcription');

  /* La vitesse n'est plus un ÉTAT : rien ne la lit, et un état qui ne pilote rien finit par
     se faire brancher sur autre chose. Elle redeviendra un état le jour où un lecteur la
     recevra — `expo-audio` expose `setPlaybackRate`. En attendant, c'est la valeur affichée
     par un bouton éteint, et rien de plus. */
  const vitesse = 1;

  const media = useMedia();
  const episode = media.valeur?.episode ?? null;

  if (episode === null) {
    return (
      <Screen territory="transforme" retour="Écouter">
        <Display size={27} lines={['Cet épisode', 'n’est pas chargé.']} style={{ marginTop: 10 }} />
        <SansDonnees
          quoi="cet épisode"
          degat="Une transcription fabriquée met des phrases dans la bouche de quelqu'un. C'est le seul contenu du produit où l'invention se lit comme une citation."
          etat={media}
          style={{ marginTop: 20 }}
        />
      </Screen>
    );
  }

  /* Le titre se coupe en deux lignes sur le dernier espace de sa première moitié : le kit
     dessine deux lignes, et un titre servi n'a aucune raison d'en faire une. */
  const coupe = (titre: string): string[] => {
    const mots = titre.split(' ');
    if (mots.length < 3) return [titre];
    const milieu = Math.ceil(mots.length / 2);
    return [mots.slice(0, milieu).join(' '), mots.slice(milieu).join(' ')];
  };

  const paragraphes = (episode.transcription ?? '')
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

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
      <Eyebrow style={{ marginTop: 6 }}>{episode.eyebrow}</Eyebrow>
      <Display size={27} lines={coupe(episode.titre)} style={{ marginTop: 8 }} />
      <Num
        value={[episode.duree, episode.invitee].filter(Boolean).join(' · ') || null}
        {...provenance(media)}
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

        {/* ⚠️ LA BARRE DE PROGRESSION A ÉTÉ RETIRÉE. Elle affichait une position (« 08:12 »)
            et un remplissage de 24 % en dur, sans aucun lecteur derrière : une lecture en
            cours qui n'existait pas. Seule la durée reste — c'est une donnée du modèle. */}
        {episode.duree === null ? null : (
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
            <Body style={{ fontFamily: 'JetBrainsMono', fontSize: 11, color: t('paperFixed') }}>
              {episode.duree}
            </Body>
          </View>
        )}
      </Gradient>

      {/* Ce que le navigateur ne garde pas d'une session à l'autre. */}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
        <Button
          tone="quiet"
          size="sm"
          fullWidth
          /* Le libellé portait « · 31 Mo », un poids que la base ne produit nulle part :
             `podcasts` n'a ni fichier ni taille, `audioUrl` pointe vers Spotify. Un poids
             annoncé sur un bouton décide d'un achat de crédit ; il ne s'estime pas. */
          label="Télécharger"
          icon="download"
          disabled
          style={{ flex: 1 }}
        />
        {/* ⚠️ CE BOUTON RÉPONDAIT AU DOIGT ET NE PILOTAIT RIEN. Il faisait tourner son
            libellé 1× → 1,25× → 1,5× → 2× sur un état local, sans lecteur derrière — le
            contrôle le plus trompeur du pôle média, parce qu'un bouton qui RÉAGIT se lit
            comme un bouton qui AGIT. Et il était invisible pour la porte des contrôles
            morts, qui cherche un `onPress` absent : celui-ci en avait un.

            Éteint jusqu'à ce qu'`expo-audio` arrive. Il garde sa place et sa valeur —
            l'écran continue de dire ce qu'il proposera — mais il ne fait plus semblant. */}
        <Button tone="quiet" size="sm" label={`${vitesse}×`} disabled />
      </View>

      <Segmented options={VUES} value={vue} onChange={setVue} style={{ marginTop: 16 }} />

      {vue === 'Transcription' ? (
        <>
          <Body muted style={{ fontSize: 12, lineHeight: 18, marginTop: 12 }}>
            Affichée par défaut : elle se lit sans charger l'audio.
          </Body>
          {paragraphes.length === 0 ? (
            <SansDonnees
              quoi="la transcription de cet épisode"
              degat="Une transcription fabriquée met des phrases dans la bouche de quelqu'un. C'est le seul contenu du produit où l'invention se lit comme une citation."
              etat={media}
              hauteur={3}
              style={{ marginTop: 12 }}
            />
          ) : (
            <Surface level="flat" style={{ marginTop: 12, padding: 16 }}>
              {paragraphes.map((bloc, i) => (
                <Body
                  key={bloc.slice(0, 40)}
                  muted
                  style={{ fontSize: 13.5, lineHeight: 21, marginTop: i === 0 ? 0 : 12 }}
                >
                  {bloc}
                </Body>
              ))}
            </Surface>
          )}
        </>
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
