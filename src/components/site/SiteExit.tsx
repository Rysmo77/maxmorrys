import type { ReactNode } from 'react';
import { Button } from '@ds';

/**
 * LA PORTE DE SORTIE D'UNE PAGE — une question, une phrase, un bouton.
 *
 * Elle existait deux fois, écrite à la main de deux façons : une rangée `SiteDisplay` +
 * bouton `quiet` en bas d'`/apprendre`, un panneau titre/corps/bouton `primary` en bas d'une
 * fiche de réalisation. Même geste, deux dessins, deux poids — et surtout **trois pages de la
 * piste Conception qui n'en avaient aucune** : `/conception` se terminait sur le pont My
 * Onoma, c'est-à-dire sur un lien SORTANT du site, au bas de la page mère de la piste la plus
 * chère du catalogue.
 *
 * ── POURQUOI LE TON N'EST PAS UNE PROP ────────────────────────────────────────────────────
 * Parce que c'était exactement là que la divergence naissait. `primary` ici vaut `--ink`
 * (`tokens/semantic.css`) : ce n'est pas un ton de vente, c'est « l'étape principale de cette
 * page ». Une sortie de page EST cette étape, sur toutes les pages, ou alors elle n'est pas
 * une sortie. Le jour où l'on veut l'alléger partout, c'est une ligne — ici.
 *
 * ── ELLE NE LIT AUCUN NAMESPACE ───────────────────────────────────────────────────────────
 * Les quatre chaînes arrivent déjà traduites et l'adresse déjà localisée. C'est ce qui lui
 * permet d'être montée sur des pages qui vouvoient comme sur des pages qui tutoient, sans
 * qu'aucune route n'ait à déclarer un namespace de plus (`tests/unit/route-namespaces.test.ts`).
 */

interface SiteExitProps {
  /** Déjà traduit. `ReactNode` pour laisser passer un `SiteDisplay` là où la page en veut un. */
  title: ReactNode;
  /** Déjà traduit. */
  body: string;
  /** Déjà traduit. */
  cta: string;
  /** Déjà localisé par l'appelant — `useLocalizedPath()`. */
  href: string;
}

export function SiteExit({ title, body, cta, href }: SiteExitProps) {
  /*
   * KIT V3 — LA BANDE « RÉSERVER UN APPEL » (`BookCallBand` des maquettes `Site-*`).
   * Une dalle de nuit, encartée, à maillage lent ; le titre en Fraunces à gauche, l'action
   * à droite. Le ton reste `primary` (voir plus haut, et `sortie-contact.test.ts`) : sous la
   * portée `.dk`, il bascule en pilule claire sur la nuit — le bouton par défaut du kit sur
   * une dalle sombre. Le sombre est une portée, jamais une prop (AD-3).
   */
  return (
    <aside className="dk rv relative isolate mt-10 overflow-hidden rounded-xl bg-night text-ink">
      <div aria-hidden="true" className="mm-mesh m-hub">
        <b />
        <b />
        <b />
      </div>
      {/* VOILE DE LECTURE (audit 29/10/2026) : sous le texte, le maillage bleu ne laissait au
          blanc qu'un fond gris-bleu moyen. Le voile assombrit la moitié gauche — celle du
          titre — et laisse respirer le maillage à droite, derrière le bouton. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(90deg,color-mix(in_srgb,var(--night)_78%,transparent)_0%,color-mix(in_srgb,var(--night)_55%,transparent)_60%,color-mix(in_srgb,var(--night)_25%,transparent)_100%)]"
      />
      <div className="relative flex flex-wrap items-center justify-between gap-6 px-6 py-9 stack:px-12 stack:py-14">
        <div className="min-w-0 flex-1 basis-[280px]">
          <p className="m-0 font-display text-[clamp(26px,3.4vw,40px)] font-black leading-[.95] tracking-[-.035em] text-ink">
            {title}
          </p>
          <p className="mt-3 mb-0 max-w-[52ch] text-[15px] leading-[1.55] text-ink-2">{body}</p>
        </div>
        {/* LA PASTILLE-FLÈCHE : sous `.dk`, la pilule passe en clair (#ECF0F5) mais la
            pastille garde `--paper` (blanc) et l'encre `--ink` (claire) — flèche claire sur
            disque blanc, invisible. On la pose en sombre, flèche claire, sur cette dalle. */}
        <Button
          href={href}
          tone="primary"
          arrow
          fullWidth={false}
          className="[&_.mm-btn\_\_arrow]:bg-[var(--text-on-primary)] [&_.mm-btn\_\_arrow]:text-ink"
        >
          {cta}
        </Button>
      </div>
    </aside>
  );
}
