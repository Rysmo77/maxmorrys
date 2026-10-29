import { afterEach, describe, expect, it, vi } from 'vitest';

import { resynchroniserRetraits, synchroniserAudience } from '../src/lib/brevo-contacts';
import { brevoConfigure } from '../src/lib/brevo-send';
import type { Env } from '../src/env';
import { fauxBrevo } from './helpers/faux-brevo';
import { fauxFirestore } from './helpers/faux-firestore';

/**
 * LA SYNCHRONISATION FIRESTORE ⇄ BREVO.
 *
 * Deux défauts silencieux à interdire : un retrait fait chez Brevo qui ne remonte pas (la
 * personne revient dans l'audience le lendemain), et une liste noire de Brevo levée par notre
 * poussée sans nouvel accord (une plainte ou un rebond dur effacés par erreur).
 */

afterEach(() => { vi.unstubAllGlobals(); });

const env = {
  BREVO_API_KEY: 'xkeysib-test',
  BREVO_LIST_ID: '4',
  BREVO_SENDER_EMAIL: 'lettre@lettre.maxmorrys.me',
  MARKETING_ENVOI_REEL: 'oui',
} as unknown as Env;

const BASE = {
  'newsletter/n1': { email: 'awa@example.com', consent: true, locale: 'fr' },
  'newsletter/n2': { email: 'moussa@example.com', consent: true, locale: 'fr' },
  'newsletter/n4': { email: 'parti@example.com', consent: true, unsubscribedAt: '2026-10-01T00:00:00Z' },
  'users/u5': { email: 'fatou@example.com', role: 'student', preferences: { newsletter: true } },
  'users/a1': { email: 'admin@maxmorrys.me', role: 'admin', preferences: { newsletter: true } },
  'waitlist/w1': { email: 'attente@example.com' },
  'transactions/t1': { userEmail: 'client@example.com' },
};

describe('la configuration', () => {
  it('exige la clé, une liste numérique et un expéditeur', () => {
    expect(brevoConfigure(env)).toBe(true);
    expect(brevoConfigure({ ...env, BREVO_API_KEY: undefined })).toBe(false);
    expect(brevoConfigure({ ...env, BREVO_LIST_ID: 'abc' })).toBe(false);
    expect(brevoConfigure({ ...env, BREVO_SENDER_EMAIL: '' })).toBe(false);
  });
});

describe('les retraits faits chez Brevo remontent dans Firestore', () => {
  it('liste noire et désinscription de liste → unsubscribedAt / préférence à false, une seule fois', async () => {
    const brevo = fauxBrevo({ contacts: [{ email: 'awa@example.com', bloque: true }, { email: 'fatou@example.com', desinscrit: [4] }, { email: 'moussa@example.com' }] });
    const { db, docs } = fauxFirestore(BASE);
    const b = await resynchroniserRetraits(db, env);
    expect(b).toMatchObject({ ok: true, lus: 3, repris: 2 });
    expect(docs.get('newsletter/n1')?.unsubscribedAt).toBeTruthy();
    expect(docs.get('newsletter/n2')?.unsubscribedAt).toBeUndefined();
    expect((docs.get('users/u5')?.preferences as Record<string, unknown>).newsletter).toBe(false);

    const rejeu = await resynchroniserRetraits(db, env);
    expect(rejeu).toMatchObject({ ok: true, repris: 0 });
    expect(brevo.appels.every((a) => a.methode === 'GET')).toBe(true); // la reprise ne fait que LIRE Brevo
  });

  it('pagine au-delà de 500 contacts', async () => {
    const contacts = Array.from({ length: 1203 }, (_, i) => ({ email: `c${i}@example.com`, bloque: i === 1202 }));
    const brevo = fauxBrevo({ contacts });
    const b = await resynchroniserRetraits(fauxFirestore().db, env);
    expect(b).toMatchObject({ ok: true, lus: 1203, repris: 1 });
    expect(brevo.appels.filter((a) => a.chemin === '/contacts/lists/4/contacts')).toHaveLength(3);
  });
});

