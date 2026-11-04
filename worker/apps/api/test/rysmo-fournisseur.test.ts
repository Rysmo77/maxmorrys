import { describe, expect, it, vi } from 'vitest';

import type { Env } from '../src/env';
import { ClaudeIndisponible } from '../src/lib/claude';
import { genererReponseRysmo, lireFournisseur, type Generateurs } from '../src/lib/rysmo-fournisseur';

/** Claude d'abord, Gemini en secours ; `RYSMO_PROVIDER=gemini` revient en arrière sans code. */

const DEMANDE = {
  message: 'Salut',
  history: [{ role: 'user' as const, content: 'a' }, { role: 'assistant' as const, content: 'b' }],
  system: { stable: 'RÈGLES', variable: 'PRÉNOM' },
};

function env(provider?: string): Env {
  return { RYSMO_PROVIDER: provider, ANTHROPIC_API_KEY: 'k', GOOGLE_AI_API_KEY: 'g' } as unknown as Env;
}

function generateurs(claude: Generateurs['claude']): Generateurs & { gemini: ReturnType<typeof vi.fn> } {
  return { claude, gemini: vi.fn(async () => 'réponse Gemini') } as never;
}

describe('le fournisseur de Rysmo', () => {
  it('lit l’interrupteur : claude par défaut, gemini sur demande', () => {
    expect(lireFournisseur(undefined)).toBe('claude');
    expect(lireFournisseur('claude')).toBe('claude');
    expect(lireFournisseur(' Gemini ')).toBe('gemini');
    expect(lireFournisseur('autre')).toBe('claude');
  });

  it('Claude répond : Gemini n’est pas appelé', async () => {
    const claude = vi.fn(async () => 'réponse Claude');
    const g = generateurs(claude);
    const r = await genererReponseRysmo(env(), DEMANDE, g);
    expect(r).toEqual({ texte: 'réponse Claude', fournisseur: 'claude' });
    expect(g.gemini).not.toHaveBeenCalled();
    expect(claude).toHaveBeenCalledWith(expect.anything(), 'Salut', expect.objectContaining({ system: DEMANDE.system, history: DEMANDE.history }));
  });

  for (const raison of ['reseau', 'serveur', 'quota', 'refus', 'coupe', 'config'] as const) {
    it(`Claude échoue (${raison}) : Gemini répond à sa place`, async () => {
      const g = generateurs(vi.fn(async () => {
        throw new ClaudeIndisponible(raison, 'x');
      }));
      const r = await genererReponseRysmo(env('claude'), DEMANDE, g);
      expect(r).toEqual({ texte: 'réponse Gemini', fournisseur: 'gemini', secours: raison });
      expect(g.gemini).toHaveBeenCalledTimes(1);
    });
  }

  it('le secours Gemini garde ses paramètres d’origine et reçoit tout le prompt', async () => {
    const g = generateurs(vi.fn(async () => {
      throw new ClaudeIndisponible('serveur', 'x');
    }));
    await genererReponseRysmo(env(), DEMANDE, g);
    expect(g.gemini).toHaveBeenCalledWith(expect.anything(), [{ text: 'Salut' }], expect.objectContaining({
      systemInstruction: 'RÈGLES\nPRÉNOM',
      temperature: 0.7,
      maxOutputTokens: 1024,
      history: [
        { role: 'user', parts: [{ text: 'a' }] },
        { role: 'model', parts: [{ text: 'b' }] },
      ],
    }));
  });

  it('RYSMO_PROVIDER=gemini : Claude n’est jamais appelé', async () => {
    const claude = vi.fn(async () => 'réponse Claude');
    const g = generateurs(claude);
    const r = await genererReponseRysmo(env('gemini'), DEMANDE, g);
    expect(r.fournisseur).toBe('gemini');
    expect(claude).not.toHaveBeenCalled();
  });

  it('si Gemini échoue aussi, son erreur remonte', async () => {
    const g: Generateurs = {
      claude: vi.fn(async () => {
        throw new ClaudeIndisponible('reseau', 'x');
      }),
      gemini: vi.fn(async () => {
        throw new Error('Gemini en panne');
      }),
    };
    await expect(genererReponseRysmo(env(), DEMANDE, g)).rejects.toThrow('Gemini en panne');
  });
});
