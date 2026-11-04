import type { Firestore } from '@mm/firestore-rest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { translateBatchDetaille, translateCachedDetaille, translateMetaToEnDetaille } from '../src/translate';

/**
 * La traduction FR→EN : Gemini d'abord, Claude Haiku en SECOURS, et un repli en français
 * qui n'entre JAMAIS dans le cache `translations/` (il y serait servi pour toujours).
 */

const json = (corps: unknown, status = 200) =>
  new Response(JSON.stringify(corps), { status, headers: { 'content-type': 'application/json' } });

const gemini = (tableau: unknown) =>
  json({ candidates: [{ content: { parts: [{ text: JSON.stringify(tableau) }] } }] });

const claude = (texte: string, stop = 'end_turn') =>
  json({
    id: 'msg', type: 'message', role: 'assistant', model: 'claude-haiku-5-5',
    content: [{ type: 'text', text: texte }], stop_reason: stop, stop_sequence: null, stop_details: null,
    usage: { input_tokens: 1, output_tokens: 1 },
  });

/** Route les appels : Gemini (generativelanguage) d'un côté, Claude (anthropic) de l'autre. */
function routeur(reponses: { gemini?: () => Response; claude?: () => Response }) {
  const appels = { gemini: 0, claude: 0, corpsClaude: [] as Record<string, unknown>[] };
  const f = vi.fn(async (entree: unknown, init?: RequestInit) => {
    const url = String(entree instanceof Request ? entree.url : entree);
    if (url.includes('anthropic')) {
      appels.claude += 1;
      appels.corpsClaude.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
      return reponses.claude?.() ?? json({}, 500);
    }
    appels.gemini += 1;
    return reponses.gemini?.() ?? json({}, 500);
  });
  vi.stubGlobal('fetch', f);
  return appels;
}

function fauxDb() {
  const ecrits: Array<{ path: string; data: Record<string, unknown> }> = [];
  const db = {
    getAll: vi.fn(async (paths: string[]) => paths.map(() => null)),
    buildWrite: vi.fn((path: string, data: Record<string, unknown>) => ({ path, data })),
    commit: vi.fn(async (writes: Array<{ path: string; data: Record<string, unknown> }>) => {
      ecrits.push(...writes);
    }),
  };
  return { db: db as unknown as Firestore, ecrits, commit: db.commit };
}

const CONFIG = { baseUrl: 'https://generativelanguage.googleapis.com', apiKey: 'g', anthropicApiKey: 'a' };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('translateBatchDetaille', () => {
  it('Gemini répond : Claude n’est pas appelé', async () => {
    const appels = routeur({ gemini: () => gemini(['Hello']) });
    expect(await translateBatchDetaille(['Bonjour'], CONFIG)).toEqual(['Hello']);
    expect(appels.claude).toBe(0);
  });

  it('Gemini échoue : Claude Haiku traduit, sans température, max_tokens ≥ 2048', async () => {
    const appels = routeur({ gemini: () => json({}, 503), claude: () => claude('```json\n["Hello"]\n```') });
    expect(await translateBatchDetaille(['Bonjour'], CONFIG)).toEqual(['Hello']);
    expect(appels.claude).toBe(1);
    expect(appels.corpsClaude[0].model).toBe('claude-haiku-5-5');
    expect(appels.corpsClaude[0]).not.toHaveProperty('temperature');
    expect(appels.corpsClaude[0].max_tokens as number).toBeGreaterThanOrEqual(2048);
  });

  it('JSON Gemini illisible : secours Claude aussi', async () => {
    routeur({ gemini: () => gemini('pas un tableau'), claude: () => claude('["Hello"]') });
    expect(await translateBatchDetaille(['Bonjour'], CONFIG)).toEqual(['Hello']);
  });

  it('sans clé Claude, une panne Gemini lève comme avant', async () => {
    routeur({ gemini: () => json({}, 500) });
    await expect(translateBatchDetaille(['Bonjour'], { baseUrl: CONFIG.baseUrl, apiKey: 'g' })).rejects.toThrow();
  });

  it('une réponse Claude coupée n’est pas acceptée', async () => {
    routeur({ gemini: () => json({}, 500), claude: () => claude('["Hel', 'max_tokens') });
    await expect(translateBatchDetaille(['Bonjour'], CONFIG)).rejects.toThrow();
  });
});

describe('le cache translations/', () => {
  it('une case illisible est servie en français mais N’EST PAS écrite dans le cache', async () => {
    routeur({ gemini: () => gemini(['Hello', 42]) });
    const { db, ecrits } = fauxDb();
    const { traductions, replis } = await translateCachedDetaille(db, CONFIG, ['Bonjour', 'Au revoir']);
    expect(traductions).toEqual({ Bonjour: 'Hello', 'Au revoir': 'Au revoir' });
    expect([...replis]).toEqual(['Au revoir']);
    expect(ecrits.map((w) => w.data.source)).toEqual(['Bonjour']);
  });

  it('les deux modèles en panne : rien n’est écrit', async () => {
    routeur({});
    const { db, commit } = fauxDb();
    await expect(translateCachedDetaille(db, CONFIG, ['Bonjour'])).rejects.toThrow();
    expect(commit).not.toHaveBeenCalled();
  });
});

describe('translateMetaToEnDetaille', () => {
  const META = { title: 'Accueil', description: 'Former. Construire.' };

  it('traduction complète', async () => {
    routeur({ gemini: () => gemini(['Home', 'Train. Build.']) });
    const { db } = fauxDb();
    const r = await translateMetaToEnDetaille(db, CONFIG, META);
    expect(r.complete).toBe(true);
    expect(r.meta.title).toBe('Home');
  });

  it('panne totale : la meta française revient, marquée incomplète (pour un TTL court)', async () => {
    routeur({});
    const { db } = fauxDb();
    const r = await translateMetaToEnDetaille(db, CONFIG, META);
    expect(r).toEqual({ meta: META, complete: false });
  });
});
