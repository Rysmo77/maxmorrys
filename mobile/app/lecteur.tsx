import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Body, Button, Eyebrow, Icon, SansDonnees, Screen, Surface, useToken, nonBranche } from '../ds';
import { texte } from './club/_layout';

/** Aucune source serveur pour ces blocs : la phase est dite, pas supposée. */
const NON_BRANCHE = nonBranche();

/**
 * ══ 16 · LECTEUR PAYSAGE ══ (maquette Rysmo-iOS-16 ; PRD rév. 6 §5.5, FR-296).
 *
 * La maquette est un lecteur intégré, en paysage, avec ±15 s et la transcription synchronisée
 * à droite. Deux choses manquent pour le tenir : un lecteur natif dans le paquet (aucun module
 * vidéo n'y est, et le verrou de fichier interdit d'en ajouter un dans ce lot) et des fichiers
 * lisibles — les leçons servent une adresse d'INTÉGRATION, pas un fichier. La scène et ses
 * commandes sont donc dessinées sans être actives, et le dit ; la vidéo s'ouvre en attendant
 * dans le navigateur, depuis la leçon. La transcription n'a pas de source : elle n'est pas écrite.
 */
export default function Lecteur() {
  const t = useToken();
  const p = useLocalSearchParams<{ titre?: string; module?: string }>();
  return (
    <Screen dark territory="nuit" espace="edu" maillage={false} retour="Leçon" titre={texte(p.titre) ?? 'Lecteur'}>
      <Surface level="ink" style={{ marginTop: 10, aspectRatio: 16 / 9, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 28, opacity: 0.45 }}>
          <Body style={{ color: t('paperFixed'), fontSize: 15 }}>−15</Body>
          <Icon name="play" size={34} color={t('paperFixed')} />
          <Body style={{ color: t('paperFixed'), fontSize: 15 }}>+15</Body>
        </View>
      </Surface>
      <Eyebrow style={{ marginTop: 14 }}>{texte(p.module) ?? 'Ta leçon'}</Eyebrow>
      <SansDonnees
        etat={NON_BRANCHE}
        quoi="le lecteur intégré"
        origine="d'un fichier vidéo lisible par l'application"
        degat="Des commandes qui ne lisent rien feraient croire à une vidéo en panne. Elles restent grisées tant que le lecteur n'existe pas."
        style={{ marginTop: 12 }}
      />
      <SansDonnees
        etat={NON_BRANCHE}
        quoi="la transcription synchronisée"
        origine="du serveur"
        degat="Une transcription inventée mettrait dans la bouche de la leçon des phrases qu'elle ne dit pas."
        style={{ marginTop: 12 }}
      />
      <Button tone="quiet" label="Revenir à la leçon" style={{ marginTop: 16 }} onPress={() => router.back()} />
    </Screen>
  );
}
