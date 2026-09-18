import { Icon, Tag } from '@ds';
import { CLIENT_RELATION, VENTURE_RELATION } from '../../lib/brand';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * UNE COQUE, DEUX ADAPTATEURS — la carte de travail de la piste Conception.
 *
 * Le même dessin était écrit TROIS fois : l'aperçu client de `/conception`, le bloc des
 * ventures de la même page (le même JSX, au caractère près), et la carte de l'index des
 * réalisations. Les deux premiers ne se distinguaient que par le texte d'un `Tag`.
 *
 * ── POURQUOI CE N'EST PAS UNE SEULE CARTE AVEC UNE PROP `relation` ────────────────────
 *
 * Parce que `src/lib/brand/clients.ts` et `ventures.ts` interdisent formellement de
 * mélanger les deux objets : un projet CLIENT appartient à son client et n'ouvre droit qu'à
 * un rôle revendiqué ; une venture est DÉTENUE et opérée par MY ONOMA. Les deux mentions se
 * contredisent, et une page qui passerait la mauvaise publierait une revendication de
 * propriété sur le produit d'un tiers — sans qu'aucune porte du dépôt ne le voie.
 *
 * La coque est donc privée à ce module, et les deux seules portes d'entrée épinglent chacune
 * SA constante. Une page ne peut pas se tromper : le mauvais couple n'est pas exprimable.
 *
 * ── LES DÉCISIONS DE DESSIN, ET CE QU'ELLES REMPLACENT ────────────────────────────────
 *
 *  • LA CARTE ENTIÈRE EST LE LIEN. Les deux grilles de `/conception` posaient une cible de
 *    16 px en pied de carte : un lien de la largeur d'un pouce au bas d'un bloc de 300 px
 *    qui, lui, ne répondait à rien. C'est un vrai `<a href>` : il se copie, s'ouvre dans un
 *    onglet, s'annonce comme un lien.
 *  • UN SEUL LIBELLÉ D'APPEL. Deux libellés dans une carte-lien créent deux promesses pour
 *    une seule destination.
 *  • L'ICÔNE DIT OÙ ÇA MÈNE. `forward` pour une destination interne, `arrow-up-right` pour
 *    une sortie de site — la seule différence visible entre une fiche et un domaine tiers.
 *
 * ⚠️ AUCUNE CAPTURE D'ÉCRAN, ET AUCUN CHIFFRE. Les aperçus sont des captures générées à la
 * volée par un service tiers : une grille en déclencherait douze en parallèle, pour un budget
 * de premier écran de 900 Ko. L'aperçu se paie UNE FOIS, sur la fiche qu'on a demandée.
 * `ventures.ts` interdit par ailleurs nommément utilisateurs, revenus, traction, levée et
 * partenaires ; `clients.ts` interdit résultats, métriques et témoignages.
 *
 * ⚠️ AUCUN NAMESPACE LU ICI. Catégorie, description et libellé d'appel arrivent déjà traduits
 * de la page. C'est ce qui permet à la même carte d'être montée sur `/conception` (catalogue
 * `conception`) et sur `/conception/realisations` (catalogue `realisations`) sans qu'aucune
 * des deux routes ait à charger celui de l'autre — le piège que `components/agency/` a posé
 * une fois, et que `tests/unit/route-namespaces.test.ts` surveille maintenant.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

interface WorkCardProps {
  /** Déjà localisée par l'appelant pour une destination interne, complète pour un site tiers. */
  href: string;
  /** Sortie de site : nouvel onglet, `rel` de sécurité, et l'autre icône. */
  external?: boolean;
  /** `CLIENT_RELATION` ou `VENTURE_RELATION` — épinglée par l'adaptateur, jamais par la page. */
  relation: string;
  name: string;
  /** Catégorie ou descripteur de marché. */
  meta: string;
  /** Libellé d'appel, déjà traduit. */
  cta: string;
  /** Description validée, déjà traduite. Absente quand le dépôt n'en porte pas. */
  description?: string;
  /** Relevée dans le dépôt du projet. Tronquée, pas résumée — voir plus bas. */
  stack?: readonly string[];
  domain?: string;
}

