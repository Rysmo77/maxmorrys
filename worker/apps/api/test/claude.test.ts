import { describe, expect, it, vi } from 'vitest';

import {
  CLAUDE_MIN_MAX_TOKENS,
  CLAUDE_MODEL,
  ClaudeIndisponible,
  construireRequeteClaude,
  genererClaude,
} from '../src/lib/claude';

/**
 * Le client Claude de Rysmo. Deux pièges mesurés au test à l'aveugle du 01/11/2026 :
 * `max_tokens` à 1024 coupait deux réponses sur dix (la réflexion y est comptée), et
 * `temperature` est rejetée par l'API sur ce modèle.
 */

function reponseClaude(corps: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(corps), { status, headers: { 'content-type': 'application/json' } });
}

const MESSAGE_OK = {
  id: 'msg_1',
  type: 'message',
  role: 'assistant',
  model: CLAUDE_MODEL,
  content: [{ type: 'text', text: 'Salut Awa !' }],
  stop_reason: 'end_turn',
  stop_sequence: null,
  stop_details: null,
  usage: { input_tokens: 10, output_tokens: 5 },
};

describe('la requête envoyée à Claude', () => {
  it('Haiku 5.5, effort bas, max_tokens ≥ 2048, aucune température', () => {
    const requete = construireRequeteClaude('Bonjour', { maxTokens: 1024 });
    expect(requete.model).toBe('claude-haiku-5-5');
    expect(requete.max_tokens).toBeGreaterThanOrEqual(2048);
    expect(requete.max_tokens).toBe(CLAUDE_MIN_MAX_TOKENS);
    expect(requete.output_config).toEqual({ effort: 'low' });
    expect(requete).not.toHaveProperty('temperature');
    expect(requete).not.toHaveProperty('top_p');
  });

  it('la partie stable du prompt porte le cache, la partie variable vient après', () => {
    const requete = construireRequeteClaude('Q', {
      system: { stable: 'RÈGLES', variable: "L'élève s'appelle Awa." },
      history: [{ role: 'user', content: 'a' }, { role: 'assistant', content: 'b' }],
    });
    expect(requete.system).toEqual([
      { type: 'text', text: 'RÈGLES', cache_control: { type: 'ephemeral' } },
      { type: 'text', text: "L'élève s'appelle Awa." },
    ]);
    expect(requete.messages).toEqual([
      { role: 'user', content: 'a' },
      { role: 'assistant', content: 'b' },
      { role: 'user', content: 'Q' },
    ]);
  });
});

describe('genererClaude', () => {
  it('envoie réellement max_tokens 2048 et aucune température', async () => {
    const fetchMock = vi.fn(async (_url: unknown, _init?: RequestInit) => reponseClaude(MESSAGE_OK));
    const texte = await genererClaude({ ANTHROPIC_API_KEY: 'k' }, 'Bonjour', {}, fetchMock as unknown as typeof fetch);
    expect(texte).toBe('Salut Awa !');
    const corps = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as Record<string, unknown>;
    expect(corps.max_tokens).toBe(2048);
    expect(corps.model).toBe('claude-haiku-5-5');
    expect(corps).not.toHaveProperty('temperature');
  });

  const cas: Array<[string, () => Response, string]> = [
    ['refus', () => reponseClaude({ ...MESSAGE_OK, content: [], stop_reason: 'refusal', stop_details: { type: 'refusal', category: null, explanation: null } }), 'refus'],
    ['réponse coupée', () => reponseClaude({ ...MESSAGE_OK, stop_reason: 'max_tokens' }), 'coupe'],
    ['réponse vide', () => reponseClaude({ ...MESSAGE_OK, content: [] }), 'vide'],
    ['5xx', () => reponseClaude({ type: 'error', error: { type: 'api_error', message: 'boom' } }, 500), 'serveur'],
    ['529 surcharge', () => reponseClaude({ type: 'error', error: { type: 'overloaded_error', message: 'busy' } }, 529), 'serveur'],
    ['429', () => reponseClaude({ type: 'error', error: { type: 'rate_limit_error', message: 'slow' } }, 429), 'quota'],
  ];
  for (const [nom, reponse, raison] of cas) {
    it(`${nom} → ClaudeIndisponible(${raison})`, async () => {
      const fetchMock = vi.fn(async () => reponse());
      await expect(
        genererClaude({ ANTHROPIC_API_KEY: 'k' }, 'Q', {}, fetchMock as unknown as typeof fetch),
      ).rejects.toMatchObject({ name: 'ClaudeIndisponible', raison });
    });
  }

  it('erreur réseau → ClaudeIndisponible(reseau)', async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError('fetch failed');
    });
    await expect(
      genererClaude({ ANTHROPIC_API_KEY: 'k' }, 'Q', {}, fetchMock as unknown as typeof fetch),
    ).rejects.toMatchObject({ raison: 'reseau' });
  });

  it('sans clé, aucun appel', async () => {
    const fetchMock = vi.fn();
    await expect(genererClaude({}, 'Q', {}, fetchMock as unknown as typeof fetch)).rejects.toBeInstanceOf(ClaudeIndisponible);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
