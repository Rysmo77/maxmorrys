import { describe, expect, it } from 'vitest';

import type { DecodedIdToken } from '@mm/firebase-auth-rest';
import { FIREBASE_CUSTOM_TOKEN_AUDIENCE, signFirebaseCustomToken } from '@mm/gcp-auth';

import type { Env } from '../src/env';
import { handleSessionTransfer, TTL_CODE_SECONDES, type DependancesTransfert } from '../src/sessionTransfer';

/**
 * Le transfert de session entre maxmorrys.me, edu. et club. Ce qui doit tenir : un code ne
 * s'obtient qu'avec un ID token valide, ne sert qu'une fois, meurt après 60 s, et ne
 * s'échange que depuis l'origine qu'il désigne.
 */

const HUB = 'https://maxmorrys.me';
const EDU = 'https://edu.maxmorrys.me';

/** Un KV en mémoire qui respecte `expirationTtl` sur l'horloge du test. */
class KvMemoire {
  donnees = new Map<string, { valeur: string; expire: number }>();
  constructor(private horloge: () => number) {}
  async get(k: string): Promise<string | null> {
    const e = this.donnees.get(k);
    if (!e || e.expire <= this.horloge()) return null;
    return e.valeur;
  }
  async put(k: string, valeur: string, opts?: { expirationTtl?: number }): Promise<void> {
    this.donnees.set(k, { valeur, expire: this.horloge() + (opts?.expirationTtl ?? 1e9) });
  }
  async delete(k: string): Promise<void> {
    this.donnees.delete(k);
  }
}

function monter() {
  let t = 1_800_000_000;
  const horloge = () => t;
  const kv = new KvMemoire(horloge);
  const env = {
    ALLOWED_ORIGINS: `${HUB},${EDU},https://club.maxmorrys.me`,
    TRANSFERTS_SESSION: kv as unknown as KVNamespace,
  } as unknown as Env;
  const signes: string[] = [];
  const deps: DependancesTransfert = {
    // Le vrai vérificateur rend `null` pour un jeton absent OU invalide : c'est ce qu'on imite.
    verifier: async (bearer) => (bearer === 'jeton-valide' ? ({ uid: 'u-42' } as DecodedIdToken) : null),
    maintenant: horloge,
    signer: async (uid) => {
      signes.push(uid);
      return `custom-token-${uid}`;
    },
  };
  return { env, deps, kv, signes, avancer: (s: number) => { t += s; } };
}

function requete(chemin: string, corps: unknown, origine: string | null, bearer?: string): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (origine) headers.Origin = origine;
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  return new Request(`https://api.maxmorrys.me/${chemin}`, { method: 'POST', headers, body: JSON.stringify(corps) });
}

async function emettre(m: ReturnType<typeof monter>, cible = EDU): Promise<string> {
  const r = await handleSessionTransfer(requete('session/emettre', { cible }, HUB, 'jeton-valide'), m.env, m.deps);
  expect(r.status).toBe(200);
  const { code } = (await r.json()) as { code: string };
  return code;
}

describe('POST /session/emettre', () => {
  it('rend un code de 32 octets, stocké haché, pour un ID token valide', async () => {
    const m = monter();
    const code = await emettre(m);
    expect(code).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect([...m.kv.donnees.keys()].some((k) => k.includes(code))).toBe(false);
    expect(m.kv.donnees.size).toBe(1);
  });

  it('refuse un ID token absent', async () => {
    const m = monter();
    const r = await handleSessionTransfer(requete('session/emettre', { cible: EDU }, HUB), m.env, m.deps);
    expect(r.status).toBe(401);
    expect(m.kv.donnees.size).toBe(0);
  });

  it('refuse un ID token invalide', async () => {
    const m = monter();
    const r = await handleSessionTransfer(requete('session/emettre', { cible: EDU }, HUB, 'jeton-forge'), m.env, m.deps);
    expect(r.status).toBe(401);
    expect(m.kv.donnees.size).toBe(0);
  });

  it('refuse une origine hors liste, et une cible hors liste', async () => {
    const m = monter();
    const a = await handleSessionTransfer(requete('session/emettre', { cible: EDU }, 'https://evil.example', 'jeton-valide'), m.env, m.deps);
    expect(a.status).toBe(403);
    const b = await handleSessionTransfer(requete('session/emettre', { cible: 'https://evil.example' }, HUB, 'jeton-valide'), m.env, m.deps);
    expect(b.status).toBe(400);
    const c = await handleSessionTransfer(requete('session/emettre', { cible: EDU }, null, 'jeton-valide'), m.env, m.deps);
    expect(c.status).toBe(403);
  });
});

