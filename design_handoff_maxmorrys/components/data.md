# Composants · `data`

Pour chaque composant : le **contrat de props** (avec ses raisons, pas seulement ses types),
puis l'**implémentation de référence**. Les styles sont en ligne parce que le système est
en React ; les états qu'un style en ligne ne peut pas exprimer (`:focus-visible`, `:active`,
`:disabled`) vivent dans `css/brand/states.css`.

> **Budget de verre.** Aucun composant de ce groupe ne porte `backdrop-filter`, à la seule
> exception de `TabBar`. Le flou est réservé au chrome fixe et à l'unique panneau héros
> d'une page — voir `REGLES-DE-REVUE.md` § 1.


---

## `Avatar`

Identité d'un membre.

```jsx
<Avatar initials="A" />
<Avatar initials="AT" size={34} background="linear-gradient(135deg,#F38B0A,#B4231F)" />
```

### Contrat de props

```ts
/**
 * Pastille d'initiales, 42 px par défaut, dégradé violet→bleu, liseré blanc.
 * Aucune photographie n'existe au dépôt (FR-084) : les initiales sont l'état livré,
 * pas un fond d'attente.
 */
export interface AvatarProps {
  /** Une ou deux initiales. */
  initials?: string;
  size?: number;
  /** Dégradé de fond, si vous voulez différencier des membres. */
  background?: string;
  style?: React.CSSProperties;
}
export function Avatar(props: AvatarProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

export function Avatar({initials='',size=42,background='linear-gradient(135deg,var(--mm-violet),var(--mm-bleu))',style}){
  return <span style={{width:size+'px',height:size+'px',borderRadius:'50%',background,display:'grid',placeItems:'center',
    color:'#fff',fontWeight:700,fontSize:Math.round(size/3)+'px',fontFamily:'var(--f-display)',
    border:'1.5px solid rgba(255,255,255,.6)',flex:'0 0 auto',...style}}>{initials}</span>;
}
```

---

## `ChatBubble`

Échange avec l'assistant Rysmo.

```jsx
<ChatBubble>Tu t'es arrêtée à la leçon 5 du module 3. On la reprend ?</ChatBubble>
<ChatBubble from="me">Comment je choisis mes mots-clés ?</ChatBubble>
<ChatBubble typing />
```

Rysmo cite une leçon des cours de la personne avant d'en suggérer un nouveau, et ne cite jamais un contenu non publié.

### Contrat de props

```ts
import * as React from 'react';

/**
 * Bulle de conversation Rysmo. `me` : dégradé violet→bleu, coin bas droit resserré.
 * `ai` : verre clair, coin bas gauche resserré. `typing` : trois points qui clignotent.
 */
export interface ChatBubbleProps {
  /** @default "ai" */
  from?: 'me' | 'ai';
  typing?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export function ChatBubble(props: ChatBubbleProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

export function ChatBubble({from='ai',typing,children,style}){
  const me = from==='me';
  const base = {maxWidth:'82%',padding:'13px 16px',borderRadius:'20px',fontSize:'14px',lineHeight:1.45};
  if (typing) return (
    <div style={{...base,background:'var(--bubble-bg)',border:'1px solid var(--bubble-brd)',
      borderBottomLeftRadius:'7px',width:'64px',padding:'14px 16px',...style}}>
      <span style={{display:'inline-flex',gap:'4px',alignItems:'center'}}>
        {[0,.18,.36].map(d=>(<i key={d} style={{width:'6px',height:'6px',borderRadius:'50%',background:'var(--mm-violet)',opacity:.35,animation:'blink 1.25s infinite',animationDelay:d+'s'}} />))}
      </span>
    </div>
  );
  return (
    <div style={{...base,
      ...(me?{marginLeft:'auto',background:'var(--action-transforme)',color:'#fff',borderBottomRightRadius:'7px',boxShadow:'0 6px 18px rgba(108,35,221,.28)'}
            /* Aucun flou : une bulle est répétée ET dans un fil qui défile — elle viole les
               deux volets de la règle 1 à elle seule. */
            :{background:'var(--bubble-bg)',border:'1px solid var(--bubble-brd)',borderBottomLeftRadius:'7px'}),...style}}>{children}</div>
  );
}
```

