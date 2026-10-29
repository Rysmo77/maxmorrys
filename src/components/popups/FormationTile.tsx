import TranslatedText from '../shared/TranslatedText';
import { PriceApprox } from '../shared/PriceApprox';
import { useFormat } from '../../hooks/useFormat';
import type { Formation } from '../../types';

/**
 * La fiche d'une formation dans une pop-up : couverture, titre, prix cadré.
 *
 * Partagée par la reprise de panier et la découverte, qui la recopiaient chacune.
 *
 * ⚠️ NI NOTE NI NOMBRE D'INSCRITS — interdit absolu du kit (« Pas de preuve sociale
 * inventée »), réintroduit et retiré quatre fois ; `tests/unit/interdits-preuve-sociale.test.ts`
 * le garde. Reste ce qui se prouve : le prix, barré s'il y a une promotion, et sa contrevaleur.
 */
export default function FormationTile({ formation }: { formation: Formation }) {
  const { formatPrice } = useFormat();
  const price = formation.promoPrice ?? formation.price;
  const hasPromo = formation.promoPrice != null && formation.promoPrice < formation.price;

  return (
    <div className="mt-4 flex items-center gap-3.5 rounded-[18px] border border-[color:var(--line)] bg-[color:var(--bento-2)] p-3 wide:mt-6">
      <span className="block h-14 w-14 shrink-0 overflow-hidden rounded-[12px] wide:h-[72px] wide:w-[72px]">
        <img src={formation.coverImage} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
      </span>
      <div className="min-w-0 flex-1">
        <TranslatedText text={formation.title} as="p" className="m-0 line-clamp-2 text-[14.5px] font-bold leading-snug text-ink" />
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-[12.5px] text-ink-2">
          <span className="text-[14px] font-bold tabular-nums text-ink">{formatPrice(price)}</span>
          {hasPromo && <span className="tabular-nums line-through">{formatPrice(formation.price)}</span>}
          <PriceApprox xof={price} />
        </div>
      </div>
    </div>
  );
}
