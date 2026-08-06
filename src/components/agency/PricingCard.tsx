import type { LucideIcon } from 'lucide-react';
import { Check, MessageCircle, CheckCircle2 } from 'lucide-react';
import { universeThemes } from '../../lib/sectionThemes';

const theme = universeThemes.agency;

export interface PricingCardProps {
  icon: LucideIcon;
  name: string;
  tagline: string;
  /** Montant principal, déjà formaté (ex. « 495 000 FCFA ») */
  price: string;
  /** Libellé au-dessus du montant (ex. « Mise en place ») */
  priceLabel: string;
  /** Ligne secondaire : mensualité, promo, ou total d'engagement */
  secondaryPrice?: string;
  features: string[];
  /** Note en bas de carte : prérequis, exclusions */
  note?: string;
  ctaLabel: string;
  onSelect: () => void;
  /** Offre principale du catalogue — signal éditorial, indépendant de l'utilisateur */
  featured?: boolean;
  /** Conseillé par le sélecteur en 3 questions */
  recommended?: boolean;
  /** Retenu par l'utilisateur, dans le formulaire — peut différer du conseil */
  selected?: boolean;
  featuredLabel?: string;
  recommendedLabel?: string;
  selectedLabel?: string;
  /** Lien wa.me pré-rempli pour la conversation directe */
  whatsappHref?: string;
  whatsappLabel?: string;
}

/**
 * Carte tarifaire commune aux packs de mise en place et aux formules d'accompagnement.
 *
 * Trois signaux visuels distincts, et tous les trois sincères :
 *   - `featured`     — l'offre que je mets en avant (éditorial, fixe)
 *   - `recommended`  — ce que le sélecteur te conseille
 *   - `selected`     — ce que TU as retenu
 * `recommended` et `selected` peuvent porter sur deux cartes différentes : c'est
 * informatif, pas contradictoire. `selected` prime visuellement — c'est la décision.
 *
 * Les montants sont en `tabular-nums whitespace-nowrap` : « 495 000 FCFA » ne doit jamais
 * se couper en fin de ligne sur un écran de 360 px, sous peine d'être illisible.
 */
export default function PricingCard({
  icon: Icon, name, tagline, price, priceLabel, secondaryPrice, features, note,
  ctaLabel, onSelect, featured, recommended, selected,
  featuredLabel, recommendedLabel, selectedLabel,
  whatsappHref, whatsappLabel,
}: PricingCardProps) {
  const highlighted = selected || recommended || featured;
  const badge = selected ? selectedLabel
    : recommended ? recommendedLabel
    : featured ? featuredLabel
    : undefined;

  return (
    <div
      className={`relative flex flex-col p-7 sm:p-8 rounded-3xl border transition-shadow ${
        selected
          ? 'border-lagoon-600 dark:border-lagoon-400 bg-white dark:bg-neutral-800 ring-2 ring-lagoon-600/40 shadow-lg'
          : recommended
            ? 'border-lagoon-500 dark:border-lagoon-400 bg-white dark:bg-neutral-800 ring-2 ring-lagoon-500/25 shadow-lg'
            : featured
              ? 'border-lagoon-300 dark:border-lagoon-700 bg-white dark:bg-neutral-800 shadow-lg shadow-lagoon-500/5'
              : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800'
      }`}
    >
      {badge && (
        // Aplat lagoon-500 + texte foncé : la signature visuelle de l'univers Agence (8,1:1).
        <span className={`absolute -top-3 left-7 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${theme.signatureFill}`}>
          {selected && <CheckCircle2 className="w-3 h-3" aria-hidden="true" />}
          {badge}
        </span>
      )}

      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-5 ${
        highlighted ? 'bg-lagoon-100 dark:bg-lagoon-900/40' : 'bg-neutral-100 dark:bg-neutral-700'
      }`}>
        <Icon className={`w-5 h-5 ${theme.accentText}`} aria-hidden="true" />
      </div>

      <h3 className="text-2xl font-black text-neutral-900 dark:text-white mb-1">{name}</h3>
      <p className="text-sm text-neutral-500 mb-6">{tagline}</p>

      <div className="mb-6 pb-6 border-b border-neutral-200 dark:border-neutral-700">
        <p className="text-xs font-bold tracking-widest uppercase text-neutral-400 mb-1">{priceLabel}</p>
        <p className="text-3xl font-black text-neutral-900 dark:text-white tabular-nums whitespace-nowrap">
          {price}
        </p>
        {secondaryPrice && (
          <p className={`text-sm font-semibold mt-2 tabular-nums ${theme.accentText}`}>{secondaryPrice}</p>
        )}
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {features.map((f) => (
          <li key={f} className="flex gap-2.5 text-sm text-neutral-700 dark:text-neutral-300">
            <Check className="w-4 h-4 text-lagoon-600 dark:text-lagoon-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {note && <p className="text-xs text-neutral-500 italic mb-4">{note}</p>}

      <div className="space-y-2.5">
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          className={`w-full inline-flex items-center justify-center px-6 py-3 rounded-full font-bold text-sm transition-colors ${
            highlighted
              ? theme.buttonSolid
              : 'border border-neutral-300 dark:border-neutral-600 text-neutral-800 dark:text-neutral-200 hover:border-lagoon-500 hover:text-lagoon-700 dark:hover:text-lagoon-400'
          }`}
        >
          {ctaLabel}
        </button>

        {/* Voie express : le commerçant qui ne veut rien remplir part directement
            en conversation, avec le contexte du pack cliqué déjà dans le message. */}
        {whatsappHref && whatsappLabel && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-semibold text-xs text-neutral-600 dark:text-neutral-400 hover:text-lagoon-700 dark:hover:text-lagoon-400 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
            {whatsappLabel}
          </a>
        )}
      </div>
    </div>
  );
}