---

## `CheckLine`

Liste ce qui est dû, un engagement par ligne — et ce qui ne l'est pas, avec un tiret.

```jsx
<CheckLine><b className="mm-num">2</b> sessions en direct par mois, avec moi</CheckLine>
<CheckLine tone="ok">Tu travailles seul, et c'est ça le plus dur</CheckLine>
<CheckLine tone="neutre" dash>Tu pars de zéro → <b style={{color:'var(--mm-bleu)'}}>Je te forme</b></CheckLine>
```

N'y mettez que du vérifiable. Sur le Club la règle est stricte : une ligne à coche ne décrit jamais l'ambiance, seulement ce qu'une personne peut garantir seule.

### Contrat de props

```ts
import * as React from 'react';

/**
 * Ligne à coche : ce qui est dû, listé un engagement par ligne. Motif central de la page
 * publique du Club, où il porte les cinq choses qui ne dépendent que d'une personne.
 * `dash` remplace la coche par un tiret : c'est la forme du renvoi (« autre chose, si… »),
 * jamais une croix — on n'écarte pas quelqu'un, on l'oriente.
 */
export interface CheckLineProps {
  /** violet = engagement du Club · ok = critère rempli · neutre = renvoi. @default "violet" */
  tone?: 'violet' | 'ok' | 'neutre';
  /** Tiret au lieu de la coche. */
  dash?: boolean;
  size?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export function CheckLine(props: CheckLineProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

const mmCheckTone = {
  violet:{bg:'rgba(108,35,221,.15)',stroke:'var(--mm-violet-t)'},
  ok:{bg:'rgba(15,123,82,.15)',stroke:'var(--ok)'},
  neutre:{bg:'var(--fill-2)',stroke:'var(--ink-2)'}
};

export function CheckLine({tone='violet',dash,size=12,children,style}){
  const t = mmCheckTone[tone] || mmCheckTone.violet;
  return (
    <div style={{display:'flex',gap:'11px',alignItems:'flex-start',marginTop:'10px',fontSize:'14.5px',lineHeight:1.5,...style}}>
      <span style={{width:'22px',height:'22px',borderRadius:'50%',flex:'0 0 auto',marginTop:'1px',background:t.bg,display:'grid',placeItems:'center'}}>
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={t.stroke} strokeWidth={dash?3:3.4} strokeLinecap="round" strokeLinejoin="round">
          {dash ? <path d="M6 12h12" /> : <path d="M4 12.5l5.5 5.5L20 7" />}
        </svg>
      </span>
      <span>{children}</span>
    </div>
  );
}
```

---

## `DocLine`

Ligne de devis ou de fiche société.

```jsx
<DocLine label="Immatriculée" value="11/04/2022" />
<DocLine label="Siège" value="Dakar, Sénégal" last />
```

### Contrat de props

```ts
import * as React from 'react';

/**
 * Ligne de document : devis TPE, mentions légales, relevé. Filet pointillé,
 * valeur en monospace à droite. Un devis émis est figé — une évolution de la grille
 * tarifaire ne réécrit jamais un devis déjà envoyé.
 */
export interface DocLineProps {
  label?: React.ReactNode;
  value?: React.ReactNode;
  last?: boolean;
  style?: React.CSSProperties;
}
export function DocLine(props: DocLineProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

export function DocLine({label,value,last,style}){
  return (
    <div style={{display:'flex',justifyContent:'space-between',gap:'12px',fontSize:'13.5px',padding:'8px 0',
      borderBottom:last?0:'1px dashed var(--fill-3)',...style}}>
      <span style={{color:'var(--text-muted)'}}>{label}</span>
      <b style={{fontFamily:'var(--f-mono)',fontWeight:700}}>{value}</b>
    </div>
  );
}
```

