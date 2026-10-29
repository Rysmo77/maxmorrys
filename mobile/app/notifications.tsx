import { router } from 'expo-router';
import { EmptyState, Icon, IconButton, Rubrique, Screen, useToken } from '../ds';
import { Verite } from '../ecrans/Verite';

/**
 * ══ 09 · NOTIFICATIONS ══ (maquette Rysmo-iOS-09 ; PRD rév. 6 §5.5, FR-270).
 *
 * La maquette montre une boîte « Aujourd'hui / Plus tôt » remplie de six notifications. AUCUNE
 * n'existe : l'application n'embarque pas de module de notification et aucun serveur n'en
 * envoie (voir l'en-tête de l'Accueil, qui a retiré la cloche pour cette raison). La boîte est
 * construite et VIDE, avec la phrase qui dit pourquoi ; les trois types acceptables et leur
 * réglage vivent dans Préférences, où ils sont gardés sur le téléphone.
 */
export default function Notifications() {
  const t = useToken();
  return (
    <Screen
      espace="hub"
      territory="transforme"
      retour="Accueil"
      titre="Notifications"
      droite={
        <IconButton label="Régler les notifications" onPress={() => router.push('/preferences')}>
          <Icon name="settings" size={17} color={t('textBody')} strokeWidth={2} />
        </IconButton>
      }
    >
      <Rubrique>Aujourd'hui</Rubrique>
      <EmptyState
        glyph={<Icon name="bell" size={26} color={t('ink2')} />}
        title="Aucune notification."
        body="Rien ne t'a été envoyé : les notifications n'existent pas encore dans l'application. Ce n'est pas un oubli de ta part."
      />
      <Verite titre="Ce qui arrivera ici">
        Les trois types que tu auras acceptés — reprise de cours, série, session du Club — plus une
        opportunité le jour de sa publication. Jamais de promotion. Chaque type se coupe dans
        Préférences.
      </Verite>
    </Screen>
  );
}
