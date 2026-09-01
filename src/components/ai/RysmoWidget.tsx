import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import LocalizedLink from '../shared/LocalizedLink';
import { httpsCallable } from 'firebase/functions';
import DOMPurify from 'dompurify';
import { functions } from '../../config/firebase';
import { captureError } from '../../lib/sentry';
import { trackChatbotInteraction } from '../../lib/tracking';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { tutorName } from '../../lib/naming';
import { Icon } from '@ds';

/* Le fil et sa persistance vivent dans `lib/rysmo/conversation` : le panneau permanent
   du tableau de bord lit LE MÊME fil, et une clé de stockage écrite à deux endroits est
   une clé qu'un renommage casse à moitié. */
type Message = RysmoMessage;

interface QuotaInfo {
  dailyLimit: number;
  dayCount: number;
  packBalance: number;
  source: 'pack' | 'subscription' | 'club' | 'free';
  hasActiveSubscription: boolean;
  hasClubBonus: boolean;
}

interface RysmoResponse {
  reply: string;
  quota?: QuotaInfo;
}

interface QuotaSnapshot {
  dailyLimit: number;
  dayCount: number;
  dayRemaining: number;
  packBalance: number;
  plan: 'lite' | 'pro' | null;
  hasActiveSubscription: boolean;
  hasClubBonus: boolean;
}

// Déclaration pour l'API Web Speech
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  readonly isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

import {
  loadConversation, persistConversation, clearConversation,
  RYSMO_OPEN_EVENT, type RysmoMessage, type RysmoOpenDetail,
} from '../../lib/rysmo/conversation';

const rysmoCallable = httpsCallable<
  { message: string; conversationHistory: Message[]; language?: 'fr' | 'en'; userContext?: { displayName?: string; enrolledCourses?: string[] } },
  RysmoResponse
>(functions, 'rysmo');

const getRysmoQuotaCallable = httpsCallable<Record<string, never>, QuotaSnapshot>(functions, 'getRysmoQuota');

