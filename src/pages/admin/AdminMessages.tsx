import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TagTone } from '@ds';
import { Button, EmptyState, Field, GlassPanel, Icon, LessonRow, Skeleton, Tag, useToast } from '@ds';
import { ConsolePage, ConsoleFilter, ConsoleList, ConsoleScope } from '../../components/console';
import { Modal } from '@/components/dialogs';
import { ConfirmDialog } from '@/components/dialogs';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { subscribeMessages, updateMessageStatus, deleteMessage } from '../../lib/firestore';
import { useFormat } from '../../hooks/useFormat';
import type { ContactMessage } from '../../types';

/**
 * ── MESSAGES DE CONTACT — motif de console ──────────────────────────────────────────
 *
 * Pipeline du kit : `tout · à traiter · en attente · clos`. Ce sont les quatre noms de
 * `MotifConsole` lui-même, et ils se posent sans traduction sur les trois statuts du
 * document : `new` est ce qu'il y a à traiter, `read` est ouvert mais sans réponse, et
 * `replied` clôt. Les COMPTEURS, eux, viennent de l'abonnement Firestore — jamais du kit,
 * dont les nombres sont de la démonstration.
 *
 * UNE SEULE ACTION PAR LIGNE : ouvrir. La suppression et le « marquer répondu » vivent dans
 * la fiche, pas dans la liste — « deux actions par ligne, c'est une hésitation par ligne ».
 * C'est aussi ce qu'impose `LessonRow` : une ligne qui agit EST un bouton, et un bouton dans
 * un bouton n'est pas un document valide.
 * ────────────────────────────────────────────────────────────────────────────────────
 */

type Stage = 'all' | ContactMessage['status'];

const TONE: Record<ContactMessage['status'], TagTone> = {
  new: 'warn',
  read: 'neutral',
  replied: 'ok',
};

const GLYPH: Record<ContactMessage['status'], { name: 'chat' | 'comment' | 'check'; token: string }> = {
  new: { name: 'chat', token: '--mm-orange' },
  read: { name: 'comment', token: '--mm-bleu' },
  replied: { name: 'check', token: '--ok' },
};

