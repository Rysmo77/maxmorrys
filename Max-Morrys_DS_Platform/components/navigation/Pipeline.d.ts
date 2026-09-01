import * as React from 'react';

/**
 * Filtre de statut de la console : le cycle de vente d'un prospect ou d'une demande.
 * Les deux cycles ne se fusionnent jamais — prospects TPE (nouveau, qualifié, devisé,
 * signé, perdu) et demandes agence (nouveau, qualifié, cadrage, proposition, gagné, perdu)
 * n'ont ni la même durée ni le même interlocuteur.
 */
export interface PipelineProps {
  stages?: string[];
  active?: string;
  onSelect?: (stage: string) => void;
  style?: React.CSSProperties;
}
export function Pipeline(props: PipelineProps): JSX.Element;
