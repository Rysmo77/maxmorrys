import { Body, Eyebrow, SansDonnees, Surface } from '../../ds';
import { ClubScreen } from './_layout';

/**
 * ══ CLUB · MEMBRES ══ — L'ONGLET QUI N'A PAS DE PRODUCTEUR, ET QUI LE DIT.
 *
 * Le kit dessine l'annuaire (`DS_Final/ui_kits/native/ScreensNatifClub.js`). Le contrat ne le
 * sert pas : `appClubListe` s'ouvre en trois formes — `discussions`, `opportunites`, `membre` —
 * et `membre` rend UNE fiche (`club/membre.tsx`, ouverte depuis l'auteur d'un message), pas une
 * liste.
 *
 * ⚠️ L'ONGLET RESTE, PARCE QUE L'ORDRE DES HUIT EST PORTEUR. Le retirer décalerait les cinq
 * suivants, c'est-à-dire changerait la position que la personne a apprise. Il porte la bande,
 * il dit ce qui manque, et il ne fabrique rien. (Décision de la réécriture Kotlin, reprise.)
 *
 * Aucun cadenas ici : sans vue, impossible de savoir si l'accès manque ou si la donnée manque.
 */
export default function ClubMembres() {
  return (
    <ClubScreen titre="Membres">
      <SansDonnees
        quoi="l'annuaire des membres"
        origine="d'une vue que le serveur ne sert pas encore — « appClubListe.membre » rend UNE fiche"
        degat="Un annuaire d'exemple ferait croire à un Club plus grand qu'il n'est, et donnerait un métier et un quartier à des gens qui ne les ont pas renseignés."
        style={{ marginTop: 16 }}
      />
      <Surface level="truth" style={{ marginTop: 16, padding: 16 }}>
        <Eyebrow>Ce que la fiche montre, et ce qu'elle cache</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          Le métier et le quartier, parce qu'ils servent à se trouver. Jamais le numéro de
          téléphone — on s'écrit dans le Club, et une personne signalée ne voit pas son
          signalement.
        </Body>
      </Surface>
    </ClubScreen>
  );
}
