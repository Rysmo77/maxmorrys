/** Le point d'entrée du port natif. Un écran importe d'ici, jamais d'un chemin profond. */
export { ThemeScope, useScheme, useToken, useTokens, useSpace, px, veil } from './theme';
/* `veil` DÉRIVE un fond de son encre — c'est la seule façon d'obtenir une couleur
   translucide sans écrire de canaux, donc sans figer un mode. */

/* Surfaces et fond */
export { Mesh } from './Mesh';
export { Surface } from './Surface';
export { Skeleton } from './Skeleton';
export { EmptyState } from './EmptyState';
export { TerritoryCard, type Territory, type CardLayout } from './TerritoryCard';

/* Typographie et nombres */
export { Display, Body, Eyebrow } from './Type';
export { Num, type NumProps, type NumSource } from './Num';

/* Actions */
export { Button } from './Button';
export { Icon, type IconName, type IconProps } from './Icon';

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

/* Le nom du répétiteur — un réglage, jamais une constante recopiée. */
export { tutorNom, useTutorNom, setTutorNom, TUTOR_DEFAUT } from './tutor';