---

## `LessonRow`

Ligne de liste du produit. Toujours dans un GlassPanel `flat` — ces listes défilent, donc pas de flou.

```jsx
<GlassPanel level="flat" padding="6px 18px">
  <LessonRow state="done" title="Choisir tes mots-clés" meta="06:12" />
  <LessonRow state="current" title="Les mots que tapent tes clients" meta="08:24 · en cours" />
  <LessonRow state="todo" last title="Écrire une fiche qui remonte" meta="07:03" />
</GlassPanel>
```

### Contrat de props

```ts
import * as React from 'react';

/**
 * Ligne de liste dense : leçon, entrée d'espace personnel, réglage, tâche d'administration.
 * L'état `done` porte la pastille verte, `current` un fond dégradé et un coin arrondi,
 * `todo` un anneau vide.
 */
export interface LessonRowProps {
  /** @default "todo" */
  state?: 'done' | 'current' | 'todo' | 'plain';
  /** Icône ou glyphe à gauche (remplace la puce d'état si fourni). */
  icon?: React.ReactNode;
  iconBackground?: string;
  title?: React.ReactNode;
  /** Métadonnée en monospace : durée, compte, date. */
  meta?: string;
  /** Élément à droite : Tag, chevron, nombre. */
  trailing?: React.ReactNode;
  /** Rend la ligne cliquable : curseur, et enfoncement scale(.975) à 120 ms. */
  onClick?: () => void;
  last?: boolean;
  style?: React.CSSProperties;
}
export function LessonRow(props: LessonRowProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

const mmCheck = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0F7B52" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5.5 5.5L20 7"/></svg>
);

export function LessonRow({state='todo',icon,iconBackground,title,meta,trailing,last,onClick,style}){
  const current = state==='current';
  let left = null;
  if (icon!==undefined) {
    left = <span style={{width:'34px',height:'34px',borderRadius:'11px',display:'grid',placeItems:'center',flex:'0 0 auto',background:iconBackground||'var(--fill-1)'}}>{icon}</span>;
  } else if (state==='done') {
    left = <span style={{width:'25px',height:'25px',borderRadius:'50%',background:'rgba(15,123,82,.16)',display:'grid',placeItems:'center',flex:'0 0 auto'}}>{mmCheck}</span>;
  } else if (state==='todo') {
    left = <span style={{width:'26px',height:'26px',borderRadius:'50%',border:'2.5px solid var(--fill-3)',flex:'0 0 auto'}} />;
  }
  return (
    <div className={onClick?'mm-press':undefined} onClick={onClick} style={{display:'flex',alignItems:'center',gap:'12px',padding:current?'13px 18px':'13px 0',cursor:onClick?'pointer':undefined,
      borderBottom:last?0:'1px solid var(--border-hair)',
      ...(current?{background:'linear-gradient(135deg,rgba(0,87,188,.1),rgba(108,35,221,.1))',margin:'0 -18px',borderRadius:'14px',borderBottom:0}:null),...style}}>
      {left}
      <span style={{flex:1,minWidth:0}}>
        <b style={{display:'block',fontSize:'14px',fontWeight:600,letterSpacing:'-.01em',color:'var(--text-body)'}}>{title}</b>
        {meta && <span style={{fontSize:'12px',color:'var(--text-faint)',fontFamily:'var(--f-mono)'}}>{meta}</span>}
      </span>
      {trailing}
    </div>
  );
}
```

---

## `MediaCard`

Carte de podcast ou de vidéo. La forme dit le format, et le poids est toujours affiché.

```jsx
<MediaCard format="audio" artHeight={190} titleSize={25}
  eyebrow="Podcast · épisode 1 · 6 août" title="Vendre sans budget pub, avec Fatou D."
  body="Gérante d'une boutique de cosmétiques aux Almadies."
  cost={['34:20','31 Mo','Transcription · 0 Mo']}
  actions={<><Button tone="transforme" size="sm">Écouter</Button><Button tone="quiet" size="sm">Lire la transcription</Button></>} />

<MediaCard format="video" badge="Vidéo · 16:9" eyebrow="Vidéo · 12 juillet"
  title="Trois heures avec un commerçant du marché Sandaga"
  cost={['18:04','96 Mo en HD','24 Mo en 480p']} />
```

