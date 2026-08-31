# Composants · `surfaces`

Pour chaque composant : le **contrat de props** (avec ses raisons, pas seulement ses types),
puis l'**implémentation de référence**.

> **Aucune valeur d'opacité ni de flou n'est répétée dans ce fichier, à dessein.** Elles vivent
> dans `css/tokens/glass.css` et `css/brand/surfaces.css`, et nulle part ailleurs. Six fichiers
> les redisaient en prose ; quatre avaient dérivé du CSS réel. Pour les lire, ouvrez la fiche
> « Niveaux de verre » : elle les **sonde** dans la feuille de styles appliquée.


---

## `EmptyState`

État vide, erreur, hors connexion, 403.

```jsx
<EmptyState glyphBackground="linear-gradient(135deg,#FFDCA8,#FFC9CE)"
  title="Aucune formation n'est encore en ligne."
  body="Je préfère te le dire que te faire cliquer dans le vide."
  action={<Button tone="primary">Crée ton compte</Button>} />
```

Ne jamais écrire « oups », ne jamais s'excuser : dire quoi, et quoi faire.

### Contrat de props

```ts
import * as React from 'react';

/**
 * État vide. Règle du produit : un écran vide est une invitation à agir, pas une excuse.
 * Il dit ce qui manque, pourquoi, et la seule chose à faire ensuite.
 */
export interface EmptyStateProps {
  /** Carré de glyphe, 64 px. */
  glyph?: React.ReactNode;
  /** Fond du carré de glyphe. */
  glyphBackground?: string;
  title?: string;
  body?: string;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}
export function EmptyState(props: EmptyStateProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

export function EmptyState({glyph,glyphBackground='var(--fill-1)',title,body,action,style}){
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',padding:'34px 20px',...style}}>
      {glyph!==undefined && <span style={{width:'64px',height:'64px',borderRadius:'22px',display:'grid',placeItems:'center',marginBottom:'16px',background:glyphBackground}}>{glyph}</span>}
      {title && <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'22px',letterSpacing:'-.03em',lineHeight:1.1,margin:0}}>{title}</p>}
      {body && <p style={{fontSize:'13.5px',color:'var(--text-muted)',lineHeight:1.5,marginTop:'9px',maxWidth:'34ch'}}>{body}</p>}
      {action && <div style={{marginTop:'18px',width:'100%'}}>{action}</div>}
    </div>
  );
}
```

---

## `GlassPanel`

Surface porteuse de tout le contenu. Le niveau se choisit par une seule question : est-ce que ça défile ?

```jsx
<GlassPanel level="hero" padding={22}>…prix et bouton…</GlassPanel>
<GlassPanel level="flat" padding="6px 18px">…liste de leçons…</GlassPanel>
<GlassPanel level="truth">…ce que je peux te prouver…</GlassPanel>
```

`hero` est le plancher d'opacité (0,45) : ne descendez pas plus bas, le contraste passe sous 4,5:1 sur le maillage violet.

### Contrat de props

```ts
import * as React from 'react';

/**
 * Panneau de verre. Cinq niveaux, un seul choix à faire : **est-ce que ça défile ?**
 * Si oui — et sur mobile, la réponse est presque toujours oui — c'est `flat`.
 *
 * **Le flou n'a droit qu'à une surface qui ne défile pas avec le contenu** : `fixed` ou
 * `sticky` en production, `absolute` dans une maquette à cadre. En pratique, seul le niveau
 * `panel` en porte un, et seulement quand il sert de chrome (barre haute, barre d'onglets).
 * Les quatre autres niveaux n'en ont pas : leur voile est plus couvrant à la place.
 *
 * **Aucune valeur numérique n'est répétée dans ce fichier, à dessein.** Les opacités et les
 * flous vivent dans `tokens/glass.css` et `brand/surfaces.css`, et nulle part ailleurs. Six
 * fichiers les redisaient en prose ; quatre avaient dérivé du CSS réel. La fiche
 * « Niveaux de verre » les affiche en les **sondant** dans la feuille de styles appliquée —
 * c'est la seule source à consulter.
 *
 * Un repli ne compense que ce qui se perd : sur appareil modeste, les niveaux déjà sans flou
 * gardent leur voile de conception. Leur translucidité est une décision, pas un artefact.
 */
export interface GlassPanelProps {
  /**
   * `panel` — chrome et panneau générique, le seul niveau qui peut porter un flou.
   * `hero` — prix, formulaire principal : la surface la plus importante de l'écran.
   * `flat` — listes, fils, grilles : le défaut sur mobile, pas l'exception.
   * `night` — contenu en portée sombre. Jamais du chrome.
   * `truth` — l'encart de vérité, avec son sourcil.
   * @default "panel"
   */
  level?: 'panel' | 'hero' | 'flat' | 'night' | 'truth';
  padding?: number | string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}
export function GlassPanel(props: GlassPanelProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

const mmGlassClass = {panel:'glass',hero:'glass-hero',flat:'glass-flat',night:'glass-d',truth:'truth'};

export function GlassPanel({level='panel',padding,children,style,className=''}){
  return (
    <div className={(mmGlassClass[level]||'glass')+(className?' '+className:'')}
      style={{padding:typeof padding==='number'?padding+'px':padding,...style}}>{children}</div>
  );
}
```

