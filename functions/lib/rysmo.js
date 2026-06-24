"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearRysmoMemory = exports.getRysmoQuota = exports.rysmo = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const genai_1 = require("@google/genai");
const params_1 = require("firebase-functions/params");
const googleAiKey = (0, params_1.defineSecret)('GOOGLE_AI_API_KEY');
const BASE_DAILY_QUOTA = 2;
const CLUB_BONUS_QUOTA = 3; // total 5/day for Club Digitos members
const SUBSCRIPTION_QUOTAS = {
    lite: 20,
    pro: 100,
};
function todayKey() {
    // Africa/Dakar is UTC+0, so plain UTC date is correct.
    return new Date().toISOString().slice(0, 10);
}
async function getActiveRysmoSubscription(uid) {
    var _a;
    const snap = await admin.firestore()
        .collection('rysmoSubscriptions')
        .where('userId', '==', uid)
        .where('status', '==', 'active')
        .limit(1)
        .get();
    if (snap.empty)
        return null;
    const data = snap.docs[0].data();
    if (data.expiresAt && new Date(data.expiresAt) < new Date())
        return null;
    return (_a = data.plan) !== null && _a !== void 0 ? _a : null;
}
// ── Connaissances statiques sur la plateforme et le fondateur ────────────
// Permet à Rysmo de répondre aux questions « C'est quoi Max-Morrys ? » / « Qui est Max-Morrys ? ».
const PLATFORM_KNOWLEDGE = [
    '',
    '── À PROPOS DE MAX-MORRYS (réponds aux questions sur la plateforme et le fondateur avec ces faits) ──',
    '',
    'LE FONDATEUR :',
    "- Max-Morrys Eyoum, basé à Dakar (Sénégal). Formateur et consultant en marketing digital, SEO et intelligence artificielle.",
    "- Parcours : études d'économie (CERAP Abidjan, BEM Dakar), puis bascule passionnée vers le marketing digital en 2021. Aujourd'hui Responsable Marketing Digital (Eyone Medical) et formateur.",
    "- Expertise : marketing/growth & SEO ; IA & automatisation (n8n, prompt engineering, chatbots) ; web & produit digital ; management & partenariats.",
    "- Mission : accompagner la croissance d'organisations en Afrique francophone (santé, services, éducation, impact social).",
    "- Valeurs : passion authentique, vision africaine, approche hybride, résultats concrets. Résultats notables : +1 790 % de trafic chez Eyone Medical, +8 000 abonnés organiques.",
    '',
    'LA PLATEFORME :',
    "- Slogan : « Maîtrise le digital, accélère ta croissance ». Pour entrepreneurs et marketeurs d'Afrique francophone.",
    "- Propose : des formations (certificat, accès à vie, garantie 7 jours), des articles de blog, un podcast, des vidéos, le Club des Digitos (communauté), et du coaching/consulting.",
    '',
    'CONTACT & LIENS :',
    "- Email : hello@maxmorrys.me · Téléphone/WhatsApp : +221 77 604 19 85 · Dakar, Sénégal.",
    "- Réseaux : LinkedIn, YouTube (@maxmorrys), Instagram (@maxmorrys).",
    "- Pages : [À propos](/a-propos), [Contact](/contact), [FAQ](/faq), [Formations](/formations), [Blog](/blog), [Podcasts](/podcasts), [Vidéos](/videos).",
    '',
    "Pour les questions sur la plateforme ou sur Max-Morrys Eyoum, réponds avec ces infos et renvoie vers la page pertinente (À propos, Contact, FAQ). N'invente AUCUN fait au-delà de ce qui est écrit ici.",
].join('\n');
// ── Catalogue de contenus Max-Morrys (cache module-level, TTL 5 min) ─────
// Permet à Rysmo de TOUJOURS ancrer ses réponses à du contenu de la plateforme.
const CATALOG_TTL_MS = 5 * 60 * 1000;
const CONTENT_LIMIT = 30; // cap par collection pour borner les tokens
let catalogCache = null;
function truncate(s, max) {
    if (!s)
        return '';
    const t = s.replace(/\s+/g, ' ').trim();
    return t.length > max ? t.slice(0, max - 1) + '…' : t;
}
// Normalise un chemin interne pour comparaison fiable (minuscule, sans query/hash/slash final).
function normPath(p) {
    return p.trim().toLowerCase().split(/[?#]/)[0].replace(/\/+$/, '');
}
async function getCatalog() {
    var _a, _b;
    if (catalogCache && catalogCache.expiresAt > Date.now()) {
        return { text: catalogCache.text, paths: new Set(catalogCache.paths) };
    }
    try {
        const db = admin.firestore();
        const [formationsSnap, blogSnap, podcastsSnap, videosSnap, faqSnap] = await Promise.all([
            db.collection('formations').where('status', '==', 'published').limit(CONTENT_LIMIT).get(),
            db.collection('blog').where('status', '==', 'published').limit(CONTENT_LIMIT).get(),
            db.collection('podcasts').where('status', '==', 'published').limit(CONTENT_LIMIT).get(),
            db.collection('videos').where('status', '==', 'published').limit(CONTENT_LIMIT).get(),
            db.collection('faq').limit(CONTENT_LIMIT).get(),
        ]);
        const sections = [];
        const paths = new Set();
        if (!formationsSnap.empty) {
            const lines = formationsSnap.docs.map((d) => {
                var _a, _b, _c;
                const f = d.data();
                if (f.slug)
                    paths.add(normPath(`/formations/${f.slug}`));
                const price = (_a = f.promoPrice) !== null && _a !== void 0 ? _a : f.price;
                const priceLabel = price > 0 ? `${price} FCFA` : 'gratuit';
                return `- "${f.title}" — ${(_b = f.category) !== null && _b !== void 0 ? _b : ''} · ${(_c = f.level) !== null && _c !== void 0 ? _c : ''} · ${priceLabel} → /formations/${f.slug}`;
            });
            sections.push(['FORMATIONS (cours payants/gratuits — à recommander pour aller plus loin) :', ...lines].join('\n'));
        }
        if (!blogSnap.empty) {
            const lines = blogSnap.docs.map((d) => {
                var _a;
                const a = d.data();
                if (a.slug)
                    paths.add(normPath(`/blog/${a.slug}`));
                return `- "${a.title}" [${(_a = a.category) !== null && _a !== void 0 ? _a : 'général'}] — ${truncate(a.excerpt, 120)} → /blog/${a.slug}`;
            });
            sections.push(['ARTICLES DU BLOG (gratuits — à recommander en priorité avant un cours payant) :', ...lines].join('\n'));
        }
        if (!podcastsSnap.empty) {
            const lines = podcastsSnap.docs.map((d) => {
                var _a;
                const p = d.data();
                if (p.slug)
                    paths.add(normPath(`/podcasts/${p.slug}`));
                return `- "${p.title}" [${(_a = p.category) !== null && _a !== void 0 ? _a : 'général'}] — ${truncate(p.description, 120)} → /podcasts/${p.slug}`;
            });
            sections.push(['PODCASTS (gratuits, audio) :', ...lines].join('\n'));
        }
        if (!videosSnap.empty) {
            const lines = videosSnap.docs.map((d) => {
                var _a;
                const v = d.data();
                if (v.slug)
                    paths.add(normPath(`/videos/${v.slug}`));
                return `- "${v.title}" [${(_a = v.category) !== null && _a !== void 0 ? _a : 'général'}] — ${truncate(v.description, 120)} → /videos/${v.slug}`;
            });
            sections.push(['VIDÉOS (gratuites) :', ...lines].join('\n'));
        }
        if (!faqSnap.empty) {
            const lines = faqSnap.docs
                .map((d) => d.data())
                .sort((a, b) => { var _a, _b; return ((_a = a.order) !== null && _a !== void 0 ? _a : 0) - ((_b = b.order) !== null && _b !== void 0 ? _b : 0); })
                .map((f) => `- Q : ${f.question} → R : ${truncate(f.answer, 200)}`);
            sections.push(['FAQ (questions fréquentes sur la plateforme) :', ...lines].join('\n'));
        }
        const text = sections.length
            ? ['', '── CATALOGUE MAX-MORRYS (utilise ces liens dans tes réponses) ──', ...sections].join('\n\n')
            : '';
        catalogCache = { text, paths: [...paths], expiresAt: Date.now() + CATALOG_TTL_MS };
        return { text, paths };
    }
    catch (err) {
        console.warn('getCatalog failed (non-blocking):', err);
        return { text: (_a = catalogCache === null || catalogCache === void 0 ? void 0 : catalogCache.text) !== null && _a !== void 0 ? _a : '', paths: new Set((_b = catalogCache === null || catalogCache === void 0 ? void 0 : catalogCache.paths) !== null && _b !== void 0 ? _b : []) };
    }
}
// Retire de la réponse tout lien interne dont le chemin n'est pas dans validPaths
// (anti-hallucination : aucun contenu inventé ou non publié ne reste cliquable).
const INTERNAL_LINK_TYPES = '(?:blog|podcasts|videos|formations)';
function sanitizeInternalLinks(reply, validPaths) {
    // 1. Liens markdown [label](/type/slug) → garder si valide, sinon ne garder que le label.
    let out = reply.replace(new RegExp(`\\[([^\\]]+)\\]\\((\\/${INTERNAL_LINK_TYPES}\\/[^)\\s]+)\\)`, 'g'), (_m, label, url) => (validPaths.has(normPath(url)) ? `[${label}](${url})` : label));
    // 2. URLs brutes /type/slug hors markdown (lookbehind pour ne pas toucher les "(/...)").
    out = out.replace(new RegExp(`(?<!\\()\\/${INTERNAL_LINK_TYPES}\\/[a-z0-9\\-]+`, 'gi'), (m) => (validPaths.has(normPath(m)) ? m : ''));
    return out;
}
function daysSince(iso) {
    if (!iso)
        return null;
    const t = new Date(iso).getTime();
    if (Number.isNaN(t))
        return null;
    return Math.floor((Date.now() - t) / (24 * 60 * 60 * 1000));
}
async function getEnrolledText(uid) {
    const paths = new Set();
    try {
        const db = admin.firestore();
        const enrSnap = await db.collection('enrollments').where('userId', '==', uid).get();
        if (enrSnap.empty)
            return { text: '', paths };
        const enrollments = enrSnap.docs.map((d) => d.data()).filter((e) => e.formationId);
        if (enrollments.length === 0)
            return { text: '', paths };
        // Lookup formations en parallèle (max 30)
        const formationDocs = await Promise.all(enrollments.slice(0, 30).map((e) => db.doc(`formations/${e.formationId}`).get()));
        const lines = [];
        formationDocs.forEach((d, i) => {
            if (!d.exists)
                return;
            const f = d.data();
            if (f.slug)
                paths.add(normPath(`/formations/${f.slug}`));
            const e = enrollments[i];
            const progress = typeof e.progress === 'number' ? e.progress : 0;
            const statut = progress >= 100 ? 'terminée' : progress > 0 ? `en cours (${progress}%)` : 'pas commencée';
            const days = daysSince(e.lastActivityAt || e.enrolledAt);
            const activite = days !== null && progress < 100
                ? (days === 0 ? ', dernière activité aujourd\'hui' : `, dernière activité il y a ${days} j`)
                : '';
            lines.push(`- "${f.title}" — ${statut}${activite} → /formations/${f.slug}`);
        });
        if (lines.length === 0)
            return { text: '', paths };
        const text = [
            '',
            "PROFIL D'APPRENTISSAGE (formations déjà achetées par cette personne — priorité absolue) :",
            ...lines,
            "→ Ancre tes réponses dans SA progression. Renvoie-la vers une leçon de SES cours avant d'en suggérer un nouveau. Si elle est bloquée (faible progression, inactive depuis longtemps), encourage-la à reprendre.",
        ].join('\n');
        return { text, paths };
    }
    catch (err) {
        console.warn('getEnrolledText failed (non-blocking):', err);
        return { text: '', paths };
    }
}
// ── Mémoire de conversation (activée par défaut / opt-out via aiMemoryConsent) ──
const SUMMARY_THRESHOLD = 6; // régénère le profil toutes les N requêtes
const MAX_STORED_MESSAGES = 40; // cap du log de conversation
async function getMemoryConsent(uid) {
    var _a, _b;
    try {
        const snap = await admin.firestore().doc(`users/${uid}`).get();
        // Activée par défaut : seul un opt-out explicite (false) la désactive.
        return ((_b = (_a = snap.data()) === null || _a === void 0 ? void 0 : _a.preferences) === null || _b === void 0 ? void 0 : _b.aiMemoryConsent) !== false;
    }
    catch (_c) {
        return false;
    }
}
async function getProfileText(uid) {
    try {
        const snap = await admin.firestore().doc(`rysmoProfiles/${uid}`).get();
        if (!snap.exists)
            return '';
        const p = snap.data();
        const parts = [];
        if (p.summary)
            parts.push(`Résumé : ${p.summary}`);
        if (Array.isArray(p.topics) && p.topics.length)
            parts.push(`Sujets d'intérêt : ${p.topics.join(', ')}`);
        if (p.level)
            parts.push(`Niveau estimé : ${p.level}`);
        if (Array.isArray(p.weakSpots) && p.weakSpots.length)
            parts.push(`Points à renforcer : ${p.weakSpots.join(', ')}`);
        if (parts.length === 0)
            return '';
        return [
            '',
            "CE QUE TU SAIS DÉJÀ DE CET ÉTUDIANT (mémoire des échanges passés — utilise-le pour personnaliser, sans le réciter mot pour mot) :",
            ...parts.map((x) => `- ${x}`),
        ].join('\n');
    }
    catch (err) {
        console.warn('getProfileText failed (non-blocking):', err);
        return '';
    }
}
async function getEngagementText(uid) {
    try {
        const snap = await admin.firestore()
            .collection(`users/${uid}/engagement`)
            .orderBy('lastAt', 'desc')
            .limit(12)
            .get();
        if (snap.empty)
            return '';
        const scored = snap.docs.map((d) => {
            var _a, _b, _c, _d, _e;
            const e = d.data();
            const scroll = Math.min((_a = e.scrollPctMax) !== null && _a !== void 0 ? _a : 0, 100) / 100;
            const dwell = Math.min((_b = e.dwellSec) !== null && _b !== void 0 ? _b : 0, 600) / 600;
            const media = Math.min((_c = e.mediaSec) !== null && _c !== void 0 ? _c : 0, 1800) / 1800;
            return {
                category: e.category || 'général',
                title: (_d = e.title) !== null && _d !== void 0 ? _d : 'contenu',
                type: (_e = e.type) !== null && _e !== void 0 ? _e : 'contenu',
                score: scroll + dwell + media,
            };
        });
        // Agrégation par catégorie
        const byCat = new Map();
        scored.forEach((e) => {
            var _a;
            byCat.set(e.category, ((_a = byCat.get(e.category)) !== null && _a !== void 0 ? _a : 0) + e.score);
        });
        const topCats = [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([c]) => c);
        // Contenus récents (les plus engageants d'abord)
        const recent = [...scored].sort((a, b) => b.score - a.score).slice(0, 5)
            .map((e) => `"${e.title}" (${e.type})`);
        const lines = [];
        if (topCats.length)
            lines.push(`- Catégories préférées : ${topCats.join(', ')}`);
        if (recent.length)
            lines.push(`- Récemment consultés : ${recent.join(', ')}`);
        if (lines.length === 0)
            return '';
        return [
            '',
            "PRÉFÉRENCES DE CONTENU (déduites de l'activité de cette personne — adapte tes réponses) :",
            ...lines,
            "→ Oriente tes exemples et recommandations vers ces centres d'intérêt.",
        ].join('\n');
    }
    catch (err) {
        console.warn('getEngagementText failed (non-blocking):', err);
        return '';
    }
}
async function persistAndSummarize(uid, userMsg, reply, apiKey) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    try {
        const db = admin.firestore();
        const convRef = db.doc(`rysmoConversations/${uid}`);
        const profileRef = db.doc(`rysmoProfiles/${uid}`);
        // 1. Append au log (cappé) + compteur
        const now = new Date().toISOString();
        const convSnap = await convRef.get();
        const prev = (_b = (_a = convSnap.data()) === null || _a === void 0 ? void 0 : _a.messages) !== null && _b !== void 0 ? _b : [];
        const msgCount = ((_d = (_c = convSnap.data()) === null || _c === void 0 ? void 0 : _c.msgCountSinceSummary) !== null && _d !== void 0 ? _d : 0) + 1;
        const messages = [
            ...prev,
            { role: 'user', content: userMsg, ts: now },
            { role: 'assistant', content: reply, ts: now },
        ].slice(-MAX_STORED_MESSAGES);
        await convRef.set({ messages, msgCountSinceSummary: msgCount, updatedAt: now }, { merge: true });
        // 2. Régénérer le profil au seuil
        if (msgCount < SUMMARY_THRESHOLD)
            return;
        const existing = (await profileRef.get()).data();
        const transcript = messages
            .map((m) => `${m.role === 'assistant' ? 'Rysmo' : 'Étudiant'}: ${m.content}`)
            .join('\n')
            .slice(0, 6000);
        const prompt = [
            "Analyse cette conversation entre un étudiant et le tuteur IA Rysmo (plateforme de marketing digital/SEO/IA).",
            (existing === null || existing === void 0 ? void 0 : existing.summary) ? `Profil précédent: ${existing.summary}` : '',
            "Produis un JSON STRICT avec ces clés (en français, concis) :",
            '{ "summary": "2-3 phrases sur cet étudiant, ses objectifs et son contexte", "topics": ["sujets d\'intérêt récurrents"], "level": "débutant|intermédiaire|avancé", "weakSpots": ["points à renforcer"] }',
            "",
            "Conversation :",
            transcript,
        ].filter(Boolean).join('\n');
        const ai = new genai_1.GoogleGenAI({ apiKey });
        const res = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.3,
                responseMimeType: 'application/json',
                thinkingConfig: { thinkingBudget: 0 },
            },
        });
        const raw = (_e = res.text) !== null && _e !== void 0 ? _e : '';
        let parsed;
        try {
            parsed = JSON.parse(raw);
        }
        catch (_o) {
            console.warn('Profile summary JSON parse failed; skipping update.');
            await convRef.set({ msgCountSinceSummary: 0 }, { merge: true });
            return;
        }
        await profileRef.set({
            summary: (_g = (_f = parsed.summary) !== null && _f !== void 0 ? _f : existing === null || existing === void 0 ? void 0 : existing.summary) !== null && _g !== void 0 ? _g : '',
            topics: Array.isArray(parsed.topics) ? parsed.topics.slice(0, 10) : ((_h = existing === null || existing === void 0 ? void 0 : existing.topics) !== null && _h !== void 0 ? _h : []),
            level: (_k = (_j = parsed.level) !== null && _j !== void 0 ? _j : existing === null || existing === void 0 ? void 0 : existing.level) !== null && _k !== void 0 ? _k : '',
            weakSpots: Array.isArray(parsed.weakSpots) ? parsed.weakSpots.slice(0, 10) : ((_l = existing === null || existing === void 0 ? void 0 : existing.weakSpots) !== null && _l !== void 0 ? _l : []),
            updatedAt: now,
        }, { merge: true });
        await convRef.set({ msgCountSinceSummary: 0 }, { merge: true });
    }
    catch (err) {
        console.warn('persistAndSummarize failed (non-blocking):', err);
    }
}
async function hasActiveClubSub(uid) {
    const snap = await admin.firestore().doc(`club_subscriptions/${uid}`).get();
    if (!snap.exists)
        return false;
    const data = snap.data();
    if (data.status !== 'active')
        return false;
    if (data.expiresAt && new Date(data.expiresAt) < new Date())
        return false;
    return true;
}
/**
 * Atomically reserves one Rysmo request slot for the user, respecting:
 * - active Rysmo+ subscription quota (lite/pro)
 * - Club Digitos bonus
 * - prepaid pack balance (consumed BEFORE the daily free quota)
 * - base daily quota (2 req/day)
 *
 * Throws HttpsError('resource-exhausted') with structured details on limit hit.
 * Returns the post-consumption quota snapshot for surfacing to the client.
 */
