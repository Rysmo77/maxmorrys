import type { CSSProperties } from 'react';

/**
 * Rangée de filtres en pilules — catalogue, blog, onglets de leçon.
 *
 * LA SÉLECTION EST DE L'ENCRE PLEINE, jamais une teinte pastel. Ce n'est pas un goût : un chip
 * pastel sur un lobe de maillage saturé ne se distingue plus d'un chip au repos, et le filtre
 * actif devient invisible exactement là où le fond est le plus vivant. `--ink` porte
 * `--text-on-primary` ; les deux s'inversent ensemble sous `.dk`, donc le contraste tient dans
 * les deux modes sans qu'une seule valeur soit écrite ici.
 *
 * Le kit rendait des `<span onClick>` : hors de l'ordre de tabulation, sans rôle, sans état
 * annoncé. Ici, de vrais `<button aria-pressed>` dans un groupe nommé — un lecteur d'écran
 * annonce « Tout, bouton bascule, activé », ce qui est précisément l'information du filtre.
 *
 * Le défilement horizontal est RÉEL (`overflow-x: auto`), pas un `overflow: hidden` qui
 * coupait les derniers chips sans moyen de les atteindre. L'ascenseur est masqué ; le geste
 * reste.
 */
export interface ChipRowProps {
  options: readonly string[];
  /** Chip actif. Par défaut le premier. */
  value?: string;
  onChange?: (option: string) => void;
  /** 40 par défaut ; 36 dans un lecteur de leçon. */
  height?: number;
  /** OBLIGATOIRE — ce que la rangée filtre. Sans lui, on entend des mots sans savoir pourquoi. */
  label: string;
  className?: string;
  style?: CSSProperties;
}

export function ChipRow({ options, value, onChange, height = 40, label, className, style }: ChipRowProps) {
  const active = value ?? options[0];

  return (
    <div
      role="group"
      aria-label={label}
      className={className}
      style={{
        display: 'flex',
        gap: 'var(--sp-8)',
        overflowX: 'auto',
        /*
         * `overflow-x: auto` NE DÉFILE QUE SI LA LARGEUR EST CONTRAINTE.
         *
         * Posé seul, il ne promet rien : un élément de grille ou de flex garde
         * `min-width: auto`, donc il s'élargit à son contenu au lieu de déborder de
         * lui-même — et c'est LA PAGE qui défile de côté. Mesuré sur `/en/faq` à 375 px :
         * la rangée de catégories s'étalait sur 1 162 px et le document sur 419.
         *
         * Les deux lignes ci-dessous rendent la promesse exécutable, et elles vivent dans
         * la primitive plutôt que chez ses appelants : c'est elle qui annonce un
         * défilement réel, c'est à elle de le garantir partout où elle est montée.
         */
        minWidth: 0,
        maxWidth: '100%',
        padding: '2px 0',
        scrollbarWidth: 'none',
        ...style,
      }}
    >
      {options.map((option) => {
        const on = option === active;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={on}
            onClick={onChange ? () => onChange(option) : undefined}
            // 40 px (36 en lecteur) pour un plancher exigé à 44 : la cible s'étend seule.
            className={[onChange ? 'mm-press-sm' : null, 'mm-touch-extend'].filter(Boolean).join(' ')}
            style={{
              height: `${height}px`,
              flex: '0 0 auto',
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0 16px',
              borderRadius: 'var(--r-pill)',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--f-body)',
              fontSize: '13px',
              cursor: onChange ? 'pointer' : 'default',
              background: on ? 'var(--ink)' : 'var(--ctl-off-bg)',
              borderStyle: 'solid',
              borderWidth: '1px',
              borderColor: on ? 'var(--ink)' : 'var(--ctl-off-brd)',
              color: on ? 'var(--text-on-primary)' : 'var(--text-muted)',
              fontWeight: on ? 600 : 500,
              // `transform` repris de `.mm-press-sm` : une transition en ligne REMPLACE celle
              // de la classe au lieu de s'y ajouter.
              transition: 'transform var(--t-tap) var(--ease),background var(--t-ui) var(--ease),color var(--t-ui) var(--ease),border-color var(--t-ui) var(--ease)',
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