describe('la poussée vers Brevo', () => {
  it('n’ajoute que les consentants absents de la liste, sans attribut, et jamais personnel/attente/clients', async () => {
    const brevo = fauxBrevo({ contacts: [{ email: 'moussa@example.com' }] });
    const b = await synchroniserAudience(fauxFirestore(BASE).db, env);
    expect(b).toMatchObject({ lus: 1, ajoutes: 2, bloques: 0, echecs: 0 });
    const ecrits = brevo.appels.filter((a) => a.methode === 'POST' && a.chemin === '/contacts');
    expect(ecrits.map((a) => (a.corps as { email: string }).email).sort()).toEqual(['awa@example.com', 'fatou@example.com']);
    for (const a of ecrits) {
      expect(a.corps).not.toHaveProperty('attributes');
      expect(a.corps).not.toHaveProperty('emailBlacklisted'); // on ne touche jamais l'état de retrait sans raison
    }
  });

  it('incrémentale : un second passage n’écrit rien', async () => {
    const brevo = fauxBrevo();
    const { db } = fauxFirestore(BASE);
    await synchroniserAudience(db, env);
    const avant = brevo.appels.length;
    const b = await synchroniserAudience(db, env);
    expect(b).toMatchObject({ ajoutes: 0, bloques: 0 });
    expect(brevo.appels.slice(avant).every((a) => a.methode === 'GET')).toBe(true);
  });

  it('met en liste noire un retiré CHEZ NOUS que Brevo connaît encore — et n’envoie pas un retiré inconnu', async () => {
    const brevo = fauxBrevo({ contacts: [{ email: 'parti@example.com' }] });
    const b = await synchroniserAudience(fauxFirestore(BASE).db, env);
    expect(b.bloques).toBe(1);
    expect(brevo.contacts.get('parti@example.com')?.bloque).toBe(true);

    const vierge = fauxBrevo();
    await synchroniserAudience(fauxFirestore(BASE).db, env);
    expect(vierge.contacts.has('parti@example.com')).toBe(false);
  });

  it('ne lève une liste noire QUE sur un réabonnement explicite après un retrait repris', async () => {
    const brevo = fauxBrevo({ contacts: [{ email: 'fatou@example.com', bloque: true }] });
    const { db, docs } = fauxFirestore(BASE);
    // Jour 1 : le retrait de Fatou chez Brevo remonte ; on ne la débloque pas.
    await synchroniserAudience(db, env);
    expect(brevo.contacts.get('fatou@example.com')?.bloque).toBe(true);
    expect((docs.get('users/u5')?.preferences as Record<string, unknown>).newsletter).toBe(false);

    // Jour 2 : elle recoche la préférence dans son espace → nouvel accord.
    docs.set('users/u5', { ...docs.get('users/u5'), preferences: { newsletter: true } });
    const b = await synchroniserAudience(db, env);
    expect(b.reabonnes).toBe(1);
    expect(brevo.contacts.get('fatou@example.com')?.bloque).toBe(false);
    expect([...docs.keys()].some((k) => k.startsWith('brevo_retraits/'))).toBe(false);
  });

  it('ne pousse RIEN sans l’accord — mais reprend quand même les retraits', async () => {
    const brevo = fauxBrevo({ contacts: [{ email: 'awa@example.com', bloque: true }] });
    const { db, docs } = fauxFirestore(BASE);
    const b = await synchroniserAudience(db, { ...env, MARKETING_ENVOI_REEL: 'non' });
    expect(b).toMatchObject({ repris: 1, ajoutes: 0 });
    expect(brevo.appels.every((a) => a.methode === 'GET')).toBe(true);
    expect(docs.get('newsletter/n1')?.unsubscribedAt).toBeTruthy();
  });

  it('ne pousse RIEN si la lecture de Brevo échoue', async () => {
    const brevo = fauxBrevo();
    brevo.pannes.set('GET /contacts/lists/4/contacts', 503);
    const b = await synchroniserAudience(fauxFirestore(BASE).db, env);
    expect(b.erreurs[0]).toMatch(/lecture des contacts Brevo impossible/);
    expect(brevo.appels.filter((a) => a.methode === 'POST')).toHaveLength(0);
  });

  it('sans configuration : aucun appel, une raison', async () => {
    const brevo = fauxBrevo();
    const b = await synchroniserAudience(fauxFirestore(BASE).db, { ...env, BREVO_API_KEY: undefined });
    expect(b.erreurs[0]).toMatch(/non configuré/);
    expect(brevo.appels).toHaveLength(0);
  });
});
