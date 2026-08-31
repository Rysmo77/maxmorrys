import type { CSSProperties, ReactNode } from 'react';
import type { NumSource } from '../types';
import { Num } from './Num';

/**
 * La case de relevé de la console.
 *
 * DEUX DÉFAUTS DU KIT SONT CORRIGÉS ICI, ET AUCUN DES DEUX NE POUVAIT SE REPORTER.
 *
 * 1. LA PROP `dark`. Le kit choisissait sa surface par une prop, et son encre par un ternaire
 *    sur cette prop. C'est exactement le piège qu'AD-3 ferme : une prop de thème doit être
 *    passée à la main partout, personne ne le fait, et le composant retombe SILENCIEUSEMENT
 *    sur sa valeur claire — une case de console blanche au milieu d'un tableau de bord nuit.
 *    La prop disparaît. `.glass-flat` et `--text-muted` basculent seuls sous la portée `.dk`,
 *    et la console n'a plus rien à dire à ses cases.
 *
 * 2. LA SURFACE FLOUTÉE. Le kit posait `.glass` — la SEULE surface floutée du système, celle
 *    qui n'a droit qu'au chrome en position fixe. Or les cases de relevé arrivent par six ou
 *    sept, dans une grille qui défile : le relevé mesuré donnait jusqu'à 6 surfaces floutées
 *    par écran de console, contre 0 après correction. `.glass-flat` est le faux verre — voile
 *    plus couvrant, aucun flou, gratuit à faire défiler.
 *
 * LA DATE DE RELEVÉ EST STRUCTURELLE, PAS ÉDITORIALE. Le kit exigeait un `foot` sur chaque
 * case, et sa raison était entière dans la phrase qui l'accompagne : « un nombre sans date de
 * relevé n'est pas publiable ». Cette date est désormais portée par <Num> lui-même —
 * `showAsOf` est vrai par défaut ici, parce qu'une case de console EST une case de relevé.
 * `foot` redevient donc ce qu'il aurait toujours dû être : la précision, quand il y en a une
 * — « 1 transaction en attente » —, et non une date recopiée à la main dans chaque appel.
 *
 * UN ZÉRO DATÉ EST UNE VALEUR ET S'AFFICHE. Une valeur absente se passe en `null` : <Num> rend
 * alors « non relevé ». Un tiret, un « — », un « N/A » ne sont pas des valeurs — ils cachent
 * la différence entre « c'est zéro » et « je ne sais pas ».
 */
export interface StatTileProps {
  label: string;
  /** Un zéro daté est une valeur valable. `null` dit « je ne l'ai pas ». */
  value: number | string | null;
  source: NumSource;
  asOf: Date;
  /** « F », « XOF », « certificats ». Rendu en corps par <Num>, jamais en monospace. */
  unit?: string;
  /** @default true — une case de console est une case de relevé, elle porte sa date. */
  showAsOf?: boolean;
  /** La précision, quand il y en a une : « 1 transaction en attente ». */
  foot?: ReactNode;
  style?: CSSProperties;
}

export function StatTile({ label, value, source, asOf, unit, showAsOf = true, foot, style }: StatTileProps) {
  return (
    <div className="glass-flat" style={{ padding: '16px', ...style }}>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>{label}</p>
      {/* La taille est portée ici, la face tabulaire et son interlettrage viennent de <Num> :
          c'est lui qui détient le seul accès du dépôt à la monospace, et donc le seul endroit
          où un nombre doit prouver d'où il sort. */}
      <p style={{ fontSize: '27px', margin: '3px 0 0' }}>
        <Num value={value} unit={unit} showAsOf={showAsOf} source={source} asOf={asOf} />
      </p>
      {/* --text-muted et non --text-faint : le kit posait la date de relevé sur l'encre
          tertiaire, 2,61:1 sur blanc pur. C'est la ligne qui rend le chiffre crédible ; elle
          ne peut pas être celle qu'on ne lit pas (AD-18). */}
      {foot && <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>{foot}</p>}
    </div>
  );
}
