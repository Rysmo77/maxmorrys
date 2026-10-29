import { afterEach, describe, expect, it, vi } from 'vitest';

import { aConsenti, canalMarketingOuvert, envoyerModele, rendreModele } from '../src/lib/envoi-modele';
import type { Env } from '../src/env';
import { aucunAppelReseau, fauxBrevo } from './helpers/faux-brevo';
import { fauxFirestore } from './helpers/faux-firestore';

/**
 * LE RÉGIME EST LA SEULE CHOSE QUI COMPTE ICI.
 *
 * Un courrier marketing parti sans consentement, sans lien de retrait, ou alors que le canal
 * est fermé, ne se voit sur aucun écran : l'envoi réussit, le destinataire le reçoit, et le
 * défaut ne se manifeste qu'en réclamation. D'où des tests qui affirment surtout des refus.
 *
 * ET LE TRANSPORT DÉCOULE DU RÉGIME : transactionnel → binding Cloudflare `EMAIL` (aucun
 * appel réseau vers Brevo), marketing → Brevo (le binding ne reçoit rien).
 */

afterEach(() => { vi.unstubAllGlobals(); });

type Envoye = { to: string; from: { email: string }; subject: string; html: string; text: string; headers?: Record<string, string> };

function environnement(extra: Partial<Env> = {}) {
  const envoyes: Envoye[] = [];
  const env = {
    EXPORT_SIGNING_KEY: 'clef',
    API_BASE_URL: 'https://api.maxmorrys.me',
    EMAIL_FROM: 'facture@mail.maxmorrys.me',
    EMAIL_FROM_NAME: 'Max-Morrys',
    BREVO_API_KEY: 'xkeysib-test',
    BREVO_LIST_ID: '4',
    BREVO_SENDER_EMAIL: 'lettre@lettre.maxmorrys.me',
    EMAIL: { send: vi.fn(async (m: Envoye) => { envoyes.push(m); return {}; }) },
    ...extra,
  } as unknown as Env;
  return { env, envoyes };
}

const abonnee = { 'newsletter/n1': { email: 'awa@example.com', consent: true } };

describe('le consentement', () => {
  it('accepte un abonné de la lettre et un compte ayant coché la préférence', async () => {
    expect(await aConsenti(fauxFirestore(abonnee).db, 'awa@example.com')).toBe(true);
    const { db } = fauxFirestore({ 'users/u1': { email: 'awa@example.com', preferences: { newsletter: true } } });
    expect(await aConsenti(db, 'awa@example.com')).toBe(true);
  });

  it('refuse dès qu’un désabonnement existe, même si le compte dit oui', async () => {
    const { db } = fauxFirestore({
      'newsletter/n1': { email: 'awa@example.com', consent: true, unsubscribedAt: '2026-09-01T00:00:00Z' },
      'users/u1': { email: 'awa@example.com', preferences: { newsletter: true } },
    });
    expect(await aConsenti(db, 'awa@example.com')).toBe(false);
  });

  it('refuse un inconnu et ignore la casse', async () => {
    expect(await aConsenti(fauxFirestore().db, 'inconnue@example.com')).toBe(false);
    expect(await aConsenti(fauxFirestore(abonnee).db, '  AWA@Example.com ')).toBe(true);
  });
});

describe('l’interrupteur du canal marketing', () => {
  it('ne s’ouvre que sur la valeur exacte « oui »', () => {
    expect(canalMarketingOuvert({ MARKETING_ENVOI_REEL: 'oui' })).toBe(true);
    for (const v of [undefined, '', 'non', 'Oui', 'true', '1', 'yes']) {
      expect(canalMarketingOuvert({ MARKETING_ENVOI_REEL: v })).toBe(false);
    }
  });
});

