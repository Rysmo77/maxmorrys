import type { CSSProperties } from 'react';

/**
 * LE CYCLE DE VENTE — filtre de statut des écrans commerciaux de la console.
 *
 * LES DEUX CYCLES NE SE FUSIONNENT JAMAIS. Prospects TPE (nouveau · qualifié · devisé ·
 * signé · perdu) et demandes agence (nouveau · qualifié · cadrage · proposition · gagné ·
 * perdu) n'ont ni la même durée, ni le même interlocuteur. Le composant ne connaît donc
 * aucune liste d'étapes par défaut : c'est l'écran qui la donne, et deux écrans distincts
 * ne peuvent pas dériver l'un vers l'autre par inadvertance.
 *
 * DES ÉLÉMENTS ATTEIGNABLES. Le kit rendait des `<span onClick>` sans `tabindex` ni `role` :
 * un filtre qui ne se déclenche qu'à la souris n'existe pas au clavier, et la console est
 * exactement l'endroit où l'on travaille au clavier toute la journée. Ici : `<ol>` — les
 * étapes sont ordonnées, et cet ordre EST l'information — puis un `<button type="button">`
 * dès qu'il y a un `onSelect`, sinon un `<span>` non focalisable, parce qu'on ne rend pas
 * atteignable ce qui ne fait rien (AD-6).
 *
 * AUCUNE PROP DE THÈME. `--seg-on-bg` passe seul du blanc plein à 16 % de blanc sous `.dk`,
 * et `--ctl-off-bg` de 55 % de blanc à 8 %. Le kit écrivait `#fff`, `#0E1116` et `#8B95A3`
 * en dur : sur la console, qui est nuit, la sélection restait un rectangle blanc.
 */

const STEP: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  fontFamily: 'var(--f-body)',
  fontSize: '11px',
  fontWeight: 600,
  padding: '5px 10px',
  borderRadius: 'var(--r-pill)',
  whiteSpace: 'nowrap',
  border: 0,
};

export interface PipelineProps {
  /** Les étapes, dans l'ordre du cycle. */
  stages: string[];
  /** L'étape courante. Elle porte `aria-current="step"`, pas seulement une couleur. */
  active?: string;
  /** Sans lui, la barre affiche le cycle sans le filtrer — et rien n'est focalisable. */
  onSelect?: (stage: string) => void;
  /** Nom de la liste : « Cycle de vente — prospects TPE ». Il se traduit. */
  label: string;
  className?: string;
  style?: CSSProperties;
}

export function Pipeline({ stages, active, onSelect, label, className = '', style }: PipelineProps) {
  return (
    // La rangée fait 44 px de haut pour que la cible étendue de `.mm-touch-extend` y tienne :
    // sinon `overflow: hidden` la rognerait, et une cible rognée est une cible absente.
    <ol
      aria-label={label}
      className={className || undefined}
      style={{ display: 'flex', alignItems: 'center', gap: '5px', minHeight: 'var(--touch-aa)', overflow: 'hidden', listStyle: 'none', margin: 0, padding: 0, ...style }}
    >
      {stages.map((s) => {
        const on = s === active;
        const css: CSSProperties = {
          ...STEP,
          background: on ? 'var(--seg-on-bg)' : 'var(--ctl-off-bg)',
          // AD-18 : l'étape au repos va sur `--ink-2`. Le kit la posait sur un gris de
          // 2,6:1 qui ne passait dans aucun des deux modes.
          color: on ? 'var(--text-body)' : 'var(--text-muted)',
        };
        return (
          <li key={s} style={{ display: 'flex' }}>
            {onSelect ? (
              <button
                type="button"
                className="mm-press-sm mm-touch-extend"
                aria-current={on ? 'step' : undefined}
                onClick={() => onSelect(s)}
                style={{ ...css, cursor: 'pointer' }}
              >
                {s}
              </button>
            ) : (
              <span aria-current={on ? 'step' : undefined} style={css}>{s}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
