import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { Icon } from '../brand/Icon';
import type { IconName } from '../../icons';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE TOAST — le retour d'une action qui s'est terminée ailleurs qu'à l'écran.
 *
 * Porté depuis `components/ui/Toast` : c'était le trou le plus coûteux du design
 * system — **trente fichiers** en dépendaient, plus que tout autre composant hérité.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ CE QUI ÉTAIT CASSÉ, ET QUE LE PORTAGE RÉPARE
 *
 * Le texte était peint en `color-mix(in srgb, var(--ok) 30%, transparent)` — la teinte
 * d'état à **30 % d'opacité**. Sur le fond clair, ça donne environ **1,5:1**. Le message
 * de confirmation, d'erreur ou d'avertissement était donc à la limite de l'invisible,
 * précisément au moment où il faut le lire.
 *
 * La valeur de 8 % qui la précède, elle, est juste : c'est le VOILE de fond. Les deux
 * lignes se ressemblaient, et la seconde a manifestement été copiée de la première.
 *
 * Le texte prend maintenant la teinte pleine. `--ok`, `--warn` et `--stop` ont chacune
 * leur variante nuit calculée par le kit (11,0:1 · 10,8:1 · 7,9:1 sur `#0B0E13`) : la
 * portée `.dk` les bascule seule, aucune classe `dark:` n'est nécessaire (AD-3).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DEUX AUTRES ÉCARTS FERMÉS
 *
 * · `shadow-lg` était l'ombre PAR DÉFAUT de Tailwind, étrangère au système. Le kit a
 *   `--card-sh`, exposée en `shadow-card`.
 * · `rounded-xl` vaut 30 px depuis que les jetons pilotent l'échelle — un rayon de
 *   panneau héros sur une bannière de 60 px de haut. `rounded-m` (16 px) est la valeur
 *   que le kit destine aux encarts denses.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE CONTENEUR EST UNE RÉGION VIVANTE, ET SES MESSAGES SONT DES ALERTES.
 * `aria-live="polite"` annonce sans interrompre ; `role="alert"` sur chaque message le
 * fait lire dès son arrivée. Les deux ensemble, parce qu'un toast ajouté à une région
 * déjà montée n'est pas annoncé par tous les lecteurs d'écran.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

interface ToastEntry {
  id: string;
  type: ToastTone;
  message: string;
}

interface ToastContextType {
  addToast: (type: ToastTone, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const GLYPH: Record<ToastTone, IconName> = {
  success: 'check-circle',
  error: 'alert-circle',
  info: 'info',
  warning: 'alert',
};

/** Voile de fond à 8 %, filet et TEXTE à la teinte pleine. */
const TONE: Record<ToastTone, string> = {
  success: 'border-ok bg-[color-mix(in_srgb,var(--ok)_8%,transparent)] text-ok',
  error: 'border-stop bg-[color-mix(in_srgb,var(--stop)_8%,transparent)] text-stop',
  info: 'border-forme bg-[color-mix(in_srgb,var(--mm-bleu)_8%,transparent)] text-forme',
  warning: 'border-warn bg-[color-mix(in_srgb,var(--warn)_8%,transparent)] text-warn',
};

/** Durée d'affichage. Assez pour lire une phrase, pas assez pour gêner. */
const DISMISS_MS = 4000;

export interface ToastProviderProps {
  children: ReactNode;
  /** Libellé du bouton de fermeture. La coquille le traduit — le DS ne connaît pas i18next. */
  closeLabel?: string;
}

export function ToastProvider({ children, closeLabel = 'Fermer' }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const addToast = useCallback((type: ToastTone, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), DISMISS_MS);
  }, []);

  const removeToast = (id: string) => setToasts((prev) => prev.filter((x) => x.id !== id));

  /* `addToast` est stable, mais pas l'objet qui l'enveloppe : sans ce memo, l'apparition
     d'un toast — et sa fermeture 4 s plus tard — re-rendait tous les `useToast()` de la page. */
  const value = useMemo(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={`flex items-start gap-3 rounded-m border-l-4 p-4 shadow-card mm-drop ${TONE[toast.type]}`}
          >
            <Icon name={GLYPH[toast.type]} size={20} className="mt-0.5 flex-shrink-0" />
            <p className="flex-1 text-meta font-medium">{toast.message}</p>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="mm-touch-extend flex-shrink-0 opacity-60 transition-opacity duration-ui hover:opacity-100"
              aria-label={closeLabel}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit être utilisé dans un <ToastProvider>');
  return ctx;
}