---

## `Mesh`

Fond maillé d'un écran. Un territoire = un maillage ; l'utilisateur sait où il est avant d'avoir lu un mot.

```jsx
<div style={{position:'relative',isolation:'isolate'}}>
  <Mesh territory="transforme" />
  <div style={{position:'relative',zIndex:3}}>…</div>
</div>
```

`nuit` sert à la console d'administration et au mode sombre. Sur écran large, `size={520}`.

### Contrat de props

```ts
import * as React from 'react';

/**
 * Fond de territoire : trois lobes de couleur flous en dérive lente, sous un voile
 * de lisibilité qui monte de 42 % en haut à 90 % en bas. Poids : 0 octet.
 * Se place en premier enfant d'un conteneur `position:relative`.
 */
export interface MeshProps {
  /** @default "forme" */
  territory?: 'forme' | 'informe' | 'transforme' | 'digitalise' | 'nuit';
  /** Diamètre des lobes en px — 340 sur mobile, 460–520 sur écran large. */
  size?: number;
  /** Substitution de style par lobe, dans l'ordre. Le kit s'en sert une fois :
   *  /agence prend un premier lobe corail sur le maillage Digitalise. */
  lobes?: React.CSSProperties[];
  style?: React.CSSProperties;
}
export function Mesh(props: MeshProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

export function Mesh({territory='forme',size,lobes,style}){
  const s = size ? {width:size+'px',height:size+'px'} : null;
  return (
    <div className={'mesh m-'+territory} style={style}>
      {[0,1,2].map(i=><b key={i} style={{...s,...(lobes&&lobes[i])}} />)}
    </div>
  );
}
```

---

## `Skeleton`

Bloc de chargement. Reproduisez la géométrie de l'écran final, pas un bloc générique.

```jsx
<Skeleton height={30} width="70%" />
<Skeleton height={96} radius={24} style={{marginTop:12}} />
```

### Contrat de props

```ts
/**
 * Squelette de chargement : la forme du contenu avant le contenu, jamais un rond qui tourne.
 * Le miroitement ne démarre que sous un parent `.play`.
 */
export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  style?: React.CSSProperties;
}
export function Skeleton(props: SkeletonProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

export function Skeleton({width='100%',height=16,radius='var(--r-s)',style}){
  return <div className="skel" style={{
    width:typeof width==='number'?width+'px':width,
    height:typeof height==='number'?height+'px':height,
    borderRadius:typeof radius==='number'?radius+'px':radius,
    background:'linear-gradient(100deg,var(--fill-1) 30%,var(--fill-3) 48%,var(--fill-1) 62%)',
    backgroundSize:'280% 100%',animation:'shim 1.5s infinite linear',...style}} />;
}
```

---

## `TerritoryCard`

Carte de territoire — le motif signature. À utiliser en pile de 2 à 4 sur mobile, en grille au-delà de 700 px.

```jsx
<div style={{marginTop:16}}>
  <TerritoryCard first territory="forme" meta="6 modules · 47 leçons" title="Je te forme" big="1" bigLabel="formation" />
  <TerritoryCard territory="informe" meta="Blog · podcast · vidéo" title="Je t'informe" big="46" bigLabel="gratuits" />
</div>
```

