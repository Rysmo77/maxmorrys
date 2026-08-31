import type { CSSProperties, ReactNode } from 'react';
import { useId } from 'react';

/**
 * LE CHAMP QUI N'EXISTAIT PAS.
 *
 * Point ouvert B du handoff, écrit par le design system lui-même : « `Field` rend un `<div>`,
 * pas un `<input>`. Zéro `<input>`, `<textarea>`, `<select>` dans tout le système ; les
 * `<label>` existent sans `for` et sans contrôle à cibler. Acceptable pour une maquette,
 * BLOQUANT EN PRODUCTION : rien n'est atteignable au clavier ni annoncé par un lecteur
 * d'écran, et aucun clavier mobile adapté ne s'ouvre. »
 *
 * Ce port rend le dessin du kit avec un contrôle réel. Ce qui change, et pourquoi :
 *
 * — `inputMode` et `autoComplete` sont exposés. Sans eux, quelqu'un qui tape son numéro Wave
 *   au tunnel reçoit un clavier alphabétique : c'est trente secondes de saisie en plus sur un
 *   écran de paiement, sur le marché même que ce produit vise.
 * — Le message d'erreur va SOUS le champ, en fondu de 220 ms, SANS SECOUSSE. La secousse
 *   ajoute du stress et ne dit pas ce qui est faux.
 *
 * LE PARTAGE DES RÔLES ENTRE LES DEUX ÉLÉMENTS N'EST PAS DÉCORATIF. L'enveloppe porte le
 * fond, le liseré de lumière et — en erreur — l'anneau `.mm-invalid` ; le contrôle ne porte
 * AUCUNE `box-shadow` en ligne. C'est la seule façon que l'anneau de focus double d'AD-6
 * s'affiche : un style en ligne l'emporte sur une feuille de style, donc une `box-shadow`
 * posée ici effacerait silencieusement l'anneau — exactement le défaut que ce port rembourse.
 */

export type FieldAs = 'input' | 'textarea' | 'select';

/**
 * La densité. `md` est celle du kit — 54 px, la hauteur d'un bouton primaire, faite pour un
 * formulaire de paiement qu'on remplit au pouce sur un écran de 390 px.
 *
 * `sm` existe pour LA CONSOLE, et pour elle seule. Ce n'est pas une préférence : un écran
 * d'administration montre huit à vingt champs à la fois, à la souris, sur un grand écran.
 * À 54 px la moitié passe sous la ligne de flottaison, et l'opérateur — il y en a UN —
 * défile au lieu de comparer. Le kit lui-même dessine ses champs de console plus courts.
 *
 * Ce qui NE change PAS avec la densité : le `<label>` lié par `htmlFor`, le contrôle réel,
 * `aria-describedby`, `aria-invalid`, le message d'erreur sous le champ. La densité est une
 * affaire de pixels, jamais de contrat.
 */
export type FieldSize = 'md' | 'sm';

