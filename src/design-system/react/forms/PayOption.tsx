import type { CSSProperties, ReactNode } from 'react';
import { useId } from 'react';

/**
 * Ligne de choix EXCLUSIF, 68 px de haut : Wave, Orange Money, carte — et les réponses du
 * sélecteur de pack TPE.
 *
 * Le kit rendait un `<div onClick>`. Sur un écran de paiement, c'est le pire endroit du
 * produit où mettre un contrôle non natif : rien n'est atteignable au clavier, rien ne
 * s'annonce, et surtout RIEN NE DIT QUE LES OPTIONS S'EXCLUENT. Ici c'est un vrai
 * `<input type="radio">` partageant un `name` : l'exclusivité est portée par le navigateur,
 * les flèches parcourent le groupe sans une ligne de JavaScript, et le lecteur d'écran annonce
 * « Wave, bouton radio, 1 sur 3 ».
 *
 * LE RADIO EST LE CONTRÔLE, pas une pastille dessinée à côté d'un champ caché. C'est ce qui
 * rend l'anneau de focus visible : un `<input>` masqué par `opacity: 0` reçoit bien le focus,
 * mais son anneau — celui d'AD-6, le défaut d'accessibilité que le handoff nomme le plus grave
 * — se dessine sur un élément invisible. Le disque de 22 px EST l'input, `appearance: none`,
 * et l'anneau se voit.
 *
 * L'ÉPAISSEUR DU LISERÉ NE S'ANIME PAS. Le kit transitionnait `border-width` ; AD-16 n'admet
 * que `transform` et `opacity`, et `border-width` est une propriété de mise en page. Le 7 px
 * de la sélection est donc immédiat, et c'est la COULEUR qui s'installe en 220 ms — la valeur
 * du kit est gardée, seule la propriété animée change.
 */
export interface PayOptionProps {
  /**
   * Le `name` partagé par les options d'un même choix. C'est LUI qui rend le choix exclusif :
   * deux `name` différents donnent deux radios qu'on peut cocher ensemble.
   */
  name: string;
  value: string;
  checked?: boolean;
  onChange?: (value: string) => void;
  /** Sigle du prestataire — « W », « OM » — ou une icône. Décoratif : le titre porte le sens. */
  logo?: ReactNode;
  /** Fond du carré de logo : le dégradé de la marque du prestataire, fourni par l'appelant. */
  logoBackground?: string;
  title: string;
  note?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Le style en ligne accepte les propriétés personnalisées ; le type de React, non. Ce type les
 * autorise sans ouvrir la porte à n'importe quelle clé.
 */
type StyleWithVars = CSSProperties & { [key: `--${string}`]: string | number };

/**
 * Le kit dessine un quatrième enfoncement, `.pay:active { transform: scale(.985) }` — ni
 * `--press-scale` (.975) ni `--press-scale-sm` (.94). Plutôt qu'une nouvelle classe, on
 * REDÉFINIT le jeton dans la portée de la ligne : `.mm-press:active` lit `var(--press-scale)`,
 * qui vaut .985 ici et nulle part ailleurs. La valeur du kit est gardée verbatim, et aucune
 * règle CSS ne se dédouble.
 */
const PRESS_PAY = '.985';

/**
 * L'opacité du désactivé vient du tableau d'états du handoff (§ 3). Elle est écrite ici parce
 * qu'aucune classe ne s'applique à un `<label>` : `[aria-disabled]` de `ad-06-etats.css` ne
 * vise que `button`, `a` et `[role="button"]`.
 */
const OPACITY_DISABLED = 0.42;

export function PayOption({
  // `checked` a une valeur par défaut pour que le radio soit contrôlé DÈS le premier rendu :
  // React n'accepte pas qu'un champ passe de non contrôlé à contrôlé en cours de route.
  name, value, checked = false, onChange, logo, logoBackground, title, note,
  disabled, id: idProp, className, style,
}: PayOptionProps) {
  const auto = useId();
  const id = idProp ?? `${auto}p`;

  const row: StyleWithVars = {
    display: 'flex',
    alignItems: 'center',
    gap: '13px',
    padding: '15px',
    borderRadius: 'var(--r-m)',
    minHeight: '68px',
    background: 'var(--ctl-off-bg)',
    borderStyle: 'solid',
    borderWidth: '1.5px',
    borderColor: checked ? 'var(--ctl-sel-brd)' : 'var(--ctl-off-brd)',
    boxShadow: checked ? 'var(--ctl-sel-ring),var(--glass-hl)' : 'none',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? OPACITY_DISABLED : undefined,
    '--press-scale': PRESS_PAY,
    // `transform` et `box-shadow` sont repris de `.mm-press` : une transition en ligne
    // REMPLACE la liste de la classe. Les omettre ferait sauter l'appui et l'anneau.
    transition: 'transform var(--t-tap) var(--ease),box-shadow var(--t-ui) var(--ease),border-color var(--t-ui) var(--ease)',
    ...style,
  };

  return (
    <label
      htmlFor={id}
      className={[disabled ? null : 'mm-press', className].filter(Boolean).join(' ')}
      style={row}
    >
      {logo && (
        <span
          aria-hidden="true"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '13px',
            display: 'grid',
            placeItems: 'center',
            flex: '0 0 auto',
            fontFamily: 'var(--f-display)',
            fontWeight: 900,
            fontSize: '16px',
            // Blanc dans les deux modes : le dégradé du prestataire, lui, ne bascule pas.
            // `--text-invert` est le jeton blanc que `.dk` ne redéfinit pas.
            color: 'var(--text-invert)',
            background: logoBackground,
          }}
        >
          {logo}
        </span>
      )}

      <span style={{ flex: 1 }}>
        <b style={{ display: 'block', fontSize: '14.5px', fontWeight: 600 }}>{title}</b>
        {/* --text-muted, jamais --text-faint : l'encre tertiaire ne porte pas de texte (AD-18). */}
        {note && <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>{note}</span>}
      </span>

      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange?.(value)}
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          // La ligne porte déjà le .42 du désactivé ; sans ce 1, la règle `[disabled]` de
          // `ad-06-etats.css` l'appliquerait une SECONDE fois et le disque disparaîtrait.
          opacity: disabled ? 1 : undefined,
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          flex: '0 0 auto',
          margin: 0,
          background: 'transparent',
          borderStyle: 'solid',
          borderWidth: checked ? '7px' : '2px',
          borderColor: checked ? 'var(--ink)' : 'var(--ctl-radio-brd)',
          cursor: disabled ? 'default' : 'pointer',
          transition: 'border-color var(--t-ui) var(--ease)',
        }}
      />
    </label>
  );
}
