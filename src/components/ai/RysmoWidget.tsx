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
import { X, Send, Mic, MicOff, Bot, Loader2, Volume2, VolumeX, Trash2, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

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

const rysmoCallable = httpsCallable<
  { message: string; conversationHistory: Message[]; language?: 'fr' | 'en'; userContext?: { displayName?: string; enrolledCourses?: string[] } },
  RysmoResponse
>(functions, 'rysmo');

const getRysmoQuotaCallable = httpsCallable<Record<string, never>, QuotaSnapshot>(functions, 'getRysmoQuota');

const STORAGE_KEY = 'rysmo_conversation';

function loadPersistedMessages(uid: string): Message[] {
  try {
    const raw = sessionStorage.getItem(`${STORAGE_KEY}_${uid}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Message[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistMessages(uid: string, messages: Message[]) {
  try {
    // Keep last 50 messages to avoid storage bloat
    const toStore = messages.slice(-50);
    sessionStorage.setItem(`${STORAGE_KEY}_${uid}`, JSON.stringify(toStore));
  } catch {
    // sessionStorage full or unavailable — silently ignore
  }
}

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
    const persisted = loadPersistedMessages(user.uid);
    if (persisted.length > 0) {
      setMessages(persisted);
      setHasGreeted(true);
    }
  }, [user]);

  // Persist messages whenever they change
  useEffect(() => {
    if (user && messages.length > 0) {
      persistMessages(user.uid, messages);
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
          content: t('greeting', { name: displayName }),
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
          errorMessage = t('errors.unauthenticated');
        } else if (code === 'functions/resource-exhausted') {
          const message = (err as { message?: string }).message;
          errorMessage = message || t('errors.limitReached');
          isLimit = true;
        } else if (code === 'functions/not-found') {
          errorMessage = t('errors.notFound');
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
    const linkAttrs = 'target="_blank" rel="noopener noreferrer" class="text-teal-600 dark:text-teal-400 underline hover:text-teal-700 dark:hover:text-teal-300 font-medium"';
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
          className="sm:hidden fixed inset-0 bg-black/30 z-40 animate-fade-in"
          aria-hidden="true"
        />
      )}

      {/* ── Panneau de chat ── */}
      {open && (
        <div
          className="fixed z-50 flex flex-col overflow-hidden bg-white dark:bg-neutral-900 animate-slide-up inset-0 rounded-none border-0 shadow-none sm:inset-auto sm:bottom-24 sm:right-6 sm:w-96 sm:h-[600px] sm:max-h-[calc(100dvh-8rem)] sm:rounded-2xl sm:border sm:border-neutral-200 sm:dark:border-neutral-700 sm:shadow-2xl"
        >

          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white flex-shrink-0"
            style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-black tracking-wide">Rysmo</p>
                <p className="text-[10px] text-teal-200 font-medium">{t('subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setVoiceEnabled((v) => !v);
                  if (voiceEnabled) window.speechSynthesis?.cancel();
                }}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                title={voiceEnabled ? t('muteVoice') : t('enableVoice')}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              {messages.length > 1 && (
                <button
                  onClick={() => {
                    if (user) {
                      sessionStorage.removeItem(`${STORAGE_KEY}_${user.uid}`);
                    }
                    setMessages([]);
                    setHasGreeted(false);
                  }}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors"
                  title={t('clearConversation')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                aria-label={t('closeRysmo')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-teal-600 text-white rounded-tr-sm'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-tl-sm'
                  }`}
                  dangerouslySetInnerHTML={{ __html: formatText(msg.content) }}
                />
              </div>
            ))}

            {/* Indicateur de chargement */}
            {loading && (
              <div className="flex justify-start items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl rounded-tl-sm px-3 py-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
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
                    className="w-full text-left text-xs px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-teal-300 dark:hover:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-150"
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
            className="flex-shrink-0 border-t border-neutral-100 dark:border-neutral-800 p-3"
            style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
          >
            {/* Bannière upsell quand limite atteinte */}
            {limitReached && (
              <LocalizedLink
                to="/mon-espace/rysmo?tab=tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold shadow-sm hover:from-amber-600 hover:to-orange-600 transition-all"
              >
                <Sparkles className="w-4 h-4 flex-shrink-0" />
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
                className="flex-1 resize-none bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 dark:focus:border-teal-500 transition-colors max-h-24 overflow-y-auto"
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
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
                title={listening ? t('stopDictation') : t('startDictation')}
              >
                {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="p-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                aria-label={t('send')}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 gap-2">
              <p className="text-[10px] text-neutral-400 dark:text-neutral-600">
                {t('disclaimer')}
              </p>
              {quota && (
                <LocalizedLink
                  to="/mon-espace/rysmo?tab=tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-neutral-500 dark:text-neutral-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors flex items-center gap-1"
                  title={t('quotaTooltip')}
                >
                  {quota.packBalance > 0 && (
                    <span className="font-semibold text-teal-600 dark:text-teal-400">{t('quotaPack', { balance: quota.packBalance })}</span>
                  )}
                  <span>
                    {t('quotaToday', { remaining: quota.dayRemaining, limit: quota.dailyLimit })}
                  </span>
                  {quota.hasClubBonus && <span className="text-amber-500" title={t('clubBonusTooltip')}>★</span>}
                </LocalizedLink>
              )}
            </div>
            {voiceError && (
              <p className="text-[11px] text-red-500 dark:text-red-400 mt-1.5 text-center">{voiceError}</p>
            )}
          </div>
        </div>
      )}

      {/* ── FAB bouton ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`fixed bottom-24 md:bottom-6 right-4 sm:right-6 z-50 w-14 h-14 rounded-full shadow-lg items-center justify-center transition-all duration-300 ${
          open ? 'hidden sm:flex bg-neutral-700 dark:bg-neutral-600 rotate-12 scale-90' : 'flex bg-teal-600 hover:bg-teal-700 hover:scale-105'
        }`}
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        aria-label={open ? t('closeRysmo') : t('openRysmo')}
      >
        {open ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-6 h-6 text-white" />
        )}
        {/* Pulse quand fermé */}
        {!open && (
          <span className="absolute inset-0 rounded-full bg-teal-500 animate-ping opacity-20" />
        )}
      </button>
    </>
  );
}
