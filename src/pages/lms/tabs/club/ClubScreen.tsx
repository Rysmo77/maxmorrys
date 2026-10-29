import type { ReactNode } from 'react';
import { Icon } from '@ds';
import LocalizedLink from '../../../../components/shared/LocalizedLink';

/**
 * LE GABARIT D'UN ÉCRAN CONNECTÉ DU CLUB — maquettes `Club-*.dc.html`, passe 2, lot C.
 *
 * Les maquettes posent trois colonnes : rail d'icônes · contenu · rail des CERCLES. Le rail
 * d'icônes appartient à la coquille (`StudentLayout`, espace `club`, prop `rail`) ; ce
 * gabarit porte les deux autres — l'en-tête de l'écran (`mm-dash__top`) et le rail des
 * cercles (`mm-circles`), à droite à partir de 1080 px.
 *
 * LE RAIL DES CERCLES EST VIDE, et le dit : les cercles thématiques n'existent ni en base ni
 * dans les règles (doc 04 du kit : « créés par l'administration du Club »). Il garde sa place
 * dans la composition, porte son titre et une case en pointillés NON cliquable — un bouton
 * « rejoindre un cercle » qui n'écrirait rien serait une fausse action.
 *
 * Les libellés arrivent en props : le gabarit sert le Club (namespace `club`) et les écrans
 * neufs (namespace `ecrans`), et la garde `route-namespaces` interdit qu'un écran lise un
 * namespace que sa route ne déclare pas.
 */
export interface ClubScreenProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Actions à droite de l'en-tête (rafraîchir, statut…). */
  actions?: ReactNode;
  /** Ligne au-dessus du titre (retour, fil d'Ariane). */
  above?: ReactNode;
  circlesLabel: string;
  circlesEmpty: string;
  children: ReactNode;
}

export function ClubScreen({ title, subtitle, actions, above, circlesLabel, circlesEmpty, children }: ClubScreenProps) {
  return (
    <div className="grid items-start gap-4 wide:grid-cols-[minmax(0,1fr)_76px]">
      <div className="mm-dash__main">
        {above}
        <header className="mm-dash__top flex-wrap !items-end">
          <div className="min-w-0">
            <h1 className="!text-[30px] text-ink wide:!text-[44px]">{title}</h1>
            {subtitle && <span className="mt-1.5 block text-[13.5px] text-ink-2">{subtitle}</span>}
          </div>
          {actions && <div className="ml-auto flex flex-none items-center gap-2.5">{actions}</div>}
        </header>
        {children}
      </div>
      <aside className="mm-circles !hidden wide:!flex" aria-label={circlesLabel}>
        <span className="text-[9.5px] font-semibold uppercase tracking-[.1em] text-ink-3">{circlesLabel}</span>
        <span
          className="grid h-[42px] w-[42px] place-items-center rounded-xs border-[1.5px] border-dashed border-[color:var(--ink-3)] text-ink-3"
          title={circlesEmpty}
        >
          <Icon name="plus" size={16} />
          <span className="sr-only">{circlesEmpty}</span>
        </span>
      </aside>
    </div>
  );
}

/** La carte « Tes cercles » de la colonne droite du fil — vide, honnêtement. */
export function CirclesCard({ title, body }: { title: string; body: string }) {
  return (
    <section className="mm-card !p-5">
      <h3 className="!text-[18px] text-ink">{title}</h3>
      <div className="mt-3.5 flex items-start gap-3">
        <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-xs border-[1.5px] border-dashed border-[color:var(--ink-3)] text-ink-3" aria-hidden="true">
          <Icon name="plus" size={14} />
        </span>
        <p className="m-0 text-[13px] leading-[1.5] text-ink-2">{body}</p>
      </div>
    </section>
  );
}

/** Ce qu'un écran du Club montre à un compte sans adhésion active : le chemin vers le mur. */
export function ClubLocked({ title, body, cta, to }: { title: string; body: string; cta: string; to: string }) {
  return (
    <div className="mm-card mx-auto mt-6 max-w-[560px] !p-[34px]">
      <span
        aria-hidden="true"
        className="grid h-[52px] w-[52px] place-items-center rounded-m text-transforme"
        style={{ background: 'color-mix(in srgb, var(--mm-violet) 12%, transparent)' }}
      >
        <Icon name="lock" size={22} />
      </span>
      <h1 className="mm-d mb-2 mt-[18px] text-[30px] text-ink">{title}</h1>
      <p className="m-0 mb-[18px] text-ink-2">{body}</p>
      <LocalizedLink className="mm-btn-club w-full" to={to}>{cta}</LocalizedLink>
    </div>
  );
}
