import type { ReactNode } from 'react';
import { Icon, Num, type IconName } from '@ds';
import { CLUB_PRICE_XOF, clubReferralPrice } from '../../lib/club/pricing';
import type { ClubPostCategory } from '../../types';

/**
 * LES PIÈCES DES TROIS PAGES PUBLIQUES DU CLUB — passe 2, lot C.
 *
 * Accueil (`ClubDigitos`, namespace `club`), Sessions et Adhésion (namespace `ecrans`) ne
 * partagent pas de catalogue : `App.tsx` déclare un namespace par route et la garde
 * `route-namespaces` refuse qu'une page en lise un autre. Ces pièces prennent donc leur
 * COPIE en props — elles ne portent que la mise en page des maquettes (`Club-*.dc.html`)
 * et les nombres, tirés des modules qui les portent (`lib/club/pricing`).
 */

/** Le haut d'une page publique : la barre est fixe, le héros commence dessous. */
export const HERO_TOP = { paddingTop: 'calc(var(--header-h) + 56px)' } as const;

/**
 * Les six catégories RÉELLES d'une publication du Club (`ClubPostCategory`). Les maquettes
 * montrent des « cercles » (`#seo-local`, `#ads`…) : ils n'existent ni en base ni dans les
 * règles. Ce qui range réellement une publication, ce sont ces catégories — on montre donc
 * celles-là, avec la teinte que le fil leur donne déjà.
 */
export const CLUB_PUBLIC_CATEGORIES: { id: ClubPostCategory; icon: IconName; tint: string }[] = [
  { id: 'general', icon: 'comment', tint: 'var(--mm-violet)' },
  { id: 'question', icon: 'info', tint: 'var(--mm-bleu)' },
  { id: 'ressource', icon: 'book', tint: 'var(--mm-teal)' },
  { id: 'temoignage', icon: 'star', tint: 'var(--mm-orange)' },
  { id: 'opportunite', icon: 'case', tint: 'var(--mm-corail)' },
  { id: 'discussion', icon: 'chat', tint: 'var(--ok)' },
];

/** Une catégorie en pastille (gabarit des pastilles de cercle des maquettes). */
export function CategoryChip({ label, icon, tint }: { label: string; icon: IconName; tint: string }) {
  return (
    <span className="inline-flex h-8 items-center gap-1.5 rounded-pill border border-[color:var(--line)] bg-bento pl-[5px] pr-3 text-[12.5px] font-semibold text-ink">
      <span aria-hidden="true" className="grid h-[22px] w-[22px] place-items-center rounded-xs text-[color:var(--paper-fixed)]" style={{ background: tint }}>
        <Icon name={icon} size={12} />
      </span>
      {label}
    </span>
  );
}

/** La pastille cochée d'une ligne de liste (carte de prix, adhésion). */
export function CheckDot({ muted = false }: { muted?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="grid h-[22px] w-[22px] flex-none place-items-center rounded-pill"
      style={muted
        ? { border: '1.5px dashed var(--ink-3)', color: 'var(--ink-3)' }
        : { background: 'color-mix(in srgb, var(--mm-violet) 12%, transparent)', color: 'var(--mm-violet)' }}
    >
      <Icon name={muted ? 'clock' : 'check'} size={12} />
    </span>
  );
}

export interface PriceCardCopy {
  title: string;
  tag: string;
  perYear: string;
  /** « soit {{monthly}} F par mois · payé une fois » — le nombre est rendu à part. */
  monthlyPre: string;
  monthlyPost: string;
  referralPost: string;
  items: string[];
  note: string;
}

/**
 * LA CARTE DE PRIX (`mm-price`) — Accueil et Adhésion. Le mensuel est l'annuel divisé par
 * douze, et la carte le dit : rien n'est débité chaque mois. Le prix parrainé vient de
 * `clubReferralPrice()`, jamais d'une chaîne.
 */
