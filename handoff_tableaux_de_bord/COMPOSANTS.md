# Contrats de props

Les 25 composants que ces deux tableaux de bord assemblent. **Lis ces contrats : ils portent
les raisons, pas seulement les types.** Plusieurs props existent pour une décision précise que
le nom seul ne dit pas — la prop `level` de `GlassPanel`, par exemple, encode le budget de flou.

Les implémentations sont dans `components.jsx`.


## brand

### `Icon`

Les 29 glyphes du produit. Trait de 2,2 px, caps et jointures rondes, boîte de 24 — proche de Lucide, ce qui est le remplaçant à prendre pour un glyphe manquant.

```jsx
<Icon name="back" />
<Icon name="check" color="#0F7B52" size={13} />
<Icon name="play" size={14} color="#fff" />
```

`play` et `star` sont les deux seuls glyphes pleins. Le logo Google du bouton d'authentification est une marque tierce : utiliser `assets/icons/google.svg` en couleurs officielles, jamais recoloré. Aucun emoji, jamais.

`heart` et `repeat` ne viennent pas du kit : ce sont deux **emprunts à Lucide**, ajoutés pour les interactions du Club (aimer, republier), à valider.

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

### `LogoMark`

Icône de marque. Un seul fichier existe, en PNG à fond blanc.

```jsx
<LogoMark size={44} src="../../assets/logo-mm-icon.png" />
<LogoMark size={56} plate />   {/* sur un maillage ou un fond nuit */}
```

Sans version transparente, posez toujours `plate` sur fond coloré. Ne recolorez pas l'icône et ne la redessinez pas en SVG.

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

### `Wordmark`

Le mot-symbole. **Trois marques, une par surface** — la prop `brand` n'est pas décorative.

```jsx
<Wordmark size={23} />                        {/* web : « Hello ! » en dégradé */}
<Wordmark brand="rysmo" size={26} />          {/* app mobile : Rysmo */}
<Wordmark brand="signature" size={20} />      {/* la personne : Max-Morrys */}
<Wordmark brand="rysmo" size={20} night tail="#fff" />   {/* sur fond sombre */}
```

Le dégradé de `hello` reprend, dans l'ordre, les trois couleurs qui portaient « Max » : bleu, orange, teal.

**Ne confondez pas** *Rysmo*, le nom de l'application, avec le **répétiteur IA** qui vit dedans — celui-ci s'appelle « Répétiteur » par défaut et chaque personne peut le renommer. Les deux noms ont longtemps été le même ; ils ne le sont plus. Pour afficher le nom du répétiteur, lisez-le dans les préférences, ne l'écrivez jamais en dur.

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

## surfaces

### `GlassPanel`

Surface porteuse de tout le contenu. Le niveau se choisit par une seule question : est-ce que ça défile ?

```jsx
<GlassPanel level="hero" padding={22}>…prix et bouton…</GlassPanel>
<GlassPanel level="flat" padding="6px 18px">…liste de leçons…</GlassPanel>
<GlassPanel level="truth">…ce que je peux te prouver…</GlassPanel>
```

`hero` est le plancher d'opacité (0,45) : ne descendez pas plus bas, le contraste passe sous 4,5:1 sur le maillage violet.

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

### `Mesh`

Fond maillé d'un écran. Un territoire = un maillage ; l'utilisateur sait où il est avant d'avoir lu un mot.

```jsx
<div style={{position:'relative',isolation:'isolate'}}>
  <Mesh territory="transforme" />
  <div style={{position:'relative',zIndex:3}}>…</div>
</div>
```

`nuit` sert à la console d'administration et au mode sombre. Sur écran large, `size={520}`.

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

### `TerritoryCard`

Carte de territoire — le motif signature. À utiliser en pile de 2 à 4 sur mobile, en grille au-delà de 700 px.

```jsx
<div style={{marginTop:16}}>
  <TerritoryCard first territory="forme" meta="6 modules · 47 leçons" title="Je te forme" big="1" bigLabel="formation" />
  <TerritoryCard territory="informe" meta="Blog · podcast · vidéo" title="Je t'informe" big="46" bigLabel="gratuits" />
</div>
```

Ne mélangez pas les teintes hors logo. `stacked={false}` pour la grille tablette.

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

## actions

### `Button`

Bouton d'action principal du produit — pilule pleine largeur sur mobile, ton coloré par territoire.

```jsx
<Button tone="forme">Je m'inscris</Button>
<Button tone="quiet" size="sm">Changer de moyen de paiement</Button>
```

