# Composants · `brand`

Pour chaque composant : le **contrat de props** (avec ses raisons, pas seulement ses types),
puis l'**implémentation de référence**. Les styles sont en ligne parce que le système est
en React ; les états qu'un style en ligne ne peut pas exprimer (`:focus-visible`, `:active`,
`:disabled`) vivent dans `css/brand/states.css`.

> **Trois noms, trois choses.** `Wordmark` porte les trois par sa prop `brand` :
> `hello` pour les **pages web** (« Hello ! » en dégradé), `rysmo` pour l'**application
> mobile**, `signature` pour la **personne** (mentions légales, signature d'article).
> Ne confondez pas *Rysmo*, le nom de l'app, avec le **répétiteur IA** qui vit dedans :
> celui-ci s'appelle « Répétiteur » par défaut et chaque personne peut le renommer.


---

## `Icon`

Les 29 glyphes du produit. Trait de 2,2 px, caps et jointures rondes, boîte de 24 — proche de Lucide, ce qui est le remplaçant à prendre pour un glyphe manquant.

```jsx
<Icon name="back" />
<Icon name="check" color="#0F7B52" size={13} />
<Icon name="play" size={14} color="#fff" />
```

`play` et `star` sont les deux seuls glyphes pleins. Le logo Google du bouton d'authentification est une marque tierce : utiliser `assets/icons/google.svg` en couleurs officielles, jamais recoloré. Aucun emoji, jamais.

`heart` et `repeat` ne viennent pas du kit : ce sont deux **emprunts à Lucide**, ajoutés pour les interactions du Club (aimer, republier), à valider.

### Contrat de props

```ts
import * as React from 'react';

/**
 * Emballage du jeu de glyphes du kit — 36 icônes à trait — dont deux emprunts déclarés à Lucide (heart, repeat), 24 × 24, extraites verbatim
 * du kit source et disponibles aussi en fichiers dans `assets/icons/`.
 * Ajout intentionnel : le kit dessine ses SVG en ligne, sans composant. Voir readme.md.
 */
export interface IconProps {
  name?: 'back' | 'forward' | 'close' | 'bell' | 'search' | 'lock' | 'share' | 'chat' | 'home'
    | 'book' | 'users' | 'user' | 'star' | 'check' | 'alert' | 'card' | 'eye' | 'download'
    | 'trash' | 'doc' | 'send' | 'bookmark' | 'comment' | 'dots' | 'play' | 'bars'
    | 'heart' | 'repeat'
    | 'list' | 'calendar' | 'case' | 'info' | 'plus' | 'chevron' | 'globe';
  /** @default 19 */
  size?: number;
  /** Par défaut celle du glyphe : 2,2 — 2,4 pour la loupe et le cadenas, 3,4 pour la coche. */
  strokeWidth?: number;
  /** @default "currentColor" */
  color?: string;
  style?: React.CSSProperties;
}
export function Icon(props: IconProps): JSX.Element;
export const iconNames: string[];
```

### Implémentation de référence

```jsx
import React from 'react';

const MM_ICONS = {"back":{"p":["M15 19l-7-7 7-7"]},"forward":{"p":["M9 5l7 7-7 7"]},"close":{"p":["M18 6L6 18M6 6l12 12"]},"bell":{"p":["M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9","M13.7 21a2 2 0 01-3.4 0"]},"search":{"p":["M20 20l-3.5-3.5"],"c":[[11,11,7]],"w":2.4},"lock":{"p":["M8 11V8a4 4 0 018 0v3"],"r":[[5,11,14,10,2]],"w":2.4},"share":{"p":["M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8","M16 6l-4-4-4 4","M12 2v14"]},"chat":{"p":["M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"]},"home":{"p":["M3 10l9-7 9 7v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"]},"book":{"p":["M4 5a2 2 0 012-2h12a2 2 0 012 2v16l-8-4-8 4z"]},"users":{"p":["M2 20a7 7 0 0114 0"],"c":[[9,8,3.4]]},"user":{"p":["M4 21a8 8 0 0116 0"],"c":[[12,8,3.6]]},"star":{"p":["M12 2l3 6 6 .8-4.5 4.3 1.2 6.4L12 16.5 6.3 19.5l1.2-6.4L3 8.8 9 8z"]},"check":{"p":["M4 12.5l5.5 5.5L20 7"],"w":3.4},"alert":{"p":["M12 8v5","M10.3 3.5L2.6 17a2 2 0 001.7 3h15.4a2 2 0 001.7-3L13.7 3.5a2 2 0 00-3.4 0z"],"c":[[12,17,0.7]],"w":2.6},"card":{"p":["M2 10h20"],"r":[[2,5,20,14,2]]},"eye":{"p":["M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z"],"c":[[12,12,2.6]]},"download":{"p":["M12 3v12M7 11l5 5 5-5M4 20h16"]},"trash":{"p":["M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"]},"doc":{"p":["M4 5h16v14H4z","M4 9h16"]},"send":{"p":["M5 12h14M13 6l6 6-6 6"],"w":2.6},"bookmark":{"p":["M6 3h12v18l-6-4.5L6 21z"]},"comment":{"p":["M4 4h16v13H8l-4 4z"]},"dots":{"c":[[12,12,2.2],[12,5,1.4],[12,19,1.4]]},"play":{"fill":"M7 4 L20 12 L7 20 Z","solid":true},"bars":{"p":["M4 18v-6M10 18V6M16 18v-9M22 18V3"]},"globe":{"p":["M12 2a9 9 0 100 18 9 9 0 000-18zM3 12h18","M12 2a14 14 0 010 18 14 14 0 010-18z"]},"chevron":{"p":["M6 9l6 6 6-6"]},"list":{"p":["M4 6h16M4 12h16M4 18h10"]},"calendar":{"p":["M3 10h18M8 3v4M16 3v4"],"r":[[3,5,18,16,2]]},"case":{"p":["M4 7h16v13H4zM9 7V4h6v3"]},"info":{"p":["M12 11v6M12 7.5v.5"],"c":[[12,12,9]]},"plus":{"p":["M12 3v18M3 12h18"]},"heart":{"p":["M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"],"w":2},"repeat":{"p":["m2 9 3-3 3 3","M13 18H7a2 2 0 0 1-2-2V6","m22 15-3 3-3-3","M11 6h6a2 2 0 0 1 2 2v10"],"w":2}};

export function Icon({name='check',size=19,strokeWidth,color='currentColor',style}){
  const ic = MM_ICONS[name] || MM_ICONS.check;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={ic.solid?'none':color}
      strokeWidth={strokeWidth||ic.w||2.2} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      {ic.solid && <path d={ic.fill} fill={color} />}
      {(ic.r||[]).map((r,i)=><rect key={'r'+i} x={r[0]} y={r[1]} width={r[2]} height={r[3]} rx={r[4]} />)}
      {(ic.c||[]).map((c,i)=><circle key={'c'+i} cx={c[0]} cy={c[1]} r={c[2]} />)}
      {(ic.p||[]).map((d,i)=><path key={'p'+i} d={d} />)}
    </svg>
  );
}

export const iconNames = Object.keys(MM_ICONS);
```

---

## `LogoMark`

Icône de marque. Un seul fichier existe, en PNG à fond blanc.

```jsx
<LogoMark size={44} src="../../assets/logo-mm-icon.png" />
<LogoMark size={56} plate />   {/* sur un maillage ou un fond nuit */}
```

Sans version transparente, posez toujours `plate` sur fond coloré. Ne recolorez pas l'icône et ne la redessinez pas en SVG.

### Contrat de props

```ts
import * as React from 'react';

/**
 * L'icône de marque fournie : un M sérif découpé en quatre teintes.
 * C'est le seul fichier de logo du dépôt (`assets/logo-mm-icon.png`, 1240 px, fond blanc).
 * Il n'existe ni version SVG, ni version monochrome, ni logotype horizontal.
 */
export interface LogoMarkProps {
  size?: number;
  /** Chemin relatif vers l'icône depuis la page qui la monte. @default "assets/logo-mm-icon.png" */
  src?: string;
  /** Pastille blanche arrondie sous l'icône — nécessaire sur fond coloré ou nuit,
   *  le fichier n'a pas de transparence. */
  plate?: boolean;
  style?: React.CSSProperties;
}
export function LogoMark(props: LogoMarkProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

export function LogoMark({size=40,src='assets/logo-mm-icon.png',plate,style}){
  return (
    <span style={{width:size+'px',height:size+'px',display:'grid',placeItems:'center',flex:'0 0 auto',
      borderRadius:plate?Math.round(size*0.28)+'px':0,background:plate?'#fff':'transparent',
      boxShadow:plate?'0 4px 14px rgba(14,17,22,.12)':'none',overflow:'hidden',...style}}>
      <img src={src} alt="Max-Morrys" width={plate?Math.round(size*0.86):size} height={plate?Math.round(size*0.86):size} style={{display:'block'}} />
    </span>
  );
}
```

---

## `Wordmark`

Le mot-symbole. **Trois marques, une par surface** — la prop `brand` n'est pas décorative.

```jsx
<Wordmark size={23} />                        {/* web : « Hello ! » en dégradé */}
<Wordmark brand="rysmo" size={26} />          {/* app mobile : Rysmo */}
<Wordmark brand="signature" size={20} />      {/* la personne : Max-Morrys */}
<Wordmark brand="rysmo" size={20} night tail="#fff" />   {/* sur fond sombre */}
```

Le dégradé de `hello` reprend, dans l'ordre, les trois couleurs qui portaient « Max » : bleu, orange, teal.

**Ne confondez pas** *Rysmo*, le nom de l'application, avec le **répétiteur IA** qui vit dedans — celui-ci s'appelle « Répétiteur » par défaut et chaque personne peut le renommer. Les deux noms ont longtemps été le même ; ils ne le sont plus. Pour afficher le nom du répétiteur, lisez-le dans les préférences, ne l'écrivez jamais en dur.

### Contrat de props

```ts
import * as React from 'react';

/**
 * Le mot-symbole. **Trois marques distinctes, une par surface** — ce n'est pas une variante
 * décorative, c'est une distinction de produit :
 *
 * - `hello` — **les pages web**. « Hello ! » en dégradé, reprenant dans l'ordre les trois
 *   couleurs qui portaient « Max » : bleu `#0057BC`, orange `#F38B0A`, teal `#02AC9C`.
 * - `rysmo` — **l'application mobile**, dont le nom est *Rysmo*. Le R prend le bleu, le o
 *   final le teal : la marque garde ses bornes de couleur.
 * - `signature` — **la personne**, Max-Morrys. Réservé aux mentions légales, à la page
 *   « Je suis Max-Morrys » et à la signature d'article. Ce n'est plus un nom de produit.
 *
 * Ne pas confondre *Rysmo* (l'application) avec le **répétiteur IA** qui vit dedans : celui-ci
 * s'appelle « Répétiteur » par défaut et **chaque personne peut le renommer**. Les deux noms
 * ont longtemps été le même ; ils ne le sont plus.
 *
 * Sur `hello`, `color` est déclaré avant `WebkitTextFillColor` : là où le remplissage
 * transparent n'est pas compris, le texte reste lisible en bleu au lieu de disparaître.
 */
export interface WordmarkProps {
  /** @default "hello" */
  brand?: 'hello' | 'rysmo' | 'signature';
  /** Taille en px. @default 22 */
  size?: number;
  /** Encre de la partie neutre — `rysmo` et `signature` uniquement. */
  tail?: string;
  /** Variantes nuit des quatre teintes. */
  night?: boolean;
  /** `signature` uniquement : « Max » seul, sans « -Morrys ». */
  short?: boolean;
  style?: React.CSSProperties;
}
export function Wordmark(props: WordmarkProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

/* Les trois couleurs sont celles qui portaient « Max » : bleu, orange, teal — dans cet ordre.
   Le dégradé les reprend en une seule coulée au lieu de trois lettres découpées. */
const mmHelloGrad = {
  jour: 'linear-gradient(96deg,#0057BC 0%,#F38B0A 52%,#02AC9C 100%)',
  nuit: 'linear-gradient(96deg,#6FB1FF 0%,#FFB24D 52%,#3FD9C6 100%)'
};

export function Wordmark({brand='hello',size=22,tail,night,short,style}){
  const c = night
    ? {b:'var(--mm-bleu-n)',o:'var(--mm-orange-n)',t:'var(--mm-teal-n)',v:'var(--mm-violet-n)'}
    : {b:'var(--mm-bleu)',o:'var(--mm-orange)',t:'var(--mm-teal)',v:'var(--mm-violet)'};
  const base = {fontFamily:'var(--f-display)',fontWeight:900,fontSize:size+'px',letterSpacing:'-.045em',
    lineHeight:1,whiteSpace:'nowrap'};

  /* WEB — « Hello ! » en dégradé.
     `color` est posé AVANT `WebkitTextFillColor` : là où le remplissage transparent n'est pas
     compris, le texte reste lisible en bleu au lieu de disparaître. */
  if (brand === 'hello') {
    return (
      <span style={{...base,
        background:night?mmHelloGrad.nuit:mmHelloGrad.jour,
        color:night?'#6FB1FF':'#0057BC',
        WebkitBackgroundClip:'text',backgroundClip:'text',
        WebkitTextFillColor:'transparent',
        ...style}}>Hello&nbsp;!</span>
    );
  }

  /* APPLICATION MOBILE — le nom de l'app est « Rysmo ».
     Le R reprend le bleu, le o final le teal : la marque garde ses bornes de couleur. */
  if (brand === 'rysmo') {
    return (
      <span style={{...base,...style}}>
        <span style={{color:c.b}}>R</span>
        <span style={{color:tail||'var(--text-body)'}}>ysm</span>
        <span style={{color:c.t}}>o</span>
      </span>
    );
  }

  /* SIGNATURE ÉDITORIALE — la personne, pas le produit. Conservée pour les mentions
     légales, la page « Je suis Max-Morrys » et la signature d'article. */
  return (
    <span style={{...base,...style}}>
      <span style={{color:c.b}}>M</span><span style={{color:c.o}}>a</span><span style={{color:c.t}}>x</span>
      {!short && <><span style={{color:c.v}}>-</span><span style={{color:tail||'var(--text-body)'}}>Morrys</span></>}
    </span>
  );
}
```
