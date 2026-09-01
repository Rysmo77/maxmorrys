import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  Body, Button, Display, Eyebrow, Icon, Mesh, Num, Segmented, Surface, useToken,
} from '../ds';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * L'ÉPISODE — LA TRANSCRIPTION D'ABORD, ET C'EST UNE DÉCISION ÉCONOMIQUE.
 *
 * Le panier de données 2 Go coûte en médiane 4,2 % du revenu national brut par habitant sur
 * ce marché. Un épisode d'une demi-heure en audio, c'est plusieurs dizaines de mégaoctets ;
 * sa transcription arrive AVEC la fiche, dans le même document — `Podcast.transcript` est un
 * champ de texte de `src/types/index.ts`, pas un fichier à télécharger.
 *
 * Ouvrir sur la transcription, ce n'est donc pas un choix de mise en page : c'est offrir la
 * totalité du contenu pour ZÉRO octet de plus, et laisser l'audio à qui le veut. L'onglet par
 * défaut est écrit ici, en dur, et il ne dépend de rien.
 *
 * LA PORTE : RIEN NE SE CHARGE AVANT QUE TU LANCES. Le bouton d'écoute ouvre le fichier dans
 * le lecteur du système — ce port n'embarque pas de lecteur audio — et le poids est annoncé
 * AVANT, jamais après.
 *
 * ⚠️ ET LE POIDS NE S'INVENTE PAS. `Podcast` ne porte NI taille NI qualité : il a `audioUrl`,
 * `duration` (une chaîne), `transcript`, et rien qui pèse. Écrire « 31 Mo » ici serait un
 * chiffre fabriqué — et c'est exactement le chiffre sur lequel quelqu'un décide s'il peut se
 * le permettre. Il vient donc de la route quand l'appelant l'a mesuré, ou il dit qu'il manque.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
const VUES = ['Transcription', 'Chapitres', 'Notes'] as const;
const MO = 1024 * 1024;

