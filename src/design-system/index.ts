/**
 * LE POINT D'ENTRÉE UNIQUE DU DESIGN SYSTEM.
 *
 * Une surface — page, écran, composant produit — importe depuis `@ds` et jamais depuis un
 * fichier de `design-system/css/` ni depuis un chemin profond de `react/`. C'est la règle de
 * dépendance du paradigme : les jetons sont sous les primitives, les primitives sous les
 * surfaces, et rien ne saute un étage.
 *
 * Ce que ça achète concrètement : le jour où une primitive change de fichier, de nom interne
 * ou de découpage, aucune des cent quarante surfaces n'a à le savoir.
 *
 * GÉNÉRÉ PAR `npm run ds:barrel` — ne pas éditer à la main.
 */

/* ── Actions ─────────────────────────────────────────────────────────── */
export { Button } from './react/actions/Button';
export type { ButtonProps, ButtonTone } from './react/actions/Button';
export { IconButton } from './react/actions/IconButton';
export type { IconButtonProps } from './react/actions/IconButton';
export { PillButton } from './react/actions/PillButton';
export type { PillButtonProps } from './react/actions/PillButton';

/* ── Marque ─────────────────────────────────────────────────────────── */
export { Icon, iconNames } from './react/brand/Icon';
export type { IconName, IconProps } from './react/brand/Icon';
export { LogoMark } from './react/brand/LogoMark';
export type { LogoMarkProps } from './react/brand/LogoMark';
export { Wordmark } from './react/brand/Wordmark';
export type { WordmarkProps } from './react/brand/Wordmark';

/* ── Données ─────────────────────────────────────────────────────────── */
export { Avatar } from './react/data/Avatar';
export type { AvatarProps } from './react/data/Avatar';
export { ChatBubble } from './react/data/ChatBubble';
export type { ChatBubbleProps } from './react/data/ChatBubble';
export { CheckLine } from './react/data/CheckLine';
export type { CheckLineProps, CheckLineTone } from './react/data/CheckLine';
export { DocLine } from './react/data/DocLine';
export type { DocLineProps } from './react/data/DocLine';
export { LessonRow } from './react/data/LessonRow';
export type { LessonRowProps } from './react/data/LessonRow';
export { MediaCard } from './react/data/MediaCard';
export type { MediaCardProps } from './react/data/MediaCard';
export { Num } from './react/data/Num';
export type { NumProps } from './react/data/Num';
export { PriceBlock } from './react/data/PriceBlock';
export type { PriceBlockProps } from './react/data/PriceBlock';
export { ProgressBar } from './react/data/ProgressBar';
export type { ProgressBarProps } from './react/data/ProgressBar';
export { QuotaMeter } from './react/data/QuotaMeter';
export type { QuotaMeterProps } from './react/data/QuotaMeter';
export { StatTile } from './react/data/StatTile';
export type { StatTileProps } from './react/data/StatTile';
export { Tag } from './react/data/Tag';
export type { TagProps, TagTone } from './react/data/Tag';
export { TranslationNotice } from './react/data/TranslationNotice';
export type { TranslationNoticeProps } from './react/data/TranslationNotice';

/* ── Formulaires ─────────────────────────────────────────────────────────── */
export { ChipRow } from './react/forms/ChipRow';
export type { ChipRowProps } from './react/forms/ChipRow';
export { Field } from './react/forms/Field';
export type { FieldAs, FieldOption, FieldProps, FieldSize } from './react/forms/Field';
export { PayOption } from './react/forms/PayOption';
export type { PayOptionProps } from './react/forms/PayOption';
export { Segmented } from './react/forms/Segmented';
export type { SegmentedProps } from './react/forms/Segmented';
export { StepDots } from './react/forms/StepDots';
export type { StepDotsProps } from './react/forms/StepDots';
export { Switch } from './react/forms/Switch';
export type { SwitchProps } from './react/forms/Switch';

/* ── Navigation ─────────────────────────────────────────────────────────── */
export { Breadcrumb } from './react/navigation/Breadcrumb';
export type { BreadcrumbItem, BreadcrumbProps } from './react/navigation/Breadcrumb';
export { Pagination } from './react/navigation/Pagination';
export type { PaginationProps } from './react/navigation/Pagination';
export { Pipeline } from './react/navigation/Pipeline';
export type { PipelineProps } from './react/navigation/Pipeline';
export { ReadingBar } from './react/navigation/ReadingBar';
export type { ReadingBarProps } from './react/navigation/ReadingBar';
export { SearchPill } from './react/navigation/SearchPill';
export type { SearchPillProps } from './react/navigation/SearchPill';
export { SideNav } from './react/navigation/SideNav';
export type { SideNavItem, SideNavProps } from './react/navigation/SideNav';
export { SubNav } from './react/navigation/SubNav';
export type { SubNavItem, SubNavProps } from './react/navigation/SubNav';
export { TabBar } from './react/navigation/TabBar';
export type { TabBarItem, TabBarProps } from './react/navigation/TabBar';
export { TopBar } from './react/navigation/TopBar';
export type { TopBarItem, TopBarProps } from './react/navigation/TopBar';

/* ── Surfaces ─────────────────────────────────────────────────────────── */
export { ConfirmDialog } from './react/surfaces/ConfirmDialog';
export type { ConfirmDialogProps } from './react/surfaces/ConfirmDialog';
export { EmptyState } from './react/surfaces/EmptyState';
export type { EmptyStateProps } from './react/surfaces/EmptyState';
export { GlassPanel } from './react/surfaces/GlassPanel';
export type { GlassPanelProps } from './react/surfaces/GlassPanel';
export { Mesh } from './react/surfaces/Mesh';
export type { MeshProps } from './react/surfaces/Mesh';
export { Modal } from './react/surfaces/Modal';
export type { ModalProps } from './react/surfaces/Modal';
export { Skeleton } from './react/surfaces/Skeleton';
export type { SkeletonProps } from './react/surfaces/Skeleton';
export { TerritoryCard } from './react/surfaces/TerritoryCard';
export type { TerritoryCardProps } from './react/surfaces/TerritoryCard';
export { ToastProvider, useToast } from './react/surfaces/Toast';
export type { ToastProviderProps, ToastTone } from './react/surfaces/Toast';
export { TruthPanel } from './react/surfaces/TruthPanel';
export type { TruthPanelProps } from './react/surfaces/TruthPanel';

/* ── Types partagés ──────────────────────────────────────────────────── */
export { TERRITORIES, TERRITORY_INK, TERRITORY_VERB } from './react/types';
export type { GlassLevel, NumSource, Territory } from './react/types';

/* ── Repli appareil modeste (règle 5) ────────────────────────────────── */
export { applyLowFiIfModestDevice } from './lowfi';

/* ── Jetons aplatis, pour le natif (AD-8) ────────────────────────────── */
export { tokens, token, TERRITORIES as NATIVE_TERRITORIES } from './tokens.generated';
