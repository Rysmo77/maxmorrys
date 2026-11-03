/**
 * « À VENIR » — LA règle unique du Club (audit UI/UX du 03/11/2026, C2 et X10).
 *
 * Le champ `status` d'un événement ou d'une session est posé à la main dans la console et
 * n'est jamais remis à jour : deux sessions de février et d'avril 2026 s'annonçaient encore
 * « Prochaine session » en novembre, pendant que la console (qui lit la date) les disait
 * « tenues » et que /live répondait qu'aucune session n'était programmée. Trois écrans, trois
 * vérités.
 *
 * Désormais une échéance est « à venir » si et seulement si :
 *   · son statut ne la ferme pas (passée, tenue, annulée) ;
 *   · sa date réelle est lisible ;
 *   · elle n'est pas terminée — début + fenêtre de déroulement > maintenant.
 *
 * Agenda, fil (carte `mm-feature`), bandeau `Ticker`, panneau « À venir », /live et les
 * boutons d'inscription passent TOUS par ici. Module pur, sans import : il est testé dans
 * `tests/unit/club-schedule.test.ts`.
 */

/** Une session est « en cours » de son heure de début à trois heures après. */
export const CLUB_LIVE_WINDOW_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Les statuts qui ferment une échéance, quelle que soit sa date. */
const CLOSED_STATUSES = new Set(['past', 'held', 'done', 'completed', 'cancelled', 'canceled', 'tenue', 'annulee', 'annulée', 'passee', 'passée']);

export function isClosedStatus(status: string | undefined | null): boolean {
  return Boolean(status) && CLOSED_STATUSES.has(String(status).toLowerCase());
}

/** Début d'une session (`scheduledAt` ISO). `NaN` si illisible. */
export function clubSessionStart(scheduledAt: string | undefined | null): number {
  return scheduledAt ? Date.parse(scheduledAt) : NaN;
}

/**
 * Début d'un événement. La console écrit `date` en `AAAA-MM-JJ` et `time` en `HH:MM`, à part ;
 * une date ISO complète est aussi acceptée. Sans heure, l'événement court toute la journée.
 */
export function clubEventStart(date: string | undefined | null, time?: string | null): number {
  if (!date) return NaN;
  const dayOnly = /^\d{4}-\d{2}-\d{2}$/.test(date);
  if (dayOnly) {
    const hm = time && /^\d{1,2}:\d{2}$/.test(time.trim()) ? time.trim().padStart(5, '0') : '00:00';
    return new Date(`${date}T${hm}:00`).getTime();
  }
  return Date.parse(date);
}

/** Durée pendant laquelle un événement reste ouvert après son début. */
export function clubEventWindow(date: string | undefined | null, time?: string | null): number {
  const dayOnly = Boolean(date && /^\d{4}-\d{2}-\d{2}$/.test(date));
  const hasTime = Boolean(time && /^\d{1,2}:\d{2}$/.test(time.trim()));
  return dayOnly && !hasTime ? DAY_MS : CLUB_LIVE_WINDOW_MS;
}

/** LA fonction : une échéance est-elle encore à venir (ou en cours) ? */
export function isClubUpcoming(
  status: string | undefined | null,
  startAt: number,
  now: number = Date.now(),
  windowMs: number = CLUB_LIVE_WINDOW_MS,
): boolean {
  if (isClosedStatus(status)) return false;
  if (!Number.isFinite(startAt)) return false;
  return now < startAt + windowMs;
}

export function isClubSessionUpcoming(
  session: { status?: string | null; scheduledAt?: string | null },
  now: number = Date.now(),
): boolean {
  return isClubUpcoming(session.status, clubSessionStart(session.scheduledAt), now, CLUB_LIVE_WINDOW_MS);
}

export function isClubEventUpcoming(
  event: { status?: string | null; date?: string | null; time?: string | null },
  now: number = Date.now(),
): boolean {
  return isClubUpcoming(event.status, clubEventStart(event.date, event.time), now, clubEventWindow(event.date, event.time));
}

/** Une session a-t-elle commencé sans être terminée ? (badge « en direct » de /live) */
export function isClubSessionLive(
  session: { status?: string | null; scheduledAt?: string | null },
  now: number = Date.now(),
): boolean {
  const at = clubSessionStart(session.scheduledAt);
  return isClubSessionUpcoming(session, now) && at <= now;
}

/**
 * Options de date : l'année n'apparaît que si elle diffère de l'année courante — « samedi
 * 21 février » sans année, lu en novembre, laissait croire à février prochain.
 */
export function clubDateOptions(
  at: number,
  base: Intl.DateTimeFormatOptions,
  now: number = Date.now(),
  timeZone?: string,
): Intl.DateTimeFormatOptions {
  const yearOf = (ms: number) =>
    Number(new Intl.DateTimeFormat('en-US', { year: 'numeric', ...(timeZone ? { timeZone } : {}) }).format(ms));
  if (!Number.isFinite(at)) return base;
  return yearOf(at) === yearOf(now) ? base : { ...base, year: 'numeric' };
}
