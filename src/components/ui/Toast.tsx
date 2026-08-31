import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { Icon, type IconName } from '@ds';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface ToastContextType {
  addToast: (type: Toast['type'], message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const icons: Record<Toast['type'], IconName> = {
  success: 'check-circle',
  error: 'alert-circle',
  info: 'info',
  warning: 'alert',
};

const styles = {
  success: 'border-ok bg-[color-mix(in_srgb,var(--ok)_8%,transparent)] text-[color-mix(in_srgb,var(--ok)_30%,transparent)]',
  error: 'border-stop bg-[color-mix(in_srgb,var(--stop)_8%,transparent)] text-[color-mix(in_srgb,var(--stop)_30%,transparent)]',
  info: 'border-forme bg-[color-mix(in_srgb,var(--mm-bleu)_8%,transparent)] text-[color-mix(in_srgb,var(--mm-bleu)_30%,transparent)]',
  warning: 'border-warn bg-[color-mix(in_srgb,var(--warn)_8%,transparent)] text-[color-mix(in_srgb,var(--warn)_30%,transparent)]',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation('ui');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  /*
    `addToast` est déjà stable, mais pas l'objet qui l'enveloppe : sans ce memo,
    l'apparition d'un toast — et sa fermeture automatique 4 s plus tard —
    re-rendait tous les `useToast()` de la page.
  */
  const value = useMemo(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => {
          const glyph = icons[toast.type];
          return (
            <div key={toast.id} role="alert" className={cn('flex items-start gap-3 p-4 rounded-xl border-l-4 shadow-lg mm-drop', styles[toast.type])}>
              <Icon name={glyph} size={20} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium flex-1">{toast.message}</p>
              <button onClick={() => removeToast(toast.id)} className="flex-shrink-0 opacity-60 hover:opacity-100" aria-label={t('toast.close')}>
                <Icon name="close" size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
