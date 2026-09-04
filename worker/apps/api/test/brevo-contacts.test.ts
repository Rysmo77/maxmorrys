import { describe, expect, it, vi } from 'vitest';

import { rassemblerAudience, synchroniserAudience } from '../src/lib/brevo-contacts';
import type { Env } from '../src/env';

/**
 * CE QUI EST TESTÉ ICI EST UNE RÈGLE DE DROIT, PAS UNE PRÉFÉRENCE.
 *
 * Le dépôt porte sept collections contenant des adresses. Une seule recueille un consentement
 * marketing. Pousser une adresse issue des six autres, c'est de la prospection sans base
 * légale — et ça ne se voit sur aucun écran : la campagne part, elle a l'air de fonctionner,
 * et le défaut ne se manifeste qu'en réclamation.
 *
 * D'où des tests qui affirment surtout des ABSENCES.
 */

function fauxDb(collections: Record<string, Array<Record<string, unknown>>>) {
  return {
    query: vi.fn(async (q: { collection: string }) =>
      (collections[q.collection] ?? []).map((data, i) => ({ path: `${q.collection}/d${i}`, data })),
    ),
  } as never;
}

describe('l’audience rassemblée', () => {
  it('prend un abonné de la lettre qui a consenti', async () => {
    const db = fauxDb({ newsletter: [{ email: 'awa@example.com', consent: true, locale: 'fr', source: 'footer' }] });
    const a = await rassemblerAudience(db);
    expect(a).toHaveLength(1);
    expect(a[0].email).toBe('awa@example.com');
    expect(a[0].bloque).toBe(false);
    expect(a[0].attributes.LOCALE).toBe('fr');
  });

  /*
   * Un désabonné est POUSSÉ EN `blocklisted`, jamais omis. L'omettre le laisserait
   * ressortir au prochain import — Listmonk ne saurait pas qu'il est sorti.
   */
  it('pousse un désabonné en liste noire au lieu de l’oublier', async () => {
    const db = fauxDb({
      newsletter: [{ email: 'sortie@example.com', consent: true, unsubscribedAt: '2026-09-01T00:00:00Z' }],
    });
    const a = await rassemblerAudience(db);
    expect(a).toHaveLength(1);
    expect(a[0].bloque).toBe(true);
  });

  it('prend un compte qui a coché la préférence', async () => {
    const db = fauxDb({
      users: [{ email: 'moussa@example.com', role: 'student', displayName: 'Moussa', preferences: { newsletter: true, language: 'en' } }],
    });
    const a = await rassemblerAudience(db);
    expect(a).toHaveLength(1);
    expect(a[0].attributes.PRENOM).toBe('Moussa');
    expect(a[0].attributes.LOCALE).toBe('en');
    expect(a[0].attributes.COMPTE).toBe(true);
  });

  /*
   * LE PERSONNEL N'EST PAS UNE AUDIENCE. Un compte admin fausserait chaque taux d'ouverture,
   * et un test grandeur nature finirait par partir depuis un compte de service.
   */
  it('exclut les comptes admin et support, même consentants', async () => {
    const db = fauxDb({
      users: [
        { email: 'admin@example.com', role: 'admin', preferences: { newsletter: true } },
        { email: 'support@example.com', role: 'support', preferences: { newsletter: true } },
        { email: 'eleve@example.com', role: 'student', preferences: { newsletter: true } },
      ],
    });
    const a = await rassemblerAudience(db);
    expect(a.map((x) => x.email)).toEqual(['eleve@example.com']);
  });

  it('déduplique, et fait gagner la version du compte', async () => {
    const db = fauxDb({
      newsletter: [{ email: 'Awa@Example.com', consent: true, source: 'footer' }],
      users: [{ email: 'awa@example.com', role: 'student', displayName: 'Awa Diallo', preferences: { newsletter: true } }],
    });
    const a = await rassemblerAudience(db);
    expect(a).toHaveLength(1);
    expect(a[0].attributes.PRENOM).toBe('Awa Diallo');
    expect(a[0].attributes.COMPTE).toBe(true);
  });

  it('ignore une adresse qui n’en est pas une', async () => {
    const db = fauxDb({ newsletter: [{ email: 'pas-une-adresse', consent: true }, { email: '', consent: true }] });
    expect(await rassemblerAudience(db)).toHaveLength(0);
  });

  /*
   * L'assertion la plus importante du fichier : les six collections interdites ne doivent
   * JAMAIS être interrogées. Un test sur le résultat ne suffirait pas — il passerait aussi
   * si on les lisait puis les filtrait, ce qui reste une lecture de données non consenties.
   */
  it('n’interroge AUCUNE des six collections sans consentement', async () => {
    const db = fauxDb({ newsletter: [], users: [] });
    await rassemblerAudience(db);
    const interrogees = (db as unknown as { query: { mock: { calls: Array<[{ collection: string }]> } } })
      .query.mock.calls.map((c) => c[0].collection);
    expect(interrogees.sort()).toEqual(['newsletter', 'users']);
    for (const interdite of ['appointments', 'messages', 'agency_leads', 'engagement_leads', 'transactions', 'waitlist']) {
      expect(interrogees).not.toContain(interdite);
    }
  });
});

describe('la passe de synchronisation', () => {
  it('se tait proprement quand Brevo n’est pas configuré', async () => {
    const db = fauxDb({ newsletter: [{ email: 'awa@example.com', consent: true }] });
    const bilan = await synchroniserAudience(db, {} as Env);
    expect(bilan.pousses).toBe(0);
    expect(bilan.erreurs[0]).toContain('non configuré');
    // Et surtout : elle n'a RIEN lu. Un canal absent ne justifie pas de parcourir la base.
    expect((db as unknown as { query: { mock: { calls: unknown[] } } }).query.mock.calls).toHaveLength(0);
  });

  it('compte séparément les poussés, les bloqués et les échecs', async () => {
    const db = fauxDb({
      newsletter: [
        { email: 'ok@example.com', consent: true },
        { email: 'sortie@example.com', consent: true, unsubscribedAt: '2026-09-01T00:00:00Z' },
        { email: 'casse@example.com', consent: true },
      ],
    });
    const env = { BREVO_API_KEY: 'cle-de-test', BREVO_LIST_ID: '4' } as Env;

    vi.stubGlobal('fetch', vi.fn(async (_u: string, init: RequestInit) => {
      const corps = JSON.parse(String(init.body)) as { email: string };
      // 204 = mis à jour chez Brevo, et c'est un SUCCÈS : le traiter comme un échec ferait
      // basculer tout le bilan en rouge dès la deuxième synchronisation.
      return corps.email === 'casse@example.com'
        ? new Response('boom', { status: 500 })
        : new Response(null, { status: 204 });
    }));

    const bilan = await synchroniserAudience(db, env);
    expect(bilan.candidats).toBe(3);
    expect(bilan.pousses).toBe(1);
    expect(bilan.bloques).toBe(1);
    expect(bilan.echecs).toBe(1);
    expect(bilan.erreurs[0]).toContain('casse@example.com');
    vi.unstubAllGlobals();
  });
});