/** Une entrée de `<select>`. Le libellé est du texte : il ne se devine pas de la valeur. */
export interface FieldOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FieldProps {
  /** Le contrôle réellement rendu. `textarea` remplace la prop `multiline` du kit. */
  as?: FieldAs;
  /** Densité. `sm` est réservé à la console — voir `FieldSize`. @default "md" */
  size?: FieldSize;
  /** Associé au contrôle par un `id` généré — jamais un `<label>` orphelin. */
  label?: string;
  /** Garde le `<label>` pour les lecteurs d'écran et le retire de l'écran. */
  hideLabel?: boolean;
  /*
   * `time` et `datetime-local` entrent avec la console : une session du Club a une heure, et
   * un événement une date ET une heure. Sans eux, le port retombait sur `text` — donc sur une
   * saisie libre à valider à la main, là où le navigateur offre un sélecteur natif qui rend
   * l'erreur impossible. C'est le même raisonnement que `min`/`max` plus bas : la meilleure
   * validation est celle qu'on n'a pas à écrire.
   */
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search' | 'number' | 'date' | 'time' | 'datetime-local';
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  /** Aide sous le champ. Sur --ink-2 : l'encre tertiaire ne porte pas de texte (AD-18). */
  hint?: string;
  /**
   * Motif réel, conséquence, sortie — dans cet ordre. Jamais d'excuse, jamais « oups ».
   * Sa présence pose `aria-invalid` et lie le message au contrôle par `aria-describedby`.
   */
  error?: string;
  /** Entrées du `<select>`. Ignoré pour les autres formes. */
  options?: readonly FieldOption[];
  rows?: number;
  /**
   * Le clavier logiciel qui s'ouvre. `tel` pour un numéro Wave, `numeric` pour un code,
   * `email` pour une adresse — c'est ce qui manquait entièrement au kit.
   */
  inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
  /** Remplissage automatique. Sans lui, le navigateur ne propose rien et tout se retape. */
  autoComplete?: string;
  /**
   * Bornes du sélecteur natif, pour `type="date"` et `type="number"`. Elles ne remplacent
   * pas la validation — elles la RENDENT INUTILE dans le cas courant : un calendrier qui
   * grise les jours passés évite d'avoir à refuser un rendez-vous après coup. Sans elles,
   * la seule barrière est un message d'erreur, c'est-à-dire une erreur déjà commise.
   */
  min?: string;
  max?: string;
  name?: string;
  /** Force l'`id` — pour un `<label>` externe ou une bibliothèque de formulaire. */
  id?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  /** Élément à droite DANS le champ — œil du mot de passe, unité. */
  trailing?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * La seule encre tertiaire du fichier, et le seul endroit où AD-18 l'autorise : l'état
 * désactivé, que WCAG 1.4.3 exempte en tant que composant inactif. Elle est nommée ici plutôt
 * qu'écrite à l'usage pour que la question « qui porte encore du --ink-3 ? » ait une réponse
 * en un grep.
 */
const INK_DISABLED = 'var(--ink-3)';

export function Field({
  as = 'input', size = 'md', label, hideLabel, type = 'text', value, defaultValue, onChange, onBlur,
  placeholder, hint, error, options, rows, inputMode, autoComplete, min, max, name, id: idProp,
  required, disabled, readOnly, maxLength, trailing, className, style,
}: FieldProps) {
  const auto = useId();
  const id = idProp ?? `${auto}f`;
  const hintId = `${auto}h`;
  const errorId = `${auto}e`;
  const area = as === 'textarea';
  const sm = size === 'sm';

  // L'aide ET l'erreur, dans cet ordre : un lecteur d'écran annonce d'abord ce qu'on attend,
  // puis ce qui cloche. L'inverse fait entendre la correction avant la consigne.
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  // Une valeur sans gestionnaire est une maquette : on la déclare en lecture seule plutôt que
  // de laisser React avertir et l'utilisateur taper dans un champ qui ne retient rien.
  const frozen = value !== undefined && !onChange;

  const control: CSSProperties = {
    display: 'block',
    width: '100%',
    minHeight: area ? (sm ? '72px' : '96px') : sm ? '38px' : '54px',
    padding: area ? (sm ? '10px 12px 0' : '14px 16px 0') : sm ? '0 12px' : '0 16px',
    borderRadius: 'var(--r-m)',
    borderStyle: 'solid',
    borderWidth: '1.5px',
    borderColor: error ? 'var(--stop)' : 'var(--border-field)',
    background: 'transparent',
    color: 'var(--text-body)',
    fontFamily: 'var(--f-body)',
    fontSize: sm ? '13.5px' : '15px',
    lineHeight: area ? 1.5 : 'normal',
    resize: area ? 'vertical' : undefined,
    transition: 'border-color var(--t-ui) var(--ease)',
  };
  // La place du contenu à droite : la gouttière du kit plus le chrome rond, parce qu'un œil de
  // mot de passe est une cible qui se touche, pas une décoration posée sur le texte.
  if (trailing) control.paddingRight = `calc(${sm ? '12px' : '16px'} + var(--touch-min))`;

  const shared = {
    id,
    name,
    disabled,
    required,
    autoComplete,
    'aria-describedby': describedBy,
    'aria-invalid': error ? (true as const) : undefined,
    onBlur,
    style: control,
  };

  return (
    <div className={className} style={{ marginTop: sm ? 'var(--sp-10)' : 'var(--sp-14)', ...style }}>
      {label && (
        <label
          htmlFor={id}
          className={hideLabel ? 'sr-only' : undefined}
          style={{
            display: 'block',
            fontSize: sm ? 'var(--fs-small)' : 'var(--fs-meta-2)',
            fontWeight: 600,
            color: disabled ? INK_DISABLED : 'var(--text-muted)',
            marginBottom: 'var(--sp-6)',
          }}
        >
          {label}
          {/* L'astérisque est DÉCORATIVE : c'est l'attribut `required` du contrôle qui porte
              l'information pour un lecteur d'écran, et il l'annonce déjà. La rendre visible
              sans `aria-hidden` la ferait lire « étoile » après chaque libellé obligatoire.
              Elle est ici plutôt que dans chaque appel : recopiée à la main, elle finit par
              manquer sur le champ où elle compte. */}
          {required && (
            <span aria-hidden="true" style={{ color: 'var(--stop)' }}> *</span>
          )}
        </label>
      )}

      {/* L'enveloppe porte le fond, le liseré de lumière et l'anneau d'erreur. Le contrôle
          garde sa box-shadow libre pour l'anneau de focus — voir l'en-tête du fichier. */}
      <div
        className={error ? 'mm-invalid' : undefined}
        style={{
          position: 'relative',
          borderRadius: 'var(--r-m)',
          background: 'var(--field-bg)',
          boxShadow: 'var(--field-hl)',
        }}
      >
        {as === 'select' ? (
          <select
            {...shared}
            value={value}
            defaultValue={defaultValue}
            onChange={(e) => onChange?.(e.target.value)}
          >
            {placeholder !== undefined && (
              <option value="" disabled={required}>
                {placeholder}
              </option>
            )}
            {options?.map((o) => (
              <option key={o.value} value={o.value} disabled={o.disabled}>
                {o.label}
              </option>
            ))}
          </select>
        ) : area ? (
          <textarea
            {...shared}
            rows={rows}
            value={value}
            defaultValue={defaultValue}
            placeholder={placeholder}
            maxLength={maxLength}
            readOnly={readOnly ?? frozen}
            onChange={(e) => onChange?.(e.target.value)}
          />
        ) : (
          <input
            {...shared}
            type={type}
            value={value}
            defaultValue={defaultValue}
            placeholder={placeholder}
            maxLength={maxLength}
            inputMode={inputMode}
            min={min}
            max={max}
            readOnly={readOnly ?? frozen}
            onChange={(e) => onChange?.(e.target.value)}
          />
        )}

        {trailing && (
          <span
            style={{
              position: 'absolute',
              right: '16px',
              top: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {trailing}
          </span>
        )}
      </div>

      {hint && (
        <span
          id={hintId}
          style={{
            display: 'block',
            fontSize: 'var(--fs-small)',
            color: 'var(--text-muted)',
            marginTop: 'var(--sp-6)',
          }}
        >
          {hint}
        </span>
      )}

      {/* `.mm-error-msg` porte la couleur, la taille et le fondu de 220 ms — pas de secousse.
          `role="alert"` fait annoncer le message à son apparition : sans lui, quelqu'un qui
          n'a pas les yeux sur le champ ne sait jamais que la validation a répondu. */}
      {error && (
        <span id={errorId} role="alert" className="mm-error-msg" style={{ display: 'block' }}>
          {error}
        </span>
      )}
    </div>
  );
}
