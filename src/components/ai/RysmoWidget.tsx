import { useState, useRef, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { X, Send, Mic, MicOff, Bot, Loader2, Volume2, VolumeX } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface RysmoResponse {
  reply: string;
}

const QUICK_ACTIONS = [
  'Explique-moi un concept marketing',
  'Fais-moi réviser 10 minutes',
  'Génère un quiz sur ce que j\'ai appris',
  'Recommande-moi une ressource',
];

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
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
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
  { message: string; conversationHistory: Message[]; userContext?: { displayName?: string; enrolledCourses?: string[] } },
  RysmoResponse
>(functions, 'rysmo');

export default function RysmoWidget() {
  const { user, userData } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const displayName = user
    ? (userData?.displayName || user.displayName || user.email?.split('@')[0] || 'Étudiant')
    : '';

  // Scroll auto vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Message de bienvenue à la première ouverture
  useEffect(() => {
    if (open && !hasGreeted && user) {
      setHasGreeted(true);
      setMessages([
        {
          role: 'assistant',
          content: `Salut ${displayName} ! Je suis **Rysmo**, ton répétiteur IA. Je suis là pour t'aider à comprendre tes cours, créer des quiz, et recommander des ressources. Comment puis-je t'aider aujourd'hui ?`,
        },
      ]);
    }
  }, [open, hasGreeted, displayName, user]);

  // Afficher uniquement pour les utilisateurs authentifiés
  if (!user) return null;

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { role: 'user', content: trimmed };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const result = await rysmoCallable({
        message: trimmed,
        conversationHistory: messages,
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

      // Lecture vocale si activée
      if (voiceEnabled && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(result.data.reply);
        utterance.lang = 'fr-FR';
        utterance.rate = 1.05;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    } catch (err: unknown) {
      console.error('Rysmo error:', err);

      let errorMessage = "Désolé, une erreur s'est produite. Réessaie dans quelques instants.";
      if (err && typeof err === 'object' && 'code' in err) {
        const code = (err as { code: string }).code;
        if (code === 'functions/unauthenticated') {
          errorMessage = "Tu dois être connecté pour utiliser Rysmo.";
        } else if (code === 'functions/resource-exhausted') {
          errorMessage = "Trop de requêtes. Attends un moment avant de réessayer.";
        } else if (code === 'functions/not-found') {
          errorMessage = "Le service Rysmo n'est pas disponible pour le moment.";
        }
      }

      setMessages([
        ...newMessages,
        { role: 'assistant', content: errorMessage },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const toggleVoiceInput = () => {
    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert("La reconnaissance vocale n'est pas supportée par votre navigateur.");
      return;
    }

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
      setInput(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Formater le texte markdown basique (gras)
  const formatText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />');
  };

  return (
    <>
      {/* ── Panneau de chat ── */}
      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 max-h-[600px] z-50 flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 animate-slide-up">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-brand-600 to-brand-700 text-white flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-black tracking-wide">Rysmo</p>
                <p className="text-[10px] text-brand-200 font-medium">Répétiteur IA · Max-Morrys</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setVoiceEnabled((v) => !v);
                  if (voiceEnabled) window.speechSynthesis?.cancel();
                }}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                title={voiceEnabled ? 'Couper la voix' : 'Activer la voix'}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Fermer Rysmo"
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
                  <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-brand-600 text-white rounded-tr-sm'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-tl-sm'
                  }`}
                  dangerouslySetInnerHTML={{ __html: formatText(msg.content) }}
                />
              </div>
            ))}

            {/* Indicateur de chargement */}
            {loading && (
              <div className="flex justify-start items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                </div>
                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl rounded-tl-sm px-3 py-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                </div>
              </div>
            )}

            {/* Actions rapides (première ouverture, avant interaction) */}
            {messages.length <= 1 && !loading && (
              <div className="pt-1 space-y-1.5">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action}
                    onClick={() => sendMessage(action)}
                    className="w-full text-left text-xs px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all duration-150"
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-neutral-100 dark:border-neutral-800 p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pose ta question à Rysmo..."
                rows={1}
                className="flex-1 resize-none bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 dark:focus:border-brand-500 transition-colors max-h-24 overflow-y-auto"
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
                title={listening ? 'Arrêter la dictée' : 'Dicter un message'}
              >
                {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="p-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                aria-label="Envoyer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-neutral-400 dark:text-neutral-600 text-center mt-2">
              Voix générée par IA · Rysmo peut faire des erreurs
            </p>
          </div>
        </div>
      )}

      {/* ── FAB bouton ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`fixed bottom-6 right-4 sm:right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          open
            ? 'bg-neutral-700 dark:bg-neutral-600 rotate-12 scale-90'
            : 'bg-brand-600 hover:bg-brand-700 hover:scale-105'
        }`}
        aria-label={open ? 'Fermer Rysmo' : 'Ouvrir Rysmo, répétiteur IA'}
      >
        {open ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-6 h-6 text-white" />
        )}
        {/* Pulse quand fermé */}
        {!open && (
          <span className="absolute inset-0 rounded-full bg-brand-500 animate-ping opacity-20" />
        )}
      </button>
    </>
  );
}
