import { useState } from 'react';
import { Plus, X, Send, Inbox, Loader2 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { cn, formatDate } from '../../../lib/utils';
import { createDoc, getUserMessages } from '../../../lib/firestore';
import type { ContactMessage } from '../../../types';
import { captureError } from '../../../lib/sentry';

const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors placeholder-neutral-400';

interface MessagesTabProps {
  userId: string;
  userEmail: string;
  displayName: string;
  sentMessages: ContactMessage[];
  setSentMessages: React.Dispatch<React.SetStateAction<ContactMessage[]>>;
  loadingMessages: boolean;
  addToast: (type: 'success' | 'error', message: string) => void;
}

export default function MessagesTab({
  userId,
  userEmail,
  displayName,
  sentMessages,
  setSentMessages,
  loadingMessages,
  addToast,
}: MessagesTabProps) {
  const [showMsgForm, setShowMsgForm] = useState(false);
  const [msgForm, setMsgForm] = useState({ subject: '', message: '' });
  const [sendingMsg, setSendingMsg] = useState(false);

  const handleSendMessage = async () => {
    if (!userEmail || !msgForm.subject.trim() || !msgForm.message.trim()) return;
    setSendingMsg(true);
    try {
      await createDoc('messages', {
        name: displayName,
        email: userEmail,
        subject: msgForm.subject.trim(),
        message: msgForm.message.trim(),
        sentAt: new Date().toISOString(),
        status: 'new',
        userId,
      });
      setMsgForm({ subject: '', message: '' });
      setShowMsgForm(false);
      addToast('success', 'Message envoyé avec succès !');
      getUserMessages(userId).then(setSentMessages).catch(() => null);
    } catch (error: unknown) {
      captureError(error, { context: 'Failed to send message' });
      addToast('error', error instanceof Error ? error.message : "Erreur lors de l'envoi. Veuillez réessayer.");
    } finally {
      setSendingMsg(false);
    }
  };

  return (
    <div className="space-y-4">
      {showMsgForm ? (
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-neutral-900 dark:text-white">Nouveau message</h3>
            <button onClick={() => setShowMsgForm(false)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-500">De</label>
            <div className="px-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-700 text-sm text-neutral-500">
              {displayName} &lt;{userEmail}&gt;
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-500">Sujet</label>
            <input
              value={msgForm.subject}
              onChange={(e) => setMsgForm((p) => ({ ...p, subject: e.target.value }))}
              placeholder="Ex: Question sur la formation..."
              maxLength={200}
              className={inputCls}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-500">Message</label>
            <textarea
              value={msgForm.message}
              onChange={(e) => setMsgForm((p) => ({ ...p, message: e.target.value }))}
              placeholder="Décris ta demande..."
              rows={6}
              maxLength={2000}
              className={`${inputCls} resize-y`}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowMsgForm(false)}>Annuler</Button>
            <Button
              onClick={handleSendMessage}
              disabled={sendingMsg || !msgForm.subject.trim() || !msgForm.message.trim()}
              icon={sendingMsg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            >
              {sendingMsg ? 'Envoi...' : 'Envoyer'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-neutral-900 dark:text-white">Messages envoyés</h3>
          <Button size="sm" onClick={() => setShowMsgForm(true)} icon={<Plus className="w-4 h-4" />}>Nouveau message</Button>
        </div>
      )}

      {!showMsgForm && (
        loadingMessages ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
        ) : sentMessages.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 dark:from-brand-900/40 dark:to-brand-900/20 flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-7 h-7 text-brand-500" />
            </div>
            <h4 className="font-bold text-neutral-900 dark:text-white mb-1">Ta boîte est vide</h4>
            <p className="text-sm text-neutral-500 mb-4 max-w-xs mx-auto">
              Une question sur une formation ou un besoin particulier ? L'équipe Max-Morrys te répond sous 24h.
            </p>
            <Button size="sm" onClick={() => setShowMsgForm(true)} icon={<Send className="w-4 h-4" />}>Envoyer un message</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sentMessages.map((msg) => (
              <div key={msg.id} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-semibold text-neutral-900 dark:text-white text-sm">{msg.subject}</p>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0',
                    msg.status === 'new' ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400' :
                    msg.status === 'read' ? 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500' :
                    'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400'
                  )}>
                    {msg.status === 'new' ? 'Envoyé' : msg.status === 'read' ? 'Lu' : 'Répondu'}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 line-clamp-2">{msg.message}</p>
                <p className="text-xs text-neutral-400 mt-2">{formatDate(msg.sentAt)}</p>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
