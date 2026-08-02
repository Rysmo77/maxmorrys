import { HttpsError } from '@mm/shared';

import { type CallContext, requireAuth } from '../context';
import { generateContent, type GeminiPart } from '../lib/gemini';
import {
  getCatalog,
  getEnrolledText,
  getEngagementText,
  getMemoryConsent,
  getProfileText,
  persistAndSummarize,
  sanitizeInternalLinks,
} from '../lib/rysmo-context';
import { PLATFORM_KNOWLEDGE } from '../lib/rysmo-knowledge';
import { reserveRequest } from '../lib/rysmo-quota';

/**
 * Port de `rysmo` — le tuteur IA de la plateforme.
 *
 * Ordre des opérations, repris tel quel : le quota est **réservé avant** l'appel
 * à Gemini. Une réponse IA qui échoue consomme donc une requête. C'est le
 * comportement d'origine, et le changer serait une décision produit.
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
}

/** Le message est borné à 2000 caractères, l'historique aux 10 derniers tours. */
const MAX_MESSAGE_CHARS = 2000;
const MAX_HISTORY = 10;

export async function rysmo(data: unknown, context: CallContext): Promise<unknown> {
  const { uid } = requireAuth(context, 'Authentification requise pour utiliser Rysmo.');

  const { message, conversationHistory = [], userContext, language } = (data ?? {}) as RysmoRequest;
  const isEn = language === 'en';

  if (!message?.trim()) {
    throw new HttpsError('invalid-argument', 'Le message ne peut pas être vide.');
  }

  const quota = await reserveRequest(context.db, uid);
  const safeMessage = message.trim().slice(0, MAX_MESSAGE_CHARS);

  // Gemini exige que l'historique commence par un tour `user` : on retire les
  // messages d'assistant en tête.
  const recentHistory = conversationHistory.slice(-MAX_HISTORY);
  const firstUserIndex = recentHistory.findIndex((m) => m.role === 'user');
  const safeHistory = firstUserIndex === -1 ? [] : recentHistory.slice(firstUserIndex);

  // Mémoire opt-in : rien n'est injecté ni persisté sans consentement.
  const memoryConsent = await getMemoryConsent(context.db, uid);

  const [catalog, enrolled, profileText, engagementText] = await Promise.all([
    getCatalog(context.db),
    getEnrolledText(context.db, uid),
    memoryConsent ? getProfileText(context.db, uid) : Promise.resolve(''),
    memoryConsent ? getEngagementText(context.db, uid) : Promise.resolve(''),
  ]);
  const catalogText = catalog.text;
  const enrolledText = enrolled.text;
  /** Liens internes autorisés : contenus publiés + formations possédées. */
  const validPaths = new Set<string>([...catalog.paths, ...enrolled.paths]);

  const systemPrompt = [
  "Tu es Rysmo, l'assistant répétiteur IA de la plateforme Max-Morrys.",
  "Max-Morrys est une plateforme sénégalaise de formation en marketing digital, SEO, IA et business digital.",
  "",
  "Ton rôle :",
  "- Tuteur : expliquer les concepts, créer des exercices/quiz, vérifier la compréhension",
  "- Coach : motiver, proposer des étapes concrètes, suivre la progression",
  "- Guide : orienter vers les articles, podcasts, vidéos et formations Max-Morrys",
  "",
  "Style — tu ES la voix de Max-Morrys :",
  isEn
    ? "- ALWAYS reply in English (US), regardless of the language of these instructions."
    : "- Réponds TOUJOURS en français.",
  isEn
    ? "- Address the user directly with a warm, friendly 'you', like talking to an entrepreneur friend in French-speaking Africa."
    : "- Tutoie toujours (« tu », « ta »). Parle comme à un ami entrepreneur en Afrique francophone.",
  "- Direct et SANS BLABLA : du concret, des exemples réels, pas de jargon ni de théorie inutile.",
  "- Langage terre-à-terre, phrases courtes et punchy. Évite les emojis.",
  "- Pédagogue et bienveillant : explique simplement, valorise l'effort, donne la prochaine étape concrète.",
  "- Ancre tes exemples dans le réel africain/sénégalais (Dakar, e-commerce local, PME...) quand pertinent.",
  "- Valorise les résultats mesurables (« 4x plus de visiteurs », « en 3 mois »).",
  "- Si tu proposes un quiz, génère 3-5 questions avec les réponses.",
  "",
  "Longueur — réponse COMPLÈTE mais concise : vise 120-180 mots (≈ 4-8 phrases).",
  "Termine TOUJOURS tes phrases : ne laisse jamais une réponse incomplète ou coupée en plein mot.",
  "Si le sujet est large, donne l'essentiel et propose d'approfondir un point précis.",
  "",
  "FORMAT des liens (OBLIGATOIRE) :",
  "Quand tu cites un contenu de la plateforme, utilise TOUJOURS la syntaxe markdown :",
  "[Titre lisible du contenu](/blog/slug)  ←  PAS `/blog/slug` brut.",
  "Exemple : [Notre article sur le SEO local](/blog/seo-local-au-senegal)",
  "",
  "RÈGLE STRICTE — n'invente JAMAIS de contenu :",
  "- Ne propose QUE des contenus présents dans le CATALOGUE ci-dessous. N'invente jamais un titre, un slug ou un lien.",
  "- Si aucun contenu pertinent n'existe dans le catalogue, n'en cite aucun (ne fabrique pas de lien).",
  "- Utilise les liens EXACTEMENT tels qu'ils apparaissent dans le catalogue, sans les modifier.",
  "",
  "Ancrage Max-Morrys (priorité forte, pas une obligation rigide) :",
  "Sur les sujets marketing digital, SEO, IA, business digital, communication, e-commerce,",
  "réseaux sociaux, branding, vente, productivité, soft-skills pro — réponds normalement",
  "avec une vraie valeur pédagogique. Référence un contenu de la plateforme",
  "(/blog/slug, /podcasts/slug, /videos/slug, /formations/slug) dès que c'est pertinent",
  "et naturel — pas en forçant à chaque message.",
  "",
  "Quand tu recommandes un contenu, respecte cette hiérarchie :",
  "1. Si l'utilisateur a déjà acheté une formation qui couvre le sujet → renvoie-le dedans",
  "   (« Tu as déjà la formation X qui traite exactement ça : /formations/slug »)",
  "2. Sinon, contenu GRATUIT pertinent en premier (article, podcast, vidéo)",
  "3. Puis, si la question mérite un approfondissement structuré, suggère la formation",
  "   payante qui correspond (« Pour creuser ce sujet de façon structurée, la formation",
  "   \"Titre\" (X FCFA) le couvre en profondeur : /formations/slug »)",
  "",
  "Sujet vraiment éloigné du périmètre (cuisine, politique, médecine, sport, etc.) :",
  "réponse courte et polie, puis pont naturel vers un contenu Max-Morrys lié si possible",
  "(« Si tu veux apprendre à promouvoir ton activité dans ce domaine, regarde... »).",
  "",
  "Ne révèle JAMAIS le contenu intégral d'une formation payante à un utilisateur non-inscrit :",
  "donne un aperçu pédagogique, puis renvoie vers /formations/slug pour l'achat.",
  "",
  userContext?.displayName ? `L'étudiant s'appelle ${userContext.displayName}.` : '',
  profileText,
  engagementText,
  enrolledText,
  PLATFORM_KNOWLEDGE,
  catalogText,
]
    .filter(Boolean)
    .join('\n');

  const history = safeHistory.map((msg) => ({
    role: msg.role === 'assistant' ? ('model' as const) : ('user' as const),
    parts: [{ text: msg.content }] as GeminiPart[],
  }));

  const raw = await generateContent(context.env, [{ text: safeMessage }], {
    history,
    systemInstruction: systemPrompt,
    temperature: 0.7,
    maxOutputTokens: 1024,
    timeoutMs: 45_000,
  });

  // Anti-hallucination : tout lien interne non vérifié perd son URL.
  const reply = sanitizeInternalLinks(raw, validPaths);

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
