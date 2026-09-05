# Composants · `forms`

Pour chaque composant : le **contrat de props** (avec ses raisons, pas seulement ses types),
puis l'**implémentation de référence**. Les styles sont en ligne parce que le système est
en React ; les états qu'un style en ligne ne peut pas exprimer (`:focus-visible`, `:active`,
`:disabled`) vivent dans `css/brand/states.css`.


---

## `ChipRow`

Filtres de catalogue, de blog ou d'onglets de leçon.

```jsx
<ChipRow options={['Tout','SEO','IA','Marketing']} />
<ChipRow options={['Vidéo','Transcription','Mes notes','Ressources']} height={36} />
```

### Contrat de props

```ts
/**
 * Rangée de filtres en pilules, défilement horizontal masqué. Le chip actif est en encre pleine.
 */
export interface ChipRowProps {
  options?: string[];
  value?: string;
  onChange?: (option: string) => void;
  /** 40 par défaut ; 36 dans un lecteur de leçon. */
  height?: number;
  style?: React.CSSProperties;
}
export function ChipRow(props: ChipRowProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

export function ChipRow({options=[],value,onChange,height=40,style}){
  return (
    <div style={{display:'flex',gap:'var(--sp-8)',overflow:'hidden',padding:'2px 0',...style}}>
      {options.map((o,i)=>{
        const on = value===undefined ? i===0 : value===o;
        return (
          <span key={o} className={onChange?'mm-press-sm':undefined} onClick={onChange?()=>onChange(o):undefined} style={{
            height:height+'px',display:'inline-flex',alignItems:'center',padding:'0 16px',borderRadius:'var(--r-pill)',
            whiteSpace:'nowrap',fontSize:'13px',cursor:onChange?'pointer':'default',
            background:on?'var(--ink)':'var(--ctl-off-bg)',
            border:'1px solid '+(on?'var(--ink)':'var(--ctl-off-brd)'),
            color:on?'var(--text-on-primary)':'var(--text-muted)',fontWeight:on?600:500,
            transition:'background var(--t-ui) var(--ease),color var(--t-ui) var(--ease)'}}>{o}</span>
        );
      })}
    </div>
  );
}
```

---

## `Field`

Champ de formulaire du produit — mocks statiques : la valeur est une chaîne, pas un état contrôlé.

```jsx
<Field label="Ton e-mail" placeholder="aissatou@exemple.sn" />
<Field label="Écris SUPPRIMER pour confirmer" state="error" hint="Le texte ne correspond pas encore." />
```

`multiline` pour un message. `trailing` pour l'œil du mot de passe.

### Contrat de props

```ts
import * as React from 'react';

/**
 * Champ de saisie avec son étiquette et son aide. Trois états seulement :
 * repos, focus (liseré bleu + anneau), erreur (liseré rouge + anneau, aide en rouge).
 */
export interface FieldProps {
  label?: string;
  /** Valeur saisie. Vide → le placeholder s'affiche en gris. */
  value?: string;
  placeholder?: string;
  /** Aide sous le champ. En état error, elle passe en rouge. */
  hint?: string;
  /** @default "idle" */
  state?: 'idle' | 'focus' | 'error';
  /** Zone de texte, 96 px de haut. */
  multiline?: boolean;
  /** Élément à droite dans le champ (œil de mot de passe, unité…). */
  trailing?: React.ReactNode;
  /* Aucune prop de thème : la surface vient d'un jeton qui bascule sous `.dk`. */
  style?: React.CSSProperties;
}
export function Field(props: FieldProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

export function Field({label,value,placeholder,hint,state='idle',multiline,trailing,style}){
  const ring = state==='focus' ? {borderColor:'var(--mm-bleu)',boxShadow:'var(--focus-ring)'}
            : state==='error' ? {borderColor:'var(--stop)',boxShadow:'var(--error-ring)'} : null;
  return (
    <label style={{display:'block',marginTop:'var(--sp-14)',...style}}>
      {label && <span style={{display:'block',fontSize:'12.5px',fontWeight:600,color:'var(--text-muted)',marginBottom:'var(--sp-6)'}}>{label}</span>}
      <span style={{
        display:'flex',alignItems:multiline?'flex-start':'center',gap:'var(--sp-10)',
        minHeight:multiline?'96px':'54px',padding:multiline?'14px 16px 0':'0 16px',
        borderRadius:'var(--r-m)',background:'var(--field-bg)',
        border:'1.5px solid var(--border-field)',boxShadow:'var(--field-hl)',
        fontSize:'15px',lineHeight:multiline?1.5:'normal',color:'var(--text-body)',
        transition:'border-color var(--t-ui) var(--ease),box-shadow var(--t-ui) var(--ease)',...ring}}>
        <span style={{flex:1,color:value?'var(--text-body)':'var(--text-faint)'}}>{value || placeholder}</span>
        {trailing}
      </span>
      {hint && <span style={{display:'block',fontSize:'11.5px',color:state==='error'?'var(--stop)':'var(--text-faint)',marginTop:'var(--sp-6)'}}>{hint}</span>}
    </label>
  );
}
```

