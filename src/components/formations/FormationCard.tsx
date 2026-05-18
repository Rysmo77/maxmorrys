import { Link } from 'react-router-dom';
import { Star, Users, Clock, BookOpen, Award, CheckCircle, Play, ArrowRight } from 'lucide-react';
import { formatPrice } from '../../lib/utils';
import type { Formation, Enrollment, Certificate } from '../../types';

const levelLabels: Record<string, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
};

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
  const totalLessons = (formation.modules ?? []).reduce((acc, m) => acc + m.lessons.length, 0);
  const price = formation.promoPrice ?? formation.price;
  const hasPromo = formation.promoPrice != null && formation.promoPrice < formation.price;

  /* ── Variante LMS : carte avec progression ── */
  if (variant === 'progress') {
    const progress = enrollment?.progress ?? 0;
    const done = enrollment?.completedLessons.length ?? 0;
    const isComplete = progress === 100;
    return (
      <div className="group flex flex-col bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300">
        <Link to={`/cours/${formation.slug}`} className="relative block aspect-[16/9] overflow-hidden">
          <img
            src={formation.coverImage}
            alt={formation.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
            <span className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="w-4 h-4 text-neutral-900 ml-0.5" fill="currentColor" />
            </span>
          </div>
        </Link>
        <div className="flex flex-col flex-1 p-4">
          <p className="font-bold text-neutral-900 dark:text-white text-sm line-clamp-2 mb-3 flex-1">{formation.title}</p>
          <div className="flex justify-between text-xs text-neutral-500 mb-1">
            <span>Progression</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden mb-1.5">
            <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-neutral-400 mb-3">
            {done} leçon{done !== 1 ? 's' : ''} complétée{done !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-2 mt-auto">
            <Link
              to={`/cours/${formation.slug}`}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-full transition-colors"
            >
              {isComplete ? <CheckCircle className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isComplete ? 'Revoir' : 'Continuer'}
            </Link>
            {isComplete && enrollment?.certificateIssued && certificate && (
              <Link
                to={`/certificat/${certificate.certificateCode}`}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border-2 border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 text-sm font-semibold rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              >
                <Award className="w-3.5 h-3.5" /> Certificat
              </Link>
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
        to={`/formations/${formation.slug}`}
        className="flex flex-col h-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden hover:border-brand-500/40 hover:shadow-lg transition-all duration-300"
      >
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={formation.coverImage}
            alt={formation.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {formation.featured ? (
            <span className="absolute top-3 left-3 px-2.5 py-1 bg-accent-500 text-white text-[11px] font-bold rounded-full uppercase tracking-wider">
              À la une
            </span>
          ) : isRecent(formation.publishedAt) ? (
            <span className="absolute top-3 left-3 px-2.5 py-1 bg-brand-600 text-white text-[11px] font-bold rounded-full uppercase tracking-wider">
              Nouveau
            </span>
          ) : null}
        </div>
        <div className="flex flex-col flex-1 p-4">
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-brand-600 dark:text-brand-400 mb-1.5">
            {formation.category}
          </p>
          <h3 className="text-base font-bold tracking-tight text-neutral-900 dark:text-white leading-snug line-clamp-2 mb-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            {formation.title}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">Max-Morrys</p>
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-3">
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-accent-500" fill="currentColor" />
              <span className="font-bold text-neutral-700 dark:text-neutral-200">{formation.rating}</span>
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {formation.students}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formation.duration}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-auto">
            {price === 0 ? (
              <span className="text-lg font-black text-success-600 dark:text-success-400">Gratuit</span>
            ) : (
              <>
                <span className="text-lg font-black text-neutral-900 dark:text-white">{formatPrice(price)}</span>
                {hasPromo && (
                  <span className="text-sm text-neutral-400 line-through">{formatPrice(formation.price)}</span>
                )}
              </>
            )}
          </div>
        </div>
      </Link>

      {/* Popover détail — desktop uniquement (réplique le hover Udemy) */}
      {enablePopover && (
      <div className="hidden lg:block absolute inset-x-0 top-full z-30 -mt-1 pt-3 opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200">
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-2xl p-5">
          <p className="text-xs font-bold tracking-[0.18em] uppercase text-brand-600 dark:text-brand-400 mb-2">
            {formation.category} · {levelLabels[formation.level] ?? formation.level}
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed line-clamp-3 mb-3">
            {formation.description}
          </p>
          <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 mb-3">
            <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-brand-500" />{totalLessons} leçons</span>
            {formation.certificateEnabled && (
              <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-success-500" />Certificat</span>
            )}
          </div>
          {learnItems.length > 0 && (
            <ul className="space-y-1.5 mb-4">
              {learnItems.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <CheckCircle className="w-4 h-4 text-success-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{item}</span>
                </li>
              ))}
            </ul>
          )}
          <Link
            to={`/formations/${formation.slug}`}
            className="inline-flex items-center justify-center gap-2 w-full px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-full transition-colors"
          >
            Voir la formation <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      )}
    </div>
  );
}