/** La coque. Privée au module : c'est elle qui rend impossible le mauvais couple. */
function WorkCard({ href, external, relation, name, meta, cta, description, stack, domain }: WorkCardProps) {
  return (
    <article className="h-full">
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        /* `rounded-card` — le rayon que le kit destine aux cartes et panneaux (`--r-l`).
           PAS `rounded-2xl` : les défauts de Tailwind survivent sous `extend`, et celui-là
           rend 16 px là où le kit en veut 30 — un écart qu'aucune porte ne signale. */
        className="group mm-press flex h-full flex-col rounded-card border border-[color:var(--line)] bg-[color:var(--fill-1)] p-6 no-underline transition-colors hover:border-[color-mix(in_srgb,var(--mm-corail)_46%,transparent)] focus:outline-none"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="mm-eyebrow m-0 text-corail-txt">{meta}</p>
          <Tag tone="neutral">{relation}</Tag>
        </div>

        <h3 className="mt-3 font-display text-[22px] font-black tracking-[-.03em] text-ink transition-colors group-hover:text-corail-txt">
          {name}
        </h3>

        {description && (
          <p className="mt-2 mb-0 text-[14.5px] leading-[1.55] text-ink-2">{description}</p>
        )}

        {stack && stack.length > 0 && (
          /*
            LA STACK EST TRONQUÉE, PAS RÉSUMÉE. Quatre entrées tiennent sur deux lignes à
            390 px ; au-delà, la carte s'allonge et la grille perd son peigne. Le reste n'est
            pas caché : la fiche l'affiche en entier, et c'est ce que la carte promet.
          */
          <p className="mt-4 mb-0 text-[13px] leading-[1.5] text-ink-2">
            {stack.slice(0, 4).join(' · ')}
            {stack.length > 4 && ' …'}
          </p>
        )}

        {domain && <p className="mt-3 mb-0 text-meta text-ink-2">{domain}</p>}

        <span className="mt-auto inline-flex items-center gap-2 pt-5 text-meta font-bold text-corail-txt">
          {cta}
          <Icon name={external ? 'arrow-up-right' : 'forward'} size={16} />
        </span>
      </a>
    </article>
  );
}

interface ClientWorkCardProps {
  /** Adresse de la fiche, déjà localisée par l'appelant. */
  href: string;
  name: string;
  /** Déjà traduite — `shared:realisations.categories.*`, seule source des sept libellés. */
  category: string;
  cta: string;
  description?: string;
  stack?: readonly string[];
  domain?: string;
}

/**
 * Un produit construit POUR un client. La mention « Client product » annonce un RÔLE tenu,
 * jamais une propriété, et ne cohabite jamais avec celle des ventures.
 */
export function ClientWorkCard({ href, name, category, cta, description, stack, domain }: ClientWorkCardProps) {
  return (
    <WorkCard
      href={href}
      relation={CLIENT_RELATION}
      name={name}
      meta={category}
      cta={cta}
      description={description}
      stack={stack}
      domain={domain}
    />
  );
}

interface VentureWorkCardProps {
  /** Le site du produit : un domaine à lui, hors de maxmorrys.me. */
  href: string;
  name: string;
  /**
   * Descripteur de marché, écrit en anglais dans les données et rendu tel quel : le traduire
   * en ferait une promesse.
   */
  category: string;
  cta: string;
  domain: string;
}

/**
 * Un produit DÉTENU et opéré par MY ONOMA. Il vit sur son propre domaine : la carte sort donc
 * du site, dans un nouvel onglet.
 */
export function VentureWorkCard({ href, name, category, cta, domain }: VentureWorkCardProps) {
  return (
    <WorkCard
      href={href}
      external
      relation={VENTURE_RELATION}
      name={name}
      meta={category}
      cta={cta}
      domain={domain}
    />
  );
}
