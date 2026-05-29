import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChatsCircle, PaperPlaneTilt, CaretLeft, CircleNotch, Flag, Check, UsersThree } from '@phosphor-icons/react';
import { cn, formatDate } from '../../../../lib/utils';
import {
  listenConversations, listenMessages, sendDmMessage, getOrCreateConversation, reportDmMessage,
} from '../../../../lib/firestore';
import type { Conversation, DmMessage } from '../../../../types';
import type { useClubData } from '../../hooks/useClubData';
import { slideUp } from '../../../../lib/animations';
import { ClubEmptyState } from './_shared';

type ClubData = ReturnType<typeof useClubData>;
const initialsOf = (n: string) => n.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase();

export default function ClubDiscussions({ data }: { data: ClubData }) {
  const { user, displayName, photoURL, dmTarget, setDmTarget, addToast } = data;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [reported, setReported] = useState<Set<string>>(new Set());
  const endRef = useRef<HTMLDivElement>(null);

  // Listen to my conversations
  useEffect(() => {
    if (!user) return;
    const unsub = listenConversations(user.uid, (list) => { setConversations(list); setLoadingConvs(false); });
    return unsub;
  }, [user]);

  // Open a conversation requested from the directory
  useEffect(() => {
    if (!user || !dmTarget) return;
    getOrCreateConversation(
      { id: user.uid, name: displayName, photo: photoURL || '' },
      { id: dmTarget.id, name: dmTarget.name, photo: dmTarget.photo },
    ).then((id) => { setSelected(id); setDmTarget(null); }).catch(() => { setDmTarget(null); addToast('error', "Impossible d'ouvrir la conversation."); });
  }, [user, dmTarget, displayName, photoURL, setDmTarget, addToast]);

  // Listen to messages of the selected conversation
  useEffect(() => {
    if (!selected) { setMessages([]); return; }
    const unsub = listenMessages(selected, setMessages);
    return unsub;
  }, [selected]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const activeConv = conversations.find((c) => c.id === selected);
  const otherIdOf = (c: Conversation) => c.participants.find((p) => p !== user?.uid) ?? '';

  const send = async () => {
    if (!user || !selected || !draft.trim()) return;
    setSending(true);
    const text = draft.trim();
    setDraft('');
    try {
      await sendDmMessage(selected, user.uid, text);
    } catch {
      addToast('error', "Échec de l'envoi.");
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  const report = async (m: DmMessage) => {
    if (!user || !selected || !activeConv) return;
    setReported((prev) => new Set(prev).add(m.id));
    try {
      await reportDmMessage(selected, m, user.uid, otherIdOf(activeConv));
      addToast('success', 'Message signalé à la modération.');
    } catch {
      addToast('error', 'Erreur lors du signalement.');
    }
  };

  if (loadingConvs) return <div className="flex justify-center py-16"><CircleNotch className="w-8 h-8 animate-spin text-plum-500" /></div>;

  // ── Thread view ──
  if (selected && activeConv) {
    const otherId = otherIdOf(activeConv);
    const otherName = activeConv.participantNames[otherId] ?? 'Membre';
    const otherPhoto = activeConv.participantPhotos[otherId] ?? '';
    return (
      <motion.div className="flex flex-col h-[calc(100svh-300px)] sm:h-[calc(100dvh-220px)] min-h-[360px] max-h-[680px] bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden" variants={slideUp} initial="hidden" animate="visible">
        <div className="flex items-center gap-3 p-3 border-b border-neutral-200 dark:border-neutral-700">
          <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700"><CaretLeft className="w-5 h-5" weight="bold" /></button>
          <div className="w-9 h-9 rounded-full bg-plum-100 dark:bg-plum-900/40 flex items-center justify-center overflow-hidden flex-shrink-0">
            {otherPhoto ? <img src={otherPhoto} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-plum-600 dark:text-plum-400">{initialsOf(otherName)}</span>}
          </div>
          <p className="font-bold text-neutral-900 dark:text-white truncate">{otherName}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.length === 0 ? (
            <p className="text-center text-xs text-neutral-400 py-8">Démarre la conversation 👋</p>
          ) : messages.map((m) => {
            const mine = m.senderId === user?.uid;
            return (
              <div key={m.id} className={cn('flex group', mine ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[78%]')}>
                  <div className={cn('px-3 py-2 rounded-2xl text-sm break-words whitespace-pre-wrap', mine ? 'bg-plum-600 text-white rounded-br-sm' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-bl-sm')}>
                    {m.text}
                  </div>
                  <div className={cn('flex items-center gap-2 mt-0.5', mine ? 'justify-end' : 'justify-start')}>
                    <span className="text-[10px] text-neutral-400">{formatDate(m.createdAt)}</span>
                    {!mine && (
                      reported.has(m.id)
                        ? <span className="text-[10px] text-neutral-400 inline-flex items-center gap-0.5"><Check className="w-3 h-3" /> signalé</span>
                        : <button onClick={() => report(m)} className="opacity-0 group-hover:opacity-100 text-[10px] text-neutral-400 hover:text-error-500 inline-flex items-center gap-0.5 transition-opacity"><Flag className="w-3 h-3" /> signaler</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <div className="flex items-center gap-2 p-3 border-t border-neutral-200 dark:border-neutral-700">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Écris un message…"
            className="flex-1 px-3 py-2 rounded-full border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-plum-500/20 focus:border-plum-500"
          />
          <button onClick={send} disabled={sending || !draft.trim()} className="p-2.5 rounded-full bg-plum-600 hover:bg-plum-700 text-white disabled:opacity-50 transition-colors flex-shrink-0">
            {sending ? <CircleNotch className="w-4 h-4 animate-spin" /> : <PaperPlaneTilt className="w-4 h-4" weight="fill" />}
          </button>
        </div>
      </motion.div>
    );
  }

  // ── Inbox view ──
  return (
    <motion.div className="space-y-3" variants={slideUp} initial="hidden" animate="visible">
      <div className="flex items-center gap-2">
        <ChatsCircle className="w-5 h-5 text-plum-500" weight="duotone" />
        <h3 className="font-bold text-neutral-900 dark:text-white">Discussions</h3>
      </div>
      {conversations.length === 0 ? (
        <ClubEmptyState
          icon={ChatsCircle}
          title="Aucune conversation"
          subtitle="Démarre un échange privé avec un autre membre depuis l'annuaire."
          action={(
            <button onClick={() => data.setClubTab('members')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-plum-600 hover:bg-plum-700 text-white text-sm font-semibold transition-colors">
              <UsersThree className="w-4 h-4" weight="fill" /> Aller à l'annuaire
            </button>
          )}
        />
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => {
            const otherId = otherIdOf(c);
            const name = c.participantNames[otherId] ?? 'Membre';
            const photo = c.participantPhotos[otherId] ?? '';
            return (
              <button key={c.id} onClick={() => setSelected(c.id)} className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-plum-200 dark:hover:border-plum-800/60 transition-colors text-left">
                <div className="w-11 h-11 rounded-full bg-plum-100 dark:bg-plum-900/40 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-plum-600 dark:text-plum-400">{initialsOf(name)}</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-neutral-900 dark:text-white truncate">{name}</p>
                  <p className="text-xs text-neutral-400 truncate">{c.lastMessage || 'Nouvelle conversation'}</p>
                </div>
                {c.lastMessageAt && <span className="text-[10px] text-neutral-400 flex-shrink-0">{formatDate(c.lastMessageAt)}</span>}
              </button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