Ne retirez jamais le poids de `cost` : c'est la seule information qui permet à quelqu'un dont le forfait est compté de décider. Pour une vidéo, donnez les deux qualités.

### Contrat de props

```ts
import * as React from 'react';

/**
 * Carte de média du pôle « écouter & regarder ». **La silhouette dit le format** :
 * une onde pour l'audio, un cadre 16:9 pour la vidéo — une étiquette « Podcast » ou
 * « Vidéo » se perd sur téléphone, une forme non.
 * `cost` porte toujours le poids en mégaoctets : le forfait est compté (NFR-04).
 */
export interface MediaCardProps {
  /** @default "audio" */
  format?: 'audio' | 'video';
  /** Dégradé de la vignette. Par défaut celui du format. Aucune photographie. */
  gradient?: string;
  eyebrow?: string;
  title?: React.ReactNode;
  body?: React.ReactNode;
  /** Durée, poids, et le coût de l'alternative texte : ["34:20","31 Mo","Transcription · 0 Mo"]. */
  cost?: string[];
  /** Étiquette en bas de vignette — « Vidéo · 16:9 », une durée. */
  badge?: string;
  artHeight?: number;
  titleSize?: number;
  actions?: React.ReactNode;
  style?: React.CSSProperties;
}
export function MediaCard(props: MediaCardProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

const MM_ONDE = [16,30,44,24,38,14,33,44,20,36,26,42,18,30,40,22];

export function MediaCard({format='audio',gradient,eyebrow,title,body,cost=[],badge,artHeight=150,titleSize=17,actions,style}){
  const grad = gradient || (format==='audio'
    ? 'linear-gradient(140deg,#6C23DD,#0057BC 62%,#02AC9C)'
    : 'linear-gradient(140deg,#0057BC,#6C23DD)');
  /* Faux verre, aucun flou : une carte de média vit toujours en grille, et une grille
     floutée coûte un recompositing par carte et par image. */
  return (
    <div style={{borderRadius:'var(--r-l)',overflow:'hidden',background:'var(--surface-card-flat)',
      border:'1px solid var(--glass-brd)',boxShadow:'var(--glass-hl),var(--glass-sh-flat)',...style}}>
      <div style={{height:artHeight+'px',background:grad,position:'relative',display:'flex',alignItems:'center',
        justifyContent:format==='audio'?'space-between':'center',padding:'18px'}}>
        {format==='audio' && (
          <span style={{display:'flex',alignItems:'center',gap:'3px',height:'46px'}}>
            {MM_ONDE.map((h,i)=><i key={i} style={{width:'3px',height:h+'px',borderRadius:'2px',background:'rgba(255,255,255,.72)'}} />)}
          </span>
        )}
        {format==='video' && <span style={{position:'absolute',inset:'14px',border:'2px solid rgba(255,255,255,.28)',borderRadius:'14px'}} />}
        <span style={{width:'56px',height:'56px',borderRadius:'50%',background:'rgba(255,255,255,.92)',display:'grid',placeItems:'center',flex:'0 0 auto',
          boxShadow:'0 8px 22px rgba(14,17,22,.24)'}}>
          <svg width="19" height="19" viewBox="0 0 24 24"><polygon points="7 4 20 12 7 20" fill="#0E1116" /></svg>
        </span>
        {badge && <span style={{position:'absolute',left:'14px',bottom:'14px',display:'inline-flex',alignItems:'center',height:'25px',padding:'0 10px',
          borderRadius:'var(--r-pill)',fontSize:'10.5px',fontWeight:600,background:'rgba(0,0,0,.5)',color:'#fff'}}>{badge}</span>}
      </div>
      <div style={{padding:'18px'}}>
        {eyebrow && <p style={{fontFamily:'var(--f-mono)',fontSize:'10.5px',letterSpacing:'.14em',textTransform:'uppercase',color:'var(--text-muted)',margin:0}}>{eyebrow}</p>}
        {title && <b style={{display:'block',fontFamily:'var(--f-display)',fontWeight:900,fontSize:titleSize+'px',letterSpacing:'-.032em',lineHeight:1.05,marginTop:'7px'}}>{title}</b>}
        {body && <p style={{fontSize:'13.5px',color:'var(--text-muted)',lineHeight:1.5,margin:'9px 0 0'}}>{body}</p>}
        {cost.length > 0 && (
          <div style={{display:'flex',gap:'12px',flexWrap:'wrap',marginTop:'13px',fontFamily:'var(--f-mono)',fontSize:'11px',color:'var(--text-muted)'}}>
            {cost.map(c=><span key={c}>{c}</span>)}
          </div>
        )}
        {actions && <div style={{display:'flex',gap:'9px',marginTop:'16px'}}>{actions}</div>}
      </div>
    </div>
  );
}
```

