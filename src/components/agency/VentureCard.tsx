import { useTranslation } from 'react-i18next';
import Badge from '../ui/Badge';
import SitePreview from './SitePreview';
import { VENTURE_RELATION } from '../../lib/brand';
import type { Venture } from '../../lib/brand';
import { Icon } from '@ds';

interface VentureCardProps {
  venture: Venture;
}

/**
 * Carte d'une venture MY ONOMA.
 *
 * ⚠️ Volontairement distincte de `ClientWorkCard`, et jamais rendue dans la même grille.
 * Une venture est détenue et opérée par MY ONOMA SARL — jamais par Max-Morrys à titre
 * personnel, jamais présentée comme un service de l'agence.
 * Voir `docs/BRAND-ARCHITECTURE.md §5`.
 *
 * ⚠️ Aucun chiffre d'utilisateurs, de revenus, de traction ou de levée n'a sa place ici.
 */
export default function VentureCard({ venture }: VentureCardProps) {
  const { t } = useTranslation('agency');

  return (
    <article className="group relative flex flex-col rounded-2xl border border-[color:var(--line)] bg-[color:var(--fill-1)] dark:bg-[color-mix(in_srgb,var(--night-3)_60%,transparent)] transition-colors hover:border-[color-mix(in_srgb,var(--mm-teal)_60%,transparent)] overflow-hidden">
      {/* Aperçu réel du produit en production. */}
      <div className="p-4 pb-0">
        <SitePreview url={venture.website} domain={venture.domain} name={venture.name} />
      </div>

      <div className="flex flex-col flex-1 p-6 pt-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h4 className="text-xl font-black tracking-tight text-ink">
              {venture.name}
            </h4>
            <p className="mt-1 text-sm text-ink-2">{venture.category}</p>
          </div>
          <Badge variant="lagoon" className="shrink-0">{VENTURE_RELATION}</Badge>
        </div>

        <a
          href={venture.website}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-digitalise-txt hover:gap-3 transition focus:outline-none focus-visible:ring-2 rounded self-start"
        >
          {venture.domain}
          <Icon name="arrow-up-right" size={16} />
          <span className="sr-only">— {t('work.visitLabel')}</span>
        </a>
      </div>
    </article>
  );
}