Ne mélangez pas les teintes hors logo. `stacked={false}` pour la grille tablette.

### Contrat de props

```ts
import * as React from 'react';

/**
 * La signature du système : quatre cartes qui s'emboîtent par un chevron et
 * reconstruisent la silhouette du M du logo en défilant. Dégradé à deux arrêts entre
 * la teinte du territoire et sa voisine dans le logo.
 * En `stacked`, chevauchement de −14 px. Au-delà de 700 px de large, passer en grille
 * (`stacked={false}`) : le chevron isolé sur une carte trop large devient un accident graphique.
 */
export interface TerritoryCardProps {
  /* L'encre de la carte vient de --card-ink / --card-ink-2 : elle s'inverse avec les
     dégradés en mode sombre. Ne jamais coder une couleur de texte en dur ici. */
  /** @default "forme" */
  territory?: 'forme' | 'informe' | 'transforme' | 'digitalise' | 'rose';
  /** Sourcil monospace — compte, durée, date. */
  meta?: string;
  /** Titre en Fraunces 900. */
  title?: React.ReactNode;
  /** Nombre vérifié à droite, en monospace. */
  big?: React.ReactNode;
  /** Légende sous le nombre, en capitales. */
  bigLabel?: string;
  /** Empilement en M : chevron + poignée + chevauchement. @default true */
  stacked?: boolean;
  /** Première carte de la pile — supprime le chevauchement haut. */
  first?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export function TerritoryCard(props: TerritoryCardProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

const mmLayout = {
  stack:{chevron:true,overlap:true,  pad:'24px 20px 36px'},
  grid: {chevron:true,overlap:false, pad:'24px 20px 28px'},
  row:  {chevron:true,overlap:false, pad:'26px 20px 30px'},
  plain:{chevron:false,overlap:false,pad:'20px'}
};

export function TerritoryCard({territory='forme',meta,title,titleSize,big,bigLabel,trailing,padding,layout,stacked=true,first,children,style}){
  const grad = 'linear-gradient(150deg,var(--g-'+territory+'-1) 0%,var(--g-'+territory+'-2) 100%)';
  const L = mmLayout[layout] || (stacked ? mmLayout.stack : mmLayout.plain);
  return (
    <div style={{
      position:'relative',borderRadius:'var(--r-l)',
      padding:padding!==undefined?(typeof padding==='number'?padding+'px':padding):L.pad,
      marginTop:L.overlap&&!first?'var(--stack-overlap)':0,isolation:'isolate',background:grad,
      border:'1px solid var(--border-glass)',color:'var(--card-ink)',
      boxShadow:'var(--card-hl),var(--card-sh)',...style}}>
      {L.chevron && <span aria-hidden="true" style={{position:'absolute',left:'-1px',right:'-1px',top:'-16px',height:'18px',background:grad,
        clipPath:'polygon(0 100%,22% 62%,38% 18%,50% 0,62% 18%,78% 62%,100% 100%)'}} />}
      {L.chevron && <span aria-hidden="true" style={{position:'absolute',top:'-7px',left:'50%',transform:'translateX(-50%)',width:'34px',height:'4px',borderRadius:'3px',background:'var(--card-grip)',zIndex:3}} />}
      <div style={{position:'relative',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'12px'}}>
        <div>
          {meta && <div style={{fontFamily:'var(--f-mono)',fontSize:'11px',color:'var(--card-ink-2)'}}>{meta}</div>}
          {title && <div style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:titleSize?titleSize+'px':'var(--fs-ttl)',letterSpacing:'var(--ls-ttl)',lineHeight:titleSize&&titleSize<26?1.08:1,marginTop:'4px'}}>{title}</div>}
        </div>
        {big!==undefined && <div style={{fontFamily:'var(--f-mono)',fontWeight:700,fontSize:'26px',lineHeight:1,textAlign:'right',letterSpacing:'-.03em'}}>
          {big}
          {bigLabel && <small style={{display:'block',fontFamily:'var(--f-body)',fontSize:'10px',fontWeight:600,letterSpacing:'.1em',textTransform:'uppercase',opacity:.58,marginTop:'3px'}}>{bigLabel}</small>}
        </div>}
        {trailing}
      </div>
      {children && <div style={{position:'relative'}}>{children}</div>}
    </div>
  );
}
```
