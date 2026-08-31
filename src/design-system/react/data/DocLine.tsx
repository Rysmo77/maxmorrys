import type { CSSProperties, ReactNode } from 'react';

/**
 * Ligne de document : devis TPE, mentions légales, relevé. Filet pointillé, valeur à droite.
 *
 * UN DEVIS ÉMIS EST FIGÉ. Une évolution de la grille tarifaire ne réécrit jamais un devis
 * déjà envoyé — c'est la raison pour laquelle `value` accepte ce qu'on lui donne au lieu de
 * recalculer quoi que ce soit.
 *
 * ⚠️ LE KIT SE CONTREDIT ICI, ET LE PORT TRANCHE. Il rendait `value` en monospace quel que
 * soit son contenu, et son propre exemple y met « Dakar, Sénégal » — un nom de ville en
 * fonte de chiffres vérifiés. Or la monospace est réservée aux nombres qui viennent de la
 * base ou d'une source citée, et `<Num>` est le seul chemin du dépôt vers elle. La ligne ne
 * choisit donc plus la face : elle rend ce qu'on lui passe. Un montant, une date, un compte
 * arrivent en `<Num>` et prennent la monospace ; un lieu, un nom, un statut restent en corps.
 */
export interface DocLineProps {
  label?: ReactNode;
  /** Un nombre vérifiable arrive ici en <Num>. Tout le reste arrive tel quel. */
  value?: ReactNode;
  last?: boolean;
  style?: CSSProperties;
}

export function DocLine({ label, value, last, style }: DocLineProps) {
  return (
    <div
      style={{
        display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '13.5px', padding: '8px 0',
        // Le filet pointillé lit `--fill-3`, qui s'inverse : un pointillé d'encre figé
        // s'effacerait complètement sous `.dk`, et la ligne perdrait sa séparation.
        borderBottom: last ? 0 : '1px dashed var(--fill-3)',
        ...style,
      }}
    >
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <b style={{ fontWeight: 700 }}>{value}</b>
    </div>
  );
}
