import { describe, expect, it, vi } from 'vitest';

import { envoyerBienvenues, envoyerSuitesBienvenue, relancerPaniers } from '../src/lib/lifecycle';
import type { Env } from '../src/env';
import { aucunAppelReseau, fauxBrevo } from './helpers/faux-brevo';
import { fauxFirestore } from './helpers/faux-firestore';

/**
 * CE QUI EST TESTÉ ICI, C'EST LA BORNE HAUTE.
 *
 * Une passe sans borne écrirait, à sa PREMIÈRE exécution, à tous les comptes et à tous les
 * paniers abandonnés depuis toujours. Des gens inscrits il y a six mois recevraient
 * « bienvenue » ; des paniers oubliés depuis un an recevraient une relance. C'est le meilleur
 * moyen de se faire signaler comme spam dès le premier envoi, sur un domaine neuf.
 *
 * Le défaut ne se voit pas en relecture : le code « marche », il envoie même beaucoup.
 */

/** Ce que le faux binding `EMAIL` a reçu, et comment il répond. */
type Envoye = { to: string; subject: string; html: string; text: string; headers?: Record<string, string> };
let envoyes: Envoye[] = [];
let reponse: () => Promise<unknown> = async () => ({ messageId: 'x' });

const env = {
  APP_BASE_URL: 'https://maxmorrys.me',
  EXPORT_SIGNING_KEY: 'clef',
  API_BASE_URL: 'https://api.maxmorrys.me',
  EMAIL_FROM: 'facture@mail.maxmorrys.me',
  EMAIL_FROM_NAME: 'Max-Morrys',
  EMAIL: {
    send: async (m: Envoye) => {
      await reponse();
      envoyes.push(m);
      return { messageId: 'x' };
    },
  },
} as unknown as Env;

const LE_4 = new Date('2026-09-04T08:00:00Z');

function fauxDb(collections: Record<string, Array<Record<string, unknown>>>) {
  const update = vi.fn().mockResolvedValue(undefined);
  return {
    db: {
      query: vi.fn(async (q: { collection: string }) =>
        (collections[q.collection] ?? []).map((data, i) => ({ path: `${q.collection}/d${i}`, data })),
      ),
      get: vi.fn(async () => null),
      update,
    } as never,
    update,
  };
}

function accepteTout(): Envoye[] {
  envoyes = [];
  reponse = async () => ({ messageId: 'x' });
  return envoyes;
}

describe('la bienvenue', () => {
  it('écrit à un compte créé aujourd’hui', async () => {
    const envois = accepteTout();
    const { db, update } = fauxDb({
      users: [{ email: 'awa@example.com', role: 'student', firstName: 'Awa', createdAt: '2026-09-04T07:00:00Z' }],
    });
    const b = await envoyerBienvenues(db, env, LE_4);
    expect(b.envoyes).toBe(1);
    expect(envois).toHaveLength(1);
    expect(update.mock.calls[0][1]).toHaveProperty('welcomeSentAt');
    vi.unstubAllGlobals();
  });

  /* LA BORNE HAUTE — voir l'en-tête du fichier. */
  it('n’écrit PAS à un compte de six mois', async () => {
    const envois = accepteTout();
    const { db } = fauxDb({
      users: [{ email: 'vieux@example.com', role: 'student', createdAt: '2026-03-01T00:00:00Z' }],
    });
    const b = await envoyerBienvenues(db, env, LE_4);
    expect(b.envoyes).toBe(0);
    expect(envois).toHaveLength(0);
    vi.unstubAllGlobals();
  });

  it('n’écrit pas deux fois', async () => {
    const envois = accepteTout();
    const { db } = fauxDb({
      users: [{ email: 'awa@example.com', role: 'student', createdAt: '2026-09-04T07:00:00Z', welcomeSentAt: '2026-09-04T08:00:00Z' }],
    });
    expect((await envoyerBienvenues(db, env, LE_4)).envoyes).toBe(0);
    expect(envois).toHaveLength(0);
    vi.unstubAllGlobals();
  });

  it('compte à part un compte sans adresse', async () => {
    accepteTout();
    const { db } = fauxDb({ users: [{ role: 'student', createdAt: '2026-09-04T07:00:00Z' }] });
    const b = await envoyerBienvenues(db, env, LE_4);
    expect(b.ignores).toBe(1);
    expect(b.envoyes).toBe(0);
    vi.unstubAllGlobals();
  });
});

