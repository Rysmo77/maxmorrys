import type { Env } from '../env';
import { ClaudeIndisponible, genererClaude, type TourHistorique } from './claude';
import { generateContent, type GeminiPart } from './gemini';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * QUI RÉPOND À L'ÉLÈVE — Claude Haiku d'abord, Gemini en secours.
 *
 * `RYSMO_PROVIDER` (variable de `wrangler.jsonc`) :
 *   - `claude` (défaut, et toute valeur inconnue) : Claude ; sur N'IMPORTE QUELLE défaillance
 *     (réseau, 5xx, 429, refus, réponse coupée ou vide, clé absente), Gemini prend le relais
 *     dans la même requête. L'élève reçoit une réponse ; la défaillance est journalisée.
 *   - `gemini` : le retour arrière sans code — Gemini seul, exactement comme avant.
 *
 * Le quota est réservé AVANT cet appel (voir `handlers/rysmo.ts`) : un secours ne coûte
 * donc rien de plus à l'élève qu'une réponse ordinaire.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

export type Fournisseur = 'claude' | 'gemini';

export function lireFournisseur(valeur: unknown): Fournisseur {
  return typeof valeur === 'string' && valeur.trim().toLowerCase() === 'gemini' ? 'gemini' : 'claude';
}

export interface DemandeRysmo {
  message: string;
  history: TourHistorique[];
  system: { stable: string; variable: string };
}

export interface ReponseRysmo {
  texte: string;
  /** Le modèle qui a réellement répondu — pour la journalisation. */
  fournisseur: Fournisseur;
  /** Présent quand Claude a échoué et que Gemini a répondu à sa place. */
  secours?: string;
}

/** Les deux générateurs, injectables pour les tests. */
export interface Generateurs {
  claude: typeof genererClaude;
  gemini: typeof generateContent;
}

const PAR_DEFAUT: Generateurs = { claude: genererClaude, gemini: generateContent };

/** Paramètres Gemini inchangés depuis la Cloud Function d'origine. */
function viaGemini(env: Env, demande: DemandeRysmo, gemini: Generateurs['gemini']): Promise<string> {
  return gemini(env, [{ text: demande.message }], {
    history: demande.history.map((m) => ({
      role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
      parts: [{ text: m.content }] as GeminiPart[],
    })),
    systemInstruction: [demande.system.stable, demande.system.variable].filter(Boolean).join('\n'),
    temperature: 0.7,
    maxOutputTokens: 1024,
    timeoutMs: 45_000,
  });
}

export async function genererReponseRysmo(
  env: Env,
  demande: DemandeRysmo,
  generateurs: Generateurs = PAR_DEFAUT,
): Promise<ReponseRysmo> {
  if (lireFournisseur(env.RYSMO_PROVIDER) === 'gemini') {
    return { texte: await viaGemini(env, demande, generateurs.gemini), fournisseur: 'gemini' };
  }

  try {
    const texte = await generateurs.claude(env, demande.message, {
      system: demande.system,
      history: demande.history,
      timeoutMs: 30_000,
    });
    return { texte, fournisseur: 'claude' };
  } catch (error: unknown) {
    const raison = error instanceof ClaudeIndisponible ? error.raison : 'inattendue';
    console.warn(
      `Rysmo : Claude indisponible (${raison}), secours Gemini.`,
      error instanceof Error ? error.message.slice(0, 200) : error,
    );
    // Si Gemini échoue à son tour, son erreur (HttpsError) remonte telle quelle à l'élève.
    const texte = await viaGemini(env, demande, generateurs.gemini);
    return { texte, fournisseur: 'gemini', secours: raison };
  }
}