export function PriceCard({ copy, asOf, children }: { copy: PriceCardCopy; asOf: Date; children: ReactNode }) {
  const monthly = Math.round(CLUB_PRICE_XOF / 12);
  return (
    <div className="mm-price" style={{ background: 'var(--bento)' }}>
      <div className="flex items-center justify-between gap-3">
        <b className="text-[15px] text-ink">{copy.title}</b>
        <span className="mm-tag is-club">{copy.tag}</span>
      </div>
      <p className="m-0 mb-1 mt-4 flex flex-wrap items-baseline gap-2.5">
        <b className="font-display text-[44px] leading-none tracking-[-.05em] text-ink stack:text-[58px]">
          <Num value={CLUB_PRICE_XOF} unit="F" source="server" asOf={asOf} />
        </b>
        <span className="text-ink-2">{copy.perYear}</span>
      </p>
      <p className="m-0 text-[14px] leading-[1.5] text-ink-2">
        {copy.monthlyPre} <Num value={monthly} unit="F" source="server" asOf={asOf} /> {copy.monthlyPost}
        <br />
        <Num value={clubReferralPrice()} unit="F" source="server" asOf={asOf} /> {copy.referralPost}
      </p>
      {copy.items.length > 0 && (
        <ul className="m-0 mb-[22px] mt-5 list-none p-0">
          {copy.items.map((item) => (
            <li key={item} className="flex items-start gap-2.5 py-[7px] text-[14.5px] text-ink">
              <CheckDot />
              {item}
            </li>
          ))}
        </ul>
      )}
      {children}
      <span className="mt-3 block text-center text-[12.5px] text-ink-3">{copy.note}</span>
    </div>
  );
}

/** Le cartouche de date d'une session (`JEU / 29 / OCT`), en violet pâle. */
export function DateBlock({ date, locale }: { date: Date; locale: string }) {
  return (
    <div
      className="flex h-[76px] w-[76px] flex-none flex-col items-center justify-center rounded-m"
      style={{ background: 'color-mix(in srgb, var(--mm-violet) 10%, transparent)' }}
    >
      <span className="text-[10.5px] font-semibold uppercase text-transforme">
        {date.toLocaleDateString(locale, { weekday: 'short' }).replace('.', '')}
      </span>
      <b className="text-[28px] leading-[1.05] tracking-[-.04em] text-ink">{date.getDate()}</b>
      <span className="text-[10.5px] font-semibold uppercase text-ink-2">
        {date.toLocaleDateString(locale, { month: 'short' }).replace('.', '')}
      </span>
    </div>
  );
}

/**
 * LE CALENDRIER FERMÉ — Accueil et Sessions.
 *
 * Les maquettes affichent trois dates « d'exemple ». Les sessions vivent dans `club_sessions`,
 * dont la lecture est réservée aux membres par `firestore.rules` : une page publique ne peut
 * donc rien en lire. Elle le dit, et montre à la place ce qui est publié pour tous — le
 * relevé des sessions tenues (`public_stats/club`), ou « non relevé » s'il n'existe pas.
 */
export function SessionsClosed({
  title, body, heldPre, held, heldAsOf, asOf, action,
}: {
  title: string;
  body: string;
  heldPre: string;
  held: number | null;
  heldAsOf: Date | null;
  asOf: Date;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-card border border-[color:var(--line)] bg-bento p-5 stack:p-6">
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="grid h-[52px] w-[52px] flex-none place-items-center rounded-m text-transforme"
          style={{ background: 'color-mix(in srgb, var(--mm-violet) 10%, transparent)' }}
        >
          <Icon name="lock" size={22} />
        </span>
        <div className="min-w-0">
          <b className="block text-[17px] leading-[1.25] text-ink">{title}</b>
          <p className="m-0 mt-1.5 text-[14px] leading-[1.55] text-ink-2">{body}</p>
          {/* Le relevé ne s'affiche que s'il dit quelque chose : « 0 » ou « non relevé » publiés
              en vitrine se lisaient comme une preuve sociale à zéro (audit 29/10/2026, #13).
              Aucune date de session n'est lisible publiquement (`club_sessions` = membres). */}
          {held !== null && held > 0 && (
            <p className="m-0 mt-3 text-[13px] text-ink-2">
              {heldPre}{' '}
              <Num value={held} source="server" asOf={heldAsOf ?? asOf} showAsOf={heldAsOf !== null} />
            </p>
          )}
        </div>
      </div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
