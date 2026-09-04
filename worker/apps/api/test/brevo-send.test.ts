import { describe, expect, it, vi } from 'vitest';

import { MODELES, aConsenti, envoyerModele } from '../src/lib/brevo-send';
import type { Env } from '../src/env';

/**
 * LE RÉGIME EST LA SEULE CHOSE QUI COMPTE ICI.
 *
 * Un courrier marketing parti sans consentement, ou sans lien de retrait, est une infraction
 * — et elle ne se voit sur aucun écran : l'envoi réussit, le destinataire le reçoit, et le
 * défaut ne se manifeste qu'en réclamation. D'où des tests qui affirment surtout des refus.
 */

const env = { BREVO_API_KEY: 'cle-de-test', EXPORT_SIGNING_KEY: 'clef', API_BASE_URL: 'https://api.maxmorrys.me' } as Env;

function fauxDb(collections: Record<string, Array<Record<string, unknown>>>) {
  return {
    query: vi.fn(async (q: { collection: string }) =>
      (collections[q.collection] ?? []).map((data, i) => ({ path: `${q.collection}/d${i}`, data })),
    ),
  } as never;
}

function capturerEnvoi() {
  const appels: Array<Record<string, unknown>> = [];
  vi.stubGlobal('fetch', vi.fn(async (_u: string, init: RequestInit) => {
    appels.push(JSON.parse(String(init.body)));
    return new Response('{"messageId":"x"}', { status: 201 });
  }));
  return appels;
}

describe('le consentement', () => {
  it('accepte un abonné de la lettre', async () => {
    const db = fauxDb({ newsletter: [{ email: 'awa@example.com', consent: true }] });
    expect(await aConsenti(db, 'awa@example.com')).toBe(true);
  });

  it('accepte un compte ayant coché la préférence', async () => {
    const db = fauxDb({ users: [{ email: 'awa@example.com', preferences: { newsletter: true } }] });
    expect(await aConsenti(db, 'awa@example.com')).toBe(true);
  });

  /*
   * UN RETRAIT L'EMPORTE SUR UN CONSENTEMENT TROUVÉ AILLEURS. Quelqu'un qui s'est désabonné
   * puis dont le compte porte encore l'ancienne préférence ne doit RIEN recevoir : dans le
   * doute, on n'envoie pas. L'inverse — chercher un « oui » jusqu'à en trouver un — est
   * exactement le raisonnement qui produit une réclamation.
   */
  it('refuse dès qu’un désabonnement existe, même si le compte dit oui', async () => {
    const db = fauxDb({
      newsletter: [{ email: 'awa@example.com', consent: true, unsubscribedAt: '2026-09-01T00:00:00Z' }],
      users: [{ email: 'awa@example.com', preferences: { newsletter: true } }],
    });
    expect(await aConsenti(db, 'awa@example.com')).toBe(false);
  });

  it('refuse un inconnu', async () => {
    expect(await aConsenti(fauxDb({}), 'inconnue@example.com')).toBe(false);
  });

  it('ignore la casse', async () => {
    const db = fauxDb({ newsletter: [{ email: 'awa@example.com', consent: true }] });
    expect(await aConsenti(db, '  AWA@Example.com ')).toBe(true);
  });
});

