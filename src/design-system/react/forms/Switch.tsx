import type { CSSProperties } from 'react';
import { useId } from 'react';

/**
 * L'interrupteur, 48 × 29. Actif : dégradé bleu → violet.
 *
 * LE DÉSACTIVÉ EST ICI UN USAGE, PAS UNE PANNE. Le kit le dit dans son propre contrat :
 * l'interrupteur sert à déclarer « ce réglage existe mais ne fait rien encore » — le canal
 * e-mail, que le produit n'a pas (AD-17 : « le centre de notifications est le seul canal
 * sortant »). Un réglage grisé qui ne s'explique pas laisse croire l'inverse de ce qu'il dit.
 *
 * D'où deux décisions qui ne se déduisent pas du dessin :
 *
 * 1. `aria-disabled`, JAMAIS l'attribut `disabled`. Un `<button disabled>` sort de l'ordre de
 *    tabulation : la promesse non tenue devient invisible pour exactement la personne qui ne
 *    voit pas le gris. Ici l'interrupteur reste atteignable, s'annonce désactivé, et porte son
 *    explication par `aria-describedby`.
 * 2. Aucun retour au toucher quand il est éteint par le produit — `.mm-press-sm` n'est pas
 *    posée. Un enfoncement qui ne mène à rien est un mensonge de 120 ms.
 *
 * L'opacité de .42 et le `cursor: default` viennent de `[aria-disabled]` dans
 * `overrides/ad-06-etats.css` : ils ne sont pas réécrits ici, sinon le style en ligne
 * l'emporterait et la valeur divergerait le jour où la règle bouge.
 */
export interface SwitchProps {
  on?: boolean;
  /**
   * OBLIGATOIRE. Un `role="switch"` sans nom accessible ne s'annonce que « interrupteur,
   * activé » : on entend l'état sans jamais savoir de quoi.
   */
  label: string;
  disabled?: boolean;
  /**
   * Ce que le produit ne tient pas, en toutes lettres — « Je n'ai aucun canal d'envoi
   * d'e-mail ». Lu par `aria-describedby`, donc entendu, pas seulement deviné au gris.
   */
  disabledReason?: string;
  onChange?: (on: boolean) => void;
  id?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * L'UNE DES TROIS EXCEPTIONS ASSUMÉES à « aucune couleur en dur » : le curseur reste blanc
 * dans les deux modes, parce qu'il vit sur une surface colorée qui, elle, ne bascule pas —
 * le dégradé bleu → violet en position active, un puits de remplissage en position éteinte.
 * Il est écrit par `--text-invert`, le seul jeton blanc que `.dk` NE redéfinit PAS : la
 * valeur est celle du kit (#FFFFFF), et elle reste traçable au lieu d'être tapée en dur.
 */
const KNOB = 'var(--text-invert)';

export function Switch({ on, label, disabled, disabledReason, onChange, id, className, style }: SwitchProps) {
  const auto = useId();
  const reasonId = `${auto}r`;
  const off = !!disabled;

  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={!!on}
      aria-disabled={off || undefined}
      aria-label={label}
      aria-describedby={off && disabledReason ? reasonId : undefined}
      onClick={off ? undefined : () => onChange?.(!on)}
      // 29 px de haut pour un plancher exigé à 44 : la cible s'étend, le dessin ne grossit pas.
      className={[off ? null : 'mm-press-sm', 'mm-touch-extend', className].filter(Boolean).join(' ')}
      style={{
        width: '48px',
        height: '29px',
        borderRadius: '16px',
        position: 'relative',
        flex: '0 0 auto',
        padding: 0,
        border: 0,
        cursor: off ? 'default' : 'pointer',
        background: on ? 'var(--action-forme)' : 'var(--fill-4)',
        // `transform` est repris de `.mm-press-sm` : un style en ligne REMPLACE la liste de
        // transitions de la classe, il ne s'y ajoute pas. L'oublier ferait sauter l'appui.
        transition: 'transform var(--t-tap) var(--ease),background var(--t-ui) var(--ease),opacity var(--t-ui) var(--ease)',
        ...style,
      }}
    >
      <b
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '3px',
          top: '3px',
          width: '23px',
          height: '23px',
          borderRadius: '50%',
          background: KNOB,
          boxShadow: '0 2px 6px rgba(14,17,22,.24)',
          transform: on ? 'translateX(19px)' : 'none',
          transition: 'transform var(--t-ui) var(--ease)',
        }}
      />
      {off && disabledReason && <span id={reasonId} className="sr-only">{disabledReason}</span>}
    </button>
  );
}
