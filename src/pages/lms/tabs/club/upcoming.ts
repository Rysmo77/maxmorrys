import type { IconName } from '@ds';
import type { useClubData } from '../../hooks/useClubData';

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
 * Les événements et les sessions À VENIR, fusionnés et triés par échéance. Exporté parce que
 * la bande « en direct » de l'accueil du Club lit la même liste : deux calculs de « ce qui
 * vient » finiraient par ne pas annoncer la même chose.
 */
export function clubUpcoming(data: ClubData, t: (key: string) => string, locale: string): ClubUpcomingItem[] {
  const { clubEvents, clubSessions, registeredEvents, registeredSessions } = data;
  const when = (iso: string, time?: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return time ?? '';
    const day = d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
    const hour = time ?? d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    return `${day} · ${hour}`;
  };
  return [
    ...clubEvents
      .filter((e) => e.status === 'upcoming')
      .map((e) => ({
        id: `e-${e.id}`,
        at: new Date(e.date).getTime(),
        title: e.title,
        meta: `${when(e.date, e.time)} · ${e.type === 'online' ? t('events.online') : e.location}`,
        glyph: (e.type === 'online' ? 'chat' : 'users') as IconName,
        gradient: e.type === 'online' ? 'var(--action-transforme)' : 'var(--action-digitalise)',
        registered: registeredEvents.has(e.id),
      })),
    ...clubSessions
      .filter((s) => s.status === 'upcoming')
      .map((s) => ({
        id: `s-${s.id}`,
        at: new Date(s.scheduledAt).getTime(),
        title: s.title,
        meta: `${when(s.scheduledAt)}${s.duration ? ` · ${s.duration}` : ''}`,
        glyph: 'video' as IconName,
        gradient: 'var(--action-transforme)',
        registered: registeredSessions.has(s.id),
      })),
  ]
    .filter((x) => Number.isFinite(x.at))
    .sort((a, b) => a.at - b.at);
}

