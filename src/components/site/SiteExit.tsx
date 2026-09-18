import type { ReactNode } from 'react';
import { Button, GlassPanel } from '@ds';

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
  return (
    <GlassPanel
      level="flat"
      padding={24}
      as="aside"
      className="rv mt-10 flex flex-wrap items-start justify-between gap-5"
    >
      <div className="min-w-0 flex-1 basis-[260px]">
        <p className="m-0 font-display text-[18px] font-black tracking-[-.03em] text-ink">{title}</p>
        <p className="mt-2 mb-0 text-[14.5px] leading-[1.55] text-ink-2">{body}</p>
      </div>
      <Button href={href} tone="primary" size="sm" fullWidth={false}>
        {cta}
      </Button>
    </GlassPanel>
  );
}
