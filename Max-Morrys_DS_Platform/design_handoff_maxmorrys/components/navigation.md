# Composants · `navigation`

Pour chaque composant : le **contrat de props** (avec ses raisons, pas seulement ses types),
puis l'**implémentation de référence**. Les styles sont en ligne parce que le système est
en React ; les états qu'un style en ligne ne peut pas exprimer (`:focus-visible`, `:active`,
`:disabled`) vivent dans `css/brand/states.css`.

> **Budget de verre.** `TabBar` est le seul composant du système qui porte encore un
> `backdrop-filter` — c'est du chrome qui ne défile pas. Elle porte pour cela la classe
> `mm-chrome`, accroche des trois replis : un flou déclaré en style inline échappe sinon à
> `.lowfi`, à `prefers-reduced-transparency` et à `@supports not`. Voir `REGLES-DE-REVUE.md` § 1.


---

## `Breadcrumb`

Fil d'Ariane des pages éditoriales et de catalogue.

```jsx
<Breadcrumb items={["Je t'informe",'Blog','SEO local']} />
```

### Contrat de props

```ts
import * as React from 'react';

/**
 * Fil d'Ariane en monospace, 11,5 px. Il manque aujourd'hui sur quatre pages publiques
 * (FR-108) : c'est une dette, pas une option de conception.
 */
export interface BreadcrumbProps {
  items?: string[];
  style?: React.CSSProperties;
}
export function Breadcrumb(props: BreadcrumbProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

export function Breadcrumb({items=[],style}){
  return (
    <div style={{display:'flex',alignItems:'center',gap:'7px',fontSize:'11.5px',color:'var(--text-faint)',fontFamily:'var(--f-mono)',...style}}>
      {items.map((it,i)=>(
        <React.Fragment key={it}>
          {i>0 && <span>/</span>}
          <b style={{color:i===items.length-1?'var(--text-muted)':'var(--text-faint)',fontWeight:400}}>{it}</b>
        </React.Fragment>
      ))}
    </div>
  );
}
```

---

## `Pipeline`

Filtre de statut des écrans commerciaux de la console.

```jsx
<Pipeline active="nouveau" stages={['nouveau','qualifié','devisé','signé','perdu']} />
```

### Contrat de props

```ts
import * as React from 'react';

/**
 * Filtre de statut de la console : le cycle de vente d'un prospect ou d'une demande.
 * Les deux cycles ne se fusionnent jamais — prospects TPE (nouveau, qualifié, devisé,
 * signé, perdu) et demandes agence (nouveau, qualifié, cadrage, proposition, gagné, perdu)
 * n'ont ni la même durée ni le même interlocuteur.
 */
export interface PipelineProps {
  stages?: string[];
  active?: string;
  onSelect?: (stage: string) => void;
  style?: React.CSSProperties;
}
export function Pipeline(props: PipelineProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

export function Pipeline({stages=[],active,onSelect,style}){
  return (
    <div style={{display:'flex',gap:'5px',overflow:'hidden',...style}}>
      {stages.map(s=>{
        const on = s===active;
        return <span key={s} onClick={onSelect?()=>onSelect(s):undefined} style={{fontSize:'11px',fontWeight:600,padding:'5px 10px',
          borderRadius:'var(--r-pill)',whiteSpace:'nowrap',cursor:onSelect?'pointer':'default',
          background:on?'#fff':'rgba(255,255,255,.08)',color:on?'#0E1116':'#8B95A3'}}>{s}</span>;
      })}
    </div>
  );
}
```

---

## `ReadingBar`

Progression de lecture d'un article ou d'un épisode.

```jsx
<ReadingBar value={46} />
```

### Contrat de props

```ts
import * as React from 'react';

/**
 * Barre de lecture d'un article, 3 px, en haut de l'écran, dégradé orange→corail→violet.
 * Elle se remplit à l'entrée sous un parent `.play`. C'est la seule animation de l'écran article.
 */
export interface ReadingBarProps {
  /** 0 à 100. */
  value?: number;
  style?: React.CSSProperties;
}
export function ReadingBar(props: ReadingBarProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

export function ReadingBar({value=0,style}){
  return (
    <div style={{position:'absolute',left:0,right:0,top:0,height:'3px',zIndex:9,background:'var(--fill-1)',...style}}>
      <i style={{display:'block',height:'100%',width:value+'%',
        background:'linear-gradient(90deg,#F38B0A,#FF6E7F,#6C23DD)',transition:'width 1.4s var(--ease-out)'}} />
    </div>
  );
}
```

---

## `SearchPill`

Recherche du site, et composeur de question Rysmo.

