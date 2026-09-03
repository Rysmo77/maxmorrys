import { describe, expect, it, vi } from 'vitest';

import type { Firestore } from '@mm/firestore-rest';

import type { Env } from '../src/env';
import { rebuildLeaderboard } from '../src/lib/leaderboard';
import { buildQuoteExpiryNotice, sendQuoteExpiryNotices, PREAVIS_DEVIS_JOURS } from '../src/lib/quote-expiry';
import { sendReengagementNotices } from '../src/lib/reengagement';

/**
 * Les quatre travaux du cron de 8 h partagent une contrainte : ils tournent sans témoin, une
 * fois par jour. Ce qui doit tenir n'est donc pas « ça marche » mais « ça ne part qu'une fois,
 * et ça ne ment pas ».
 */

/** Faux Firestore : on n'observe que ce qui est écrit et ce qui est demandé. */
function fauxDb(docs: Record<string, Record<string, unknown>>, reponses: Record<string, Array<{ id: string; data: Record<string, unknown> }>> = {}) {
  const ajouts: Array<{ chemin: string; data: Record<string, unknown> }> = [];
  const maj: Array<{ chemin: string; data: Record<string, unknown> }> = [];
  const sets: Array<{ chemin: string; data: Record<string, unknown> }> = [];
  const db = {
    get: vi.fn(async (c: string) => (docs[c] ? { id: c.split('/').pop()!, path: c, data: docs[c] } : null)),
    query: vi.fn(async (q: { collection: string }) =>
      (reponses[q.collection] ?? []).map((d) => ({ ...d, path: `${q.collection}/${d.id}` }))),
    add: vi.fn(async (chemin: string, data: Record<string, unknown>) => { ajouts.push({ chemin, data }); return 'n'; }),
    update: vi.fn(async (chemin: string, data: Record<string, unknown>) => { maj.push({ chemin, data }); }),
    set: vi.fn(async (chemin: string, data: Record<string, unknown>) => { sets.push({ chemin, data }); }),
    count: vi.fn(async () => 3),
  } as unknown as Firestore;
  return { db, ajouts, maj, sets };
}

const ENV = { APP_BASE_URL: 'https://maxmorrys.me', EMAIL: { send: vi.fn(async () => {}) } } as unknown as Env;

/** Une échéance à J-N pile, depuis maintenant. */
function echeanceDans(jours: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + jours);
  return d.toISOString();
}

describe('relance de devis — le courrier', () => {
  const DEVIS = { ref: 'MM-42', commerce: 'Chez Awa', echeance: '20/09/2026' };

  it('porte la référence et l’échéance, dans les deux langues', () => {
    for (const langue of ['fr', 'en'] as const) {
      const m = buildQuoteExpiryNotice(DEVIS, 'Awa', langue, 'https://maxmorrys.me');
      expect(m.text).toContain('MM-42');
      expect(m.text).toContain('20/09/2026');
      expect(m.html).toContain('/presence-digitale/devis/MM-42');
    }
  });

  it('mène vers le devis dans la bonne langue', () => {
    expect(buildQuoteExpiryNotice(DEVIS, '', 'en', 'https://x').html).toContain('https://x/en/presence-digitale/devis/');
    expect(buildQuoteExpiryNotice(DEVIS, '', 'fr', 'https://x').html).toContain('https://x/presence-digitale/devis/');
  });

  it('échappe le nom du commerce, qui vient d’un formulaire public', () => {
    const m = buildQuoteExpiryNotice({ ...DEVIS, commerce: '<img onerror=x>' }, '', 'fr', 'https://x');
    expect(m.html).not.toContain('<img onerror=x>');
  });
});

