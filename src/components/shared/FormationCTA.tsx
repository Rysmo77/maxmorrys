import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Clock, Award } from 'lucide-react';
import { getPublishedFormations } from '../../lib/firestore';
import { formatPrice } from '../../lib/utils';
import type { Formation } from '../../types';

interface FormationCTAProps {
  /** Category of the current content — used to find a relevant formation */
  category?: string;
  /** Tags from the current content — used as fallback matching */
  tags?: string[];
}

/**
 * Displays a contextual CTA card recommending a relevant formation
 * based on the content's category/tags. Falls back to a featured formation.
 */
export default function FormationCTA({ category, tags = [] }: FormationCTAProps) {
  const [formation, setFormation] = useState<Formation | null>(null);

  useEffect(() => {
    getPublishedFormations().then((formations) => {
      if (formations.length === 0) return;

      // Try to match by category (case-insensitive partial match)
      const normalise = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const cat = category ? normalise(category) : '';
      const tagSet = tags.map(normalise);

      let match = formations.find((f) => {
        const fCat = normalise(f.category ?? '');
        const fTags = (f.tags ?? []).map(normalise);
        // Direct category match
        if (cat && (fCat.includes(cat) || cat.includes(fCat))) return true;
        // Tag overlap
        if (tagSet.some((t) => fTags.includes(t) || fCat.includes(t))) return true;
        return false;
      });

      // Fallback: featured formation, or first formation
      if (!match) {
        match = formations.find((f) => f.featured) ?? formations[0];
      }

      setFormation(match);
    }).catch(() => null);
  }, [category, tags]);

  if (!formation) return null;

  const price = formation.promoPrice ?? formation.price;
  const hasPromo = formation.promoPrice != null && formation.promoPrice < formation.price;

  return (
    <div className="bg-gradient-to-br from-brand-50 to-brand-100/50 dark:from-brand-900/20 dark:to-brand-950/30 border border-brand-200 dark:border-brand-800/40 rounded-2xl p-6 sm:p-8">
      <p className="text-xs font-bold tracking-[0.3em] uppercase text-brand-600 dark:text-brand-400 mb-3">
        FORMATION RECOMMANDEE
      </p>
      <h3 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 dark:text-white mb-3 leading-tight">
        {formation.title}
      </h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-5 line-clamp-2">
        {formation.description}
      </p>

      <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400 mb-6">
        <span className="flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-brand-500" />
          {(formation.modules ?? []).reduce((a, m) => a + m.lessons.length, 0)} lecons
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-brand-500" />
          {formation.duration}
        </span>
        {formation.certificateEnabled && (
          <span className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-brand-500" />
            Certificat inclus
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Link
          to={`/formations/${formation.slug}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-full transition-colors text-sm"
        >
          Voir la formation <ArrowRight className="w-4 h-4" />
        </Link>
        <div className="flex items-baseline gap-2">
          {price === 0 ? (
            <span className="font-black text-lg text-success-600 dark:text-success-400">Gratuit</span>
          ) : (
            <>
              <span className="font-black text-lg text-neutral-900 dark:text-white">{formatPrice(price)}</span>
              {hasPromo && (
                <span className="text-sm text-neutral-400 line-through">{formatPrice(formation.price)}</span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
