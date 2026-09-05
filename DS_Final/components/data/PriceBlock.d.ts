/**
 * Prix. Toujours en monospace tabulaire : dans ce système, un nombre en monospace
 * vient de la base ou d'une source citée. Le cadrage mensuel est obligatoire sur le Club
 * (19 900/an ≈ 1 658/mois) — le montant annuel seul franchit un seuil de délibération.
 */
export interface PriceBlockProps {
  /** Montant, déjà formaté avec espaces fines : "95 000". */
  amount?: string;
  /** @default "FCFA" */
  currency?: string;
  /** Prix barré, en promotion de lancement. */
  strike?: string;
  /** Ligne sous le prix : « Une fois, accès à vie », équivalent mensuel, échéancier. */
  note?: React.ReactNode;
  size?: number;
  style?: React.CSSProperties;
}
export function PriceBlock(props: PriceBlockProps): JSX.Element;
