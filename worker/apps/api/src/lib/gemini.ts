import { HttpsError } from '@mm/shared';

import type { Env } from '../env';

/**
 * Appel Gemini par l'API REST.
 *
 * Le SDK `@google/genai` n'est pas embarqué : un `fetch` suffit, et cela évite
 * une dépendance de plus dans le bundle. `env.GEMINI_BASE_URL` permet de router
 * vers AI Gateway sans changer une ligne d'appel.
 */

export interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

export interface GeminiOptions {
  model?: string;
  temperature?: number;
  /** Impose une réponse JSON. */
  json?: boolean;
  maxOutputTokens?: number;
  timeoutMs?: number;
  /** Historique de conversation, hors message courant. */
  history?: Array<{ role: 'user' | 'model'; parts: GeminiPart[] }>;
  systemInstruction?: string;
}

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string; status?: string };
}

/** Renvoie le texte brut de la première réponse. */
export async function generateContent(
  env: Env,
  parts: GeminiPart[],
  options: GeminiOptions = {},
): Promise<string> {
  if (!env.GOOGLE_AI_API_KEY) {
    throw new HttpsError('internal', 'Service IA non configuré.');
  }

  const model = options.model ?? 'gemini-2.5-flash';
  const url = `${env.GEMINI_BASE_URL}/v1beta/models/${model}:generateContent?key=${env.GOOGLE_AI_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [...(options.history ?? []), { role: 'user', parts }],
      ...(options.systemInstruction
        ? { systemInstruction: { parts: [{ text: options.systemInstruction }] } }
        : {}),
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        ...(options.json ? { responseMimeType: 'application/json' } : {}),
        ...(options.maxOutputTokens ? { maxOutputTokens: options.maxOutputTokens } : {}),
        // Le « thinking » double le coût de sortie sans bénéfice sur ces usages.
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
    signal: AbortSignal.timeout(options.timeoutMs ?? 30_000),
  });

  const body = (await response.json()) as GeminiResponse;

  if (!response.ok || body.error) {
    const message = body.error?.message ?? `HTTP ${response.status}`;
    // Le quota côté Google se distingue d'une panne : le client peut réessayer.
    if (response.status === 429 || body.error?.status === 'RESOURCE_EXHAUSTED') {
      throw new HttpsError(
        'resource-exhausted',
        'Trop de requêtes côté serveur IA. Réessaie dans un moment.',
      );
    }
    if (response.status === 401 || response.status === 403) {
      throw new HttpsError('internal', 'Erreur de configuration du service IA.');
    }
    throw new HttpsError('internal', `Service IA indisponible : ${message.slice(0, 120)}`);
  }

  return body.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}
