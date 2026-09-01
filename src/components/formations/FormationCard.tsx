import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import LocalizedLink from '../shared/LocalizedLink';
import TranslatedText from '../shared/TranslatedText';
import { formatPrice } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { contentPath } from '../../lib/contentPath';
import type { Formation, Enrollment, Certificate } from '../../types';
import { Icon } from '@ds';

function isRecent(dateString?: string): boolean {
  if (!dateString) return false;
  const published = new Date(dateString).getTime();
  if (Number.isNaN(published)) return false;
  return Date.now() - published < 30 * 24 * 60 * 60 * 1000;
}

interface FormationCardProps {
  formation: Formation;
  /** `default` = carte catalogue · `progress` = carte LMS avec progression */
  variant?: 'default' | 'progress';
  /** Inscription de l'utilisateur (variant `progress`) */
  enrollment?: Enrollment;
  /** Certificat émis pour cette formation (variant `progress`) */
  certificate?: Certificate;
  /** Popover détail au survol (désactivé dans les carrousels qui rognent l'overflow) */
  enablePopover?: boolean;
}

/**
 * Carte de formation réutilisable, inspirée des cartes de cours Udemy
 * et alignée sur les couleurs du site (brand / accent / neutral).
 */
export default function FormationCard({ formation, variant = 'default', enrollment, certificate, enablePopover = true }: FormationCardProps) {
  const { t } = useTranslation('formations');
  const { language } = useLanguage();
  const formationPath = contentPath('formations', formation, language);
  const levelLabels: Record<string, string> = {
    debutant: t('level.debutant'),
    intermediaire: t('level.intermediaire'),
    avance: t('level.avance'),
  };
  const totalLessons = (formation.modules ?? []).reduce((acc, m) => acc + m.lessons.length, 0);
  const price = formation.promoPrice ?? formation.price;
  const hasPromo = formation.promoPrice != null && formation.promoPrice < formation.price;

  /* ── Variante LMS : carte avec progression ── */
  if (variant === 'progress') {
    const progress = enrollment?.progress ?? 0;
    const done = enrollment?.completedLessons.length ?? 0;
    const isComplete = progress === 100;
    return (
      <div className="group flex flex-col bg-surface-sheet border border-[color:var(--line)] rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-md transition duration-300">
        <LocalizedLink to={`/cours/${formation.slug}`} className="relative block aspect-[16/9] overflow-hidden">
          <img
            src={formation.coverImage}
            alt={formation.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
            <span className="w-11 h-11 rounded-full bg-[color-mix(in_srgb,var(--paper)_90%,transparent)] flex items-center justify-center">
              <Icon name="play" size={16} className="text-ink ml-0.5" />
            </span>
          </div>
        </LocalizedLink>
        <div className="flex flex-col flex-1 p-4">
          <TranslatedText text={formation.title} as="p" className="font-bold text-ink text-sm line-clamp-2 mb-3 flex-1" />
          <div className="flex justify-between text-xs text-ink-2 mb-1">
            <span>{t('card.progress')}</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <div className="h-1.5 bg-[color:var(--fill-3)] rounded-full overflow-hidden mb-1.5">
            <div className="h-full bg-[color:var(--mm-bleu)] rounded-full prog-fill transition-[width] duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-ink-2 mb-3">
            {t(done !== 1 ? 'card.lessonsDoneOther' : 'card.lessonsDoneOne', { count: done })}
          </p>
          <div className="flex gap-2 mt-auto">
            <LocalizedLink
              to={`/cours/${formation.slug}`}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-forme hover:bg-forme text-white text-sm font-semibold rounded-full transition-colors"
            >
              {isComplete ? <Icon name="check-circle" size={14} /> : <Icon name="play" size={14} />}
              {isComplete ? t('card.review') : t('card.continue')}
            </LocalizedLink>
            {isComplete && enrollment?.certificateIssued && certificate && (
              <LocalizedLink
                to={`/certificat/${certificate.certificateCode}`}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border-2 border-[color:var(--line)] text-ink-2 text-sm font-semibold rounded-full hover:bg-[color:var(--fill-1)] dark:hover:bg-[color:var(--night-3)] transition-colors"
              >
                <Icon name="award" size={14} /> {t('card.certificate')}
              </LocalizedLink>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Variante catalogue ── */
  const learnItems = (formation.modules ?? []).slice(0, 3).map((m) => m.title);

  return (
    <div className="group relative h-full">
      <Link
        to={formationPath}
        className="flex flex-col h-full bg-surface-sheet border border-[color:var(--line)] rounded-2xl overflow-hidden hover:border-[color-mix(in_srgb,var(--mm-bleu)_40%,transparent)] hover:shadow-lg transition duration-300"
      >
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={formation.coverImage}
            alt={formation.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {formation.featured ? (
            <span className="absolute top-3 left-3 px-2.5 py-1 bg-[color:var(--mm-orange)] text-white text-[11px] font-bold rounded-full uppercase tracking-wider">
              {t('card.featured')}
            </span>
          ) : isRecent(formation.publishedAt) ? (
            <span className="absolute top-3 left-3 px-2.5 py-1 bg-forme text-white text-[11px] font-bold rounded-full uppercase tracking-wider">
              {t('card.new')}
            </span>
          ) : null}
        </div>
        <div className="flex flex-col flex-1 p-4">
          <TranslatedText
            text={formation.category}
            as="p"
            className="text-[11px] font-bold tracking-[0.18em] uppercase text-forme mb-1.5"
          />
          <TranslatedText
            text={formation.title}
            as="h3"
            className="text-base font-bold tracking-tight text-ink leading-snug line-clamp-2 mb-1 group-hover:text-forme dark:group-hover:text-forme transition-colors"
          />
          <p className="text-xs text-ink-2 mb-2">Max-Morrys</p>
          <div className="flex items-center gap-2 text-xs text-ink-2 mb-3">
            <span className="flex items-center gap-1">
              <Icon name="star" size={14} className="text-informe-txt" />
              <span className="font-bold text-ink-2">{formation.rating}</span>
            </span>
            <span className="flex items-center gap-1">
              <Icon name="users" size={14} />
              {formation.students}
            </span>
            <span className="flex items-center gap-1">
              <Icon name="clock" size={14} />
              {formation.duration}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-auto">
            {price === 0 ? (
              <span className="text-lg font-black text-ok">{t('card.free')}</span>
            ) : (
              <>
                <span className="text-lg font-black text-ink">{formatPrice(price)}</span>
                {hasPromo && (
                  <span className="text-sm text-ink-2 line-through">{formatPrice(formation.price)}</span>
                )}
              </>
            )}
          </div>
        </div>
      </Link>

      {/* Popover détail — desktop uniquement (réplique le hover Udemy) */}
      {enablePopover && (
      <div className="hidden lg:block absolute inset-x-0 top-full z-30 -mt-1 pt-3 opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition duration-200">
        <div className="bg-surface-sheet border border-[color:var(--line)] rounded-2xl shadow-2xl p-5">
          <p className="text-xs font-bold tracking-[0.18em] uppercase text-forme mb-2">
            <TranslatedText text={formation.category} /> · {levelLabels[formation.level] ?? formation.level}
          </p>
          <TranslatedText
            text={formation.description}
            as="p"
            className="text-sm text-ink-2 leading-relaxed line-clamp-3 mb-3"
          />
          <div className="flex items-center gap-3 text-xs text-ink-2 mb-3">
            <span className="flex items-center gap-1"><Icon name="book" size={14} className="text-forme" />{t('card.lessonsCount', { count: totalLessons })}</span>
            {formation.certificateEnabled && (
              <span className="flex items-center gap-1"><Icon name="award" size={14} className="text-ok" />{t('card.popoverCertificate')}</span>
            )}
          </div>
          {learnItems.length > 0 && (
            <ul className="space-y-1.5 mb-4">
              {learnItems.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-ink-2">
                  <Icon name="check-circle" size={16} className="text-ok shrink-0 mt-0.5" />
                  <TranslatedText text={item} className="line-clamp-1" />
                </li>
              ))}
            </ul>
          )}
          <Link
            to={formationPath}
            className="inline-flex items-center justify-center gap-2 w-full px-5 py-2.5 bg-forme hover:bg-forme text-white text-sm font-bold rounded-full transition-colors"
          >
            {t('card.viewFormation')} <Icon name="forward" size={16} />
          </Link>
        </div>
      </div>
      )}
    </div>
  );
}