describe('la relance de panier', () => {
  it('relance un panier abandonné hier, et une seule fois', async () => {
    const envois = accepteTout();
    const { db, update } = fauxDb({
      transactions: [{
        status: 'pending', userEmail: 'awa@example.com', userName: 'Awa',
        formationTitle: 'Vendre sur WhatsApp', formationSlug: 'vendre-whatsapp',
        amount: 19900, currency: 'XOF', couponCode: 'LANCEMENT',
        createdAt: '2026-09-03T10:00:00Z',
      }],
    });
    const b = await relancerPaniers(db, env, LE_4);
    expect(b.envoyes).toBe(1);
    expect(update.mock.calls[0][1]).toHaveProperty('cartReminderSentAt');
    expect(envois[0].text).toContain('LANCEMENT');
    expect(envois[0].html).toContain('LANCEMENT');
    vi.unstubAllGlobals();
  });

  /*
   * NI AVANT, NI APRÈS. Trop tôt, le paiement est peut-être encore en cours chez
   * l'opérateur — on écrirait à quelqu'un qui vient de payer. Trop tard, la relance n'a
   * plus de sens et ressemble à du démarchage.
   */
  it('ignore un panier du jour même et un panier de la semaine dernière', async () => {
    const envois = accepteTout();
    const { db } = fauxDb({
      transactions: [
        { status: 'pending', userEmail: 'a@b.com', createdAt: '2026-09-04T07:00:00Z' },
        { status: 'pending', userEmail: 'c@d.com', createdAt: '2026-08-28T10:00:00Z' },
      ],
    });
    expect((await relancerPaniers(db, env, LE_4)).envoyes).toBe(0);
    expect(envois).toHaveLength(0);
    vi.unstubAllGlobals();
  });

  /* Sans coupon, on ne parle pas de coupon : inventer « ton coupon » ferait chercher une
     remise qui n'existe pas. */
  it('adapte le texte quand il n’y a pas de coupon', async () => {
    const envois = accepteTout();
    const { db } = fauxDb({
      transactions: [{ status: 'pending', userEmail: 'a@b.com', createdAt: '2026-09-03T10:00:00Z' }],
    });
    await relancerPaniers(db, env, LE_4);
    expect(envois[0].text).not.toContain('coupon');
    expect(envois[0].text).toContain('Rien n’a été débité');
    // Transactionnel : ni lien de retrait, ni en-tête de liste.
    expect(envois[0].headers).toBeUndefined();
    expect(envois[0].text).not.toContain('désabonner');
    vi.unstubAllGlobals();
  });

  it('ne marque rien si l’envoi échoue', async () => {
    accepteTout();
    reponse = async () => { throw new Error('E_DELIVERY_FAILED'); };
    const { db, update } = fauxDb({
      transactions: [{ status: 'pending', userEmail: 'a@b.com', createdAt: '2026-09-03T10:00:00Z' }],
    });
    const b = await relancerPaniers(db, env, LE_4);
    expect(b.echecs).toBe(1);
    // Le marqueur n'est PAS posé : la prochaine passe réessaiera tant qu'on est à J+1.
    expect(update).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe('les suites de bienvenue (marketing, par Brevo)', () => {
  const ouvert = { ...env, MARKETING_ENVOI_REEL: 'oui', BREVO_API_KEY: 'xkeysib-test', BREVO_LIST_ID: '4', BREVO_SENDER_EMAIL: 'lettre@lettre.maxmorrys.me' } as Env;
  const compteJ2 = { email: 'awa@example.com', role: 'student', firstName: 'Awa', createdAt: '2026-09-02T07:00:00Z' };

  it('ne lit RIEN et n’envoie rien tant que l’accord n’est pas donné', async () => {
    const envois = accepteTout();
    const reseau = aucunAppelReseau();
    const { db } = fauxDb({ users: [compteJ2], newsletter: [{ email: 'awa@example.com', consent: true }] });
    const b = await envoyerSuitesBienvenue(db, { ...ouvert, MARKETING_ENVOI_REEL: 'non' } as Env, LE_4);
    expect(b.examines).toBe(0);
    expect(envois).toHaveLength(0);
    expect(reseau).not.toHaveBeenCalled();
    expect((db as unknown as { query: { mock: { calls: unknown[] } } }).query.mock.calls).toHaveLength(0);
    vi.unstubAllGlobals();
  });

  it('ne lit RIEN sans Brevo configuré, même avec l’accord — et ne passe pas par Cloudflare', async () => {
    const envois = accepteTout();
    const { db } = fauxDb({ users: [compteJ2], newsletter: [{ email: 'awa@example.com', consent: true }] });
    const b = await envoyerSuitesBienvenue(db, { ...env, MARKETING_ENVOI_REEL: 'oui' } as Env, LE_4);
    expect(b.examines).toBe(0);
    expect(envois).toHaveLength(0);
  });

  it('n’écrit pas à J+2 sans consentement, et ne compte pas d’échec', async () => {
    const envois = accepteTout();
    const brevo = fauxBrevo();
    const { db, docs } = fauxFirestore({ 'users/u1': compteJ2 });
    const b = await envoyerSuitesBienvenue(db, ouvert, LE_4);
    expect(b.ignores).toBe(1);
    expect(b.echecs).toBe(0);
    expect(envois).toHaveLength(0);
    expect(brevo.unitaires).toHaveLength(0);
    expect(docs.get('users/u1')?.welcome2SentAt).toBeUndefined();
    vi.unstubAllGlobals();
  });

  it('écrit #2 à J+2 par Brevo, avec consentement, retrait et en-têtes un clic — rien par Cloudflare', async () => {
    const envois = accepteTout();
    const brevo = fauxBrevo();
    const { db, docs } = fauxFirestore({ 'users/u1': compteJ2, 'newsletter/n1': { email: 'awa@example.com', consent: true } });
    const b = await envoyerSuitesBienvenue(db, ouvert, LE_4);
    expect(b.envoyes).toBe(1);
    expect(envois).toHaveLength(0);
    const m = brevo.unitaires[0] as { subject: string; headers: Record<string, string>; textContent: string; sender: { email: string } };
    expect(m.subject).toBe('La question que tout le monde me pose en premier');
    expect(m.sender.email).toBe('lettre@lettre.maxmorrys.me');
    expect(m.headers['List-Unsubscribe']).toMatch(/^<https:\/\/api\.maxmorrys\.me\/desabonnement\?e=awa%40example\.com&s=[0-9a-f]{64}&l=fr>$/);
    expect(m.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
    expect(m.textContent).toContain('/desabonnement?e=');
    expect(docs.get('users/u1')?.welcome2SentAt).toBeTruthy();
    vi.unstubAllGlobals();
  });

  it('au-delà du plafond Brevo : ignoré, pas d’échec, aucun marqueur', async () => {
    accepteTout();
    const brevo = fauxBrevo();
    const { db, docs } = fauxFirestore({ 'users/u1': compteJ2, 'newsletter/n1': { email: 'awa@example.com', consent: true } });
    const b = await envoyerSuitesBienvenue(db, { ...ouvert, MARKETING_PLAFOND_JOUR: '1' } as Env, LE_4);
    expect(b.envoyes).toBe(1);
    const autre = fauxFirestore({ 'users/u2': { ...compteJ2, email: 'moussa@example.com' }, 'newsletter/n2': { email: 'moussa@example.com', consent: true } });
    // Même jour, même compteur de quota (le faux est distinct : on le recopie).
    for (const [k, v] of docs) if (k.startsWith('_ratelimits/')) autre.docs.set(k, v);
    const b2 = await envoyerSuitesBienvenue(autre.db, { ...ouvert, MARKETING_PLAFOND_JOUR: '1' } as Env, LE_4);
    expect(b2).toMatchObject({ envoyes: 0, ignores: 1, echecs: 0 });
    expect(autre.docs.get('users/u2')?.welcome2SentAt).toBeUndefined();
    expect(brevo.unitaires).toHaveLength(1);
    vi.unstubAllGlobals();
  });

  it('ignore J+3 et un compte déjà servi', async () => {
    const envois = accepteTout();
    const brevo = fauxBrevo();
    const { db } = fauxDb({
      users: [
        { ...compteJ2, createdAt: '2026-09-01T07:00:00Z' },
        { ...compteJ2, welcome2SentAt: '2026-09-04T08:00:00Z' },
      ],
      newsletter: [{ email: 'awa@example.com', consent: true }],
    });
    expect((await envoyerSuitesBienvenue(db, ouvert, LE_4)).envoyes).toBe(0);
    expect(envois).toHaveLength(0);
    expect(brevo.unitaires).toHaveLength(0);
    vi.unstubAllGlobals();
  });
});

describe('la bienvenue n°1 et le panier restent sur Cloudflare', () => {
  it('aucun appel réseau vers Brevo, même Brevo configuré et l’accord donné', async () => {
    const envois = accepteTout();
    const reseau = aucunAppelReseau();
    const ouvert = { ...env, MARKETING_ENVOI_REEL: 'oui', BREVO_API_KEY: 'xkeysib-test', BREVO_LIST_ID: '4', BREVO_SENDER_EMAIL: 'lettre@lettre.maxmorrys.me' } as Env;
    const { db } = fauxDb({
      users: [{ email: 'a@b.com', role: 'student', createdAt: '2026-09-04T07:00:00Z' }],
      transactions: [{ status: 'pending', userEmail: 'c@d.com', createdAt: '2026-09-03T10:00:00Z' }],
    });
    expect((await envoyerBienvenues(db, ouvert, LE_4)).envoyes).toBe(1);
    expect((await relancerPaniers(db, ouvert, LE_4)).envoyes).toBe(1);
    expect(envois).toHaveLength(2);
    expect(reseau).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
