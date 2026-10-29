import type { CSSProperties } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getPublishedFormations } from '../../../lib/firestore';
import { queryKeys } from '../../../lib/queryClient';
import { coverTint, fitTitle, splitTitle } from './coverTint';

/**
 * LES TROIS COUVERTURES QUI FLOTTENT — héros du catalogue, bande « nouvelles formations »,
 * panneau de la connexion. Positions et rotations reprises des maquettes.
 *
 * ⚠️ CE SONT LES VRAIES FORMATIONS PUBLIÉES, trois au plus. La maquette y écrit des titres
 * d'exemple (« Ads Meta », « L'IA ») ; ici, une couverture qui n'a pas de formation derrière
 * n'est pas dessinée. Sans aucune formation, le bloc ne rend rien.
 *
 * La lecture partage la clé du catalogue (`publishedFormations`) : sur `/formations` elle ne
 * coûte rien de plus.
 */
const PLACES: CSSProperties[] = [
  { ['--r' as string]: '-12deg', left: 0, top: '40px', width: '150px', height: '200px' },
  { ['--r' as string]: '8deg', left: '180px', top: '30px', width: '150px', height: '200px', animationDelay: '-2s' },
  { ['--r' as string]: '-2deg', left: '92px', top: 0, width: '160px', height: '215px', animationDelay: '-4s', zIndex: 2 },
];

interface FloatingCoversProps {
  className?: string;
  style?: CSSProperties;
}

export default function FloatingCovers({ className, style }: FloatingCoversProps) {
  const { t } = useTranslation('formations');
  const { data: formations = [] } = useQuery({
    queryKey: queryKeys.publishedFormations,
    queryFn: () => getPublishedFormations(),
  });
  const picked = formations.slice(0, 3);
  if (picked.length === 0) return null;
  /* L'ordre des places : la couverture du milieu (au premier plan) reçoit la première formation. */
  const order = picked.length === 1 ? [2] : picked.length === 2 ? [0, 2] : [2, 0, 1];
  return (
    <div aria-hidden="true" className={className} style={{ position: 'relative', width: '340px', height: '260px', flex: 'none', ...style }}>
      {picked.map((f, i) => {
        const { t: titre, s } = splitTitle(f.title);
        const place = PLACES[order[i]];
        return (
          <div
            key={f.id}
            className={`mm-floaty mm-cover ${coverTint(f)}`}
            style={{ ...place, padding: '14px' }}
          >
            <span className="k" style={{ fontSize: '8px' }}>{`${t('v3.coverKickerShort')} · ${f.category}`}</span>
            <div>
              <div className="t" style={{ fontSize: `${fitTitle(titre, order[i] === 2 ? 28 : 26, 125)}px` }}>{titre}</div>
              {s ? <div className="s" style={{ fontSize: '12px' }}>{s}</div> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
