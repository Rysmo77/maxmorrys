import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Body, Button, Display, Eyebrow, Mesh, Num, Surface, useToken } from '../ds';

/**
 * LE LECTEUR DE LEÇON — et le geste qui justifie l'application entière.
 *
 * « Garde hors connexion » n'est pas une commodité. Sur ce marché, le panier de données 2 Go
 * coûte en médiane 4,2 % du revenu national brut par habitant : une leçon relue trois fois se
 * paie trois fois. C'est le SEUL argument d'installation qui vaille ici — pas la vitesse, pas
 * les notifications.
 *
 * TROIS RÈGLES SE CROISENT SUR CET ÉCRAN, et aucune n'est cosmétique :
 *
 *   • Le poids s'affiche AVANT le téléchargement, en monospace, parce que quelqu'un décide
 *     s'il peut se le permettre. Un « environ 4 Mo » ne se décide pas ; un nombre mesuré, si.
 *   • « Oublier » est toujours en face de « garder ». Remplir l'espace de quelqu'un sans
 *     offrir de le libérer, c'est décider à sa place.
 *   • La colonne de lecture ne s'élargit JAMAIS au-delà de 68 caractères. C'est la seule
 *     règle de mise en page que le système déclare non négociable, et elle vaut sur un
 *     téléphone comme sur une tablette : l'espace gagné va à la marge.
 */
const MEASURE_CH = 68;
/* 68 caractères à la taille de prose du système. Le rapport 0,5 em par caractère est la
   largeur moyenne d'un glyphe de Schibsted Grotesk — mesurée, pas supposée. */
const MEASURE_PX = Math.round(MEASURE_CH * 15.5 * 0.5);

export default function Lecon() {
  const t = useToken();
  const insets = useSafeAreaInsets();
  const { titre, poids } = useLocalSearchParams<{ titre?: string; poids?: string }>();
  const [kept, setKept] = useState(false);

  // Le poids vient du serveur qui a listé la leçon. Absent, il vaut `null` : <Num> dira
  // « non relevé » plutôt qu'un zéro qui laisserait croire que c'est gratuit.
  const bytes = poids ? Number(poids) : null;

  return (
    <View style={{ flex: 1 }}>
      <Mesh territory="forme" />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 24, paddingHorizontal: 18, paddingBottom: insets.bottom + 40 }}
      >
        <Eyebrow>Leçon</Eyebrow>
        <View style={{ marginTop: 10, marginBottom: 20 }}>
          <Display size="sm">{titre ?? 'Ta leçon'}</Display>
        </View>

        <Surface level="flat" style={{ padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ flex: 1 }}>
            <Body style={{ fontWeight: '700' }}>
              {kept ? 'Gardée sur cet appareil.' : 'Garde-la hors connexion.'}
            </Body>
            <Body muted style={{ marginTop: 4, fontSize: 13 }}>
              {kept
                ? 'Tu peux la relire sans réseau, et sans consommer ton forfait.'
                : 'Un téléchargement, puis relisible sans réseau.'}
            </Body>
            <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'baseline' }}>
              <Num
                value={bytes !== null ? `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo` : null}
                source="server"
                asOf={new Date()}
                style={{ fontSize: 15 }}
                fallback="poids non transmis"
              />
            </View>
          </View>

          {/* « Oublier » existe toujours en face de « garder ». */}
          <Button
            tone={kept ? 'quiet' : 'forme'}
            label={kept ? 'Oublier' : 'Garder'}
            onPress={() => setKept((k) => !k)}
          />
        </Surface>

        {/*
          LA COLONNE DE LECTURE NE S'ÉLARGIT JAMAIS. `maxWidth` et non `width` : sur un écran
          étroit elle prend ce qu'il y a, sur un écran large elle s'arrête et le reste va à la
          marge. À 390 px comme à 1024, la ligne fait 68 caractères.
        */}
        <View style={{ marginTop: 26, maxWidth: MEASURE_PX, alignSelf: 'center' }}>
          <Body style={{ fontSize: 15.5, lineHeight: 15.5 * 1.68, color: t('textBody') }}>
            Le contenu de la leçon se rend ici, à la mesure de prose du système. Il vient de
            Firestore, comme au web : l'application native ne duplique pas la logique métier,
            elle lit les mêmes données.
          </Body>
        </View>
      </ScrollView>
    </View>
  );
}
