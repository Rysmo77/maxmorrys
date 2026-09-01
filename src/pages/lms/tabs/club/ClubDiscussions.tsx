import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Avatar, Button, ChatBubble, Field, GlassPanel, Icon, IconButton, LessonRow, Skeleton, Tag } from '@ds';
import { cn } from '../../../../lib/utils';
import { useFormat } from '../../../../hooks/useFormat';
import {
  listenConversations, listenMessages, sendDmMessage, getOrCreateConversation, reportDmMessage,
} from '../../../../lib/firestore';
import type { Conversation, DmMessage } from '../../../../types';
import type { useClubData } from '../../hooks/useClubData';
import { slideUp } from '../../../../lib/animations';
import { ClubEmptyState, ClubSectionHeader } from './_shared';

type ClubData = ReturnType<typeof useClubData>;
const initialsOf = (n: string) => n.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase();

/**
 * LES MESSAGES PRIVÉS — et un écart entre le kit et le produit qu'il faut nommer.
 *
 * ⚠️ L'écran `ClubDiscussions` du kit N'EST PAS CET ÉCRAN-CI. Il montre un FORUM : des fils
 * publics classés par catégorie, avec un décompte de réponses et une pile d'avatars. Cet
 * onglet-ci, dans le produit, est une messagerie un à un — `listenConversations`,
 * `sendDmMessage`, une boîte de réception et un fil. Le forum du kit, lui, existe bien dans le
 * produit : ce sont les catégories du FIL, onglet précédent.
 *
 * La forme reprise est donc celle du kit là où elle s'applique — la liste en `LessonRow` sur
 * du verre plat, la pastille d'initiales, l'horodatage en méta — et la bulle de conversation
 * du système (`ChatBubble`) pour le fil, qui a exactement ce dessin.
 *
 * LE SIGNALEMENT GARDE LA PHRASE DU KIT, prise à l'écran `ClubMembre` : « le signalement part
 * à l'administration seule. La personne signalée ne le voit pas et ne peut pas l'annuler. »
 * Elle était absente du produit, où « signaler » n'expliquait rien de ce qu'il déclenchait.
 */