describe('POST /session/echanger', () => {
  it('rend un custom token, une seule fois', async () => {
    const m = monter();
    const code = await emettre(m);
    const r1 = await handleSessionTransfer(requete('session/echanger', { code }, EDU), m.env, m.deps);
    expect(r1.status).toBe(200);
    expect(await r1.json()).toEqual({ token: 'custom-token-u-42' });
    expect(r1.headers.get('Access-Control-Allow-Origin')).toBe(EDU);

    const r2 = await handleSessionTransfer(requete('session/echanger', { code }, EDU), m.env, m.deps);
    expect(r2.status).toBe(410);
    expect(m.signes).toEqual(['u-42']);
  });

  it('refuse un code expiré', async () => {
    const m = monter();
    const code = await emettre(m);
    m.avancer(TTL_CODE_SECONDES + 1);
    const r = await handleSessionTransfer(requete('session/echanger', { code }, EDU), m.env, m.deps);
    expect(r.status).toBe(410);
    expect(m.signes).toEqual([]);
  });

  it('refuse un code expiré même si le stockage l’a encore', async () => {
    const m = monter();
    const code = await emettre(m);
    // KV purge en différé : l'échéance écrite dans l'enregistrement fait foi.
    for (const e of m.kv.donnees.values()) e.expire = Number.MAX_SAFE_INTEGER;
    m.avancer(TTL_CODE_SECONDES);
    const r = await handleSessionTransfer(requete('session/echanger', { code }, EDU), m.env, m.deps);
    expect(r.status).toBe(410);
    expect(await r.json()).toEqual({ erreur: 'code-expire' });
  });

  it('refuse l’échange depuis une autre origine que la cible — et consomme le code', async () => {
    const m = monter();
    const code = await emettre(m, EDU);
    const r = await handleSessionTransfer(requete('session/echanger', { code }, 'https://club.maxmorrys.me'), m.env, m.deps);
    expect(r.status).toBe(403);
    const r2 = await handleSessionTransfer(requete('session/echanger', { code }, EDU), m.env, m.deps);
    expect(r2.status).toBe(410);
    expect(m.signes).toEqual([]);
  });

  it('refuse une origine hors liste et un code mal formé', async () => {
    const m = monter();
    const code = await emettre(m);
    const a = await handleSessionTransfer(requete('session/echanger', { code }, 'https://evil.example'), m.env, m.deps);
    expect(a.status).toBe(403);
    const b = await handleSessionTransfer(requete('session/echanger', { code: 'court' }, EDU), m.env, m.deps);
    expect(b.status).toBe(400);
  });
});

describe('signFirebaseCustomToken', () => {
  it('signe en RS256 les claims que Firebase exige', async () => {
    const paire = (await crypto.subtle.generateKey(
      { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
      true,
      ['sign', 'verify'],
    )) as CryptoKeyPair;
    const pkcs8 = new Uint8Array((await crypto.subtle.exportKey('pkcs8', paire.privateKey)) as ArrayBuffer);
    const pem = `-----BEGIN PRIVATE KEY-----\n${btoa(String.fromCharCode(...pkcs8))}\n-----END PRIVATE KEY-----\n`;
    const sa = { client_email: 'sa@max-morrys.iam.gserviceaccount.com', private_key: pem, project_id: 'max-morrys', private_key_id: 'test-transfert' };

    const jeton = await signFirebaseCustomToken(sa, 'u-42', 1_800_000_000);
    const [h, p, sig] = jeton.split('.');
    const decode = (x: string) => JSON.parse(atob(x.replace(/-/g, '+').replace(/_/g, '/')));
    expect(decode(h)).toEqual({ alg: 'RS256', typ: 'JWT' });
    expect(decode(p)).toEqual({
      iss: sa.client_email,
      sub: sa.client_email,
      aud: FIREBASE_CUSTOM_TOKEN_AUDIENCE,
      iat: 1_800_000_000,
      exp: 1_800_003_600,
      uid: 'u-42',
    });
    const signature = Uint8Array.from(atob(sig.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', paire.publicKey, signature, new TextEncoder().encode(`${h}.${p}`));
    expect(ok).toBe(true);
  });
});
