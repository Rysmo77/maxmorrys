import { useState } from 'react';
import { Share, View } from 'react-native';
import { router } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import {
  Body, Button, Display, Eyebrow, Gradient, Icon, IconButton, Num, SansDonnees, Screen, Segmented, Surface, isIOS, useActionGradient, useToken, veil, POLICE,
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


  const media = useMedia();
  const episode = media.valeur?.episode ?? null;

  if (episode === null) {
    return (
      <Screen territory="transforme" espace="hub" retour="Écouter">
        <Display size={27} lines={media.phase === 'charge' || media.phase === 'restauration' ? ['Cet épisode.'] : ['Cet épisode', 'n’est pas chargé.']} style={{ marginTop: 10 }} />
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
      espace="hub"
      retour="Écouter"
      titre={isIOS ? undefined : 'Épisode'}
      droite={episode.lien ? (
        <IconButton
          label="Partager cet épisode"
          onPress={() => { void Share.share({ message: `${episode.titre}\n${episode.lien}`, url: episode.lien ?? undefined }); }}
        >
          <Icon name="share" size={17} color={t('textBody')} strokeWidth={2} />
        </IconButton>
      ) : undefined}
    >
      <Eyebrow style={{ marginTop: 6 }}>{episode.eyebrow}</Eyebrow>
      <Display size={27} lines={coupe(episode.titre)} style={{ marginTop: 8 }} />
      <Num
        value={[episode.duree, episode.invitee].filter(Boolean).join(' · ') || null}
        {...provenance(media)}
        style={{ fontSize: 12, color: t('textMuted'), marginTop: 10 }}
      />

      {/* ── L'ÉCOUTE ───────────────────────────────────────────────────────────────────
          ⚠️ UN FAUX LECTEUR A ÉTÉ RETIRÉ ICI : un bouton pause dessiné, « −15 » et « +15 »,
          « Télécharger » et « 1× » éteints — cinq contrôles qui ne pilotaient rien, en état
          « lecture en cours ». L'application n'a pas de lecteur audio (`expo-audio` n'est
          pas installé). L'épisode s'écoute là où il est publié, et l'écran le dit. */}
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{
            width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center',
            backgroundColor: veil(t('paperFixed'), 0.22),
          }}>
            <Icon name="mic" size={22} color={t('paperFixed')} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Body style={{ color: t('paperFixed'), fontWeight: '700' }}>
              {episode.lien ? "S'écoute sur Spotify" : "L'audio n'est pas encore en ligne"}
            </Body>
            {episode.duree ? (
              <Body style={{ fontFamily: POLICE.mono, fontSize: 12, color: t('paperFixed'), marginTop: 2 }}>
                {episode.duree}
              </Body>
            ) : null}
          </View>
        </View>
        {episode.lien ? (
          <Button
            tone="quiet"
            size="sm"
            label="Écouter"
            trailing="external"
            style={{ marginTop: 14 }}
            onPress={() => { void openBrowserAsync(episode.lien as string); }}
          />
        ) : null}
      </Gradient>

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