```jsx
<SearchPill icon={loupe} label="TROUVE CE " hint="QU'IL TE FAUT" />
<SearchPill hint="Écris ta question…" height={54} trailing={sendButton} />
```

### Contrat de props

```ts
import * as React from 'react';

/**
 * Champ de recherche en pilule de verre, 56 px. Le libellé est en capitales grasses
 * avec sa fin en gris : « TROUVE CE QU'IL TE FAUT ». Sert aussi de composeur Rysmo.
 *
 * Faux verre, aucun flou : ce n'est pas du chrome fixe, rien ne passe dessous. Elle prenait
 * `.glass` et devenait la troisième surface floutée d'une page qui a déjà sa barre haute et
 * son héros. Voir REGLES-DE-REVUE.md § 1.
 */
export interface SearchPillProps {
  /** Partie grasse du libellé. *
 * Faux verre, aucun flou : ce n'est pas du chrome fixe, rien ne passe dessous. Elle prenait
 * `.glass` et devenait la troisième surface floutée d'une page qui a déjà sa barre haute et
 * son héros. Voir REGLES-DE-REVUE.md § 1.
 */
  label?: string;
  /** Partie grise. *
 * Faux verre, aucun flou : ce n'est pas du chrome fixe, rien ne passe dessous. Elle prenait
 * `.glass` et devenait la troisième surface floutée d'une page qui a déjà sa barre haute et
 * son héros. Voir REGLES-DE-REVUE.md § 1.
 */
  hint?: string;
  /** Icône de gauche (loupe). Absente pour le composeur. *
 * Faux verre, aucun flou : ce n'est pas du chrome fixe, rien ne passe dessous. Elle prenait
 * `.glass` et devenait la troisième surface floutée d'une page qui a déjà sa barre haute et
 * son héros. Voir REGLES-DE-REVUE.md § 1.
 */
  icon?: React.ReactNode;
  /** Bouton d'envoi à droite. *
 * Faux verre, aucun flou : ce n'est pas du chrome fixe, rien ne passe dessous. Elle prenait
 * `.glass` et devenait la troisième surface floutée d'une page qui a déjà sa barre haute et
 * son héros. Voir REGLES-DE-REVUE.md § 1.
 */
  trailing?: React.ReactNode;
  height?: number;
  style?: React.CSSProperties;
}
export function SearchPill(props: SearchPillProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

export function SearchPill({label,hint,icon,trailing,height=56,style}){
  return (
    <div className="glass-flat" style={{display:'flex',alignItems:'center',gap:'var(--sp-10)',height:height+'px',
      borderRadius:'var(--r-pill)',padding:'0 20px',...style}}>
      {icon}
      <span style={{fontWeight:700,fontSize:'14px'}}>{label}<em style={{fontStyle:'normal',color:'var(--text-faint)',fontWeight:500}}>{hint}</em></span>
      {trailing && <span style={{marginLeft:'auto',display:'flex',alignItems:'center'}}>{trailing}</span>}
    </div>
  );
}
```

---

## `SideNav`

Barre latérale tablette (700–1080 px).

```jsx
<SideNav brand={<Wordmark size={21} />} active="Je te forme"
  items={[{label:'Je te forme',color:'#0057BC'},{label:"Je t'informe",color:'#F38B0A'}]} />
```

### Contrat de props

```ts
import * as React from 'react';

/**
 * Navigation latérale de 250 px, en verre, pour tablette et écran large.
 * Chaque territoire porte sa pastille de couleur ; les entrées hors territoire
 * portent une pastille grise.
 */
export interface SideNavProps {
  brand?: React.ReactNode;
  items?: { label: string; color?: string }[];
  active?: string;
  onSelect?: (label: string) => void;
  /** Bloc bas : reprise de cours, progression. */
  footer?: React.ReactNode;
  style?: React.CSSProperties;
}
export function SideNav(props: SideNavProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

export function SideNav({brand,items=[],active,onSelect,footer,style}){
  return (
    <div className="glass" style={{borderRadius:0,border:0,borderRight:'1px solid var(--nav-brd)',boxShadow:'none',
      padding:'22px 18px',position:'relative',zIndex:3,...style}}>
      {brand && <div style={{margin:'2px 0 22px 12px'}}>{brand}</div>}
      {items.map(it=>{
        const on = it.label===active;
        return (
          <a key={it.label} onClick={onSelect?()=>onSelect(it.label):undefined} style={{display:'flex',alignItems:'center',gap:'10px',
            padding:'11px 13px',borderRadius:'14px',fontSize:'13.5px',fontWeight:600,textDecoration:'none',marginBottom:'3px',
            cursor:onSelect?'pointer':'default',
            color:on?'var(--text-body)':'var(--text-muted)',
            background:on?'var(--nav-on-bg)':'transparent',boxShadow:on?'var(--nav-on-sh)':'none'}}>
            <u style={{width:'8px',height:'8px',borderRadius:'3px',display:'block',background:it.color||'var(--fill-5)'}} />
            {it.label}
          </a>
        );
      })}
      {footer && <div style={{marginTop:'22px'}}>{footer}</div>}
    </div>
  );
}
```

