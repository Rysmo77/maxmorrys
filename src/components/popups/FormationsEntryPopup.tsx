import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Star, Users } from 'lucide-react';
import LocalizedLink from '../shared/LocalizedLink';
import TranslatedText from '../shared/TranslatedText';
import { universeThemes } from '../../lib/sectionThemes';
import { contentPath } from '../../lib/contentPath';
import { formatPrice } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { staggerContainer, staggerItem } from '../../lib/animations';
import type { Formation } from '../../types';

/**
 * Mise en avant de « Je te forme » pour un visiteur arrivé depuis un moteur de recherche ou
 * depuis la signature de pied de page d'un site construit par l'agence.
 *
 * Registre : TUTOIEMENT. Les formations relèvent du territoire LEARN, où le système « Je te… »
 * est l'actif de marque à préserver (`docs/UX-AUDIT.md §2`).
 *
 * Quand une formation est disponible, la pop-up montre la VRAIE fiche — couverture, note,
 * inscrits, prix — plutôt qu'une promesse abstraite : un visiteur qui ne connaît pas encore le
 * catalogue a besoin de voir ce qu'il y trouvera. `formation` peut être `null` (chargement non
 * terminé, catalogue vide, Firestore muet) : la pop-up retombe alors sur son texte statique et
 * s'affiche quand même. Elle ne dépend JAMAIS du réseau pour exister.
 *
 * ⚠️ Le corps reste compact : sous `lg`, cette pop-up s'affiche en bandeau bas plafonné à 30 vh
 * (voir `PopupSurface`). D'où la vignette en ligne sur mobile et la couverture 16/9 seulement à
 * partir de `lg` — une seule balise `img`, mise en page par classes responsives.
 */

interface FormationsEntryPopupProps {
  /** Formation vedette à mettre en avant, ou `null` pour le repli textuel. */
  formation: Formation | null;
  onAccept: () => void;
  onDismiss: () => void;
}

const theme = universeThemes.formations;

const ctaCls = `group inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${theme.buttonSolid}`;
const dismissCls = 'text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded';

export default function FormationsEntryPopup({ formation, onAccept, onDismiss }: FormationsEntryPopupProps) {
  const { t } = useTranslation('shared');
  const { language } = useLanguage();
  const reduced = useReducedMotion();

  const motionProps = reduced
    ? {}
    : { variants: staggerContainer, initial: 'hidden' as const, animate: 'visible' as const };
  const itemProps = reduced ? {} : { variants: staggerItem };

  if (!formation) {
    return (
      <div>
        <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
          {t('popups.formationsEntry.text')}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          <LocalizedLink to="/formations" onClick={onAccept} className={ctaCls}>
            {t('popups.formationsEntry.cta')}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </LocalizedLink>
          <button type="button" onClick={onDismiss} className={dismissCls}>
            {t('popups.formationsEntry.dismiss')}
          </button>
        </div>
      </div>
    );
  }

  const price = formation.promoPrice ?? formation.price;
  const hasPromo = formation.promoPrice != null && formation.promoPrice < formation.price;

  return (
    <motion.div {...motionProps}>
      <motion.p
        {...itemProps}
        className={`hidden lg:block text-[0.6875rem] font-bold tracking-[0.2em] uppercase ${theme.eyebrow}`}
      >
        {t('popups.formationsEntry.eyebrow')}
      </motion.p>

      <motion.div {...itemProps} className="flex items-start gap-3 lg:mt-3 lg:block">
        <LocalizedLink
          to={contentPath('formations', formation, language)}
          onClick={onAccept}
          className="group block shrink-0 overflow-hidden rounded-xl w-14 h-14 lg:w-full lg:h-auto lg:aspect-video lg:rounded-2xl lg:mb-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <img
            src={formation.coverImage}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </LocalizedLink>

        <div className="min-w-0 flex-1">
          <TranslatedText
            text={formation.title}
            as="h3"
            className="text-sm lg:text-base font-bold text-neutral-900 dark:text-white leading-snug line-clamp-2"
          />
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
            {formation.rating > 0 && (
              <span className="inline-flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-accent-500" fill="currentColor" aria-hidden="true" />
                {formation.rating.toFixed(1)}
              </span>
            )}
            {formation.students > 0 && (
              <span className="inline-flex items-center gap-1">
                <Users className="w-3.5 h-3.5" aria-hidden="true" />
                {t('popups.formationsEntry.students', { count: formation.students })}
              </span>
            )}
            <span className="font-bold text-neutral-900 dark:text-white">
              {formatPrice(price)}
            </span>
            {hasPromo && (
              <span className="line-through text-neutral-400 dark:text-neutral-500">
                {formatPrice(formation.price)}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div {...itemProps} className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <LocalizedLink to="/formations" onClick={onAccept} className={ctaCls}>
          {t('popups.formationsEntry.ctaWithFormation')}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
        </LocalizedLink>
        <button type="button" onClick={onDismiss} className={dismissCls}>
          {t('popups.formationsEntry.dismiss')}
        </button>
      </motion.div>
    </motion.div>
  );
}
