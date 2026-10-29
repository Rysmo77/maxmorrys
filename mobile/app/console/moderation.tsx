import { SansDonnees } from '../../ds';
import { ConsoleScreen, PiedDePortee } from './_layout';
import { Verite } from '../../ecrans/Verite';

/**
 * ══ 51 · MODÉRATION ══ (maquette Rysmo-iOS-51 ; console mobile, Club · modération).
 *
 * La maquette ouvre un signalement : la personne, ce qui a été signalé, la charte concernée, un
 * motif obligatoire et quatre décisions. La file des signalements n'est pas servie à
 * l'application, et une décision de modération doit s'écrire au journal d'audit avec son motif :
 * aucune décision n'est proposée sans la chaîne qui la trace. L'écran le dit.
 */
export default function ConsoleModeration() {
  return (
    <ConsoleScreen titre="Modération" sourcil="Club · modération" lignes={['Les signalements', 'à trancher.']}>
      <SansDonnees
        quoi="la file des signalements"
        origine="du serveur"
        style={{ marginTop: 18 }}
      />
      <Verite titre="Comment se tranche un signalement">
        Un motif écrit, visible par la personne concernée ; la personne qui a signalé reçoit une
        réponse ; la décision est tracée au journal, et une suspension s'applique au site et à
        l'application.
      </Verite>
      <PiedDePortee quoi="Cet écran ne tranche que les signalements du Club." />
    </ConsoleScreen>
  );
}
