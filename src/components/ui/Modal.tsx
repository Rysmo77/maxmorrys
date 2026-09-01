import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { Icon } from '@ds';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/**
 * ⚠️ RENDU SOUS LA PORTÉE `.dk` DE LA CONSOLE — voir le bloc identique dans `ui/Card.tsx`.
 *
 * `bg-paper` seul donnait `#ECF0F5` sur `#FFFFFF`, soit **1,06:1**, sur les neuf feuilles
 * d'édition que sept écrans de console ouvrent encore par ici. `--paper` est le blanc FIXE du
 * système et ne bascule pas ; `--ink`, si. `ConsoleSheet` existe pour ces écrans et dit déjà
 * pourquoi (`pages/admin/components/ConsoleSheet.tsx:18-22`) ; le pendant `dark:` ci-dessous
 * ne fait que rendre lisibles les appels qui n'y sont pas encore passés.
 */
export default function Modal({ open, onClose, children, title, size = 'md' }: ModalProps) {
  const { t } = useTranslation('ui');
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      // Focus the modal
      setTimeout(() => modalRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
      // Restore focus
      previousFocusRef.current?.focus();
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Focus trap
  useEffect(() => {
    if (!open || !modalRef.current) return;
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleTab);
    return () => window.removeEventListener('keydown', handleTab);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={title ? 'modal-title' : undefined}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm mm-drop" onClick={onClose} aria-hidden="true" />
      <div
        ref={modalRef}
        tabIndex={-1}
        className={cn('relative bg-surface-sheet rounded-2xl shadow-xl w-full mm-drop max-h-[90vh] overflow-y-auto focus:outline-none', sizeMap[size])}
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-[color:var(--line)]">
            <h2 id="modal-title" className="text-lg font-semibold text-ink">{title}</h2>
            <button onClick={onClose} className="p-1 rounded-lg text-ink-2 hover:bg-[color:var(--fill-2)] dark:hover:bg-[color:var(--night-3)] transition-colors" aria-label={t('modal.close')}>
              <Icon name="close" size={20} />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
