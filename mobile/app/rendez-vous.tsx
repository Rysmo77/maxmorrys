import { openBrowserAsync } from 'expo-web-browser';
import { Button, CheckLine, Display, Eyebrow, Rubrique, SansDonnees, Screen, Surface, isIOS, nonBranche } from '../ds';
import { Verite } from '../ecrans/Verite';

/** Aucune source serveur pour ces blocs : la phase est dite, pas supposée. */
const NON_BRANCHE = nonBranche();

/**
 * ══ 44 · RÉSERVER UN APPEL ══ (maquette Rysmo-iOS-44 ; PRD rév. 6 §6 : « réservation complète »).
 *
 * La maquette pose une grille de jours et d'heures « branchés sur l'agenda de Max », puis nom,
 * numéro WhatsApp, objet et format. L'agenda n'est servi qu'au SITE (le dialogue de réservation
 * de `/contact?rdv=1`) : l'application ne connaît aucun créneau. La grille est donc remplacée par
 * son état vide, et les champs ne sont pas posés — un formulaire qui n'envoie rien perdrait ce
 * que la personne y a tapé. La réservation se termine sur le site, dans le même dialogue que
 * celui du pied de page. Un appel n'est pas un contenu numérique : aucune règle de magasin ici.
 */
export default function RendezVous() {
  return (
    <Screen espace="hub" territory="transforme" retour="Accueil" titre={isIOS ? undefined : 'Réserver un appel'}>
      <Eyebrow style={{ marginTop: 6 }}>30 min · gratuit · avec Max-Morrys</Eyebrow>
      <Display size={30} lines={['Choisis ton créneau.']} style={{ marginTop: 6 }} />

      <Rubrique>Créneaux · heure de Dakar (GMT)</Rubrique>
      <SansDonnees
        etat={NON_BRANCHE}
        quoi="les créneaux de Max"
        origine="de son agenda, servi au site"
        degat="Un créneau affiché sans venir de l'agenda serait un rendez-vous que personne n'attend."
      />

      <Surface level="flat" style={{ marginTop: 16, padding: 18 }}>
        <Eyebrow>Ce que tu donnes en réservant</Eyebrow>
        <CheckLine tone="ok">Ton nom et ton numéro WhatsApp</CheckLine>
        <CheckLine tone="ok">L'objet de l'appel, en une phrase</CheckLine>
        <CheckLine tone="ok">Le format : visio, téléphone ou WhatsApp</CheckLine>
      </Surface>

      <Button
        tone="primary"
        label="Choisir mon créneau sur le site"
        trailing="external"
        style={{ marginTop: 18 }}
        onPress={() => { void openBrowserAsync('https://maxmorrys.me/contact?rdv=1'); }}
      />
      <Verite titre="Aucune règle de magasin ici">
        Un appel n'est pas un contenu numérique. La confirmation et le rappel arrivent sur WhatsApp.
      </Verite>
    </Screen>
  );
}