---

## `SubNav`

Sépare les deux étages d'un même territoire, en tête de page.

```jsx
<SubNav active="Écouter & regarder"
  items={[{label:'Écouter & regarder'},{label:'Le Club des Digitos',color:'#6C23DD'}]} />
```

Sur le territoire violet, l'ordre n'est pas négociable : le gratuit d'abord, le Club ensuite. Le passage vers le Club se place **en bas** de la page, après le contenu.

### Contrat de props

```ts
import * as React from 'react';

/**
 * Sous-navigation d'un territoire, en tête de page. Elle existe pour une raison précise :
 * « Je te transforme » abrite du contenu **gratuit et ouvert** (podcast, vidéos) et du contenu
 * **payant et fermé** (le Club). Sans cette séparation visible, un visiteur croit le podcast
 * derrière le mur et ne clique pas — et le haut de l'entonnoir perd sa fonction.
 */
export interface SubNavProps {
  items?: { label: string; color?: string }[];
  active?: string;
  onSelect?: (label: string) => void;
  style?: React.CSSProperties;
}
export function SubNav(props: SubNavProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

export function SubNav({items=[],active,onSelect,style}){
  return (
    <div style={{display:'flex',gap:'8px',...style}}>
      {items.map((it,i)=>{
        const on = active===undefined ? i===0 : active===it.label;
        return (
          <a key={it.label} className={onSelect?'mm-press-sm':undefined} onClick={onSelect?()=>onSelect(it.label):undefined} style={{
            display:'inline-flex',alignItems:'center',gap:'9px',height:'42px',padding:'0 16px',borderRadius:'var(--r-pill)',
            fontSize:'13.5px',fontWeight:600,textDecoration:'none',cursor:onSelect?'pointer':'default',
            background:on?'var(--surface-card)':'var(--ctl-off-bg)',
            border:'1px solid '+(on?'var(--glass-brd)':'var(--ctl-off-brd)'),
            color:on?'var(--text-body)':'var(--text-muted)',
            boxShadow:on?'var(--glass-hl),0 4px 14px rgba(14,17,22,.07)':'none'}}>
            <u style={{width:'8px',height:'8px',borderRadius:'3px',display:'block',background:it.color||'var(--fill-5)'}} />
            {it.label}
          </a>
        );
      })}
    </div>
  );
}
```

---

## `TabBar`

Navigation basse de l'espace apprenant.

```jsx
<TabBar active="Espace" items={[{label:'Espace',icon:homeIcon},{label:'Cours',icon:bookIcon},{label:'Rysmo',icon:chatIcon},{label:'Club',icon:peopleIcon},{label:'Profil',icon:userIcon}]} />
```

Elle est `position:absolute` en bas de son conteneur : prévoir 104 px de rembourrage bas dans le corps de l'écran.

### Contrat de props

