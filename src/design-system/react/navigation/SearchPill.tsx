import type { CSSProperties, FormEvent, ReactNode } from 'react';
import { useId, useRef } from 'react';

/**
 * LA PILULE DE RECHERCHE — 56 px. Recherche du site, et composeur de question du répétiteur.
 *
 * ELLE A PERDU SON FLOU, ET C'EST NOMMÉ DANS LES RÈGLES. Le kit lui donnait `blur(24px)` :
 * ce n'est pas du chrome fixe, rien ne passe dessous, et elle devenait la troisième surface
 * floutée d'une page qui a déjà sa barre haute et son héros. Faux verre — `.glass-flat`,
 * voile à 78 %, aucun flou. Ce qui fait qu'un verre a l'air d'un verre n'est de toute façon
 * pas le flou : c'est le liseré de lumière de 1 px et la bordure blanche.
 *
 * C'EST UN VRAI CHAMP. Le kit livrait un `<div>` avec un faux libellé : ni saisie, ni focus,
 * ni annonce, ni soumission au clavier. Le système entier ne contenait AUCUN `<input>` — c'est
 * le point ouvert B du transfert, déclaré bloquant par le design system lui-même. Ici :
 * `<input type="search">` associé à son `<label for>` par un identifiant stable, dans un
 * `<form role="search">` qui répond à la touche Entrée (AD-6).
 *
 * LE LIBELLÉ N'EST PAS UN PLACEHOLDER. « TROUVE CE QU'IL TE FAUT » est le libellé du champ,
 * en deux tons — un placeholder disparaît dès la première frappe, et avec lui la seule
 * indication de ce qu'on est en train de remplir. `labelHidden` le masque à l'œil quand la
 * pilule sert de composeur ; il reste au lecteur d'écran, toujours.
 */

const PILL: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--sp-10)',
  borderRadius: 'var(--r-pill)',
  padding: '0 20px',
};

const CAPTION: CSSProperties = {
  fontFamily: 'var(--f-body)',
  fontWeight: 700,
  fontSize: '14px',
  color: 'var(--text-body)',
  flex: '0 0 auto',
  cursor: 'pointer',
};

const FIELD: CSSProperties = {
  flex: 1,
  minWidth: 0,
  height: '100%',
  border: 0,
  background: 'transparent',
  color: 'var(--text-body)',
  fontFamily: 'var(--f-body)',
  fontSize: '14px',
  fontWeight: 500,
  /* L'anneau de focus est un `box-shadow` double posé sur `:focus-visible` (ad-06-etats.css),
     jamais un contour par défaut : sinon un clic à la souris l'allume, tout le monde le
     trouve laid, et quelqu'un finit par l'éteindre pour tout le monde, clavier compris. */
  outline: 'none',
};

export interface SearchPillProps {
  /** Libellé du champ — la partie grasse. C'est un vrai `<label for>`, pas une décoration. */
  label: string;
  /** La fin du libellé, en gris. Même `<label>` : « TROUVE CE » + « QU'IL TE FAUT ». */
  hint?: string;
  /** Masque le libellé à l'œil. Jamais au lecteur d'écran. */
  labelHidden?: boolean;
  /** Texte d'aide DANS le champ. Il complète le libellé, il ne le remplace jamais. */
  placeholder?: string;
  /** Icône de gauche (loupe). Absente pour le composeur. */
  icon?: ReactNode;
  /** Bouton d'envoi, à droite. En `type="submit"`, il soumet le formulaire. */
  trailing?: ReactNode;
  name?: string;
  /** Champ contrôlé. Sans lui, le champ est libre et se lit à la soumission. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Recherche soumise : touche Entrée, ou bouton d'envoi. */
  onSearch?: (value: string) => void;
  height?: number;
  /** Identifiant du champ. Sans lui, il est dérivé de `useId` — donc stable au rendu serveur. */
  id?: string;
  className?: string;
  style?: CSSProperties;
}

export function SearchPill({
  label, hint, labelHidden, placeholder, icon, trailing, name = 'q', value, defaultValue,
  onChange, onSearch, height = 56, id, className = '', style,
}: SearchPillProps) {
  const generated = useId();
  const fieldId = id ?? `mm-search-${generated}`;
  const field = useRef<HTMLInputElement>(null);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch?.(value ?? field.current?.value ?? '');
  };

  return (
    <form role="search" onSubmit={submit} className={['glass-flat', className].filter(Boolean).join(' ')} style={{ height: `${height}px`, ...PILL, ...style }}>
      {icon && <span aria-hidden="true" style={{ display: 'flex', flex: '0 0 auto' }}>{icon}</span>}
      <label htmlFor={fieldId} className={labelHidden ? 'sr-only' : undefined} style={labelHidden ? undefined : CAPTION}>
        {label}
        {/* AD-18 : la fin du libellé descend sur `--ink-2`, pas sur l'encre tertiaire —
            elle plafonne à 2,51:1 même sous un voile à 94 %, et c'est du texte. */}
        {hint && <em style={{ fontStyle: 'normal', fontWeight: 500, color: 'var(--text-muted)' }}>{hint}</em>}
      </label>
      <input
        ref={field}
        id={fieldId}
        name={name}
        type="search"
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        style={FIELD}
      />
      {trailing && <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', flex: '0 0 auto' }}>{trailing}</span>}
    </form>
  );
}