export default function AdminMessages() {
  const { t } = useTranslation('admin');
  const { locale } = useFormat();
  const statusLabels: Record<ContactMessage['status'], string> = {
    new: t('messages.status.new'),
    read: t('messages.status.read'),
    replied: t('messages.status.replied'),
  };
  const { addToast } = useToast();
  const confirm = useConfirmDialog();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<Stage>('all');
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  useEffect(() => {
    const unsub = subscribeMessages((msgs) => {
      setMessages(msgs);
      setLoading(false);
    });
    return unsub;
  }, []);

  const openMessage = async (msg: ContactMessage) => {
    setSelected(msg);
    if (msg.status === 'new') {
      await updateMessageStatus(msg.id, 'read').catch(() => null);
    }
  };

  const markReplied = async (id: string) => {
    await updateMessageStatus(id, 'replied').catch(() => addToast('error', t('messages.toast.updateError')));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status: 'replied' } : prev);
  };

  const handleDelete = (id: string) => {
    confirm.requestConfirm(t('messages.confirm.deleteMessage'), async () => {
      try {
        await deleteMessage(id);
        addToast('success', t('messages.toast.deleted'));
        setSelected(null);
      } catch {
        addToast('error', t('messages.toast.deleteError'));
      }
      confirm.closeConfirm();
    });
  };

  const filtered = messages.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || m.status === filterStatus;
    return matchSearch && matchStatus;
  });

  /* Le nom de l'étape vient du kit ; le nombre qui le suit vient de l'abonnement. */
  const bar = useMemo(() => {
    const count = (s: ContactMessage['status']) => messages.filter((m) => m.status === s).length;
    return ([
      { key: 'all' as Stage, label: t('messages.stage.all'), n: messages.length },
      { key: 'new' as Stage, label: t('messages.stage.todo'), n: count('new') },
      { key: 'read' as Stage, label: t('messages.stage.waiting'), n: count('read') },
      { key: 'replied' as Stage, label: t('messages.stage.closed'), n: count('replied') },
    ]).map((s) => ({ ...s, text: `${s.label} ${s.n}` }));
  }, [messages, t]);

  return (
    <ConsolePage title={t('messages.title')} sub={t('messages.sub')}>
      <ConsoleFilter
        stages={bar.map((s) => s.text)}
        active={bar.find((s) => s.key === filterStatus)?.text}
        onSelect={(text) => {
          const hit = bar.find((s) => s.text === text);
          if (hit) setFilterStatus(hit.key);
        }}
        label={t('messages.pipelineLabel')}
      />

      <div className="mt-4 max-w-sm">
        <Field
          type="search"
          label={t('messages.searchLabel')}
          hideLabel
          value={search}
          onChange={setSearch}
          placeholder={t('messages.searchPlaceholder')}
        />
      </div>

      {loading && (
        <GlassPanel level="night" padding="14px 18px" className="mt-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={44} label={i === 0 ? t('messages.loading') : undefined} style={{ marginBottom: '8px' }} />
          ))}
        </GlassPanel>
      )}

      {!loading && filtered.length === 0 && (
        <GlassPanel level="night" padding={8} className="mt-4">
          <EmptyState
            glyph={<Icon name="chat" size={26} color="var(--text-muted)" />}
            glyphBackground="var(--fill-1)"
            title={t('messages.emptyTitle')}
            body={t('messages.empty')}
          />
        </GlassPanel>
      )}

      {!loading && filtered.length > 0 && (
        <ConsoleList label={t('messages.title')} style={{ marginTop: '16px' }}>
          {filtered.map((msg, i) => (
            <li key={msg.id}>
              <LessonRow
                icon={<Icon name={GLYPH[msg.status].name} size={14} color={`var(${GLYPH[msg.status].token})`} />}
                iconBackground={`color-mix(in srgb, var(${GLYPH[msg.status].token}) 20%, transparent)`}
                title={msg.subject}
                meta={`${msg.name} · ${new Date(msg.sentAt).toLocaleDateString(locale)}`}
                trailing={<Tag tone={TONE[msg.status]}>{statusLabels[msg.status]}</Tag>}
                onClick={() => { void openMessage(msg); }}
                last={i === filtered.length - 1}
              />
            </li>
          ))}
        </ConsoleList>
      )}

      <ConsoleScope>{t('messages.scope')}</ConsoleScope>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.subject || ''} size="lg">
        {selected && (
          <div>
            <div className="mb-4 flex items-center gap-3 border-b border-[color:var(--line)] pb-4">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--mm-bleu)_16%,transparent)] text-xs font-bold text-forme"
              >
                {selected.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{selected.name}</p>
                <a href={`mailto:${selected.email}`} className="text-sm text-forme hover:underline">{selected.email}</a>
              </div>
              <span className="shrink-0 text-xs text-ink-2">{new Date(selected.sentAt).toLocaleString(locale)}</span>
            </div>

            <p className="mb-6 whitespace-pre-wrap leading-relaxed text-ink-2">{selected.message}</p>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--line)] pt-4">
              <Button tone="ghost" size="sm" onClick={() => handleDelete(selected.id)}>
                <Icon name="trash" size={15} /> {t('messages.actions.delete')}
              </Button>
              <div className="flex gap-2">
                {selected.status !== 'replied' && (
                  <Button tone="quiet" size="sm" onClick={() => { void markReplied(selected.id); }}>
                    <Icon name="check" size={15} /> {t('messages.actions.markReplied')}
                  </Button>
                )}
                <Button
                  size="sm"
                  href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}
                >
                  <Icon name="send" size={15} /> {t('messages.actions.replyByEmail')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        onClose={confirm.closeConfirm}
        onConfirm={confirm.onConfirm}
        title={t('messages.confirm.deleteTitle')}
        message={confirm.message}
        confirmLabel={t('messages.actions.delete')}
      />
    </ConsolePage>
  );
}