export default function Episode() {
  const t = useToken();
  const insets = useSafeAreaInsets();
  const { titre, date, duree, transcription, audio, octets, releve } = useLocalSearchParams<{
    titre?: string;
    date?: string;
    duree?: string;
    transcription?: string;
    audio?: string;
    /** Poids de l'audio, MESURÉ par l'appelant. Absent, il ne s'estime pas. */
    octets?: string;
    releve?: string;
  }>();

  /* La transcription est ce qu'on ouvre : le seul état initial possible est le premier. */
  const [vue, setVue] = useState<string>(VUES[0]);
  const [ouverture, setOuverture] = useState(false);

  const brut = releve ? new Date(releve) : null;
  const lu = brut !== null && !Number.isNaN(brut.getTime()) ? brut : null;

  const poids = octets && Number.isFinite(Number(octets)) ? Number(octets) : null;
  const poidsMo = poids !== null ? `${(poids / MO).toFixed(0)} Mo` : null;

  async function ecouter() {
    if (!audio) return;
    setOuverture(true);
    try {
      await WebBrowser.openBrowserAsync(audio);
    } catch {
      Alert.alert(
        "Le lecteur n'a pas pu s'ouvrir",
        "Rien n'a été téléchargé, et ton forfait n'a pas bougé. La transcription reste lisible sur cet écran.",
      );
    } finally {
      setOuverture(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Mesh territory="transforme" />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 28, paddingHorizontal: 18, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Eyebrow>Je te transforme · Podcast</Eyebrow>
        <View style={{ marginTop: 8 }}>
          <Display size="sm">{titre ?? 'Cet épisode'}</Display>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
          {date ? <Body muted style={{ fontSize: 12 }}>{date}</Body> : null}
          <Num
            value={duree ?? null}
            source="db"
            asOf={lu ?? new Date(0)}
            fallback="durée non transmise"
            style={{ fontSize: 12, fontWeight: '400' }}
          />
        </View>

        {/* ── LA PORTE ─────────────────────────────────────────────────────────────────
            Le poids AVANT le geste, et le geste seulement si quelqu'un le fait. */}
        <Surface level="flat" style={{ marginTop: 18, padding: 18 }}>
          <Eyebrow>Avant d'écouter</Eyebrow>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
            <Icon name="download" size={16} color={t('textMuted')} />
            <Num
              value={poidsMo}
              source={{ cite: "poids mesuré par l'appelant, transmis avec la route" }}
              asOf={lu ?? new Date(0)}
              fallback="poids de l'audio non transmis"
              style={{ fontSize: 14 }}
            />
          </View>
          <Body muted style={{ marginTop: 8, fontSize: 12.5 }}>
            {poidsMo !== null
              ? "C'est ce que l'écoute coûtera à ton forfait. Rien ne se charge tant que tu ne lances pas."
              : "Le type Podcast, dans src/types/index.ts, ne porte ni taille ni qualité : une URL, une durée, une transcription, et rien qui pèse. Je ne t'invente donc pas de mégaoctets — c'est le chiffre sur lequel tu décides."}
          </Body>
          <Button
            tone="transforme"
            label={ouverture ? 'Ouverture…' : 'Écouter'}
            disabled={!audio || ouverture}
            onPress={() => void ecouter()}
            style={{ marginTop: 14 }}
          />
          <Body muted style={{ marginTop: 10, fontSize: 12 }}>
            {audio
              ? "L'audio s'ouvre dans le lecteur de ton téléphone : ce port n'embarque pas de lecteur à lui."
              : "Aucune URL d'audio n'est arrivée avec cette route. Le bouton reste éteint plutôt que d'ouvrir dans le vide."}
          </Body>
        </Surface>

        {/* ── CE QUI SE LIT SANS RIEN CHARGER ─────────────────────────────────────────── */}
        <Segmented options={VUES} value={vue} onChange={setVue} style={{ marginTop: 18 }} />

        <Body muted style={{ marginTop: 12, fontSize: 12 }}>
          La transcription s'affiche par défaut : elle arrive avec la fiche et se lit sans
          charger l'audio —{' '}
          <Num value={0} source={{ cite: 'champ de texte du même document' }} asOf={lu ?? new Date(0)} unit="Mo" style={{ fontSize: 12 }} />
          {poidsMo !== null ? ` contre ${poidsMo}.` : ", contre le poids de l'audio."}
        </Body>

        <Surface level="flat" style={{ marginTop: 12, padding: 18 }}>
          {vue === 'Transcription' && (
            transcription ? (
              /* La colonne de prose ne s'élargit jamais au-delà de 68 caractères — la seule
                 règle de mise en page que le système déclare non négociable. */
              <Body style={{ fontSize: 15, lineHeight: 15 * 1.62, maxWidth: 527, alignSelf: 'center' }}>
                {transcription}
              </Body>
            ) : (
              <Body muted style={{ fontSize: 13 }}>
                La transcription n'est pas arrivée avec cette route. C'est un champ facultatif
                de la fiche podcast, donc son absence peut vouloir dire deux choses :
                l'épisode n'en a pas, ou l'appelant ne l'a pas transmise. Cet écran ne tranche
                pas à leur place.
              </Body>
            )
          )}

          {vue === 'Chapitres' && (
            <Body muted style={{ fontSize: 13 }}>
              La fiche podcast ne porte pas de chapitres : Podcast, dans src/types/index.ts,
              n'a pas de champ pour eux. Il n'y a donc rien à lire ici — et fabriquer des
              horodatages plausibles ferait chercher, dans l'audio, des passages qui n'y sont
              pas.
            </Body>
          )}

          {vue === 'Notes' && (
            <Body muted style={{ fontSize: 13 }}>
              Tes notes vivent sur ton compte, et ce port ne lit pas encore la base. Elles ne
              sont ni affichées ni perdues : elles sont ailleurs.
            </Body>
          )}
        </Surface>
      </ScrollView>
    </View>
  );
}
