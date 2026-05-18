import { useState, useEffect } from 'react';
import { getPublishedFormations } from '../../lib/firestore';
import type { Formation } from '../../types';
import FormationCard from '../formations/FormationCard';
import { universeThemes } from '../../lib/sectionThemes';

const theme = universeThemes.formations;

interface FormationCTAProps {
  /** Category of the current content — used to find a relevant formation */
  category?: string;
  /** Tags from the current content — used as fallback matching */
  tags?: string[];
}

/**
 * Displays a contextual CTA recommending a relevant formation
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

  return (
    <div className="bg-gradient-to-br from-brand-50 to-brand-100/50 dark:from-brand-900/20 dark:to-brand-950/30 border border-brand-200 dark:border-brand-800/40 rounded-2xl p-6 sm:p-8">
      <div className="grid sm:grid-cols-2 gap-6 items-center">
        <div>
          <p className={`text-xs font-bold tracking-[0.3em] uppercase ${theme.eyebrow} mb-3`}>
            Formation recommandée
          </p>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 dark:text-white mb-3 leading-tight">
            Va plus loin avec une formation pratique
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Tu as aimé cet article ? Passe à la pratique avec une formation conçue pour des résultats concrets.
          </p>
        </div>
        <FormationCard formation={formation} />
      </div>
    </div>
  );
}