describe('relance de devis — la passe', () => {
  it('ne relance qu’à l’échéance exacte', async () => {
    const { db, maj } = fauxDb({}, {
      agency_quotes: [
        { id: 'TROP-TOT', data: { expiresAt: echeanceDans(PREAVIS_DEVIS_JOURS + 3), businessName: 'A' } },
        { id: 'TROP-TARD', data: { expiresAt: echeanceDans(PREAVIS_DEVIS_JOURS - 3), businessName: 'B' } },
      ],
    });
    const bilan = await sendQuoteExpiryNotices(db, ENV);
    expect(bilan.envoyes).toBe(0);
    expect(maj).toHaveLength(0);
  });

  it('ne rejoue pas une relance déjà faite pour la même échéance', async () => {
    const dans7 = echeanceDans(PREAVIS_DEVIS_JOURS);
    const { db, maj } = fauxDb({}, {
      agency_quotes: [{ id: 'MM-1', data: { expiresAt: dans7, expiryNoticeFor: dans7, businessName: 'A' } }],
    });
    expect((await sendQuoteExpiryNotices(db, ENV)).envoyes).toBe(0);
    expect(maj).toHaveLength(0);
  });

  /*
   * ⚠️ LE CHIFFRE QUI COMPTE POUR LA SUITE. `AgencyLead.email` est optionnel : l'ICP de cette
   * offre traite son commerce sur WhatsApp et le formulaire n'exige que le téléphone. Ces
   * prospects sont COMPTÉS, jamais relancés en silence par un canal que le produit ne sait pas
   * automatiser. C'est ce compteur qui justifierait d'ouvrir ce canal un jour.
   */
  it('compte les prospects sans adresse au lieu de les relancer autrement', async () => {
    const { db } = fauxDb({}, {
      agency_quotes: [{ id: 'MM-2', data: { expiresAt: echeanceDans(PREAVIS_DEVIS_JOURS), businessName: 'A' } }],
      agency_leads: [{ id: 'L1', data: { quoteRef: 'MM-2', phone: '+221...' } }], // pas d'email
    });
    const bilan = await sendQuoteExpiryNotices(db, ENV);
    expect(bilan.sansAdresse).toBe(1);
    expect(bilan.envoyes).toBe(0);
  });
});

describe('relances d’engagement', () => {
  const AUJ = new Date().toISOString().slice(0, 10);

  it('épargne qui a déjà été actif aujourd’hui', async () => {
    const { db, ajouts } = fauxDb({}, {
      gamification: [{ id: 'u1', data: { currentStreak: 5, lastActiveDate: AUJ } }],
    });
    expect((await sendReengagementNotices(db)).series).toBe(0);
    expect(ajouts).toHaveLength(0);
  });

  it('prévient qui a une série en danger', async () => {
    const { db, ajouts } = fauxDb(
      { 'users/u1': { preferences: { language: 'fr' } } },
      { gamification: [{ id: 'u1', data: { currentStreak: 7, lastActiveDate: '2020-01-01' } }] },
    );
    expect((await sendReengagementNotices(db)).series).toBe(1);
    expect(ajouts[0].chemin).toBe('notifications/u1/items');
    expect(String(ajouts[0].data.title)).toContain('7');
  });

  /*
   * ⚠️ UNE PERSONNE, UN RAPPEL. Quelqu'un peut avoir plusieurs inscriptions en cours : sans
   * cette garde, il recevrait autant de rappels que de formations abandonnées, le même matin.
   */
  it('ne relance pas la même personne deux fois pour deux cours', async () => {
    const vieux = '2020-01-01T00:00:00.000Z';
    const { db, ajouts } = fauxDb(
      { 'users/u1': {} },
      {
        enrollments: [
          { id: 'e1', data: { userId: 'u1', progress: 10, lastActivityAt: vieux, formationId: 'f1' } },
          { id: 'e2', data: { userId: 'u1', progress: 20, lastActivityAt: vieux, formationId: 'f2' } },
        ],
      },
    );
    expect((await sendReengagementNotices(db)).reprises).toBe(1);
    expect(ajouts).toHaveLength(1);
  });
});

describe('classement du Club', () => {
  it('attribue les rangs dans l’ordre et n’expose jamais l’adresse entière', async () => {
    const { db, sets } = fauxDb(
      { 'users/a': { displayName: 'Awa' }, 'users/b': { email: 'moussa@exemple.sn' } },
      { gamification: [{ id: 'a', data: { xp: 900, level: 4 } }, { id: 'b', data: { xp: 300, level: 2 } }] },
    );
    expect(await rebuildLeaderboard(db)).toBe(2);

    const agregat = sets.find((s) => s.chemin === 'leaderboard/global')!;
    const entries = agregat.data.entries as Array<Record<string, unknown>>;
    expect(entries.map((e) => e.rank)).toEqual([1, 2]);
    expect(entries[0].displayName).toBe('Awa');
    // Repli sur la partie locale seulement : l'adresse ne doit pas devenir publique.
    expect(entries[1].displayName).toBe('moussa');
    expect(JSON.stringify(agregat.data)).not.toContain('@exemple.sn');
  });
});
