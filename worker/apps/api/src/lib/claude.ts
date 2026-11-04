import Anthropic from '@anthropic-ai/sdk';

import type { Env } from '../env';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * CLAUDE HAIKU — le fournisseur principal de Rysmo depuis le 01/11/2026 (décision de Max).
 *
 * Un test à l'aveugle sur dix questions réelles (`eval-rysmo`, 01/11/2026) a montré que
 * Gemini 2.5 Flash inventait une formation et deux liens, là où Claude Haiku n'inventait
 * rien. Gemini reste le SECOURS (`rysmo-fournisseur.ts`) et l'interrupteur `RYSMO_PROVIDER`
 * permet de revenir à Gemini seul sans toucher au code.
 *
 * TROIS PARAMÈTRES QUI NE SONT PAS DES DÉTAILS :
 *
 *  - `max_tokens` ≥ 2048. Haiku 5.5 réfléchit même en `effort: "low"`, et cette réflexion
 *    est COMPTÉE dans `max_tokens`. À 1024, deux réponses sur dix ont été coupées en plein
 *    mot (846 jetons de réflexion sur 1024). `CLAUDE_MIN_MAX_TOKENS` est un plancher, pas un
 *    défaut : une valeur inférieure demandée par un appelant est relevée.
 *  - AUCUNE `temperature` : l'API la rejette (400) sur ce modèle.
 *  - `maxRetries: 0` : le secours, c'est Gemini. Un nouvel essai du SDK ajouterait de la
 *    latence à une réponse que l'élève attend déjà.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

export const CLAUDE_MODEL = 'claude-haiku-5-5';
export const CLAUDE_MIN_MAX_TOKENS = 2048;

/** Pourquoi Claude n'a pas rendu de réponse exploitable — journalisé, jamais montré. */
export type RaisonEchec =
  | 'config' // clé absente
  | 'reseau' // connexion, délai dépassé
  | 'serveur' // 5xx, 529 surcharge
  | 'quota' // 429
  | 'refus' // stop_reason « refusal »
  | 'coupe' // stop_reason « max_tokens » : une réponse coupée ne s'affiche pas
  | 'vide' // aucun bloc texte
  | 'requete'; // 4xx autre : un défaut de notre côté

export class ClaudeIndisponible extends Error {
  constructor(
    readonly raison: RaisonEchec,
    message: string,
  ) {
    super(message);
    this.name = 'ClaudeIndisponible';
  }
}

export interface TourHistorique {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeOptions {
  /**
   * Le prompt système en DEUX parties. `stable` (règles, base de connaissance, catalogue)
   * est identique d'un élève à l'autre : il porte le point de cache. `variable` (prénom,
   * mémoire, leçon) change à chaque requête et vient après — sinon il invaliderait tout.
   */
  system?: { stable: string; variable?: string };
  history?: TourHistorique[];
  maxTokens?: number;
  timeoutMs?: number;
}

/** Construit la requête — pure, pour que les tests vérifient ce qui part réellement. */
export function construireRequeteClaude(
  message: string,
  options: ClaudeOptions = {},
): Anthropic.MessageCreateParamsNonStreaming {
  const system: Anthropic.TextBlockParam[] = [];
  if (options.system?.stable) {
    system.push({ type: 'text', text: options.system.stable, cache_control: { type: 'ephemeral' } });
  }
  if (options.system?.variable) system.push({ type: 'text', text: options.system.variable });

  return {
    model: CLAUDE_MODEL,
    max_tokens: Math.max(CLAUDE_MIN_MAX_TOKENS, options.maxTokens ?? CLAUDE_MIN_MAX_TOKENS),
    output_config: { effort: 'low' },
    ...(system.length ? { system } : {}),
    messages: [
      ...(options.history ?? []).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ],
  };
}

function classer(error: unknown): ClaudeIndisponible {
  if (error instanceof ClaudeIndisponible) return error;
  // Du plus précis au plus large : le délai dépassé est une erreur de connexion.
  if (error instanceof Anthropic.APIConnectionError) {
    return new ClaudeIndisponible('reseau', error.message);
  }
  if (error instanceof Anthropic.RateLimitError) return new ClaudeIndisponible('quota', error.message);
  if (error instanceof Anthropic.APIError) {
    const status = error.status ?? 0;
    return new ClaudeIndisponible(status >= 500 ? 'serveur' : 'requete', `HTTP ${status} : ${error.message}`);
  }
  return new ClaudeIndisponible('reseau', error instanceof Error ? error.message : String(error));
}

/**
 * Renvoie le texte de la réponse, ou lève `ClaudeIndisponible` — jamais une réponse coupée,
 * vide ou refusée : c'est à l'appelant de passer au secours.
 *
 * `fetchImpl` n'existe que pour les tests (le SDK appelle le `fetch` du runtime sinon).
 */
export async function genererClaude(
  env: Pick<Env, 'ANTHROPIC_API_KEY'>,
  message: string,
  options: ClaudeOptions = {},
  fetchImpl?: typeof fetch,
): Promise<string> {
  if (!env.ANTHROPIC_API_KEY) throw new ClaudeIndisponible('config', 'ANTHROPIC_API_KEY absente');

  const client = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    maxRetries: 0,
    timeout: options.timeoutMs ?? 30_000,
    ...(fetchImpl ? { fetch: fetchImpl } : {}),
  });

  let reponse: Anthropic.Message;
  try {
    reponse = await client.messages.create(construireRequeteClaude(message, options));
  } catch (error: unknown) {
    throw classer(error);
  }

  if (reponse.stop_reason === 'refusal') {
    throw new ClaudeIndisponible('refus', `refus (${reponse.stop_details?.category ?? 'sans catégorie'})`);
  }
  if (reponse.stop_reason === 'max_tokens') {
    throw new ClaudeIndisponible('coupe', `réponse coupée à ${reponse.usage.output_tokens} jetons`);
  }
  const texte = reponse.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
  if (!texte) throw new ClaudeIndisponible('vide', 'aucun texte');
  return texte;
}
