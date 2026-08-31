import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import Button from './Button';
import { Icon } from '@ds';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  variant?: 'danger' | 'warning';
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  children,
  confirmLabel,
  cancelLabel,
  loading = false,
  variant = 'danger',
}: ConfirmDialogProps) {
  const { t } = useTranslation('ui');
  const resolvedTitle = title ?? t('confirmDialog.title');
  const resolvedConfirmLabel = confirmLabel ?? t('confirmDialog.confirm');
  const resolvedCancelLabel = cancelLabel ?? t('confirmDialog.cancel');
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="text-center">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
          variant === 'danger'
            ? 'bg-[color-mix(in_srgb,var(--stop)_4%,transparent)]'
            : 'bg-[color-mix(in_srgb,var(--mm-orange)_4%,transparent)]'
        }`}>
          <Icon name="alert" className={`w-6 h-6 ${
            variant === 'danger'
              ? 'text-stop'
              : 'text-informe-txt'
          }`} />
        </div>
        <h3 className="text-lg font-bold text-ink mb-2">{resolvedTitle}</h3>
        {message && <p className="text-sm text-ink-2 mb-6">{message}</p>}
        {children && <div className="text-left mb-6">{children}</div>}
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {resolvedCancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            loading={loading}
            className={variant === 'danger' ? 'bg-stop hover:bg-stop text-white border-stop' : ''}
          >
            {resolvedConfirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
