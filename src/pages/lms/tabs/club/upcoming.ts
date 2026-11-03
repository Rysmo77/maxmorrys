import type { IconName } from '@ds';
import type { useClubData } from '../../hooks/useClubData';
import { clubDateOptions, clubEventStart, clubSessionStart, isClubEventUpcoming, isClubSessionUpcoming } from './schedule';

type ClubData = ReturnType<typeof useClubData>;

export interface ClubUpcomingItem {
  id: string;
  at: number;
  title: string;
  meta: string;
  glyph: IconName;
  gradient: string;
  registered: boolean;
}

/**
 * Les événements et les sessions À VENIR (règle unique : `./schedule`, date réelle ET statut), fusionnés et triés par échéance. Exporté parce que
 * la bande « en direct » de l'accueil du Club lit la même liste : deux calculs de « ce qui
 * vient » finiraient par ne pas annoncer la même chose.
 */
export function clubUpcoming(data: ClubData, t: (key: string) => string, locale: string, now: number = Date.now()): ClubUpcomingItem[] {
  const { clubEvents, clubSessions, registeredEvents, registeredSessions } = data;
  const when = (at: number, time?: string) => {
    const d = new Date(at);
    if (Number.isNaN(d.getTime())) return time ?? '';
    // L'année n'est écrite que si elle n'est pas l'année courante (audit C2).
    const day = d.toLocaleDateString(locale, clubDateOptions(at, { weekday: 'long', day: 'numeric', month: 'long' }, now));
    const hour = time ?? d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    return `${day} · ${hour}`;
  };
  return [
    ...clubEvents
      .filter((e) => isClubEventUpcoming(e, now))
      .map((e) => ({
        id: `e-${e.id}`,
        at: clubEventStart(e.date, e.time),
        title: e.title,
        meta: `${when(clubEventStart(e.date, e.time), e.time)} · ${e.type === 'online' ? t('events.online') : e.location}`,
        glyph: (e.type === 'online' ? 'chat' : 'users') as IconName,
        gradient: e.type === 'online' ? 'var(--action-transforme)' : 'var(--action-digitalise)',
        registered: registeredEvents.has(e.id),
      })),
    ...clubSessions
      .filter((s) => isClubSessionUpcoming(s, now))
      .map((s) => ({
        id: `s-${s.id}`,
        at: clubSessionStart(s.scheduledAt),
        title: s.title,
        meta: `${when(clubSessionStart(s.scheduledAt))}${s.duration ? ` · ${s.duration}` : ''}`,
        glyph: 'video' as IconName,
        gradient: 'var(--action-transforme)',
        registered: registeredSessions.has(s.id),
      })),
  ]
    .filter((x) => Number.isFinite(x.at))
    .sort((a, b) => a.at - b.at);
}

