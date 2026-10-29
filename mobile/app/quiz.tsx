import { useLocalSearchParams } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import {
  Button, Display, Eyebrow, ProgressBar, SansDonnees, Screen, useTutorNom, nonBranche
} from '../ds';
import { texte } from './club/_layout';
import { Verite } from '../ecrans/Verite';
import { SITE_EDU } from '../contenu/termes';

/** Aucune source serveur pour ces blocs : la phase est dite, pas supposée. */
const NON_BRANCHE = nonBranche();

/**
 * ══ 17 · QUIZ DU MODULE ══ (maquette Rysmo-iOS-17 ; PRD rév. 6, C-08 : « dans l'app, comptés
 * par le serveur comme sur le site »).
 *
 * La moitié serveur n'existe pas encore : aucun appel ne compte une réponse donnée dans
 * l'application. Rejouer les questions ici serait mentir sur ce qui compte — un module validé
 * au téléphone et non validé sur le site. L'écran porte donc la structure de la maquette (barre,
 * progression, encart de l'assistant en pause) et un état vide qui le dit, avec une sortie vers
 * le lecteur du site, où les réponses sont comptées aujourd'hui.
 */
export default function Quiz() {
  const p = useLocalSearchParams<{ titre?: string; module?: string; slug?: string }>();
  const ia = useTutorNom();
  const slug = texte(p.slug);
  return (
    <Screen territory="forme" retour="Leçon" titre={texte(p.titre) ?? 'Quiz du module'}>
      <ProgressBar value={0} height={6} territory="forme" style={{ marginTop: 6 }} />
      <Eyebrow style={{ marginTop: 16 }}>{texte(p.module) ?? 'Quiz du module'}</Eyebrow>
      <Display size={24} maxLignes={3} style={{ marginTop: 8 }}>Le quiz se joue ici dès que le serveur le compte.</Display>
      <SansDonnees
        etat={NON_BRANCHE}
        quoi="les questions du quiz"
        origine="du serveur"
        degat="Un quiz rejoué sans être compté validerait un module au téléphone qui ne l'est pas sur ton compte."
        style={{ marginTop: 16 }}
      />
      <Verite titre={`${ia} est en pause`}>
        Pendant le quiz, il ne répond pas. Il revient dès la dernière question, pour t'expliquer tes
        erreurs.
      </Verite>
      <Button
        tone="forme"
        label="Faire le quiz sur le site"
        trailing="external"
        style={{ marginTop: 18 }}
        onPress={() => { void openBrowserAsync(slug ? `${SITE_EDU}/cours/${slug}` : `${SITE_EDU}/mes-formations`); }}
      />
    </Screen>
  );
}
