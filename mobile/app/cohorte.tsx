import { router } from 'expo-router';
import {
  CheckLine, Display, Eyebrow, Ligne, Liste, Rubrique, SansDonnees, Screen, Surface, isIOS, nonBranche
} from '../ds';
import { useEspace } from '../donnees';
import { BandeApprendre } from '../ecrans/BandeApprendre';
import { Verite } from '../ecrans/Verite';

/** Aucune source serveur pour ces blocs : la phase est dite, pas supposée. */
const NON_BRANCHE = nonBranche();

/**
 * ══ 19 · MA COHORTE ══ (maquette Rysmo-iOS-19).
 *
 * La maquette montre le prochain live avec son compte à rebours, la répartition de la cohorte
 * par module, et les missions à relire. AUCUNE de ces données n'a de source côté application :
 * le serveur ne sert ni la cohorte, ni le calendrier de ses lives, ni les missions des autres.
 * L'écran garde l'ordre de la maquette et dit, à chaque place, ce qui n'est pas servi. Les
 * règles de la cohorte, elles, sont un engagement écrit : elles s'affichent telles quelles.
 */
export default function Cohorte() {
  const espace = useEspace();
  return (
    <Screen territory="forme" retour="Apprendre" titre={isIOS ? undefined : 'Ma cohorte'}>
      <Eyebrow style={{ marginTop: 6 }}>{espace.valeur?.titreCourt ?? 'Ta cohorte'}</Eyebrow>
      <Display size={32} lines={['Ma cohorte']} style={{ marginTop: 6 }} />
      <BandeApprendre />

      <Rubrique>Live de cohorte · avec Max-Morrys</Rubrique>
      <Liste>
        <Ligne
          icone="video"
          titre="Le prochain live"
          sous="questions votées, audio seul possible, replay"
          onPress={() => router.push('/live')}
        />
      </Liste>

      <Rubrique>Où en est la cohorte</Rubrique>
      <SansDonnees
        etat={NON_BRANCHE}
        quoi="la progression de ta cohorte"
        origine="du serveur"
        degat="Une répartition inventée te placerait en avance ou en retard sur des gens qui n'existent pas."
      />

      <Rubrique>Missions à relire</Rubrique>
      <SansDonnees
        etat={NON_BRANCHE}
        quoi="les missions de ta cohorte"
        origine="du serveur"
        degat="Une mission à relire porte le travail et le nom de quelqu'un. Rien n'est affiché tant que le serveur ne les transmet pas."
      />

      <Surface level="flat" style={{ marginTop: 16, padding: 18 }}>
        <Eyebrow>Les règles de la cohorte</Eyebrow>
        <CheckLine tone="ok">On relit la mission, pas la personne.</CheckLine>
        <CheckLine tone="ok">Un retour = ce qui marche + une chose à changer.</CheckLine>
        <CheckLine tone="ok">Pas de classement : on suit la régularité de chacun.</CheckLine>
      </Surface>

      <Verite titre="Ce qui arrivera ici">
        Le live, la cohorte par module et les missions à relire s'affichent dès que le serveur les
        sert à l'application. Rien n'est simulé en attendant.
      </Verite>
    </Screen>
  );
}