export default function RysmoWidget() {
  const { t } = useTranslation('rysmo');
  const { language } = useLanguage();
  const { user, userData } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [quota, setQuota] = useState<QuotaSnapshot | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  /*
    ── OUVERTURE DEPUIS AILLEURS ─────────────────────────────────────────────────
    Le panneau permanent du tableau de bord (`TutorPanel`) ne connaît pas ce widget :
    il émet `rysmo:open` avec la question déjà écrite, et c'est ici qu'on la reçoit.

    Le widget est monté UNE fois pour toute l'application (`App.tsx`), donc un seul
    écouteur existe — pas de risque de double ouverture. Et l'écouteur ne dépend de
    rien : il est posé au montage et retiré au démontage, sans se réarmer à chaque
    frappe dans le champ.
  */
  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<RysmoOpenDetail>).detail;
      setOpen(true);
      if (detail?.question) setInput(detail.question);
      /* Le focus suit l'ouverture : sans lui, quelqu'un qui vient d'écrire sa question
         dans le panneau devrait la retrouver au clic. Le délai laisse le panneau se
         monter — `inputRef` n'existe pas tant qu'il est fermé. */
      window.setTimeout(() => inputRef.current?.focus(), 120);
    };
    window.addEventListener(RYSMO_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(RYSMO_OPEN_EVENT, onOpen);
  }, []);

  const displayName = user
    ? (userData?.displayName || user.displayName || user.email?.split('@')[0] || t('defaultName'))
    : '';

  const quickActions = useMemo(
    () => [
      t('quickActions.explainConcept'),
      t('quickActions.reviewSession'),
      t('quickActions.generateQuiz'),
      t('quickActions.recommendResource'),
    ],
    [t],
  );

  // Restore persisted messages on mount
  useEffect(() => {
    if (!user) return;
    const persisted = loadConversation(user.uid);
    if (persisted.length > 0) {
      setMessages(persisted);
      setHasGreeted(true);
    }
  }, [user]);

  // Persist messages whenever they change
  useEffect(() => {
    if (user && messages.length > 0) {
      persistConversation(user.uid, messages);
    }
  }, [messages, user]);

  // Scroll auto vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const refreshQuota = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getRysmoQuotaCallable({});
      setQuota(res.data);
    } catch {
      // Non-blocking — quota display is cosmetic
    }
  }, [user]);

  // Charger le quota à l'ouverture
  useEffect(() => {
    if (open && user) {
      refreshQuota();
    }
  }, [open, user, refreshQuota]);

  // Message de bienvenue à la première ouverture
  useEffect(() => {
    if (open && !hasGreeted && user) {
      setHasGreeted(true);
      setMessages([
        {
          role: 'assistant',
          content: t('greeting', { name: displayName, tutor: tutorName(userData) }),
        },
      ]);
    }
  }, [open, hasGreeted, displayName, user]);

  // Afficher uniquement pour les utilisateurs authentifiés
  if (!user) return null;

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    trackChatbotInteraction();

    const userMessage: Message = { role: 'user', content: trimmed };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const result = await rysmoCallable({
        message: trimmed,
        conversationHistory: messages,
        language,
        userContext: {
          displayName,
          enrolledCourses: [],
        },
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: result.data.reply,
      };
      setMessages([...newMessages, assistantMessage]);
      setLimitReached(false);

      // Mettre à jour le quota depuis la réponse serveur
      if (result.data.quota) {
        const q = result.data.quota;
        setQuota({
          dailyLimit: q.dailyLimit,
          dayCount: q.dayCount,
          dayRemaining: Math.max(0, q.dailyLimit - q.dayCount),
          packBalance: q.packBalance,
          plan: q.hasActiveSubscription ? (q.source === 'subscription' ? null : null) : null,
          hasActiveSubscription: q.hasActiveSubscription,
          hasClubBonus: q.hasClubBonus,
        });
      }

      // Lecture vocale si activée
      if (voiceEnabled && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(result.data.reply);
        utterance.lang = 'fr-FR';
        utterance.rate = 1.05;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    } catch (err: unknown) {
      captureError(err, { context: 'Rysmo error' });

      let errorMessage = t('errors.generic');
      let isLimit = false;
      if (err && typeof err === 'object' && 'code' in err) {
        const code = (err as { code: string }).code;
        if (code === 'functions/unauthenticated') {
          errorMessage = t('errors.unauthenticated', { tutor: tutorName(userData) });
        } else if (code === 'functions/resource-exhausted') {
          const message = (err as { message?: string }).message;
          errorMessage = message || t('errors.limitReached');
          isLimit = true;
        } else if (code === 'functions/not-found') {
          errorMessage = t('errors.notFound', { tutor: tutorName(userData) });
        }
      }

      setMessages([
        ...newMessages,
        { role: 'assistant', content: errorMessage },
      ]);
      if (isLimit) {
        setLimitReached(true);
        refreshQuota();
      }
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const toggleVoiceInput = () => {
    setVoiceError(null);

    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setVoiceError(t('voice.notSupported'));
      return;
    }

    // Toggle off si déjà en écoute
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + ' ' : '') + transcript);
      setVoiceError(null);
    };
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setListening(false);
      if (event.error === 'aborted') return; // arrêt volontaire → silencieux
      const map: Record<string, string> = {
        'not-allowed': t('voice.notAllowed'),
        'service-not-allowed': t('voice.notAllowed'),
        'no-speech': t('voice.noSpeech'),
        'audio-capture': t('voice.audioCapture'),
        'network': t('voice.network'),
      };
      setVoiceError(map[event.error] ?? t('voice.failed'));
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
      setVoiceError(t('voice.startFailed'));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Formater le texte markdown (gras + liens internes plateforme) + sanitisation XSS
  const formatText = (text: string) => {
    // Contenus (avec slug ou page de listing) + pages publiques statiques.
    const INTERNAL_LINK_RE = /^\/(blog|podcasts|videos|formations)(\/[a-z0-9-]+)?$|^\/(a-propos|contact|faq)$/i;
    const linkAttrs = 'target="_blank" rel="noopener noreferrer" class="text-digitalise-txt underline hover:text-digitalise-txt dark:hover:text-digitalise-txt font-medium"';
    const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

    const raw = text
      // Markdown [label](path) → <a> uniquement si path interne whitelisté
      .replace(/\[([^\]]+)\]\((\/[^\s)]+)\)/g, (_, label: string, url: string) =>
        INTERNAL_LINK_RE.test(url)
          ? `<a href="${url}" ${linkAttrs}>${escapeHtml(label)}</a>`
          : escapeHtml(label),
      )
      // Fallback : URL brute (contenu ou page publique) → <a>
      .replace(/(^|[\s(])(\/(?:blog|podcasts|videos|formations)(?:\/[a-z0-9-]+)?|\/(?:a-propos|contact|faq))(?=[\s.,!?)]|$)/gi,
        (_m, prefix: string, url: string) => `${prefix}<a href="${url}" ${linkAttrs}>${url}</a>`)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />');

    return DOMPurify.sanitize(raw, {
      ALLOWED_TAGS: ['strong', 'br', 'a'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
      ALLOWED_URI_REGEXP: /^\/(blog|podcasts|videos|formations|a-propos|contact|faq)(\/|$)/i,
    });
  };

  return (
    <>
      {/* ── Backdrop mobile (tap pour fermer) ── */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="sm:hidden fixed inset-0 bg-black/30 z-40 mm-drop"
          aria-hidden="true"
        />
      )}

      {/* ── Panneau de chat ── */}
      {open && (
        <div
          className="fixed z-50 flex flex-col overflow-hidden bg-surface-sheet mm-drop inset-0 rounded-none border-0 shadow-none sm:inset-auto sm:bottom-24 sm:right-6 sm:w-96 sm:h-[600px] sm:max-h-[calc(100dvh-8rem)] sm:rounded-2xl sm:border sm:border-[color:var(--line)] sm:dark:border-[color:var(--border-hair)] sm:shadow-2xl"
        >

          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 bg-[image:var(--action-digitalise)] text-white flex-shrink-0"
            style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[color-mix(in_srgb,var(--paper)_20%,transparent)] flex items-center justify-center">
                <Icon name="bot" size={16} />
              </div>
              <div>
                {/*
                  LE NOM DU RÉPÉTITEUR, PAS CELUI DE L'APPLICATION.

                  Cette ligne écrivait « Rysmo » en dur — pas même une clé i18n. C'est
                  exactement le défaut que le système désigne comme le plus facile à
                  commettre : « Rysmo » est le nom de l'APPLICATION, le répétiteur qui vit
                  dedans s'appelle « Répétiteur » par défaut et CHAQUE PERSONNE PEUT LE
                  RENOMMER. Quelqu'un qui avait appelé le sien « Tonton » le retrouvait ici
                  sous un autre nom, sans qu'aucun test ni aucun type ne le signale.

                  L'en-tête de conversation est l'un des treize emplacements qui lisent le
                  nom. Il le lit maintenant.
                */}
                <p className="text-sm font-black tracking-wide">{tutorName(userData)}</p>
                <p className="text-[10px] text-[color:var(--paper-fixed)] font-medium">{t('subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setVoiceEnabled((v) => !v);
                  if (voiceEnabled) window.speechSynthesis?.cancel();
                }}
                className="p-2 rounded-full hover:bg-[color-mix(in_srgb,var(--paper)_20%,transparent)] transition-colors"
                title={voiceEnabled ? t('muteVoice') : t('enableVoice')}
              >
                {voiceEnabled ? <Icon name="volume" size={16} /> : <Icon name="volume-off" size={16} />}
              </button>
              {messages.length > 1 && (
                <button
                  onClick={() => {
                    if (user) {
                      clearConversation(user.uid);
                    }
                    setMessages([]);
                    setHasGreeted(false);
                  }}
                  className="p-2 rounded-full hover:bg-[color-mix(in_srgb,var(--paper)_20%,transparent)] transition-colors"
                  title={t('clearConversation')}
                >
                  <Icon name="trash" size={16} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-full hover:bg-[color-mix(in_srgb,var(--paper)_20%,transparent)] transition-colors"
                aria-label={t('closeRysmo', { tutor: tutorName(userData) })}
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-[color-mix(in_srgb,var(--mm-teal)_6%,transparent)] flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                    <Icon name="bot" size={14} className="text-digitalise-txt" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-digitalise text-white rounded-tr-sm'
                      : 'bg-[color:var(--fill-2)] text-ink rounded-tl-sm'
                  }`}
                  dangerouslySetInnerHTML={{ __html: formatText(msg.content) }}
                />
              </div>
            ))}

            {/* Indicateur de chargement */}
            {loading && (
              <div className="flex justify-start items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[color-mix(in_srgb,var(--mm-teal)_6%,transparent)] flex items-center justify-center flex-shrink-0">
                  <Icon name="bot" size={14} className="text-digitalise-txt" />
                </div>
                {/* Les trois points de `ChatBubble`, pas un rond : le système les décrit comme
                    « un ÉVÉNEMENT, pas un décor » — quelqu'un est en train de répondre. Ils
                    n'animent que l'opacité et une translation de 3 px. */}
                <div className="bg-[color:var(--fill-2)] rounded-2xl rounded-tl-sm px-3 py-2.5 flex items-center gap-1.5" role="status" aria-live="polite">
                  <span className="sr-only">{t('thinking')}</span>
                  {[0, 0.15, 0.3].map((d) => (
                    <i
                      key={d}
                      aria-hidden="true"
                      style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--mm-teal)', opacity: 0.35, animation: 'blink 1.25s infinite', animationDelay: `${d}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Actions rapides (première ouverture, avant interaction) */}
            {messages.length <= 1 && !loading && (
              <div className="pt-1 space-y-1.5">
                {quickActions.map((action) => (
                  <button
                    key={action}
                    onClick={() => sendMessage(action)}
                    className="w-full text-left text-xs px-3 py-2 rounded-xl border border-[color:var(--line)] text-ink-2 hover:border-digitalise dark:hover:border-digitalise hover:bg-[color-mix(in_srgb,var(--mm-teal)_8%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--mm-teal)_20%,transparent)] transition duration-150"
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            className="flex-shrink-0 border-t border-[color:var(--border-hair)] p-3"
            style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
          >
            {/* Bannière upsell quand limite atteinte */}
            {limitReached && (
              <LocalizedLink
                to="/mon-espace/repetiteur?tab=tokens"
                target="_blank"
                rel="noopener noreferrer"
                /* `from-amber-500 to-orange-500` : deux couleurs de la palette PAR DÉFAUT de
                   Tailwind, étrangères aux quatre teintes du système. Elles génèrent du CSS
                   valide — donc aucune porte ne les voyait — mais ne basculent pas sous `.dk`
                   et ne sont dans aucun jeton. `--action-informe` est le dégradé orange de
                   « Je t'informe », et son encre est `--ink-fixed` : le dégradé est clair, un
                   `text-white` y donnerait du blanc sur orange pâle. */
                className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl bg-[image:var(--action-informe)] text-[color:var(--ink-fixed)] text-xs font-semibold shadow-sm transition-opacity duration-ui hover:opacity-90"
              >
                <Icon name="sparkles" size={16} className="flex-shrink-0" />
                <span className="flex-1">{t('upsellBanner')}</span>
              </LocalizedLink>
            )}
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('inputPlaceholder')}
                rows={1}
                className="flex-1 resize-none bg-[color:var(--fill-1)] border border-[color:var(--line)] rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:border-digitalise dark:focus:border-digitalise transition-colors max-h-24 overflow-y-auto"
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 96)}px`;
                }}
                disabled={loading}
              />
              <button
                onClick={toggleVoiceInput}
                className={`p-2 rounded-xl transition-colors flex-shrink-0 ${
                  listening
                    ? 'bg-[color:var(--stop)] text-white animate-pulse'
                    : 'bg-[color:var(--fill-2)] text-ink-2 hover:bg-[color:var(--fill-3)] dark:hover:bg-[color:var(--night-3)]'
                }`}
                title={listening ? t('stopDictation') : t('startDictation')}
              >
                {listening ? <Icon name="mic-off" size={16} /> : <Icon name="mic" size={16} />}
              </button>
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="p-2 bg-digitalise text-white rounded-xl hover:bg-digitalise disabled:opacity-40 transition-colors flex-shrink-0"
                aria-label={t('send')}
              >
                <Icon name="send" size={16} />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 gap-2">
              <p className="text-[10px] text-ink-2">
                {t('disclaimer', { tutor: tutorName(userData) })}
              </p>
              {quota && (
                <LocalizedLink
                  to="/mon-espace/repetiteur?tab=tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-ink-2 hover:text-digitalise-txt dark:hover:text-digitalise-txt transition-colors flex items-center gap-1"
                  title={t('quotaTooltip')}
                >
                  {quota.packBalance > 0 && (
                    <span className="font-semibold text-digitalise-txt">{t('quotaPack', { balance: quota.packBalance })}</span>
                  )}
                  <span>
                    {t('quotaToday', { remaining: quota.dayRemaining, limit: quota.dailyLimit })}
                  </span>
                  {/* `★` était un caractère unicode servant d'icône, en ambre hors palette :
                      le système n'admet qu'un jeu de glyphes, et `star` en fait partie — c'est
                      l'un de ses deux seuls glyphes pleins. Le bonus vient du Club, donc violet. */}
                  {quota.hasClubBonus && (
                    <Icon name="star" size={12} color="var(--mm-violet-t)" title={t('clubBonusTooltip')} />
                  )}
                </LocalizedLink>
              )}
            </div>
            {voiceError && (
              <p className="text-[11px] text-stop mt-1.5 text-center">{voiceError}</p>
            )}
          </div>
        </div>
      )}

      {/* ── FAB bouton ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`fixed bottom-24 md:bottom-6 right-4 sm:right-6 z-50 w-14 h-14 rounded-full shadow-lg items-center justify-center transition duration-300 ${
          open ? 'hidden sm:flex bg-[color:var(--night-3)] rotate-12 scale-90' : 'flex bg-digitalise hover:bg-digitalise hover:scale-105'
        }`}
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        aria-label={open ? t('closeRysmo', { tutor: tutorName(userData) }) : t('openRysmo', { tutor: tutorName(userData) })}
      >
        {open ? (
          <Icon name="close" size={20} className="text-white" />
        ) : (
          <Icon name="bot" size={24} className="text-white" />
        )}
        {/* LA PULSATION A ÉTÉ RETIRÉE. Le système ne scénarise QUE deux moments — l'attente de
            paiement et l'émission du certificat — et dit pourquoi : « il n'y en aura pas un
            troisième ». Un anneau qui bat en permanence dans un coin d'écran ne répond à
            aucune question que la personne se pose ; la planche des micro-interactions en fait
            sa règle d'admission : « une micro-interaction sans raison d'exister est un tic ».
            Le bouton reste repérable par sa taille, sa couleur et son ombre. */}
      </button>
    </>
  );
}