describe('l’envoi par gabarit', () => {
  it('envoie un transactionnel par le binding Cloudflare, JAMAIS par Brevo, sans retrait ni en-tête de liste', async () => {
    const { env, envoyes } = environnement({ MARKETING_ENVOI_REEL: 'oui' });
    const reseau = aucunAppelReseau();
    const r = await envoyerModele(env, { modele: 'certificat', to: 'awa@example.com', langue: 'fr', params: { prenom: 'Awa', code: 'MM-ABC', lien: 'https://maxmorrys.me/verifier' } });
    expect(r.issue).toBe('envoye');
    expect(reseau).not.toHaveBeenCalled();
    expect(envoyes[0].from.email).toBe('facture@mail.maxmorrys.me');
    expect(envoyes[0].headers).toBeUndefined();
    expect(envoyes[0].html).toContain('MM-ABC');
    expect(envoyes[0].html).not.toContain('/desabonnement');
    expect(envoyes[0].text).not.toContain('/desabonnement');
  });

  it.each(['certificat', 'panierAbandonne', 'bienvenue1', 'accuseDevis', 'accuseAgence'] as const)(
    'le transactionnel « %s » ne touche jamais Brevo, même Brevo configuré et canal ouvert',
    async (modele) => {
      const { env, envoyes } = environnement({ MARKETING_ENVOI_REEL: 'oui' });
      const reseau = aucunAppelReseau();
      expect((await envoyerModele(env, { modele, to: 'awa@example.com', langue: 'fr', params: {} })).issue).toBe('envoye');
      expect(reseau).not.toHaveBeenCalled();
      expect(envoyes).toHaveLength(1);
    },
  );

  it('REFUSE tout marketing tant que l’accord n’est pas donné — même consenti', async () => {
    const { env, envoyes } = environnement();
    const brevo = fauxBrevo();
    const r = await envoyerModele(env, { modele: 'bienvenue2', to: 'awa@example.com', langue: 'fr', params: {} }, fauxFirestore(abonnee).db);
    expect(r.issue).toBe('canalFerme');
    expect(envoyes).toHaveLength(0);
    expect(brevo.appels).toHaveLength(0);
  });

  it('REFUSE un marketing si Brevo n’est pas configuré — et ne se rabat pas sur Cloudflare', async () => {
    const { env, envoyes } = environnement({ MARKETING_ENVOI_REEL: 'oui', BREVO_API_KEY: undefined });
    const reseau = aucunAppelReseau();
    const r = await envoyerModele(env, { modele: 'bienvenue2', to: 'awa@example.com', langue: 'fr', params: {} }, fauxFirestore(abonnee).db);
    expect(r.issue).toBe('nonConfigure');
    expect(envoyes).toHaveLength(0);
    expect(reseau).not.toHaveBeenCalled();
  });

  it('REFUSE un marketing sans consentement, canal ouvert', async () => {
    const { env, envoyes } = environnement({ MARKETING_ENVOI_REEL: 'oui' });
    const brevo = fauxBrevo();
    const r = await envoyerModele(env, { modele: 'reactivation', to: 'inconnue@example.com', langue: 'fr', params: {} }, fauxFirestore().db);
    expect(r.issue).toBe('sansConsentement');
    expect(envoyes).toHaveLength(0);
    expect(brevo.appels).toHaveLength(0);
  });

  it('refuse un marketing si la base n’est pas fournie', async () => {
    const { env } = environnement({ MARKETING_ENVOI_REEL: 'oui' });
    const r = await envoyerModele(env, { modele: 'quotaRysmo', to: 'awa@example.com', langue: 'fr', params: {} });
    expect(r.issue).toBe('echec');
    expect(r.erreur).toContain('invérifiable');
  });

  it('envoie un marketing par Brevo (unitaire), avec NOS gabarits, le retrait signé et les en-têtes un clic', async () => {
    const { env, envoyes } = environnement({ MARKETING_ENVOI_REEL: 'oui' });
    const brevo = fauxBrevo();
    const r = await envoyerModele(env, { modele: 'nurtureDevis', to: 'awa@example.com', langue: 'en', params: { ref: 'DV-1' } }, fauxFirestore(abonnee).db);
    expect(r.issue).toBe('envoye');
    expect(envoyes).toHaveLength(0); // rien par Cloudflare
    expect(brevo.appels.map((a) => `${a.methode} ${a.chemin}`)).toEqual(['POST /smtp/email']);
    const m = brevo.unitaires[0] as { sender: { email: string }; to: Array<{ email: string }>; subject: string; htmlContent: string; textContent: string; headers: Record<string, string>; tags: string[] };
    expect(m.sender.email).toBe('lettre@lettre.maxmorrys.me');
    expect(m.to).toEqual([{ email: 'awa@example.com' }]);
    expect(m.headers['List-Unsubscribe']).toMatch(/^<https:\/\/api\.maxmorrys\.me\/desabonnement\?e=awa%40example\.com&s=[0-9a-f]{64}&l=en>$/);
    expect(m.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
    expect(m.htmlContent).toContain('Unsubscribe in one click');
    expect(m.htmlContent).toContain('MY ONOMA SARL');
    expect(m.textContent).toContain('/desabonnement?e=awa%40example.com');
    expect(m.subject).toContain('DV-1');
    expect(m.tags).toEqual(['nurtureDevis']);
  });

  it('rend « plafondAtteint » au-delà du quota Brevo du jour, sans appeler Brevo', async () => {
    const { env } = environnement({ MARKETING_ENVOI_REEL: 'oui', MARKETING_PLAFOND_JOUR: '1' });
    const brevo = fauxBrevo();
    const { db } = fauxFirestore({ ...abonnee, 'newsletter/n2': { email: 'moussa@example.com', consent: true } });
    expect((await envoyerModele(env, { modele: 'bienvenue2', to: 'awa@example.com', langue: 'fr', params: {} }, db)).issue).toBe('envoye');
    expect((await envoyerModele(env, { modele: 'bienvenue2', to: 'moussa@example.com', langue: 'fr', params: {} }, db)).issue).toBe('plafondAtteint');
    expect(brevo.unitaires).toHaveLength(1);
  });

  it('un refus de Brevo est un échec, jamais une levée', async () => {
    const { env } = environnement({ MARKETING_ENVOI_REEL: 'oui' });
    const brevo = fauxBrevo();
    brevo.pannes.set('POST /smtp/email', 'reseau');
    const r = await envoyerModele(env, { modele: 'bienvenue3', to: 'awa@example.com', langue: 'fr', params: {} }, fauxFirestore(abonnee).db);
    expect(r).toMatchObject({ issue: 'echec' });
  });

  it('rend « nonConfigure » sans binding, et ne lève jamais', async () => {
    const { env } = environnement({ EMAIL: undefined });
    const r = await envoyerModele(env, { modele: 'accuseAgence', to: 'awa@example.com', langue: 'fr', params: {} });
    expect(r.issue).toBe('nonConfigure');

    const casse = environnement({ EMAIL: { send: async () => { throw new Error('E_RECIPIENT_SUPPRESSED'); } } } as Partial<Env>);
    const r2 = await envoyerModele(casse.env, { modele: 'accuseAgence', to: 'awa@example.com', langue: 'fr', params: {} });
    expect(r2).toEqual({ issue: 'echec', erreur: 'E_RECIPIENT_SUPPRESSED' });
  });
});

describe('le rendu refuse le mauvais régime', () => {
  it('un marketing sans retrait, un transactionnel avec', () => {
    expect(() => rendreModele('bienvenue3', 'fr', {})).toThrow(/sans lien de retrait/);
    expect(() => rendreModele('certificat', 'fr', {}, 'https://api.maxmorrys.me/desabonnement')).toThrow(/avec un lien de retrait/);
  });

  it('ne laisse jamais « Bonjour , » quand le prénom manque', () => {
    const r = rendreModele('accuseAgence', 'fr', { entreprise: 'Ndiaye' });
    expect(r.text.startsWith('Bonjour,')).toBe(true);
    expect(r.html).not.toContain('Bonjour ,');
  });
});
