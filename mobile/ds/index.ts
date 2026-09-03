/** Le point d'entrée du port natif. Un écran importe d'ici, jamais d'un chemin profond. */
export { ThemeScope, useScheme, useToken, useTokens, useSpace, px, veil } from './theme';
/* `veil` DÉRIVE un fond de son encre — c'est la seule façon d'obtenir une couleur
   translucide sans écrire de canaux, donc sans figer un mode. */

/* Ce qui doit différer d'une plateforme à l'autre — et rien d'autre. */
export {
  isIOS, isAndroid, screenAnimation, screenAnimationDuration,
  edgeSwipeBack, translucentTabBar, ripple, navBarElevation,
} from './platform';

/* Le châssis natif — un corps, deux plateformes. C'est lui qui porte la différence. */
export { Screen, type ScreenTerritory } from './Screen';
export { NavBar, NAVBAR_H } from './NavBar';

/* Surfaces et fond */
export { Mesh } from './Mesh';
export { Surface } from './Surface';
export { Gradient, useActionGradient } from './Gradient';
export { Skeleton } from './Skeleton';
export { EmptyState } from './EmptyState';
/* Le vide HONNÊTE de la production : ce qui manque, d'où ça vient, pourquoi rien n'est inventé. */
export { SansDonnees } from './SansDonnees';
export { TerritoryCard, type Territory, type CardLayout } from './TerritoryCard';

/* Typographie et nombres */
export { Display, Body, Eyebrow } from './Type';
export { Num, type NumProps, type NumSource } from './Num';

/* Actions */
export { Button } from './Button';
export { IconButton } from './IconButton';
export { Fab } from './Fab';
export { Icon, type IconName, type IconProps } from './Icon';
export { Wordmark } from './Wordmark';
/* Les marques TIERCES — elles gardent leurs couleurs, et c'est la règle : voir le fichier. */
export { GoogleMark, AppleMark } from './BrandMarks';

/* Formulaires et contrôles */
export { Field } from './Field';
export { Switch } from './Switch';
export { Segmented } from './Segmented';
export { ChipRow } from './ChipRow';
export { PayOption } from './PayOption';
export { StepDots } from './StepDots';

/* Données */
export { Tag, type TagTone } from './Tag';
export { LessonRow, type LessonState } from './LessonRow';
export { ProgressBar } from './ProgressBar';
export { QuotaMeter } from './QuotaMeter';
export { Avatar } from './Avatar';
export { ChatBubble } from './ChatBubble';
export { CheckLine } from './CheckLine';
export { DocLine } from './DocLine';
export { PriceBlock } from './PriceBlock';
export { StatTile } from './StatTile';
export { MediaCard } from './MediaCard';

/* Navigation secondaire et lecture persistante */
export { SubNav } from './SubNav';
export { Pipeline } from './Pipeline';
export { MiniPlayer } from './MiniPlayer';

/* Le nom du répétiteur — un réglage, jamais une constante recopiée. */
export { tutorNom, useTutorNom, setTutorNom, TUTOR_DEFAUT } from './tutor';