---

## `PriceBlock`

Bloc de prix des formations, du Club et des packs TPE.

```jsx
<PriceBlock amount="95 000" note={<>Une fois, accès à vie · ou <b className="mm-num">3 × 31 700</b> sans frais</>} />
<PriceBlock amount="1 658" currency="FCFA / mois" size={35} note="Facturé 19 900 FCFA une fois par an." />
<PriceBlock amount="250 000" strike="295 000" note="Une fois · lancement" />
```

### Contrat de props

```ts
/**
 * Prix. Toujours en monospace tabulaire : dans ce système, un nombre en monospace
 * vient de la base ou d'une source citée. Le cadrage mensuel est obligatoire sur le Club
 * (19 900/an ≈ 1 658/mois) — le montant annuel seul franchit un seuil de délibération.
 */
export interface PriceBlockProps {
  /** Montant, déjà formaté avec espaces fines : "95 000". */
  amount?: string;
  /** @default "FCFA" */
  currency?: string;
  /** Prix barré, en promotion de lancement. */
  strike?: string;
  /** Ligne sous le prix : « Une fois, accès à vie », équivalent mensuel, échéancier. */
  note?: React.ReactNode;
  size?: number;
  style?: React.CSSProperties;
}
export function PriceBlock(props: PriceBlockProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

export function PriceBlock({amount,currency='FCFA',strike,note,size=31,style}){
  return (
    <div style={style}>
      <div style={{display:'flex',alignItems:'baseline',gap:'8px'}}>
        <b style={{fontFamily:'var(--f-mono)',fontWeight:700,fontSize:size+'px',letterSpacing:'-.04em'}}>{amount}</b>
        <span style={{fontSize:'14px',fontWeight:600}}>{currency}</span>
        {strike && <s style={{fontFamily:'var(--f-mono)',fontSize:'14px',color:'rgba(14,17,22,.42)'}}>{strike}</s>}
      </div>
      {note && <p style={{fontSize:'12.5px',color:'var(--text-muted)',marginTop:'4px'}}>{note}</p>}
    </div>
  );
}
```

---

## `ProgressBar`

Progression d'une formation, d'un niveau de gamification, d'une lecture.

```jsx
<ProgressBar value={34} />
```

La progression peut redescendre (décocher est permis) mais le repère de progression maximale ne décroît jamais — c'est lui qui borne l'expérience gagnée.

### Contrat de props