```ts
import * as React from 'react';

/**
 * Barre d'onglets basse, 80 px, en verre flouté — c'est la seule surface floutée
 * fixe d'un écran d'espace personnel, et elle compte dans le budget de deux.
 * Cinq onglets : Espace, Cours, Rysmo, Club, Profil.
 *
 * Elle porte la classe `mm-chrome` : c'est l'accroche des trois replis. Un flou déclaré en
 * style inline échappe à `.lowfi`, à `prefers-reduced-transparency` et à `@supports not` —
 * sans cette classe, le repli ne coupait rien sur la seule surface encore floutée.
 */
export interface TabBarProps {
  /** Onglets : { label, icon }. *
 * Elle porte la classe `mm-chrome` : c'est l'accroche des trois replis. Un flou déclaré en
 * style inline échappe à `.lowfi`, à `prefers-reduced-transparency` et à `@supports not` —
 * sans cette classe, le repli ne coupait rien sur la seule surface encore floutée.
 */
  items?: { label: string; icon?: React.ReactNode }[];
  /** Libellé de l'onglet actif. *
 * Elle porte la classe `mm-chrome` : c'est l'accroche des trois replis. Un flou déclaré en
 * style inline échappe à `.lowfi`, à `prefers-reduced-transparency` et à `@supports not` —
 * sans cette classe, le repli ne coupait rien sur la seule surface encore floutée.
 */
  active?: string;
  onSelect?: (label: string) => void;
  /* Aucune prop de thème : la surface vient d'un jeton qui bascule sous `.dk`. *
 * Elle porte la classe `mm-chrome` : c'est l'accroche des trois replis. Un flou déclaré en
 * style inline échappe à `.lowfi`, à `prefers-reduced-transparency` et à `@supports not` —
 * sans cette classe, le repli ne coupait rien sur la seule surface encore floutée.
 */
  style?: React.CSSProperties;
}
export function TabBar(props: TabBarProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

export function TabBar({items=[],active,onSelect,style}){
  return (
    /* mm-chrome : la classe d'accroche des replis. Sans elle, le flou en ligne échappe à
       `.lowfi`, à `prefers-reduced-transparency` et à `@supports not`. */
    <div className="mm-chrome" style={{position:'absolute',left:0,right:0,bottom:0,height:'var(--tabbar-h)',
      display:'flex',alignItems:'flex-start',padding:'10px 8px 0',zIndex:7,
      background:'var(--tabbar-bg)',
      backdropFilter:'blur(var(--glass-blur-chrome)) saturate(180%)',WebkitBackdropFilter:'blur(var(--glass-blur-chrome)) saturate(180%)',
      borderTop:'1px solid var(--tabbar-brd)',
      boxShadow:'var(--tabbar-hl)',...style}}>
      {items.map(it=>{
        const on = it.label===active;
        return (
          <a key={it.label} onClick={onSelect?()=>onSelect(it.label):undefined} style={{flex:1,display:'flex',flexDirection:'column',
            alignItems:'center',gap:'3px',fontSize:'10px',fontWeight:600,textDecoration:'none',minHeight:'48px',justifyContent:'center',
            cursor:onSelect?'pointer':'default',color:on?'var(--text-body)':'var(--text-faint)'}}>
            {it.icon}{it.label}
          </a>
        );
      })}
    </div>
  );
}
```

---

## `TopBar`

Navigation du site public au-delà de 1080 px.

```jsx
<TopBar brand={<Wordmark size={23} />} items={[{label:'Je suis Max-Morrys'},{label:'Je te forme',territory:'forme'},{label:"Je t'informe",territory:'informe'}]} trailing={<Button size="sm">Connexion</Button>} />
```

L'ordre des entrées est fixe : Je suis · Je te forme · Je t'informe · Je te transforme · Je te digitalise · Contacte-moi.

### Contrat de props

```ts
import * as React from 'react';

/**
 * Barre de navigation desktop : pilule de verre flottante, détachée des bords
 * (marge de 16 px en haut, 22 px sur les côtés). Chaque entrée de territoire porte
 * son filet de couleur sous le libellé.
 */
export interface TopBarProps {
  /** Marque à gauche — Wordmark. */
  brand?: React.ReactNode;
  /** Entrées : { label, territory? }. */
  items?: { label: string; territory?: 'forme' | 'informe' | 'transforme' | 'digitalise' }[];
  active?: string;
  onSelect?: (label: string) => void;
  /** Bloc de droite : langue, connexion. */
  trailing?: React.ReactNode;
  style?: React.CSSProperties;
}
export function TopBar(props: TopBarProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

const mmTerritoryInk = {forme:'var(--mm-bleu)',informe:'var(--mm-orange)',transforme:'var(--mm-violet)',digitalise:'var(--mm-teal)'};

export function TopBar({brand,items=[],active,onSelect,trailing,style}){
  return (
    <div className="glass" style={{display:'flex',alignItems:'center',gap:'24px',padding:'14px 22px',
      position:'relative',zIndex:4,margin:'16px 22px',borderRadius:'var(--r-pill)',...style}}>
      {brand}
      {items.map(it=>(
        <a key={it.label} onClick={onSelect?()=>onSelect(it.label):undefined} style={{fontSize:'13.5px',fontWeight:600,
          color:'var(--text-body)',textDecoration:'none',paddingBottom:'3px',cursor:onSelect?'pointer':'default',
          borderBottom:'2px solid '+(it.territory?mmTerritoryInk[it.territory]:(it.label===active?'var(--ink)':'transparent')),
          transition:'border-color var(--t-ui) var(--ease)'}}>{it.label}</a>
      ))}
      {trailing && <span style={{marginLeft:'auto',display:'flex',gap:'12px',alignItems:'center'}}>{trailing}</span>}
    </div>
  );
}
```
