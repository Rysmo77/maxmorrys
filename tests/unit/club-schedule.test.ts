import { describe, expect, it } from 'vitest';

import {
  CLUB_LIVE_WINDOW_MS, clubDateOptions, clubEventStart, isClubEventUpcoming, isClubSessionLive,
  isClubSessionUpcoming, isClubUpcoming,
} from '../../src/pages/lms/tabs/club/schedule';
import { buildCommands, filterCommands } from '../../src/lib/commands';

/**
 * « À VENIR » DU CLUB — audit UI/UX du 03/11/2026, C2 et X10. Le statut posé à la main dans
 * la console restait `upcoming` : des sessions de février et d'avril s'annonçaient encore
 * « Prochaine session » en novembre. La date réelle ET le statut décident, partout.
 */
const NOW = new Date('2026-11-03T12:00:00Z').getTime();

describe('isClubSessionUpcoming', () => {
  it('une session passée reste passée, même marquée « upcoming »', () => {
    expect(isClubSessionUpcoming({ status: 'upcoming', scheduledAt: '2026-02-21T15:00:00Z' }, NOW)).toBe(false);
    expect(isClubSessionUpcoming({ status: 'upcoming', scheduledAt: '2026-04-04T15:00:00Z' }, NOW)).toBe(false);
  });

  it('une session future à venir l’est', () => {
    expect(isClubSessionUpcoming({ status: 'upcoming', scheduledAt: '2026-11-10T15:00:00Z' }, NOW)).toBe(true);
  });

  it('un statut fermé l’emporte sur une date future', () => {
    for (const status of ['past', 'held', 'tenue', 'cancelled', 'annulée']) {
      expect(isClubSessionUpcoming({ status, scheduledAt: '2026-12-01T15:00:00Z' }, NOW), status).toBe(false);
    }
  });

  it('une date illisible n’est jamais à venir', () => {
    expect(isClubSessionUpcoming({ status: 'upcoming', scheduledAt: 'pas une date' }, NOW)).toBe(false);
    expect(isClubSessionUpcoming({ status: 'upcoming', scheduledAt: null }, NOW)).toBe(false);
  });

  it('une session commencée reste ouverte pendant sa fenêtre, puis se ferme', () => {
    const started = new Date(NOW - 60 * 60 * 1000).toISOString();
    expect(isClubSessionUpcoming({ status: 'upcoming', scheduledAt: started }, NOW)).toBe(true);
    expect(isClubSessionLive({ status: 'upcoming', scheduledAt: started }, NOW)).toBe(true);
    const over = new Date(NOW - CLUB_LIVE_WINDOW_MS - 1).toISOString();
    expect(isClubSessionUpcoming({ status: 'upcoming', scheduledAt: over }, NOW)).toBe(false);
    expect(isClubSessionLive({ status: 'upcoming', scheduledAt: over }, NOW)).toBe(false);
  });

  it('une session future n’est pas « en direct »', () => {
    expect(isClubSessionLive({ status: 'upcoming', scheduledAt: '2026-11-10T15:00:00Z' }, NOW)).toBe(false);
  });
});

describe('isClubEventUpcoming', () => {
  it('date seule : ouvert toute la journée, fermé le lendemain', () => {
    const start = clubEventStart('2026-11-03');
    expect(isClubEventUpcoming({ status: 'upcoming', date: '2026-11-03' }, start + 20 * 3600 * 1000)).toBe(true);
    expect(isClubEventUpcoming({ status: 'upcoming', date: '2026-11-03' }, start + 25 * 3600 * 1000)).toBe(false);
  });

  it('date et heure : combinées', () => {
    expect(clubEventStart('2026-11-03', '18:30')).toBe(new Date('2026-11-03T18:30:00').getTime());
    expect(clubEventStart('2026-11-03', '9:05')).toBe(new Date('2026-11-03T09:05:00').getTime());
  });

  it('un événement de février n’est plus à venir en novembre', () => {
    expect(isClubEventUpcoming({ status: 'upcoming', date: '2026-02-21', time: '15:00' }, NOW)).toBe(false);
  });

  it('statut « past » : fermé', () => {
    expect(isClubEventUpcoming({ status: 'past', date: '2026-12-21' }, NOW)).toBe(false);
  });
});

describe('isClubUpcoming', () => {
  it('sans statut, la date seule décide', () => {
    expect(isClubUpcoming(undefined, NOW + 1000, NOW)).toBe(true);
    expect(isClubUpcoming(undefined, NOW - CLUB_LIVE_WINDOW_MS - 1, NOW)).toBe(false);
  });
});

describe('clubDateOptions', () => {
  const base: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
  it('même année : pas d’année', () => {
    expect(clubDateOptions(new Date('2026-12-05T12:00:00Z').getTime(), base, NOW)).toEqual(base);
  });
  it('autre année : l’année est écrite', () => {
    expect(clubDateOptions(new Date('2027-01-05T12:00:00Z').getTime(), base, NOW)).toEqual({ ...base, year: 'numeric' });
    expect(clubDateOptions(new Date('2025-02-21T12:00:00Z').getTime(), base, NOW).year).toBe('numeric');
  });
});

describe('palette (Ctrl+K) — les écrans du Club, audit C4', () => {
  const ctx = {
    user: { uid: 'u1' } as never,
    userData: null,
    navigate: () => {},
    theme: 'light' as const,
    setTheme: () => {},
    signOut: async () => {},
  };

  it('« classement » trouve le classement du Club', () => {
    const found = filterCommands(buildCommands({ ...ctx, inClub: true }), 'classement');
    expect(found.map((c) => c.id)).toContain('club-leaderboard');
  });

  it('sur le Club, ses écrans passent devant ceux d’Edu', () => {
    const cmds = buildCommands({ ...ctx, inClub: true });
    expect(cmds[0].id.startsWith('club-')).toBe(true);
  });

  it('hors du Club, Edu reste en tête', () => {
    const cmds = buildCommands({ ...ctx, inClub: false });
    expect(cmds[0].id).toBe('go-dashboard');
    expect(cmds.some((c) => c.id === 'club-leaderboard')).toBe(true);
  });
});
