import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getPublishedFormations } from '../../lib/firestore/formations';
import { queryKeys } from '../../lib/queryClient';
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
  const { t } = useTranslation('shared');
  /*
    Lecture partagée : la même liste alimente la page d'accueil, l'arbitre de
    pop-ups et la recherche. Avant, chaque montage relisait toute la collection
    publiée pour n'en afficher qu'une carte — et `tags` valant `[]` par défaut,
    l'effet se redéclenchait à chaque rendu du parent.
  */
  const { data: formations = [] } = useQuery({
    queryKey: queryKeys.publishedFormations,
    queryFn: () => getPublishedFormations(),
  });

  const formation = useMemo<Formation | null>(() => {
    if (formations.length === 0) return null;

    const normalise = (v: string) => v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const cat = category ? normalise(category) : '';
    const tagSet = tags.map(normalise);

    const match = formations.find((f) => {
      const fCat = normalise(f.category ?? '');
      const fTags = (f.tags ?? []).map(normalise);
      if (cat && (fCat.includes(cat) || cat.includes(fCat))) return true;
      if (tagSet.some((tag) => fTags.includes(tag) || fCat.includes(tag))) return true;
      return false;
    });

    // Repli : formation à la une, sinon la première.
    return match ?? formations.find((f) => f.featured) ?? formations[0] ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formations, category, tags.join('|')]);

  if (!formation) return null;

  return (
    <div className="bg-[color-mix(in_srgb,var(--mm-bleu)_12%,transparent)] border border-[color-mix(in_srgb,var(--mm-bleu)_7%,transparent)] rounded-2xl p-6 sm:p-8">
      <div className="grid stack:grid-cols-2 gap-6 items-center">
        <div>
          <p className={`text-xs font-bold tracking-[0.3em] uppercase ${theme.eyebrow} mb-3`}>
            {t('formationCta.eyebrow')}
          </p>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-ink mb-3 leading-tight">
            {t('formationCta.title')}
          </h3>
          <p className="text-sm text-ink-2 leading-relaxed">
            {t('formationCta.text')}
          </p>
        </div>
        <FormationCard formation={formation} />
      </div>
    </div>
  );
}
