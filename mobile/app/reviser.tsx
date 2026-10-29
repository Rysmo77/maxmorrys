import { router } from 'expo-router';
import { Button, Display, Eyebrow, SansDonnees, Screen, isIOS, nonBranche, useTutorNom } from '../ds';
import { Verite } from '../ecrans/Verite';

/**
 * ══ 38 · RÉVISER ══ (maquette Rysmo-iOS-38).
 *
 * La maquette liste trois notions avec un pourcentage de maîtrise et la raison de les revoir
 * (une erreur au quiz, le sujet de la dernière question, une leçon pas revue depuis 6 jours).
 * Ce pourcentage n'existe nulle part : ni le serveur ni l'application ne mesurent une maîtrise.
 * Un « 40 % » inventé déciderait de ce qu'on révise. La liste est donc vide, et le dit ; la
 * révision express n'est pas proposée tant qu'elle n'a rien à réviser.
 */
export default function Reviser() {
  const ia = useTutorNom();
  return (
    <Screen espace="ia" territory="transforme" retour="Assistant" titre={isIOS ? undefined : 'Réviser'}>
      <Eyebrow style={{ marginTop: 6 }}>{`Ce que ${ia} te propose de revoir`}</Eyebrow>
      <Display size={28} lines={['Réviser']} style={{ marginTop: 6 }} />
      <SansDonnees
        etat={nonBranche()}
        quoi="les notions à revoir"
        origine="du serveur"
        style={{ marginTop: 18 }}
        action={<Button tone="transforme" size="sm" label="Poser une question" onPress={() => router.navigate('/repetiteur')} />}
      />
      <Verite titre="Ce que mesurera le pourcentage">
        Ta maîtrise d'après tes quiz et tes révisions. Il ne validera rien : seul le quiz du module
        le fait. La révision express ne comptera pas dans ton quota.
      </Verite>
    </Screen>
  );
}