Tons : `primary` (encre), `forme`, `informe`, `transforme`, `digitalise`, `ghost` (verre à liseré d'encre), `quiet`. `disabled` grise le fond et retire le pointeur. Enfoncement `scale(.975)` au tap — n'ajoutez pas d'effet de survol porteur d'information, le survol n'existe pas sur mobile.

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

### `IconButton`

Bouton rond en verre pour le chrome d'écran : retour, notifications, partage, options.

```jsx
<IconButton label="Retour"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M15 19l-7-7 7-7"/></svg></IconButton>
<IconButton label="Notifications" badge>{bellIcon}</IconButton>
```

`badge` ajoute la pastille orange. `dark` pour la console. Toujours renseigner `label`.

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

### `PillButton`

Pilule d'encre translucide du chrome haut. Sert au menu et aux repères courts, jamais à une action de conversion.

```jsx
<PillButton>Menu</PillButton>
```

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

## forms

### `ChipRow`

Filtres de catalogue, de blog ou d'onglets de leçon.

```jsx
<ChipRow options={['Tout','SEO','IA','Marketing']} />
<ChipRow options={['Vidéo','Transcription','Mes notes','Ressources']} height={36} />
```

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

### `Field`

Champ de formulaire du produit — mocks statiques : la valeur est une chaîne, pas un état contrôlé.

```jsx
<Field label="Ton e-mail" placeholder="aissatou@exemple.sn" />
<Field label="Écris SUPPRIMER pour confirmer" state="error" hint="Le texte ne correspond pas encore." />
```

`multiline` pour un message. `trailing` pour l'œil du mot de passe.

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

### `Segmented`

Segments pour un choix exclusif court.

```jsx
<Segmented options={['Français','English']} />
<Segmented options={['Clair','Sombre','Système']} value="Sombre" />
```

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

## data

### `Avatar`

Identité d'un membre.

```jsx
<Avatar initials="A" />
<Avatar initials="AT" size={34} background="linear-gradient(135deg,#F38B0A,#B4231F)" />
```

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

### `ChatBubble`

Échange avec l'assistant Rysmo.

```jsx
<ChatBubble>Tu t'es arrêtée à la leçon 5 du module 3. On la reprend ?</ChatBubble>
<ChatBubble from="me">Comment je choisis mes mots-clés ?</ChatBubble>
<ChatBubble typing />
```

Rysmo cite une leçon des cours de la personne avant d'en suggérer un nouveau, et ne cite jamais un contenu non publié.

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

### `CheckLine`

Liste ce qui est dû, un engagement par ligne — et ce qui ne l'est pas, avec un tiret.

```jsx
<CheckLine><b className="mm-num">2</b> sessions en direct par mois, avec moi</CheckLine>
<CheckLine tone="ok">Tu travailles seul, et c'est ça le plus dur</CheckLine>
<CheckLine tone="neutre" dash>Tu pars de zéro → <b style={{color:'var(--mm-bleu)'}}>Je te forme</b></CheckLine>
```

N'y mettez que du vérifiable. Sur le Club la règle est stricte : une ligne à coche ne décrit jamais l'ambiance, seulement ce qu'une personne peut garantir seule.

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

### `DocLine`

Ligne de devis ou de fiche société.

```jsx
<DocLine label="Immatriculée" value="11/04/2022" />
<DocLine label="Siège" value="Dakar, Sénégal" last />
```

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

### `LessonRow`

Ligne de liste du produit. Toujours dans un GlassPanel `flat` — ces listes défilent, donc pas de flou.

```jsx
<GlassPanel level="flat" padding="6px 18px">
  <LessonRow state="done" title="Choisir tes mots-clés" meta="06:12" />
  <LessonRow state="current" title="Les mots que tapent tes clients" meta="08:24 · en cours" />
  <LessonRow state="todo" last title="Écrire une fiche qui remonte" meta="07:03" />
</GlassPanel>
```

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

### `PriceBlock`

Bloc de prix des formations, du Club et des packs TPE.

```jsx
<PriceBlock amount="95 000" note={<>Une fois, accès à vie · ou <b className="mm-num">3 × 31 700</b> sans frais</>} />
<PriceBlock amount="1 658" currency="FCFA / mois" size={35} note="Facturé 19 900 FCFA une fois par an." />
<PriceBlock amount="250 000" strike="295 000" note="Une fois · lancement" />
```

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

### `ProgressBar`

Progression d'une formation, d'un niveau de gamification, d'une lecture.

```jsx
<ProgressBar value={34} />
```

La progression peut redescendre (décocher est permis) mais le repère de progression maximale ne décroît jamais — c'est lui qui borne l'expérience gagnée.

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

### `QuotaMeter`

Quota quotidien de l'assistant Rysmo (2 gratuit · 5 Club · 20 Lite · 100 Pro).

```jsx
<QuotaMeter used={2} total={5} />
```

Un pack acheté s'ajoute au solde et ne se périme pas au changement de jour : ne le confondez pas avec le quota.

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

### `StatTile`

Case de chiffre de la console d'administration.

```jsx
<StatTile dark label="Encaissé" value="0 F" foot="1 transaction en attente" />
```

Ne composez jamais une case sans `foot` : un nombre sans date de relevé n'est pas publiable.

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

### `Tag`

Étiquette courte d'état ou de qualification.

```jsx
<Tag tone="ok">Vérifié</Tag>
<Tag tone="warn">En attente</Tag>
<Tag>Wave · Orange Money</Tag>
```

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

## navigation

### `Pipeline`

Filtre de statut des écrans commerciaux de la console.

```jsx
<Pipeline active="nouveau" stages={['nouveau','qualifié','devisé','signé','perdu']} />
```

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

### `SideNav`

Barre latérale tablette (700–1080 px).

```jsx
<SideNav brand={<Wordmark size={21} />} active="Je te forme"
  items={[{label:'Je te forme',color:'#0057BC'},{label:"Je t'informe",color:'#F38B0A'}]} />
```

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

### `TopBar`

Navigation du site public au-delà de 1080 px.

```jsx
<TopBar brand={<Wordmark size={23} />} items={[{label:'Je suis Max-Morrys'},{label:'Je te forme',territory:'forme'},{label:"Je t'informe",territory:'informe'}]} trailing={<Button size="sm">Connexion</Button>} />
```

L'ordre des entrées est fixe : Je suis · Je te forme · Je t'informe · Je te transforme · Je te digitalise · Contacte-moi.

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