---

## `PayOption`

Choix exclusif au tunnel de paiement (Wave, Orange Money, carte) et dans le sélecteur de pack.

```jsx
<PayOption on logo="W" logoBackground="linear-gradient(135deg,#3FD8FF,#009FE3)"
  title="Wave" note="Tu valides dans l'app Wave" />
<PayOption title="Je ne sais pas trop" />
```

« Free Money » figure aux CGV mais n'est pas offert au tunnel (FR-098) : ne pas l'ajouter sans décision.

### Contrat de props

```ts
import * as React from 'react';

/**
 * Ligne de choix exclusif à radio, 68 px de haut : moyens de paiement au tunnel,
 * réponses du sélecteur de pack TPE. Sans `logo`, c'est une simple option de réponse.
 */
export interface PayOptionProps {
  /** Sigle du prestataire — « W », « OM » — ou une icône. */
  logo?: React.ReactNode;
  /** Fond du carré de logo (dégradé de la marque du prestataire). */
  logoBackground?: string;
  title?: string;
  note?: string;
  on?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}
export function PayOption(props: PayOptionProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

export function PayOption({logo,logoBackground,title,note,on,onClick,style}){
  return (
    <div className={onClick?'mm-press':undefined} onClick={onClick} style={{
      display:'flex',alignItems:'center',gap:'13px',padding:'15px',borderRadius:'var(--r-m)',minHeight:'68px',
      background:'var(--ctl-off-bg)',border:'1.5px solid '+(on?'var(--ctl-sel-brd)':'var(--ctl-off-brd)'),
      boxShadow:on?'var(--ctl-sel-ring),var(--glass-hl)':'none',cursor:onClick?'pointer':'default',
      transition:'border-color var(--t-ui) var(--ease),box-shadow var(--t-ui) var(--ease)',...style}}>
      {logo && <span style={{width:'44px',height:'44px',borderRadius:'13px',display:'grid',placeItems:'center',flex:'0 0 auto',
        fontFamily:'var(--f-display)',fontWeight:900,fontSize:'16px',color:'#fff',background:logoBackground}}>{logo}</span>}
      <span style={{flex:1}}>
        <b style={{display:'block',fontSize:'14.5px',fontWeight:600}}>{title}</b>
        {note && <span style={{fontSize:'12px',color:'var(--text-faint)'}}>{note}</span>}
      </span>
      <span style={{width:'22px',height:'22px',borderRadius:'50%',flex:'0 0 auto',
        border:(on?'7px':'2px')+' solid '+(on?'var(--ink)':'var(--ctl-radio-brd)'),
        transition:'border-width var(--t-ui) var(--ease),border-color var(--t-ui) var(--ease)'}} />
    </div>
  );
}
```

---

## `Segmented`

Segments pour un choix exclusif court.

```jsx
<Segmented options={['Français','English']} />
<Segmented options={['Clair','Sombre','Système']} value="Sombre" />
```

