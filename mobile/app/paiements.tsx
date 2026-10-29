import { openBrowserAsync } from 'expo-web-browser';
import { Button, SansDonnees, Screen, Rubrique, nonBranche } from '../ds';
import { useClub } from '../donnees';
import { Verite } from '../ecrans/Verite';

/** Aucune source serveur pour ces blocs : la phase est dite, pas supposée. */
const NON_BRANCHE = nonBranche();

/**
 * ══ 48 · MES PAIEMENTS ══ (maquette Rysmo-iOS-48 ; PRD rév. 6, FR-291/293).
 *
 * La maquette liste deux règlements avec leur moyen et leur montant, et l'échéance du Club.
 * L'application ne lit aucune transaction de la personne (seule `appTransaction` existe, pour
 * le retour d'un paiement précis) : la liste est vide, et le dit. L'échéance du Club, elle, est
 * servie (`appClub`) : elle s'affiche quand elle existe. Aucun montant n'est écrit — l'app
 * n'encaisse rien, elle constate ce qui est ouvert (`mobile-store-achats.test.ts`).
 */
export default function Paiements() {
  const club = useClub();
  const echeance = club.valeur?.echeance ?? null;
  return (
    <Screen espace="hub" territory="transforme" retour="Profil" titre="Mes paiements">
      <Rubrique>Faits sur le site</Rubrique>
      <SansDonnees
        etat={NON_BRANCHE}
        quoi="l'historique de tes paiements"
        origine="du site"
        degat="Un règlement affiché ici sans venir de ton compte ferait croire à un accès que tu n'as pas — ou à une dépense que tu n'as pas faite."
      />
      {echeance ? (
        <Verite titre="Prochaine échéance">
          {`Club · ${echeance} · rien n'est prélevé automatiquement.`}
        </Verite>
      ) : null}
      <Button
        tone="quiet"
        label="Factures et historique sur maxmorrys.me"
        trailing="external"
        style={{ marginTop: 16 }}
        onPress={() => { void openBrowserAsync('https://maxmorrys.me/compte'); }}
      />
      <Verite titre="Pourquoi les factures ne sont pas ici">
        Les paiements ont lieu sur le site : c'est là que vivent les reçus. L'application
        n'encaisse rien, elle constate ce qui est ouvert.
      </Verite>
    </Screen>
  );
}
