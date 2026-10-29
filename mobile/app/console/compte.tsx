import { SansDonnees } from '../../ds';
import { ConsoleScreen, PiedDePortee } from './_layout';
import { Verite } from '../../ecrans/Verite';

/**
 * ══ 53 · UN COMPTE ══ (maquette Rysmo-iOS-53 ; console mobile).
 *
 * La maquette ouvre la fiche d'un compte (rôle, adhésion, formation, quota, signalements) et
 * quatre actions motivées. Aucune fiche de compte n'est servie à l'application, et chaque action
 * doit s'écrire au journal d'audit avec son motif : rien n'est proposé sans cette chaîne.
 */
export default function ConsoleCompte() {
  return (
    <ConsoleScreen titre="Compte" sourcil="Comptes, rôles et accès" lignes={['Un compte,', 'en entier.']}>
      <SansDonnees
        quoi="la fiche de ce compte"
        origine="du serveur"
        degat="Une fiche inventée ferait agir — réinitialiser, octroyer, suspendre — sur une personne qui n'est pas celle qu'on croit."
        style={{ marginTop: 18 }}
      />
      <Verite titre="Chaque action">
        Réinitialiser le quota, octroyer une formation, voir les traces, suspendre : chacune demande
        un motif et s'écrit au journal d'audit. Modifier un rôle reste à la console desktop.
      </Verite>
      <PiedDePortee quoi="Cet écran n'ouvre qu'un compte à la fois." />
    </ConsoleScreen>
  );
}
