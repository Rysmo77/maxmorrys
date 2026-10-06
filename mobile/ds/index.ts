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
export { Gradient, useActionGradient, useDegrade } from './Gradient';
export { analyserDegrade, ligneDeDegrade, type Degrade } from './degrade';
export { Skeleton, SqueletteGroupe } from './Skeleton';
export { EmptyState } from './EmptyState';
/* Le vide HONNÊTE de la production : ce qui manque, d'où ça vient, pourquoi rien n'est inventé. */
export { SansDonnees } from './SansDonnees';
/* Le vocabulaire de ce qu'on sait — six situations là où les écrans n'en connaissaient
   que deux. C'est `SansDonnees` qui traduit chaque phase en écran. */
export {
  type Etat, type Phase, type Provenance, PHASES_SANS_VALEUR, enChargement, nonBranche,
} from './Etat';
export { TerritoryCard, type Territory, type CardLayout } from './TerritoryCard';

/* Typographie et nombres */
export { Display, Body, Eyebrow } from './Type';
/* Les fontes elles-mêmes — la table des graisses, et leur chargement au démarrage.
   `Type.tsx` les CITE ; c'est ici qu'elles arrivent, sans quoi tout retombe en police système. */
export { FONTES, CARTE_DES_FONTES, GRAISSE_BASE, useFontesChargees, type Famille } from './Fontes';
export { Num, type NumProps, type NumSource } from './Num';
/* Le nom de famille par plateforme : sur iOS, la vraie famille, qui porte toutes ses graisses. */
export { POLICE } from './police';

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
export {
  APPAREIL_MODESTE, COURBE, DUREE, ENFONCEMENT, duree, mouvementReduit, reduitMaintenant, useBascule, useMouvement,
} from './mouvement';
export { Fondu, Heros, Pressoir, Revele } from './Pressoir';
export { Anneaux } from './Anneaux';

/* Les retours d'action — sur place, jamais flottants (le kit interdit la notification
   flottante : « elle apparaît là où la personne ne regarde pas »). */
export { haptique } from './haptique';
export { useConfirmation } from './useConfirmation';
export { Bandeau, type BandeauTon } from './Bandeau';
export { useBandeau } from './useBandeau';
export { Feuille } from './Feuille';
/* La signature du répétiteur : trois barres, animées seulement pendant qu'il réfléchit. */
export { Onde } from './Onde';
/* « Réduire la transparence » (iOS) : lu une fois, comme le mouvement. */
export { useTransparenceReduite } from './transparence';
/* La typographie par rôle et l'espacement par intention (audit du 05/10/2026, DS-02/03/04). */
export { Texte, type RoleTexte, type TonTexte } from './Texte';
export { ECART, Pile, Rangee, Section, type Ecart } from './Pile';
export { elevation } from './elevation';
