import { useState } from 'react';
import { SansDonnees, Segmented } from '../../ds';
import { ConsoleScreen, PiedDePortee } from './_layout';
import { Verite } from '../../ecrans/Verite';

/**
 * ══ 52 · TRANSACTIONS ══ (maquette Rysmo-iOS-52 ; console mobile, lecture seule).
 *
 * La maquette montre l'encaissé sur 30 jours, les règlements en attente et une liste filtrable
 * par statut. Aucune de ces données n'est servie à l'application. Le filtre est posé — il dira
 * ce qu'il filtre dès que la liste existera — et le corps dit qu'il n'y a rien à filtrer.
 * Aucun montant n'est écrit à la place.
 */
/*
 * « Remboursé » est un STATUT que l'admin lit, pas une promesse faite au client : un
 * remboursement exceptionnel reste un acte admin légitime, et la liste doit pouvoir le
 * montrer. Les CGV (art. 6, aucun droit au remboursement) ne sont pas en cause ici.
 */
const STATUTS = ['Tout', 'Payé', 'En attente', 'Remboursé'] as const;

export default function ConsoleTransactions() {
  const [statut, setStatut] = useState<string>('Tout');
  return (
    <ConsoleScreen titre="Transactions" sourcil="Transactions · lecture seule" lignes={['Ce qui est', 'encaissé.']}>
      <Segmented options={STATUTS} value={statut} onChange={setStatut} style={{ marginTop: 18 }} />
      <SansDonnees
        quoi={statut === 'Tout' ? 'les transactions' : `les transactions « ${statut.toLowerCase()} »`}
        origine="du serveur"
        degat="Un montant encaissé inventé fausserait la seule ligne qu'on vérifie avant de rembourser."
        style={{ marginTop: 14 }}
      />
      <Verite titre="Lecture seule sur téléphone">
        Corrections, exports et rapprochements se font à la console desktop, avec un motif écrit
        au journal d'audit.
      </Verite>
      <PiedDePortee quoi="Cet écran ne fait que lire les transactions." />
    </ConsoleScreen>
  );
}
