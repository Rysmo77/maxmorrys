import type { CSSProperties, KeyboardEvent } from 'react';
import { useRef } from 'react';

/**
 * Deux à trois options courtes — langue, apparence, portée d'un classement. Au-delà de trois,
 * c'est `ChipRow`.
 *
 * Le kit rendait des `<span onClick>` : rien dans l'ordre de tabulation, rien d'annoncé, et
 * surtout aucune notion de GROUPE — un lecteur d'écran lisait trois mots sans dire qu'ils
 * s'excluent ni combien il y en a. Ici c'est un `role="radiogroup"` de vrais `<button>` :
 * l'ensemble s'annonce « 2 sur 3 », et les flèches parcourent le groupe.
 *
 * TABULATION UNIQUE (« roving tabindex ») : seul le segment sélectionné est atteignable par
 * Tab, les autres portent `tabIndex={-1}`. C'est le comportement attendu d'un groupe de
 * boutons radio — sans lui, un contrôle à trois options coûte trois tabulations à traverser,
 * et un formulaire en compte plusieurs.
 *
 * LA PILULE ACTIVE EST UN ÉLÉMENT À PART, pas une `box-shadow` posée sur le bouton. Un style
 * en ligne l'emporte sur la feuille de style : la `--seg-on-sh` écrite sur le `<button>`
 * effacerait l'anneau de focus d'AD-6 sur le seul segment qui est justement atteignable au
 * clavier. Le fond et son ombre vivent donc dans un `<span aria-hidden>` derrière le libellé.
 */
export interface SegmentedProps {
  options: readonly string[];
  /** Option active. Par défaut la première. */
  value?: string;
  onChange?: (option: string) => void;
  /** OBLIGATOIRE — ce que le groupe règle. Sans lui, on entend les choix sans la question. */
  label: string;
  className?: string;
  style?: CSSProperties;
}

export function Segmented({ options, value, onChange, label, className, style }: SegmentedProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const index = Math.max(0, options.indexOf(value ?? options[0]));

  // La flèche DÉPLACE ET SÉLECTIONNE : c'est la convention d'un groupe radio, et l'écart le
  // plus courant est de ne faire que déplacer, ce qui laisse un segment surligné mais inactif.
  const move = (step: number) => {
    if (options.length < 2) return;
    const next = (index + step + options.length) % options.length;
    onChange?.(options[next]);
    refs.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    move(step);
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={className}
      style={{
        display: 'flex',
        padding: '4px',
        borderRadius: 'var(--r-pill)',
        background: 'var(--surface-quiet)',
        gap: '4px',
        ...style,
      }}
    >
      {options.map((option, i) => {
        const on = i === index;
        return (
          <button
            key={option}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange?.(option)}
            // 36 px de dessin pour un plancher exigé à 44 : la cible s'étend, le dessin reste.
            className={[onChange ? 'mm-press-sm' : null, 'mm-touch-extend'].filter(Boolean).join(' ')}
            style={{
              position: 'relative',
              flex: 1,
              textAlign: 'center',
              fontFamily: 'var(--f-body)',
              fontSize: '13px',
              fontWeight: 600,
              padding: '9px 0',
              borderRadius: 'var(--r-pill)',
              border: 0,
              background: 'transparent',
              cursor: onChange ? 'pointer' : 'default',
              color: on ? 'var(--ink)' : 'var(--text-muted)',
              // `transform` repris de `.mm-press-sm` : une transition en ligne REMPLACE celle
              // de la classe. Sans ce premier terme, l'appui saute au lieu de s'enfoncer.
              transition: 'transform var(--t-tap) var(--ease),color var(--t-ui) var(--ease)',
            }}
          >
            {on && (
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'var(--r-pill)',
                  background: 'var(--seg-on-bg)',
                  boxShadow: 'var(--seg-on-sh)',
                }}
              />
            )}
            <span style={{ position: 'relative' }}>{option}</span>
          </button>
        );
      })}
    </div>
  );
}