### Contrat de props

```ts
/**
 * Contrôle segmenté, 2 à 3 options courtes : langue, apparence, portée d'un classement.
 * Au-delà de trois options, utiliser ChipRow.
 */
export interface SegmentedProps {
  options?: string[];
  /** Option active. Par défaut la première. */
  value?: string;
  onChange?: (option: string) => void;
  style?: React.CSSProperties;
}
export function Segmented(props: SegmentedProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

export function Segmented({options=[],value,onChange,style}){
  return (
    <div style={{display:'flex',padding:'4px',borderRadius:'var(--r-pill)',background:'var(--surface-quiet)',gap:'4px',...style}}>
      {options.map((o,i)=>{
        const on = value===undefined ? i===0 : value===o;
        return (
          <span key={o} className={onChange?'mm-press-sm':undefined} onClick={onChange?()=>onChange(o):undefined} style={{
            flex:1,textAlign:'center',fontSize:'13px',fontWeight:600,padding:'9px 0',borderRadius:'var(--r-pill)',
            cursor:onChange?'pointer':'default',
            color:on?'var(--ink)':'var(--text-muted)',background:on?'var(--seg-on-bg)':'transparent',
            boxShadow:on?'var(--seg-on-sh)':'none',
            transition:'background var(--t-ui) var(--ease),color var(--t-ui) var(--ease),box-shadow var(--t-ui) var(--ease)'}}>{o}</span>
        );
      })}
    </div>
  );
}
```

---

## `StepDots`

Barres d'étape du tunnel d'achat et du sélecteur TPE.

```jsx
<StepDots total={3} current={2} />
```

### Contrat de props

```ts
/**
 * Avancement d'un tunnel court — trois barres pleine largeur, jamais un numéro seul.
 * Le libellé « Étape 2 sur 3 » vit dans la barre haute, pas ici.
 */
export interface StepDotsProps {
  /** @default 3 */
  total?: number;
  /** Nombre d'étapes franchies. @default 1 */
  current?: number;
  style?: React.CSSProperties;
}
export function StepDots(props: StepDotsProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

export function StepDots({total=3,current=1,style}){
  return (
    <div style={{display:'flex',gap:'5px',...style}}>
      {Array.from({length:total}).map((_,i)=>(
        <i key={i} style={{flex:1,height:'4px',borderRadius:'3px',background:i<current?'var(--ink)':'var(--fill-3)'}} />
      ))}
    </div>
  );
}
```

---

## `Switch`

Interrupteur de préférence. Le seul composant dont l'état désactivé porte du sens : il déclare une promesse non tenue plutôt que de la cacher.

```jsx
<Switch on />
<Switch disabled />   {/* « pas encore disponible » */}
```

### Contrat de props

```ts
/**
 * Interrupteur, 48 × 29. Actif : dégradé bleu→violet.
 * L'état désactivé est un usage à part entière du produit — il sert à dire
 * « ce réglage existe mais ne fait rien encore » (canal e-mail absent, R-14)
 * au lieu de laisser croire le contraire.
 */
export interface SwitchProps {
  on?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}
export function Switch(props: SwitchProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

export function Switch({on,disabled,onClick,style}){
  return (
    <span role="switch" aria-checked={!!on} aria-disabled={disabled||undefined} onClick={disabled?undefined:onClick} style={{
      width:'48px',height:'29px',borderRadius:'16px',position:'relative',flex:'0 0 auto',cursor:disabled?'default':'pointer',
      background:on?'var(--action-forme)':'var(--fill-4)',opacity:disabled?.4:1,
      transition:'background var(--t-ui) var(--ease),opacity var(--t-ui) var(--ease)',...style}}>
      <b style={{position:'absolute',left:'3px',top:'3px',width:'23px',height:'23px',borderRadius:'50%',background:'#fff',
        boxShadow:'0 2px 6px rgba(14,17,22,.24)',transform:on?'translateX(19px)':'none',
        transition:'transform var(--t-ui) var(--ease)'}} />
    </span>
  );
}
```
