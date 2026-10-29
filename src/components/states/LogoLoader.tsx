import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { espaceCourant, type Espace } from '../../lib/hosts';
import { useDelayed } from './useDelayed';
import { routeVeil, useVeilActive } from './routeVeilStore';
import './logo-loader.css';

export interface LogoLoaderProps {
  /** `sm` 36 px (pastille de navigation), `md` 56 px, `lg` 72 px. */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Délai avant d'APPARAÎTRE, en ms. 180 par défaut : sous ce seuil une attente se perçoit
   * comme instantanée, et un logo qui clignote 80 ms est pire que rien.
   */
  delay?: number;
  /** Libellé lu par les lecteurs d'écran. Par défaut `common:loading`. */
  label?: string;
  /** L'espace dont le liseré prend la teinte. Par défaut, celui de l'hôte. */
  tone?: Espace;
  className?: string;
}

/**
 * ── LE LOGO QUI ATTEND ────────────────────────────────────────────────────────────────
 *
 * LA MARQUE, PAS UN DESSIN. Le seul fichier de logo est le M découpé en quatre teintes
 * (voir `LogoMark` : rien n'est redessiné de mémoire). On anime donc la VRAIE image —
 * `monogramme-320.png`, 30 Ko, le poids que les e-mails servent déjà — sur la pastille
 * blanche du kit : un voile de papier balaie le M de gauche à droite, la pastille respire,
 * et un liseré à la teinte de l'espace passe dessous. Le liseré est le vocabulaire que le
 * système impose pour toute attente : « Un liseré le balaie. Jamais de rond qui tourne. »
 *
 * TROIS GARANTIES :
 *   • Il n'apparaît qu'après `delay` — les navigations rapides ne voient rien.
 *   • `prefers-reduced-motion` : `brand/fallback.css` coupe toutes les animations, et l'état
 *     de base de `logo-loader.css` EST la version statique (M entier, liseré centré).
 *   • `role="status"` et le libellé sont présents DÈS LE MONTAGE, visuellement masqués ;
 *     seul le visuel attend le délai.
 */
export default function LogoLoader({ size = 'md', delay = 180, label, tone, className = '' }: LogoLoaderProps) {
  const { t } = useTranslation('common');
  const visible = useDelayed(delay);
  const espace = tone ?? espaceCourant();
  const px = size === 'sm' ? 36 : size === 'lg' ? 72 : 56;

  return (
    <div
      role="status"
      aria-live="polite"
      data-tone={espace}
      className={`mm-ll ${size === 'md' ? '' : `mm-ll--${size}`} ${className}`}
    >
      {visible && (
        <span className="mm-ll__visual" aria-hidden="true">
          <span className="mm-ll__plate">
            <img src="/monogramme-320.png" alt="" width={px} height={px} decoding="async" />
          </span>
          <span className="mm-ll__trait"><i /></span>
        </span>
      )}
      <span className="sr-only">{label ?? t('loading')}</span>
    </div>
  );
}

/**
 * Le repli plein écran des routes paresseuses : la place d'une page, le logo au centre.
 *
 * Il se déclare EN ATTENTE auprès de `RouteVeil` (qui tient alors son voile), et ne dessine
 * pas son logo tant que le voile couvre — un seul indicateur à la fois.
 */
export function PageLogoLoader({ label }: { label?: string }) {
  const { t } = useTranslation('common');
  const voile = useVeilActive();
  useLayoutEffect(() => {
    routeVeil.suspendStart();
    return () => routeVeil.suspendEnd();
  }, []);
  return (
    <div className="mm-ll-page" aria-busy="true">
      {voile ? (
        <span role="status" className="sr-only">{label ?? t('loading')}</span>
      ) : (
        <LogoLoader size="lg" label={label} />
      )}
    </div>
  );
}