async function reserveRequest(uid) {
    const [subPlan, clubActive] = await Promise.all([
        getActiveRysmoSubscription(uid),
        hasActiveClubSub(uid),
    ]);
    let dailyLimit = BASE_DAILY_QUOTA;
    let hasClubBonus = false;
    let hasActiveSubscription = false;
    if (subPlan && SUBSCRIPTION_QUOTAS[subPlan]) {
        dailyLimit = SUBSCRIPTION_QUOTAS[subPlan];
        hasActiveSubscription = true;
    }
    else if (clubActive) {
        dailyLimit = BASE_DAILY_QUOTA + CLUB_BONUS_QUOTA;
        hasClubBonus = true;
    }
    const rateLimitRef = admin.firestore().doc(`_ratelimits/rysmo_${uid}`);
    const dayKey = todayKey();
    return await admin.firestore().runTransaction(async (txn) => {
        var _a, _b, _c;
        const snap = await txn.get(rateLimitRef);
        const data = (_a = snap.data()) !== null && _a !== void 0 ? _a : {};
        const sameDay = data.dayKey === dayKey;
        const dayCount = sameDay ? ((_b = data.dayCount) !== null && _b !== void 0 ? _b : 0) : 0;
        const packBalance = (_c = data.packBalance) !== null && _c !== void 0 ? _c : 0;
        // Strategy: consume from pack first (gives best perceived value to paying users)
        let newDayCount = dayCount;
        let newPackBalance = packBalance;
        let source = 'free';
        if (packBalance > 0) {
            newPackBalance = packBalance - 1;
            source = 'pack';
        }
        else if (dayCount < dailyLimit) {
            newDayCount = dayCount + 1;
            source = hasActiveSubscription ? 'subscription' : (hasClubBonus ? 'club' : 'free');
        }
        else {
            throw new https_1.HttpsError('resource-exhausted', hasActiveSubscription
                ? `Tu as atteint ta limite quotidienne Rysmo+ (${dailyLimit}/jour). Reviens demain ou upgrade vers Pro.`
                : `Tu as utilisé tes ${dailyLimit} requêtes Rysmo du jour ! Achète un pack à partir de 500 XOF pour continuer maintenant.`, {
                reason: 'daily_limit',
                dailyLimit,
                hasActiveSubscription,
                hasClubBonus,
                upgradeUrl: '/mon-espace/rysmo-store',
            });
        }
        txn.set(rateLimitRef, {
            dayKey,
            dayCount: newDayCount,
            packBalance: newPackBalance,
            lastReset: Date.now(),
        }, { merge: true });
        return {
            dailyLimit,
            dayKey,
            dayCount: newDayCount,
            packBalance: newPackBalance,
            source,
            hasActiveSubscription,
            hasClubBonus,
        };
    });
}
exports.rysmo = (0, https_1.onCall)({ region: 'us-central1', secrets: [googleAiKey] }, async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise pour utiliser Rysmo.');
    }
    const data = request.data;
    const { message, conversationHistory = [], userContext } = data;
    const isEn = data.language === 'en';
    if (!(message === null || message === void 0 ? void 0 : message.trim())) {
        throw new https_1.HttpsError('invalid-argument', 'Le message ne peut pas être vide.');
    }
    const uid = request.auth.uid;
    const quota = await reserveRequest(uid);
    // Tronquer le message à 2000 caractères
    const safeMessage = message.trim().slice(0, 2000);
    // Garder les 10 derniers messages pour le contexte
    // Gemini exige que l'historique commence par 'user' — on retire les messages 'assistant' en tête.
    const recentHistory = conversationHistory.slice(-10);
    const firstUserIdx = recentHistory.findIndex((m) => m.role === 'user');
    const safeHistory = firstUserIdx === -1 ? [] : recentHistory.slice(firstUserIdx);
    // Mémoire opt-in : on n'injecte/persiste le profil que si l'utilisateur a consenti.
    const memoryConsent = await getMemoryConsent(uid);
    // Catalogue mutualisé (cache 5 min) + enrollments + profil mémoire + préférences (si consentement).
    const [catalog, enrolled, profileText, engagementText] = await Promise.all([
        getCatalog(),
        getEnrolledText(uid),
        memoryConsent ? getProfileText(uid) : Promise.resolve(''),
        memoryConsent ? getEngagementText(uid) : Promise.resolve(''),
    ]);
    const catalogText = catalog.text;
    const enrolledText = enrolled.text;
    // Ensemble des liens internes autorisés (publiés + formations possédées).
    const validPaths = new Set([...catalog.paths, ...enrolled.paths]);
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
        (userContext === null || userContext === void 0 ? void 0 : userContext.displayName) ? `L'étudiant s'appelle ${userContext.displayName}.` : '',
        profileText,
        engagementText,
        enrolledText,
        PLATFORM_KNOWLEDGE,
        catalogText,
    ]
        .filter(Boolean)
        .join('\n');
    const apiKey = googleAiKey.value();
    if (!apiKey) {
        console.error('GOOGLE_AI_API_KEY secret is not configured.');
        throw new https_1.HttpsError('internal', 'Le service IA est temporairement indisponible.');
    }
    try {
        const ai = new genai_1.GoogleGenAI({ apiKey });
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            history: safeHistory.map((msg) => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }],
            })),
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.7,
                maxOutputTokens: 1024, // garde-fou (thinking off → ne tronque plus)
                thinkingConfig: { thinkingBudget: 0 }, // désactive le thinking (coût output ÷~2)
            },
        });
        const result = await chat.sendMessage({ message: safeMessage });
        // Anti-hallucination : retire tout lien interne non vérifié (inexistant/non publié).
        const reply = sanitizeInternalLinks((_a = result.text) !== null && _a !== void 0 ? _a : '', validPaths);
        // Mémoire (opt-in) : persiste l'échange + régénère le profil au seuil.
        if (memoryConsent) {
            await persistAndSummarize(uid, safeMessage, reply, apiKey);
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
    catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('Google AI API error:', errMsg);
        if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('401')) {
            throw new https_1.HttpsError('internal', 'Erreur de configuration du service IA.');
        }
        if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
            throw new https_1.HttpsError('resource-exhausted', 'Trop de requêtes côté serveur IA. Réessaie dans un moment.');
        }
        throw new https_1.HttpsError('internal', 'Le service IA est temporairement indisponible.');
    }
});
/**
 * Returns the user's current Rysmo quota state without consuming a request.
 * Used by the widget to display remaining quota + by RysmoStore to display balance.
 */
