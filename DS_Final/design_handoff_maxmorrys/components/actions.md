# Composants · `actions`

Pour chaque composant : le **contrat de props** (avec ses raisons, pas seulement ses types),
puis l'**implémentation de référence**. Les styles sont en ligne parce que le système est
en React ; les états qu'un style en ligne ne peut pas exprimer (`:focus-visible`, `:active`,
`:disabled`) vivent dans `css/brand/states.css`.

> **Budget de verre.** Aucun composant de ce groupe ne porte `backdrop-filter`, à la seule
> exception de `TabBar`. Le flou est réservé au chrome fixe et à l'unique panneau héros
> d'une page — voir `REGLES-DE-REVUE.md` § 1.


---

## `Button`

Bouton d'action principal du produit — pilule pleine largeur sur mobile, ton coloré par territoire.

```jsx
<Button tone="forme">Je m'inscris</Button>
<Button tone="quiet" size="sm">Changer de moyen de paiement</Button>
```

Tons : `primary` (encre), `forme`, `informe`, `transforme`, `digitalise`, `ghost` (verre à liseré d'encre), `quiet`. `disabled` grise le fond et retire le pointeur. Enfoncement `scale(.975)` au tap — n'ajoutez pas d'effet de survol porteur d'information, le survol n'existe pas sur mobile.

### Contrat de props

```ts
import * as React from 'react';

/**
 * Bouton d'action. Pilule, 54 px de haut en taille normale, 42 px en petite taille.
 * Le ton porte le territoire : forme = bleu→violet, transforme = violet→bleu,
 * digitalise = teal→bleu. `primary` est l'encre unie, utilisée hors territoire.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Ton de surface. @default "primary" */
  tone?: 'primary' | 'forme' | 'informe' | 'transforme' | 'digitalise' | 'ghost' | 'quiet';
  /** @default "md" */
  size?: 'md' | 'sm';
  /** md remplit sa largeur par défaut, sm non. */
  fullWidth?: boolean;
  children?: React.ReactNode;
}
export function Button(props: ButtonProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

const mmButtonTone = {
  primary:{background:'var(--action-primary)',color:'var(--text-on-primary)',boxShadow:'var(--sh-ink)'},
  forme:{background:'var(--action-forme)',color:'#fff',boxShadow:'var(--sh-bleu)'},
  /* L'orange reste clair dans les deux modes : son encre est fixe, jamais var(--ink). */
  informe:{background:'var(--action-informe)',color:'#0E1116',boxShadow:'0 8px 24px rgba(243,139,10,.32)'},
  transforme:{background:'var(--action-transforme)',color:'#fff',boxShadow:'var(--sh-violet)'},
  digitalise:{background:'var(--action-digitalise)',color:'#fff',boxShadow:'var(--sh-teal)'},
  /* Aucun flou : un bouton est petit, le flou n'y apporte presque rien mais coûte une couche
     de composition PAR bouton. Trois boutons fantômes suffisaient à dépasser le budget de deux
     surfaces sans qu'aucune carte ne soit en cause. Voir REGLES-DE-REVUE.md § 1. */
  ghost:{background:'var(--btn-ghost-bg)',color:'var(--ink)',border:'var(--btn-ghost-brd)'},
  quiet:{background:'var(--surface-quiet)',border:'var(--btn-quiet-brd)',color:'var(--ink)'},
  disabled:{background:'var(--btn-off-bg)',color:'var(--ink-3)'}
};

export function Button({tone='primary',size='md',fullWidth,children,style,onClick,disabled,className='',...rest}){
  const t = mmButtonTone[disabled ? 'disabled' : tone] || mmButtonTone.primary;
  const sm = size === 'sm';
  return (
    <button type="button" className={('mm-press '+className).trim()} onClick={disabled ? undefined : onClick} aria-disabled={disabled || undefined} style={{
      display:'inline-flex',alignItems:'center',justifyContent:'center',gap:'8px',border:0,cursor:disabled?'default':'pointer',
      minHeight:sm?'42px':'var(--touch-btn)',padding:sm?'0 17px':'0 22px',borderRadius:'var(--r-pill)',
      fontFamily:'var(--f-body)',fontWeight:700,fontSize:sm?'13.5px':'15px',
      width:fullWidth===undefined ? (sm?'auto':'100%') : (fullWidth?'100%':'auto'),
      ...t,...style}} {...rest}>{children}</button>
  );
}
```

---

## `IconButton`

Bouton rond en verre pour le chrome d'écran : retour, notifications, partage, options.

```jsx
<IconButton label="Retour"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M15 19l-7-7 7-7"/></svg></IconButton>
<IconButton label="Notifications" badge>{bellIcon}</IconButton>
```

`badge` ajoute la pastille orange. `dark` pour la console. Toujours renseigner `label`.

### Contrat de props

```ts
import * as React from 'react';

/**
 * Bouton rond en verre, 42 px — le plancher de cible tactile du chrome.
 * Surface floutée fixe : ne jamais en placer dans une liste qui défile.
 * Le bouton fixe sa propre couleur d'encre : les glyphes en `currentColor` s'y accrochent.
 */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Le glyphe. Un SVG à trait de 2 à 2,4 px, 17–19 px de côté. */
  children?: React.ReactNode;
  /** Pastille orange de notification non lue. */
  badge?: boolean;
  /* Aucune prop de thème : la surface vient d'un jeton qui bascule sous `.dk`. */
  /** Libellé accessible — obligatoire, le bouton n'a pas de texte. */
  label?: string;
}
export function IconButton(props: IconButtonProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

export function IconButton({children,badge,label,style,onClick,className='',...rest}){
  return (
    <button type="button" className={('mm-press-sm '+className).trim()} aria-label={label} onClick={onClick} style={{
      position:'relative',width:'var(--touch-min)',height:'var(--touch-min)',borderRadius:'50%',
      display:'grid',placeItems:'center',cursor:'pointer',
      color:'var(--text-body)',background:'var(--chrome-bg)',
      border:'1px solid var(--chrome-brd)',
      boxShadow:'var(--chrome-hl),0 4px 14px rgba(14,17,22,.09)',
      ...style}} {...rest}>
      {children}
      {badge && <b style={{position:'absolute',top:'8px',right:'9px',width:'9px',height:'9px',borderRadius:'50%',
        background:'var(--mm-orange)',border:'1.5px solid var(--surface-page)'}} />}
    </button>
  );
}
```

---

## `PillButton`

Pilule d'encre translucide du chrome haut. Sert au menu et aux repères courts, jamais à une action de conversion.

```jsx
<PillButton>Menu</PillButton>
```

### Contrat de props

```ts
import * as React from 'react';

/**
 * Pilule d'encre du chrome — « Menu », et rien d'autre dans le produit actuel.
 * Capitales, interlettrage ouvert, 12 px : c'est un repère, pas un appel à l'action.
 */
export interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  /* Aucune prop de thème : la surface vient d'un jeton qui bascule sous `.dk`. */
}
export function PillButton(props: PillButtonProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

export function PillButton({children,style,className='',...rest}){
  return (
    <button type="button" className={('mm-press-sm '+className).trim()} style={{
      background:'var(--pill-bg)',
      color:'#fff',border:0,cursor:'pointer',borderRadius:'var(--r-pill)',padding:'0 17px',
      fontFamily:'var(--f-body)',fontSize:'12px',fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',
      minHeight:'var(--touch-min)',display:'inline-flex',alignItems:'center',
      ...style}} {...rest}>{children}</button>
  );
}
```
