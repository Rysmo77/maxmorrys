import type { ReactNode } from 'react';
import { GlassPanel, IconButton, Icon } from '@ds';
import { SiteEyebrow } from '../../../components/site/SiteType';
import { useDialogA11y } from '../../../hooks/useDialogA11y';

/**
 * LA FEUILLE D'ÉDITION DE LA CONSOLE.
 *
 * Le motif de console (`ui_kits/console/ScreensMotif.js`) ne dessine que la LISTE : trois
 * zones, une action par ligne, un pied qui nomme les angles morts. Il ne dit rien de l'endroit
 * où l'on SAISIT. C'est pourtant là que passe la moitié du travail d'un opérateur unique, et
 * quatre écrans de ce lot ouvraient chacun leur propre boîte de dialogue, recopiée à la ligne
 * près — même voile, même carte, même en-tête collant.
 *
 * DEUX RAISONS DE NE PAS RÉUTILISER `ui/Modal` ICI, et ce sont les mêmes que celles écrites
 * dans `useDialogA11y` :
 *
 *   • `ui/Modal` impose `bg-paper`. Or `--paper` n'est PAS redéclaré sous `.dk` — c'est le
 *     blanc fixe du système. Dans la console, qui est nuit, la feuille sortait donc en carte
 *     blanche au milieu d'un écran sombre.
 *   • Sa gouttière `p-6` et son en-tête ne laissent pas la place à un pied d'actions à trois
 *     boutons, dont un destructeur.
 *
 * La mécanique d'accessibilité — verrou du défilement, Échap, piège de focus, restitution du
 * focus — est REPRISE de `useDialogA11y`, pas réécrite : c'est exactement ce pour quoi ce hook
 * a été extrait.
 *
 * LE FLOU EST ICI DANS SON SEUL DROIT (règle 1) : le voile est `fixed`, il ne défile pas. La
 * feuille elle-même prend `GlassPanel level="night"`, qui n'a aucun flou — elle défile.
 */
export interface ConsoleSheetProps {
  open: boolean;
  /** Titre du dialogue. Il nomme le dialogue pour un lecteur d'écran. */
  title: string;
  /** Sourcil au-dessus du titre — « Redirection · SEO ». */
  eyebrow?: string;
  onClose: () => void;
  /** Ce que ferme le bouton de fermeture, pour qui ne voit pas la croix. */
  closeLabel: string;
  children: ReactNode;
  /** Les actions, dans l'ordre de lecture : destructrice à gauche, validation à droite. */
  footer?: ReactNode;
}

export default function ConsoleSheet({
  open, title, eyebrow, onClose, closeLabel, children, footer,
}: ConsoleSheetProps) {
  const ref = useDialogA11y(open, onClose);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 pb-8 pt-[5vh]">
      {/* Chrome fixe : le seul endroit où le flou a droit de cité. Le voile emprunte `--night`
          plutôt qu'un noir littéral — la valeur reste traçable au jeton. */}
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
        className="fixed inset-0 backdrop-blur-sm"
        style={{ background: 'color-mix(in srgb, var(--night) 76%, transparent)' }}
      />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-lg focus:outline-none"
      >
        <GlassPanel level="night" padding={0} style={{ overflow: 'hidden' }}>
          <div
            className="flex items-start justify-between gap-3 px-5 pb-4 pt-5"
            style={{ borderBottom: '1px solid var(--border-hair)' }}
          >
            <div className="min-w-0">
              {eyebrow && <SiteEyebrow style={{ marginBottom: '4px' }}>{eyebrow}</SiteEyebrow>}
              <p className="m-0 text-[15px] font-bold text-ink">{title}</p>
            </div>
            <IconButton label={closeLabel} onClick={onClose}>
              <Icon name="close" size={17} />
            </IconButton>
          </div>

          <div className="space-y-4 px-5 py-5">{children}</div>

          {footer && (
            <div
              className="flex flex-wrap items-center justify-end gap-3 px-5 pb-5 pt-4"
              style={{ borderTop: '1px solid var(--border-hair)' }}
            >
              {footer}
            </div>
          )}
        </GlassPanel>
      </div>
    </div>
  );
}