exports.getRysmoQuota = (0, https_1.onCall)({ region: 'us-central1' }, async (request) => {
    var _a, _b, _c;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    const uid = request.auth.uid;
    const [subPlan, clubActive] = await Promise.all([
        getActiveRysmoSubscription(uid),
        hasActiveClubSub(uid),
    ]);
    let dailyLimit = BASE_DAILY_QUOTA;
    let hasClubBonus = false;
    let hasActiveSubscription = false;
    if (subPlan && SUBSCRIPTION_QUOTAS[subPlan]) {
        dailyLimit = SUBSCRIPTION_QUOTAS[subPlan];
        hasActiveSubscription = true;
    }
    else if (clubActive) {
        dailyLimit = BASE_DAILY_QUOTA + CLUB_BONUS_QUOTA;
        hasClubBonus = true;
    }
    const rlSnap = await admin.firestore().doc(`_ratelimits/rysmo_${uid}`).get();
    const data = (_a = rlSnap.data()) !== null && _a !== void 0 ? _a : {};
    const dayKey = todayKey();
    const sameDay = data.dayKey === dayKey;
    const dayCount = sameDay ? ((_b = data.dayCount) !== null && _b !== void 0 ? _b : 0) : 0;
    const packBalance = (_c = data.packBalance) !== null && _c !== void 0 ? _c : 0;
    return {
        dailyLimit,
        dayCount,
        dayRemaining: Math.max(0, dailyLimit - dayCount),
        packBalance,
        plan: subPlan,
        hasActiveSubscription,
        hasClubBonus,
    };
});
/**
 * Efface la mémoire Rysmo de l'utilisateur (profil résumé + logs de conversation).
 * Déclenché depuis la page « Ce que Rysmo sait de moi » (RGPD).
 */
exports.clearRysmoMemory = (0, https_1.onCall)({ region: 'us-central1' }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    const uid = request.auth.uid;
    const db = admin.firestore();
    // Supprime la sous-collection d'engagement (par lots)
    const engSnap = await db.collection(`users/${uid}/engagement`).get();
    if (!engSnap.empty) {
        const batch = db.batch();
        engSnap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
    }
    await Promise.all([
        db.doc(`rysmoProfiles/${uid}`).delete(),
        db.doc(`rysmoConversations/${uid}`).delete(),
    ]);
    return { success: true };
});
//# sourceMappingURL=rysmo.js.map