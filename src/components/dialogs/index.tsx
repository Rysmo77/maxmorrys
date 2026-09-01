import { useTranslation } from 'react-i18next';
import {
  ConfirmDialog as DsConfirmDialog, Modal as DsModal, Pagination as DsPagination,
  Sheet as DsSheet,
  type ConfirmDialogProps as DsConfirmDialogProps,
  type ModalProps as DsModalProps,
  type PaginationProps as DsPaginationProps,
  type SheetProps as DsSheetProps,
} from '@ds';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LA COUCHE QUI TRADUIT — trois adaptateurs, et rien d'autre.
 *
 * `Modal`, `ConfirmDialog` et `Pagination` ont quitté `components/ui/` pour le design
 * system. Le portage a buté sur un point de principe : **le design system ne connaît
 * pas i18next**, et il ne doit pas le connaître — c'est ce qui le rend réutilisable
 * hors de ce dépôt, et ce qui permet à `mobile/ds` de partager ses jetons.
 *
 * Or les composants hérités lisaient leurs libellés par défaut dans `t('ui.…')` :
 * « Fermer », « Annuler », « Confirmer », « Page précédente ». Trente-cinq appels s'y
 * fiaient.
 *
 * Deux mauvaises réponses, et celle qu'on retient :
 *
 * ✘ Rendre les libellés OBLIGATOIRES dans le design system — trente-cinq appels à
 *   réécrire, et la même chaîne recopiée trente-cinq fois.
 * ✘ Laisser i18next entrer dans le design system — la dépendance s'inverse, le kit
 *   n'est plus portable.
 * ✔ Une couche d'adaptation de trente lignes, ici, qui injecte les libellés et
 *   transmet tout le reste. Les appels ne changent pas, le kit reste pur.
 *
 * ⚠️ NE RIEN AJOUTER D'AUTRE DANS CE FICHIER. Ce n'est pas un dossier `ui/` qui
 * repousse : c'est une frontière de traduction. Toute logique de présentation vit dans
 * le composant du design system, derrière.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export function Modal(props: Omit<DsModalProps, 'closeLabel'>) {
  const { t } = useTranslation('ui');
  return <DsModal {...props} closeLabel={t('modal.close')} />;
}

type ConfirmProps =
  Omit<DsConfirmDialogProps, 'title' | 'confirmLabel' | 'cancelLabel' | 'closeLabel'>
  & Partial<Pick<DsConfirmDialogProps, 'title' | 'confirmLabel' | 'cancelLabel'>>;

export function ConfirmDialog({ title, confirmLabel, cancelLabel, ...rest }: ConfirmProps) {
  const { t } = useTranslation('ui');
  return (
    <DsConfirmDialog
      {...rest}
      title={title ?? t('confirmDialog.title')}
      confirmLabel={confirmLabel ?? t('confirmDialog.confirm')}
      cancelLabel={cancelLabel ?? t('confirmDialog.cancel')}
      closeLabel={t('modal.close')}
    />
  );
}

export function Sheet(props: Omit<DsSheetProps, 'closeLabel'>) {
  const { t } = useTranslation('ui');
  return <DsSheet {...props} closeLabel={t('modal.close')} />;
}

export function Pagination(props: Omit<DsPaginationProps, 'label' | 'previousLabel' | 'nextLabel' | 'pageLabel'>) {
  const { t } = useTranslation('ui');
  return (
    <DsPagination
      {...props}
      label={t('pagination.label')}
      previousLabel={t('pagination.previous')}
      nextLabel={t('pagination.next')}
      pageLabel={(page) => t('pagination.page', { page, defaultValue: `Page ${page}` })}
    />
  );
}
