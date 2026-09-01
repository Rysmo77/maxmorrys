import { useState } from 'react';
import { Alert, Image, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  Body, Button, Display, Eyebrow, Icon, Mesh, Num, PayOption, Surface, Tag, useToken,
} from '../ds';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LA VIDÉO — LA PORTE, ET LA VÉRITÉ SUR LA QUALITÉ PLUTÔT QUE SON IMITATION.
 *
 * ── CE QUE J'AI VÉRIFIÉ AVANT D'ÉCRIRE CET ÉCRAN ──
 * `Video`, dans `src/types/index.ts`, porte : id, title, slug, description, `videoUrl`,
 * `thumbnailUrl`, `duration` (une CHAÎNE, « 18:04 »), publishedAt, category, status, `views`,
 * et les champs de référencement. IL N'Y A NI VARIANTE DE QUALITÉ, NI TAILLE DE FICHIER —
 * ni pour la vidéo, ni pour la vignette. `Podcast` est logé à la même enseigne.
 *
 * La maquette propose « 480p — 24 Mo » et « 720p HD — 96 Mo ». Ces quatre nombres n'existent
 * nulle part dans la donnée. Les écrire ferait décider quelqu'un — sur ce marché, décider
 * s'il peut se le permettre — à partir d'un chiffre fabriqué. C'est le seul endroit de
 * l'écran où mentir a un coût direct, en francs, pour la personne devant.
 *
 * DONC : LA PORTE EST CONSTRUITE, LE FAUX MENU NE L'EST PAS.
 *
 *   • Rien ne se charge à l'arrivée. Pas même la VIGNETTE : `thumbnailUrl` est une image
 *     réseau, et l'afficher d'office prélèverait le forfait de quelqu'un qui n'a rien demandé.
 *   • Le choix se fait AVANT, et il porte sur ce qui est vrai : voir l'aperçu, ou lancer.
 *   • Le poids annoncé vient de la route quand l'appelant l'a mesuré. Sinon `<Num>` écrit
 *     « non transmis » — ce qui est une information, là où « environ 25 Mo » n'en est pas une.
 *
 * ⚠️ À ROUVRIR CÔTÉ DONNÉES. Tant que `Video` ne porte pas de rendus multiples et leur taille,
 * aucun écran ne pourra offrir un vrai choix de qualité. C'est une lacune du modèle, pas de
 * cette page — et c'est là qu'il faut la corriger.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
const MO = 1024 * 1024;
type Choix = 'apercu' | 'lecture';

