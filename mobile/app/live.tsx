import { View } from 'react-native';
import { router } from 'expo-router';
import {
  Body, Button, Display, Eyebrow, Icon, Rubrique, SansDonnees, Screen, Surface, isIOS, useToken, nonBranche
} from '../ds';
import { Verite } from '../ecrans/Verite';

/** Aucune source serveur pour ces blocs : la phase est dite, pas supposée. */
const NON_BRANCHE = nonBranche();

/**
 * ══ 20 · LIVE DE COHORTE ══ (maquette Rysmo-iOS-20).
 *
 * La maquette est un direct : la scène vidéo, « audio seul », « lever la main », les questions
 * votées et le champ pour en poser une. Rien de cela n'est diffusé à l'application — ni flux, ni
 * salle, ni file de questions. La scène est construite, vide, et le dit. Les deux boutons du
 * direct ne sont pas posés : une main levée dans une salle qui n'existe pas est un geste perdu.
 * Les débits de la maquette (« 4 Mo par minute ») ne sont pas mesurés : ils sont masqués.
 */
export default function Live() {
  const t = useToken();
  return (
    <Screen territory="forme" retour="Cohorte" titre={isIOS ? undefined : 'Live de cohorte'}>
      <Eyebrow style={{ marginTop: 6 }}>Avec Max-Morrys</Eyebrow>
      <Display size={28} lines={['Live de cohorte']} style={{ marginTop: 6 }} />

      <Surface level="ink" style={{ marginTop: 16, aspectRatio: 16 / 9, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <View style={{ alignItems: 'center', gap: 10 }}>
          <Icon name="video" size={28} color={t('paperFixed')} />
          <Body style={{ color: t('paperFixed'), textAlign: 'center', fontSize: 14 }}>
            Aucun live n'est diffusé dans l'application pour l'instant.
          </Body>
        </View>
      </Surface>

      <Rubrique>Questions · votées</Rubrique>
      <SansDonnees
        etat={NON_BRANCHE}
        quoi="les questions du live"
        origine="du serveur"
        degat="Une question votée porte le nom de la personne qui l'a posée. Aucune n'est affichée tant que le live ne les transmet pas."
      />

      <Verite titre="Ce que le live consomme">
        Le poids d'une minute de vidéo et d'audio seul sera mesuré et affiché ici avant que tu
        lances quoi que ce soit. Aucune estimation n'est écrite à la place.
      </Verite>
      <Button tone="quiet" label="Revenir à la cohorte" style={{ marginTop: 16 }} onPress={() => router.back()} />
    </Screen>
  );
}
