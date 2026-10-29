import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import LocalizedLink from '../shared/LocalizedLink';
import PopupHeading from './PopupHeading';
import { staggerContainer, staggerItem } from '../../lib/animations';
import { TONES, DISMISS, BODY, TILE, TILE_ICON, TILE_LABEL, TILE_DESC, TILE_ARROW } from './popupStyles';
import { Icon, type IconName } from '@ds';

/**
 * Aiguilleur d'audience sur la page mère de la piste Conception. Ce n'est pas une mise en avant
 * d'offre mais une question d'audience, pour ne pas abîmer un positionnement haut de gamme.
 *
 * Corrigé le 2026-10-29 :
 *   · la porte « faire construire » visait `#projet`, ancre disparue avec la refonte : elle
 *     refermait la fenêtre sans rien faire. Le formulaire de la page est `#qualif` ;
 *   · la fenêtre TUTOYAIT sur la seule page qui vouvoie (kit v3, « La piste Conception
 *     vouvoie ») ;
 *   · la porte « se former » mène à l'accueil de l'école (edu.), pas à un catalogue dont les
 *     formations sont encore « Bientôt ».
 */
interface AudienceRouterPopupProps {
  onChoose: (destination: 'build' | 'presence' | 'learn') => void;
  onContinue: () => void;
}

function Door({ icon, tint, label, desc }: { icon: IconName; tint: string; label: string; desc: string }) {
  return (
    <>
      <span className={`${TILE_ICON} ${tint}`}><Icon name={icon} size={20} /></span>
      <span className="min-w-0 flex-1">
        <span className={TILE_LABEL}>{label}</span>
        <span className={TILE_DESC}>{desc}</span>
      </span>
      <Icon name="forward" size={16} className={TILE_ARROW} />
    </>
  );
}

export default function AudienceRouterPopup({ onChoose, onContinue }: AudienceRouterPopupProps) {
  const { t } = useTranslation('shared');
  const reduced = useReducedMotion();
  const list = reduced ? {} : { variants: staggerContainer, initial: 'hidden' as const, animate: 'visible' as const };
  const item = reduced ? {} : { variants: staggerItem };

  return (
    <div>
      <PopupHeading
        tone="hub"
        eyebrow={t('popups.agencyExit.eyebrow')}
        title={t('popups.agencyExit.title')}
      />
      <p className={BODY}>{t('popups.agencyExit.intro')}</p>

      <motion.div className="mt-6 grid gap-2.5" {...list}>
        <motion.div {...item}>
          {/* Le visiteur est déjà au bon endroit : le formulaire de qualification de la page. */}
          <a href="#qualif" onClick={() => onChoose('build')} className={TILE}>
            <Door icon="layers" tint={TONES.hub.tint} label={t('popups.agencyExit.buildLabel')} desc={t('popups.agencyExit.buildDesc')} />
          </a>
        </motion.div>
        <motion.div {...item}>
          <LocalizedLink to="/conception/commerces-et-tpe" onClick={() => onChoose('presence')} className={TILE}>
            <Door icon="store" tint={TONES.studio.tint} label={t('popups.agencyExit.presenceLabel')} desc={t('popups.agencyExit.presenceDesc')} />
          </LocalizedLink>
        </motion.div>
        <motion.div {...item}>
          <LocalizedLink to="/apprendre" onClick={() => onChoose('learn')} className={TILE}>
            <Door icon="graduation" tint={TONES.edu.tint} label={t('popups.agencyExit.learnLabel')} desc={t('popups.agencyExit.learnDesc')} />
          </LocalizedLink>
        </motion.div>
      </motion.div>

      {/* Sortie neutre, toujours offerte : un blocage sans issue lisible serait un dark pattern. */}
      <button type="button" onClick={onContinue} className={`mt-5 ${DISMISS}`}>
        {t('popups.agencyExit.continue')}
      </button>
    </div>
  );
}
