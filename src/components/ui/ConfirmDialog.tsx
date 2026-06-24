import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Loader2 } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

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
            ? 'bg-error-100 dark:bg-error-900/30'
            : 'bg-accent-100 dark:bg-accent-900/30'
        }`}>
          <AlertTriangle className={`w-6 h-6 ${
            variant === 'danger'
              ? 'text-error-600 dark:text-error-400'
              : 'text-accent-600 dark:text-accent-400'
          }`} />
        </div>
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">{resolvedTitle}</h3>
        {message && <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">{message}</p>}
        {children && <div className="text-left mb-6">{children}</div>}
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {resolvedCancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={variant === 'danger' ? 'bg-error-600 hover:bg-error-700 text-white border-error-600' : ''}
            icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
          >
            {resolvedConfirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