```ts
/**
 * Barre de progression, 8 px, remplie par le dégradé des quatre teintes du logo.
 * Se remplit à l'entrée de l'écran (durée --t-scene) sous un parent `.play`.
 */
export interface ProgressBarProps {
  /** 0 à 100. */
  value?: number;
  height?: number;
  style?: React.CSSProperties;
}
export function ProgressBar(props: ProgressBarProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

export function ProgressBar({value=0,height=8,style}){
  const [w,setW] = React.useState(0);
  React.useEffect(()=>{
    const r = requestAnimationFrame(()=>setW(value));
    const t = setTimeout(()=>setW(value), 60);   // repli hors peinture : la barre ne reste jamais à 0
    return ()=>{ cancelAnimationFrame(r); clearTimeout(t); };
  },[value]);
  return (
    <div style={{height:height+'px',borderRadius:'5px',background:'var(--fill-2)',overflow:'hidden',...style}}>
      <i style={{display:'block',height:'100%',borderRadius:'5px',width:w+'%',
        background:'linear-gradient(90deg,#0057BC,#6C23DD,#F38B0A,#02AC9C)',backgroundSize:'220% 100%',
        transition:'width var(--t-scene) var(--ease-out)'}} />
    </div>
  );
}
```

---

## `QuotaMeter`

Quota quotidien de l'assistant Rysmo (2 gratuit · 5 Club · 20 Lite · 100 Pro).

```jsx
<QuotaMeter used={2} total={5} />
```

Un pack acheté s'ajoute au solde et ne se périme pas au changement de jour : ne le confondez pas avec le quota.

### Contrat de props

```ts
/**
 * Compteur de quota Rysmo : cinq barres, remplies en violet.
 * Le quota est visible en permanence — le plafond est un choix de marge assumé (NFR-10),
 * pas une limite honteuse à cacher.
 */
export interface QuotaMeterProps {
  used?: number;
  /** @default 5 */
  total?: number;
  /** Libellé à droite. Par défaut « x / y aujourd'hui ». */
  label?: string;
  style?: React.CSSProperties;
}
export function QuotaMeter(props: QuotaMeterProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

export function QuotaMeter({used=0,total=5,label,style}){
  return (
    <div style={{display:'flex',alignItems:'center',gap:'9px',fontSize:'11.5px',color:'var(--text-muted)',fontFamily:'var(--f-mono)',...style}}>
      <span style={{display:'flex',gap:'3px'}}>
        {Array.from({length:total}).map((_,i)=>(
          <i key={i} style={{width:'15px',height:'5px',borderRadius:'3px',
            background:i<used?'var(--mm-violet)':'var(--fill-3)',transition:'background var(--t-ui) var(--ease)'}} />
        ))}
      </span>
      <span>{label || used+' / '+total+" aujourd'hui"}</span>
    </div>
  );
}
```

---

## `StatTile`

Case de chiffre de la console d'administration.

```jsx
<StatTile dark label="Encaissé" value="0 F" foot="1 transaction en attente" />
```

Ne composez jamais une case sans `foot` : un nombre sans date de relevé n'est pas publiable.

### Contrat de props

```ts
import * as React from 'react';

/**
 * Case de relevé de la console. Chaque case porte sa date de relevé ;
 * une case sans date affiche « non relevé », jamais une estimation (D-03, FR-070).
 */
export interface StatTileProps {
  label?: string;
  /** Valeur — monospace, 27 px. Un zéro daté est une valeur valable. */
  value?: React.ReactNode;
  /** Date ou précision du relevé. */
  foot?: string;
  dark?: boolean;
  style?: React.CSSProperties;
}
export function StatTile(props: StatTileProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

export function StatTile({label,value,foot,dark,style}){
  return (
    <div className={dark?'glass-d':'glass'} style={{padding:'16px',...style}}>
      <p style={{fontSize:'11px',color:dark?'#8B95A3':'var(--text-muted)',margin:0}}>{label}</p>
      <p style={{fontFamily:'var(--f-mono)',fontWeight:700,fontVariantNumeric:'tabular-nums',fontSize:'27px',letterSpacing:'var(--ls-num)',margin:'3px 0 0'}}>{value}</p>
      {foot && <p style={{fontSize:'11px',color:dark?'#7C8896':'var(--text-faint)',margin:0}}>{foot}</p>}
    </div>
  );
}
```

---

## `Tag`

