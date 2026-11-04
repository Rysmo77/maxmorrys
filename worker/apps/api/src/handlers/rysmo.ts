import { HttpsError } from '@mm/shared';

import { type CallContext, requireAuth } from '../context';
import {
  getCatalog,
  getEnrolledText,
  getEngagementText,
  getMemoryConsent,
  getProfileText,
  persistAndSummarize,
} from '../lib/rysmo-context';
import { genererReponseRysmo } from '../lib/rysmo-fournisseur';
import { getLessonContext, type DemandeLecon } from '../lib/rysmo-lecon';
import { filtrerLiensRysmo } from '../lib/rysmo-liens';
import { lirePrenom, promptStable } from '../lib/rysmo-prompt';
import { reserveRequest } from '../lib/rysmo-quota';
import { catalogueSansPrix, lireCanal, retirerLesPrix } from '../lib/rysmo-canal';

/**
 * Port de `rysmo` — le tuteur IA de la plateforme.
 *
 * Ordre des opérations, repris tel quel : le quota est **réservé avant** l'appel
 * au modèle. Une réponse IA qui échoue consomme donc une requête. C'est le
 * comportement d'origine, et le changer serait une décision produit.
 *
 * Le modèle : Claude Haiku, Gemini en secours (`lib/rysmo-fournisseur.ts`, interrupteur
 * `RYSMO_PROVIDER`). Le prompt : `lib/rysmo-prompt.ts`.
 */

interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface RysmoRequest {
  message?: string;
  conversationHistory?: HistoryMessage[];
  userContext?: { displayName?: string };
  language?: string;
  /** `app` : l'application mobile, qui ne vend rien. Absent : le site. */
  canal?: string;
  /**
   * La leçon ouverte à l'écran — DEUX IDENTIFIANTS, jamais son texte : le contenu est relu
   * côté serveur, avec la règle d'accès de `appLeconContenu` (`lib/rysmo-lecon.ts`).
   */
  lecon?: DemandeLecon;
}

/** Le message est borné à 2000 caractères, l'historique aux 10 derniers tours. */
const MAX_MESSAGE_CHARS = 2000;
const MAX_HISTORY = 10;

export async function rysmo(data: unknown, context: CallContext): Promise<unknown> {
  const { uid } = requireAuth(context, 'Authentification requise pour utiliser Rysmo.');

  const { message, conversationHistory = [], userContext, language, canal: canalBrut, lecon } = (data ?? {}) as RysmoRequest;
  const isEn = language === 'en';
  const canal = lireCanal(canalBrut);

  if (!message?.trim()) {
    throw new HttpsError('invalid-argument', 'Le message ne peut pas être vide.');
  }

  const quota = await reserveRequest(context.db, uid);
  const safeMessage = message.trim().slice(0, MAX_MESSAGE_CHARS);

  // Les deux modèles exigent que l'historique commence par un tour `user` : on retire
  // les messages d'assistant en tête.
  // Un tour sans texte fait rejeter la requête par Claude : on ne garde que les tours lisibles.
  const recentHistory = (Array.isArray(conversationHistory) ? conversationHistory : [])
    .filter((m) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string' && m.content.trim() !== '')
    .slice(-MAX_HISTORY);
  const firstUserIndex = recentHistory.findIndex((m) => m.role === 'user');
  const safeHistory = firstUserIndex === -1 ? [] : recentHistory.slice(firstUserIndex);

  // Mémoire opt-in : rien n'est injecté ni persisté sans consentement.
  const memoryConsent = await getMemoryConsent(context.db, uid);

  const [catalog, enrolled, profileText, engagementText, lessonText] = await Promise.all([
    getCatalog(context.db),
    getEnrolledText(context.db, uid),
    memoryConsent ? getProfileText(context.db, uid) : Promise.resolve(''),
    memoryConsent ? getEngagementText(context.db, uid) : Promise.resolve(''),
    // Lu dans Firestore à partir des seuls identifiants : voir `lib/rysmo-lecon.ts`.
    getLessonContext(context.db, uid, lecon, canal),
  ]);
  const catalogText = canal === 'app' ? catalogueSansPrix(catalog.text) : catalog.text;
  const enrolledText = canal === 'app' ? catalogueSansPrix(enrolled.text) : enrolled.text;
  /** Liens internes autorisés : contenus publiés + formations possédées. */
  const validPaths = new Set<string>([...catalog.paths, ...enrolled.paths]);

  const prenom = lirePrenom(userContext?.displayName);
  const system = {
    stable: promptStable(isEn, canal, catalogText),
    variable: [
      prenom
        ? `L'élève s'appelle ${prenom}. Salue-le par son prénom.`
        : "Tu ne connais pas le prénom de l'élève : salue-le simplement, sans inventer de prénom.",
      profileText,
      engagementText,
      enrolledText,
      lessonText,
    ]
      .filter(Boolean)
      .join('\n'),
  };

  const { texte: raw, fournisseur, secours } = await genererReponseRysmo(context.env, {
    message: safeMessage,
    history: safeHistory,
    system,
  });
  if (secours) console.warn(`Rysmo a répondu via ${fournisseur} (secours : ${secours}).`);

  // Anti-hallucination : tout lien maxmorrys qui ne mène à aucune page réelle perd son URL.
  const verifiee = filtrerLiensRysmo(raw, validPaths);
  const reply = canal === 'app' ? retirerLesPrix(verifiee) : verifiee;

  if (memoryConsent) {
    // Hors du chemin critique : la réponse est déjà prête et déjà décomptée.
    context.ctx.waitUntil(
      persistAndSummarize(context.db, context.env, uid, safeMessage, reply),
    );
  }

  return {
    reply,
    quota: {
      dailyLimit: quota.dailyLimit,
      dayCount: quota.dayCount,
      packBalance: quota.packBalance,
      source: quota.source,
      hasActiveSubscription: quota.hasActiveSubscription,
      hasClubBonus: quota.hasClubBonus,
    },
  };
}