export default function Video() {
  const t = useToken();
  const insets = useSafeAreaInsets();
  const { titre, date, duree, video, apercu, octets, releve } = useLocalSearchParams<{
    titre?: string;
    date?: string;
    duree?: string;
    video?: string;
    apercu?: string;
    /** Poids MESURÉ par l'appelant. `Video` ne le porte pas : sans mesure, pas de nombre. */
    octets?: string;
    releve?: string;
  }>();

  const [choix, setChoix] = useState<Choix | null>(null);
  const [vignette, setVignette] = useState(false);
  const [ouverture, setOuverture] = useState(false);

  const brut = releve ? new Date(releve) : null;
  const lu = brut !== null && !Number.isNaN(brut.getTime()) ? brut : null;
  const poids = octets && Number.isFinite(Number(octets)) ? Number(octets) : null;
  const poidsMo = poids !== null ? `${(poids / MO).toFixed(0)} Mo` : null;

  async function lancer() {
    // La porte : ce sont ces deux lignes, et rien avant elles. Aucun octet ne part de cet
    // écran tant que `choix` vaut `null`.
    if (choix === 'apercu') { setVignette(true); return; }
    if (choix !== 'lecture' || !video) return;
    setOuverture(true);
    try {
      await WebBrowser.openBrowserAsync(video);
    } catch {
      Alert.alert(
        "Le lecteur n'a pas pu s'ouvrir",
        "Rien n'a été téléchargé, et ton forfait n'a pas bougé. La fiche reste lisible ici.",
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
        <Eyebrow>Je te transforme · Vidéo</Eyebrow>
        <View style={{ marginTop: 8 }}>
          <Display size="sm">{titre ?? 'Cette vidéo'}</Display>
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

        {/* ── L'EMPLACEMENT D'IMAGE, VIDE TANT QU'ON NE L'A PAS DEMANDÉ ────────────────── */}
        <Surface
          level="flat"
          style={{
            marginTop: 16, height: 190, overflow: 'hidden',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          {vignette && apercu ? (
            <Image
              source={{ uri: apercu }}
              accessibilityLabel={titre ? `Aperçu de « ${titre} »` : 'Aperçu de la vidéo'}
              resizeMode="cover"
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <>
              <View style={{
                width: 62, height: 62, borderRadius: 31,
                alignItems: 'center', justifyContent: 'center', backgroundColor: t('fill2'),
              }}>
                <Icon name="play" size={20} color={t('ink2')} />
              </View>
              <Body muted style={{ marginTop: 12, fontSize: 12 }}>
                {apercu ? "L'aperçu n'est pas chargé." : "Aucun aperçu n'est arrivé avec cette route."}
              </Body>
            </>
          )}
          {duree ? (
            <View style={{ position: 'absolute', left: 14, top: 14 }}>
              <Tag>{duree}</Tag>
            </View>
          ) : null}
        </Surface>

        {/* ── AVANT DE LANCER ─────────────────────────────────────────────────────────── */}
        <Surface level="flat" style={{ marginTop: 16, padding: 18 }}>
          <Eyebrow>Avant de lancer</Eyebrow>
          <Body muted style={{ marginTop: 7, fontSize: 13.5 }}>
            Choisis ce que tu veux charger. Rien ne se télécharge tant que tu n'as pas choisi.
          </Body>

          <View style={{ gap: 9, marginTop: 13 }}>
            <PayOption
              title="L'aperçu seul"
              note={apercu ? 'une image, et rien de plus' : 'aucun aperçu transmis'}
              on={choix === 'apercu'}
              onPress={apercu ? () => setChoix('apercu') : undefined}
            />
            <PayOption
              title="La vidéo entière"
              note={video ? 'elle part dans le lecteur du système' : 'aucune URL transmise'}
              on={choix === 'lecture'}
              onPress={video ? () => setChoix('lecture') : undefined}
            />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 }}>
            <Icon name="download" size={16} color={t('textMuted')} />
            <Num
              value={choix === 'lecture' ? poidsMo : null}
              source={{ cite: "poids mesuré par l'appelant, transmis avec la route" }}
              asOf={lu ?? new Date(0)}
              fallback={choix === null ? 'rien de choisi, rien de chargé' : 'poids non transmis'}
              style={{ fontSize: 14 }}
            />
          </View>

          <Button
            tone="transforme"
            label={ouverture ? 'Ouverture…' : choix === 'apercu' ? "Afficher l'aperçu" : 'Lancer la vidéo'}
            disabled={choix === null || ouverture || (choix === 'apercu' && vignette)}
            onPress={() => void lancer()}
            style={{ marginTop: 14 }}
          />
        </Surface>

        {/* ── LA VÉRITÉ SUR LA QUALITÉ ────────────────────────────────────────────────── */}
        <Surface level="truth" style={{ marginTop: 16, padding: 18 }}>
          <Eyebrow>Pourquoi il n'y a pas de 480p ni de 720p</Eyebrow>
          <Body muted style={{ marginTop: 6, fontSize: 12.5 }}>
            La fiche vidéo ne porte qu'une seule URL, sans variante de qualité ni taille de
            fichier — c'est le type Video, dans src/types/index.ts, et tu peux le vérifier. Un menu
            « 480p · 24 Mo / 720p · 96 Mo » serait donc quatre nombres inventés, sur lesquels
            tu déciderais de dépenser ton forfait. Je préfère te dire que je ne sais pas.
          </Body>
        </Surface>

        {/* ── CE QU'IL Y A DEDANS ─────────────────────────────────────────────────────── */}
        <Eyebrow style={{ marginTop: 22 }}>Ce qu'il y a dedans</Eyebrow>
        <Surface level="flat" style={{ marginTop: 10, padding: 18 }}>
          <Body muted style={{ fontSize: 13 }}>
            La fiche vidéo ne porte pas de chapitres : il n'y a pas de champ pour eux. Les
            chapitres se liraient sans lancer la vidéo, et c'est souvent tout ce qu'on cherche —
            raison de plus pour ne pas en fabriquer : quelqu'un lancerait la vidéo pour y
            chercher un passage qui n'y est pas.
          </Body>
        </Surface>
      </ScrollView>
    </View>
  );
}