Étiquette courte d'état ou de qualification.

```jsx
<Tag tone="ok">Vérifié</Tag>
<Tag tone="warn">En attente</Tag>
<Tag>Wave · Orange Money</Tag>
```

### Contrat de props

```ts
import * as React from 'react';

/**
 * Étiquette d'état, 27 px. Quatre tons seulement, et ils veulent dire quelque chose :
 * ok = acquis, warn = en attente, stop = bloquant, neutral = information.
 */
export interface TagProps {
  /** @default "neutral" */
  tone?: 'ok' | 'warn' | 'stop' | 'neutral';
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export function Tag(props: TagProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

const mmTagTone = {
  ok:{background:'rgba(15,123,82,.13)',color:'var(--ok)'},
  warn:{background:'rgba(243,139,10,.18)',color:'var(--warn)'},
  stop:{background:'rgba(180,35,31,.13)',color:'var(--stop)'},
  neutral:{background:'var(--fill-tag)',color:'var(--text-muted)'}
};

export function Tag({tone='neutral',children,style}){
  return <span style={{display:'inline-flex',alignItems:'center',gap:'5px',height:'27px',padding:'0 11px',
    borderRadius:'var(--r-pill)',fontSize:'11px',fontWeight:600,
    transition:'background var(--t-ui) var(--ease),color var(--t-ui) var(--ease)',
    ...(mmTagTone[tone]||mmTagTone.neutral),...style}}>{children}</span>;
}
```

---

## `TranslationNotice`

Bandeau de traduction automatique, en tête de tout article anglais.

```jsx
<TranslationNotice date="14/09/2026" href="/blog/boutique-invisible-google-maps" />
```

Obligatoire sur chaque page éditoriale traduite. Ne le déplacez pas en pied de page : après l'article, l'avertissement n'avertit plus. Ne le traduisez pas en français — il n'a de sens que pour le lecteur anglophone.

### Contrat de props

```ts
import * as React from 'react';

/**
 * Bandeau obligatoire en tête de tout contenu éditorial traduit. Il existe parce que la
 * traduction est générée au pré-rendu **et mise en cache** : une correction du français
 * n'atteint la page anglaise qu'à l'expiration du cache, et il n'y a pas d'invalidation
 * manuelle. Le dire coûte moins cher que de faire semblant.
 *
 * Toujours en anglais — c'est un lecteur anglophone qui le lit — et toujours au-dessus du
 * corps, jamais en pied de page : après l'article, l'avertissement n'avertit plus.
 */
export interface TranslationNoticeProps {
  /** Date de génération, telle qu'elle sort du pré-rendu. Rendue en monospace. */
  date: string;
  /** URL de la version française. */
  href?: string;
  /** @default "Read the original" */
  originalLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}
export function TranslationNotice(props: TranslationNoticeProps): JSX.Element;
```

### Implémentation de référence

```jsx
import React from 'react';

export function TranslationNotice({date,href,originalLabel='Read the original',className,style}){
  return (
    <div className={className} style={{display:'flex',alignItems:'flex-start',gap:'11px',padding:'13px 16px',borderRadius:'var(--r-m)',
      background:'var(--fill-1)',border:'1px solid var(--border-hair)',...style}}>
      <span style={{width:'22px',height:'22px',borderRadius:'50%',flex:'0 0 auto',marginTop:'1px',
        background:'rgba(243,139,10,.18)',display:'grid',placeItems:'center'}}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--mm-orange-t)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 010 18 14 14 0 010-18z" />
        </svg>
      </span>
      <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.5,margin:0}}>
        <b style={{color:'var(--text-body)',fontWeight:600}}>Machine-translated on <span className="mm-num">{date}</span></b> — The French version is the one I wrote, and the one I keep up to date.{' '}
        <a href={href||'#'} style={{color:'var(--mm-bleu)',fontWeight:600,textDecoration:'none',whiteSpace:'nowrap'}}>{originalLabel} →</a>
      </p>
    </div>
  );
}
```