describe('l’envoi par modèle', () => {
  it('envoie un transactionnel sans rien demander à la base', async () => {
    const appels = capturerEnvoi();
    const db = fauxDb({});
    const r = await envoyerModele(env, {
      modele: 'certificat', to: 'awa@example.com', langue: 'fr',
      params: { prenom: 'Awa', code: 'MM-ABC' },
    }, db);
    expect(r.issue).toBe('envoye');
    expect(appels[0].templateId).toBe(MODELES.certificat.fr);
    // Un transactionnel ne consulte AUCUNE collection : il n'a pas de consentement à vérifier.
    expect((db as unknown as { query: { mock: { calls: unknown[] } } }).query.mock.calls).toHaveLength(0);
    vi.unstubAllGlobals();
  });

  it('ne pose PAS de lien de retrait sur un transactionnel', async () => {
    const appels = capturerEnvoi();
    await envoyerModele(env, { modele: 'accuseDevis', to: 'awa@example.com', langue: 'fr', params: {} }, fauxDb({}));
    expect(appels[0].params).not.toHaveProperty('desabonnement');
    vi.unstubAllGlobals();
  });

  it('REFUSE un marketing sans consentement, et n’appelle pas Brevo', async () => {
    const appels = capturerEnvoi();
    const r = await envoyerModele(env, {
      modele: 'reactivation', to: 'inconnue@example.com', langue: 'fr', params: {},
    }, fauxDb({}));
    expect(r.issue).toBe('sansConsentement');
    expect(appels).toHaveLength(0);
    vi.unstubAllGlobals();
  });

  it('pose systématiquement le lien de retrait sur un marketing', async () => {
    const appels = capturerEnvoi();
    const db = fauxDb({ newsletter: [{ email: 'awa@example.com', consent: true }] });
    const r = await envoyerModele(env, {
      modele: 'nurtureDevis', to: 'awa@example.com', langue: 'en', params: { ref: 'DV-1' },
    }, db);
    expect(r.issue).toBe('envoye');
    const params = appels[0].params as Record<string, string>;
    expect(params.desabonnement).toContain('/desabonnement?e=awa%40example.com');
    expect(params.desabonnement).toContain('&l=en');
    expect(params.libelleDesabonnement).toBe('Unsubscribe');
    // Le paramètre de l'appelant survit à l'injection.
    expect(params.ref).toBe('DV-1');
    vi.unstubAllGlobals();
  });

  it('refuse un marketing si la base n’est pas fournie', async () => {
    const r = await envoyerModele(env, { modele: 'quotaRysmo', to: 'awa@example.com', langue: 'fr', params: {} });
    expect(r.issue).toBe('echec');
    expect(r.erreur).toContain('invérifiable');
  });

  it('se tait proprement quand Brevo n’est pas configuré', async () => {
    const r = await envoyerModele({} as Env, { modele: 'certificat', to: 'a@b.com', langue: 'fr', params: {} });
    expect(r.issue).toBe('nonConfigure');
  });

  it('ne lève jamais, même si le réseau tombe', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('réseau coupé'); }));
    const r = await envoyerModele(env, { modele: 'certificat', to: 'a@b.com', langue: 'fr', params: {} }, fauxDb({}));
    expect(r.issue).toBe('echec');
    expect(r.erreur).toContain('réseau coupé');
    vi.unstubAllGlobals();
  });

  it('choisit le modèle de la bonne langue', async () => {
    const appels = capturerEnvoi();
    await envoyerModele(env, { modele: 'certificat', to: 'a@b.com', langue: 'en', params: {} }, fauxDb({}));
    expect(appels[0].templateId).toBe(MODELES.certificat.en);
    vi.unstubAllGlobals();
  });
});

/* Un modèle marketing mal déclaré n'enverrait rien de plus qu'un transactionnel : ce test
   garde la table elle-même, qui est la source de la distinction. */
describe('la table des modèles', () => {
  it('déclare cinq transactionnels et six marketing', () => {
    const regimes = Object.values(MODELES).map((m) => m.regime);
    expect(regimes.filter((r) => r === 'transactionnel')).toHaveLength(5);
    expect(regimes.filter((r) => r === 'marketing')).toHaveLength(6);
  });

  it('donne à chaque modèle ses deux langues, sans identifiant partagé', () => {
    const ids = new Set<number>();
    for (const m of Object.values(MODELES)) {
      expect(m.fr).toBeGreaterThan(0);
      expect(m.en).toBeGreaterThan(0);
      ids.add(m.fr); ids.add(m.en);
    }
    expect(ids.size).toBe(Object.keys(MODELES).length * 2);
  });
});
