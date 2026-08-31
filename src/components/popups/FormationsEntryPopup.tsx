import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import LocalizedLink from '../shared/LocalizedLink';
import TranslatedText from '../shared/TranslatedText';
import { contentPath } from '../../lib/contentPath';
import { formatPrice } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { staggerContainer, staggerItem } from '../../lib/animations';
import type { Formation } from '../../types';
import { Icon } from '@ds';

/**
 * Mise en avant de « Je te forme » pour un visiteur arrivé depuis un moteur de recherche ou
 * depuis la signature de pied de page d'un site construit par l'agence.
 *
 * Registre : TUTOIEMENT. Les formations relèvent du territoire LEARN, où le système « Je te… »
 * est l'actif de marque à préserver (`docs/UX-AUDIT.md §2`).
 *
 * Quand une formation est disponible, la pop-up montre la VRAIE fiche — note, inscrits, prix — et
 * sa couverture devient le panneau de droite du dialogue (voir `PopupManager`). `formation` peut
 * être `null` : la pop-up retombe alors sur son texte statique et s'affiche quand même. Elle ne
 * dépend JAMAIS du réseau pour exister.
 *
 * ⚠️ Deux mises en page dans un seul composant, et c'est voulu. Sous `lg` cette pop-up s'affiche
 * en bandeau bas plafonné à 30 vh : titre réduit, vignette en ligne, aucun ornement. À partir de
 * `lg` elle devient le dialogue éditorial pleine largeur. Tout ce qui grossit est donc conditionné
 * par `lg:` — ajouter un élément non conditionné pousserait le CTA sous la ligne de flottaison du
 * bandeau sur un petit téléphone.
 */

interface FormationsEntryPopupProps {
  /** Formation vedette à mettre en avant, ou `null` pour le repli textuel. */
  formation: Formation | null;
  onAccept: () => void;
  onDismiss: () => void;
}

/** CTA « blob » : coins très arrondis et aplat de marque, dans l'esprit du bouton de référence. */
const ctaCls = 'group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[color:var(--mm-bleu)] hover:bg-[color:var(--mm-bleu)] text-ink font-black text-sm uppercase tracking-wide transition duration-300 hover:-translate-y-0.5 active:scale-[0.97] shadow-forme focus:outline-none';
const dismissCls = 'text-xs font-semibold text-white/40 hover:text-white/80 transition-colors focus:outline-none focus-visible:ring-2 rounded';

export default function FormationsEntryPopup({ formation, onAccept, onDismiss }: FormationsEntryPopupProps) {
  const { t } = useTranslation('shared');
  const { language } = useLanguage();
  const reduced = useReducedMotion();

  const containerProps = reduced
    ? {}
    : { variants: staggerContainer, initial: 'hidden' as const, animate: 'visible' as const };
  const itemProps = reduced ? {} : { variants: staggerItem };

  const title = (
    <h2 className="text-base lg:text-5xl font-bold lg:font-black lg:uppercase lg:tracking-tight lg:leading-[0.95] text-white text-balance">
      {t('popups.formationsEntry.title')}
    </h2>
  );

  if (!formation) {
    return (
      <div>
        <p className="hidden lg:block text-[0.625rem] font-bold tracking-[0.3em] uppercase text-forme">
          {t('popups.formationsEntry.eyebrow')}
        </p>
        <div className="lg:mt-3">{title}</div>
        <p className="mt-2 lg:mt-4 text-sm text-white/60 leading-relaxed max-w-md">
          {t('popups.formationsEntry.text')}
        </p>
        <div className="mt-4 lg:mt-7 flex flex-wrap items-center gap-x-5 gap-y-2">
          <LocalizedLink to="/formations" onClick={onAccept} className={ctaCls}>
            {t('popups.formationsEntry.cta')}
            <Icon name="forward" size={16} className="group-hover:translate-x-1 transition-transform" />
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
    <motion.div {...containerProps}>
      <motion.p
        {...itemProps}
        className="hidden lg:block text-[0.625rem] font-bold tracking-[0.3em] uppercase text-forme"
      >
        {t('popups.formationsEntry.eyebrow')}
      </motion.p>

      <motion.div {...itemProps} className="lg:mt-3">{title}</motion.div>

      {/*
        Fiche de la formation. Sous `lg`, la vignette reste en ligne : la couverture pleine largeur
        ne s'affiche que dans le panneau de droite du dialogue, qui n'existe pas sur mobile.
      */}
      <motion.div
        {...itemProps}
        className="mt-3 lg:mt-6 flex items-start gap-3 lg:gap-4 lg:p-4 lg:rounded-2xl lg:border lg:border-white/10 lg:bg-paper/[0.03]"
      >
        <LocalizedLink
          to={contentPath('formations', formation, language)}
          onClick={onAccept}
          className="group block shrink-0 overflow-hidden rounded-xl w-14 h-14 lg:w-20 lg:h-20 focus:outline-none focus-visible:ring-2"
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
            as="p"
            className="text-sm lg:text-base font-bold text-white leading-snug line-clamp-2"
          />
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/50">
            {formation.rating > 0 && (
              <span className="inline-flex items-center gap-1">
                <Icon name="star" size={14} className="text-informe-txt" />
                {formation.rating.toFixed(1)}
              </span>
            )}
            {formation.students > 0 && (
              <span className="inline-flex items-center gap-1">
                <Icon name="users" size={14} />
                {t('popups.formationsEntry.students', { count: formation.students })}
              </span>
            )}
            <span className="font-bold text-white">{formatPrice(price)}</span>
            {hasPromo && (
              <span className="line-through text-white/30">{formatPrice(formation.price)}</span>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div {...itemProps} className="mt-4 lg:mt-7 flex flex-wrap items-center gap-x-5 gap-y-2">
        <LocalizedLink to="/formations" onClick={onAccept} className={ctaCls}>
          {t('popups.formationsEntry.ctaWithFormation')}
          <Icon name="forward" size={16} className="group-hover:translate-x-1 transition-transform" />
        </LocalizedLink>
        <button type="button" onClick={onDismiss} className={dismissCls}>
          {t('popups.formationsEntry.dismiss')}
        </button>
      </motion.div>
    </motion.div>
  );
}
