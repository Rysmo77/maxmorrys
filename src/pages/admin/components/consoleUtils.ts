import type { AdminSpace } from '../../../lib/admin/consoleNav';
import type { ConsoleStatusTone } from '../../../components/console';

/** La pastille de chaque espace, aux teintes de territoire du kit (jamais en dur). */
export const SPACE_DOT: Record<AdminSpace, string> = {
  hub: 'linear-gradient(135deg, var(--mm-bleu-f), var(--mm-orange-f))',
  edu: 'var(--mm-bleu-f)',
  club: 'var(--mm-violet-f)',
  conception: 'var(--mm-teal-f)',
  rysmo: 'var(--mm-orange-f)',
};

/** Le ton du statut `mm-st` qui nomme un espace (maquette : Edu bleu, Club violet…). */
export const SPACE_TONE: Record<AdminSpace, ConsoleStatusTone> = {
  hub: 'mute', edu: 'info', club: 'club', conception: 'ok', rysmo: 'warn',
};

export type SpaceFilterValue = AdminSpace | 'all';

/** Les libellés du filtre d'espace, fournis par la page (chaque route a son namespace). */
export interface SpaceLabels {
  group: string;
  all: string;
  spaces: Record<AdminSpace, string>;
}

/**
 * Construit les libellés du filtre depuis la fonction `t` de la page. `base` vaut
 * `console` dans le namespace `admin`, `console.common` dans `ecrans`.
 */
export function spaceLabels(t: (key: string) => string, base: string): SpaceLabels {
  return {
    group: t(`${base}.spacesLabel`),
    all: t(`${base}.spaces.all`),
    spaces: {
      hub: t(`${base}.spaces.hub`),
      edu: t(`${base}.spaces.edu`),
      club: t(`${base}.spaces.club`),
      conception: t(`${base}.spaces.conception`),
      rysmo: t(`${base}.spaces.rysmo`),
    },
  };
}

/** L'âge d'un élément, à la façon de la maquette : « 6 h », « 2 j ». `null` si la date manque. */
export function ageOf(iso: string | undefined | null, now: Date, lang: string): string | null {
  if (!iso) return null;
  const ms = now.getTime() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return '< 1 h';
  if (h < 48) return `${h} h`;
  return `${Math.floor(h / 24)} ${lang.startsWith('en') ? 'd' : 'j'}`;
}

/** Initiales d'un nom, pour `mm-avatar`. */
export function initialsOf(name: string): string {
  return name.split(/\s+/).filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
}
