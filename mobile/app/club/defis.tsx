import { Display, Rubrique, SansDonnees, nonBranche } from '../../ds';
import { ClubScreen } from './_layout';
import { Verite } from '../../ecrans/Verite';

/** Aucune source serveur pour ces blocs : la phase est dite, pas supposée. */
const NON_BRANCHE = nonBranche();

/**
 * ══ 31 · DÉFIS ══ (maquette Rysmo-iOS-31 ; PRD rév. 6, C-09 : les défis remplacent le
 * classement dans la bande, R-05 / FR-078).
 *
 * La maquette pose le défi de la semaine (titre, clôture, XP, nombre de participations), un
 * bouton « Participer » et la liste des participations avec des coups de cœur. Aucune de ces
 * données n'est servie : ni défi, ni participation — et une participation porte le nom et le
 * commerce de quelqu'un. L'écran garde l'ordre de la maquette ; le bouton n'est pas posé tant
 * qu'il n'a rien à rejoindre. La règle du jeu est un engagement écrit : elle s'affiche.
 */
export default function ClubDefis() {
  return (
    <ClubScreen titre="Défis">
      <Display size={24} lines={['Un défi par semaine.']} />
      <Rubrique>Défi de la semaine</Rubrique>
      <SansDonnees
        etat={NON_BRANCHE}
        quoi="le défi de la semaine"
        origine="du serveur"
        degat="Un défi affiché sans exister ferait publier des captures pour rien, et promettrait de l'XP que personne ne compte."
      />
      <Rubrique>Participations</Rubrique>
      <SansDonnees
        etat={NON_BRANCHE}
        quoi="les participations"
        origine="du serveur"
        degat="Une participation porte le nom et le commerce de quelqu'un. Aucune n'est inventée."
      />
      <Verite titre="Comment ça marche">
        Un défi par semaine, lancé le lundi. Pas de vote : Max choisit des coups de cœur et explique
        pourquoi en session.
      </Verite>
    </ClubScreen>
  );
}