export default function ClubDiscussions({ data }: { data: ClubData }) {
  const { t } = useTranslation('club');
  const { formatDate } = useFormat();
  const { user, displayName, photoURL, dmTarget, setDmTarget, addToast } = data;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [reported, setReported] = useState<Set<string>>(new Set());
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = listenConversations(user.uid, (list) => { setConversations(list); setLoadingConvs(false); });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user || !dmTarget) return;
    getOrCreateConversation(
      { id: user.uid, name: displayName, photo: photoURL || '' },
      { id: dmTarget.id, name: dmTarget.name, photo: dmTarget.photo },
    ).then((id) => { setSelected(id); setDmTarget(null); }).catch(() => { setDmTarget(null); addToast('error', t('discussions.toastOpenError')); });
  }, [user, dmTarget, displayName, photoURL, setDmTarget, addToast, t]);

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
      addToast('error', t('discussions.toastSendError'));
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
      addToast('success', t('discussions.toastReported'));
    } catch {
      addToast('error', t('discussions.toastReportError'));
    }
  };

  if (loadingConvs) {
    return (
      <div className="space-y-2">
        <Skeleton height={30} width="45%" label={t('discussions.title')} />
        <Skeleton height={72} radius="var(--r-l)" label={t('discussions.title')} />
        <Skeleton height={72} radius="var(--r-l)" label={t('discussions.title')} />
      </div>
    );
  }

  /* ── Le fil ─────────────────────────────────────────────────────────────── */
  if (selected && activeConv) {
    const otherId = otherIdOf(activeConv);
    const otherName = activeConv.participantNames[otherId] ?? t('discussions.memberFallback');
    const otherPhoto = activeConv.participantPhotos[otherId] ?? '';
    return (
      <motion.div variants={slideUp} initial="hidden" animate="visible">
        <GlassPanel
          level="flat"
          padding={0}
          className="flex h-[calc(100svh-300px)] max-h-[680px] min-h-[360px] flex-col overflow-hidden stack:h-[calc(100dvh-220px)]"
        >
          <div className="flex flex-none items-center gap-3 border-b border-[color:var(--line)] p-3">
            <IconButton label={t('discussions.back')} onClick={() => setSelected(null)}>
              <Icon name="back" size={18} />
            </IconButton>
            {otherPhoto
              ? <img src={otherPhoto} alt="" loading="lazy" className="h-9 w-9 flex-none rounded-full object-cover" />
              : <Avatar initials={initialsOf(otherName)} size={36} />}
            <p className="truncate font-bold text-ink">{otherName}</p>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {messages.length === 0 ? (
              <p className="py-8 text-center text-meta-2 text-ink-2">{t('discussions.startConversation')}</p>
            ) : messages.map((m) => {
              const mine = m.senderId === user?.uid;
              return (
                <div key={m.id} className={cn('group flex flex-col', mine ? 'items-end' : 'items-start')}>
                  <ChatBubble from={mine ? 'me' : 'ai'}>{m.text}</ChatBubble>
                  <div className={cn('mt-0.5 flex items-center gap-2', mine ? 'justify-end' : 'justify-start')}>
                    <span className="text-small text-ink-2">{formatDate(m.createdAt)}</span>
                    {!mine && (reported.has(m.id) ? (
                      <Tag tone="ok">{t('discussions.reported')}</Tag>
                    ) : (
                      <button
                        type="button"
                        onClick={() => report(m)}
                        className="mm-touch-extend inline-flex items-center gap-1 text-small text-ink-2 opacity-0 transition-opacity duration-ui ease-ds hover:text-stop focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <Icon name="alert" size={12} /> {t('discussions.report')}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          {/*
            UN VRAI `<form>`, ET C'EST CE QUI REND LA TOUCHE ENTRÉE. La version précédente
            écoutait `keydown` sur l'input pour envoyer ; la soumission native fait la même
            chose sans code, la fait aussi au clavier logiciel mobile (dont la touche « envoi »
            soumet le formulaire et n'émet pas toujours d'Entrée), et l'annonce comme telle.
          */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="flex flex-none items-end gap-2 border-t border-[color:var(--line)] p-3"
          >
            <Field
              label={t('discussions.messageLabel')}
              hideLabel
              value={draft}
              onChange={setDraft}
              placeholder={t('discussions.messagePlaceholder')}
              className="flex-1"
              style={{ marginTop: 0 }}
            />
            <Button tone="transforme" size="sm" type="submit" loading={sending} disabled={!draft.trim()}>
              <Icon name="send" size={15} /> {t('discussions.send')}
            </Button>
          </form>
        </GlassPanel>

        {/* La phrase du kit, prise à l'écran `ClubMembre` : ce que « signaler » déclenche. */}
        <p className="mt-3 text-small leading-relaxed text-ink-2">{t('discussions.reportNote')}</p>
      </motion.div>
    );
  }

  /* ── La boîte de réception ──────────────────────────────────────────────── */
  return (
    <motion.div className="space-y-3" variants={slideUp} initial="hidden" animate="visible">
      <ClubSectionHeader icon="chat" title={t('discussions.title')} />

      {conversations.length === 0 ? (
        <ClubEmptyState
          icon="chat"
          title={t('discussions.emptyTitle')}
          subtitle={t('discussions.emptySubtitle')}
          action={(
            <Button tone="transforme" size="sm" onClick={() => data.setClubTab('members')}>
              <Icon name="users" size={15} /> {t('discussions.goToDirectory')}
            </Button>
          )}
        />
      ) : (
        <GlassPanel level="flat" padding="4px 18px" as="ul" className="m-0 list-none">
          {conversations.map((c, i) => {
            const otherId = otherIdOf(c);
            const name = c.participantNames[otherId] ?? t('discussions.memberFallback');
            const photo = c.participantPhotos[otherId] ?? '';
            return (
              <li key={c.id}>
                <LessonRow
                  state="plain"
                  last={i === conversations.length - 1}
                  onClick={() => setSelected(c.id)}
                  iconBackground="transparent"
                  icon={photo
                    ? <img src={photo} alt="" loading="lazy" className="h-[34px] w-[34px] rounded-full object-cover" />
                    : <Avatar initials={initialsOf(name)} size={34} />}
                  title={name}
                  meta={c.lastMessage || t('discussions.newConversation')}
                  trailing={c.lastMessageAt
                    ? <span className="flex-none text-small text-ink-2">{formatDate(c.lastMessageAt)}</span>
                    : undefined}
                />
              </li>
            );
          })}
        </GlassPanel>
      )}
    </motion.div>
  );
}
