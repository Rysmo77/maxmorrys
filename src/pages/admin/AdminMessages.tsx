import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, MailOpen, Clock, Search, Trash2, CheckCheck, Loader2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { subscribeMessages, updateMessageStatus, deleteMessage } from '../../lib/firestore';
import { useFormat } from '../../hooks/useFormat';
import type { ContactMessage } from '../../types';

const statusVariants = { new: 'error' as const, read: 'warning' as const, replied: 'success' as const };

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
  const [filterStatus, setFilterStatus] = useState<'all' | ContactMessage['status']>('all');
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

  const newCount = messages.filter((m) => m.status === 'new').length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('messages.title')}</h1>
          <p className="text-sm text-neutral-500">
            {loading ? t('messages.loading') : t('messages.newCount', { count: newCount })}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('messages.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-neutral-900 dark:text-white"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'new', 'read', 'replied'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === s
                  ? 'bg-brand-500 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-600'
              }`}
            >
              {s === 'all' ? t('messages.filter.all') : statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <p className="text-center text-neutral-500 py-8">{t('messages.empty')}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((msg) => (
            <Card key={msg.id} hover className="cursor-pointer" onClick={() => openMessage(msg)}>
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-xl flex-shrink-0 ${msg.status === 'new' ? 'bg-error-50 dark:bg-error-900/20' : 'bg-neutral-100 dark:bg-neutral-700'}`}>
                  {msg.status === 'new' ? (
                    <Mail className="w-5 h-5 text-error-500" />
                  ) : (
                    <MailOpen className="w-5 h-5 text-neutral-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className={`text-sm font-medium ${msg.status === 'new' ? 'text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400'}`}>
                      {msg.name}
                    </p>
                    <Badge variant={statusVariants[msg.status]} size="sm">{statusLabels[msg.status]}</Badge>
                  </div>
                  <p className="text-sm text-neutral-900 dark:text-white font-medium mb-1 truncate">{msg.subject}</p>
                  <p className="text-xs text-neutral-500 truncate">{msg.message}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-neutral-400 flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  {new Date(msg.sentAt).toLocaleDateString(locale)}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.subject || ''} size="lg">
        {selected && (
          <div>
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-200 dark:border-neutral-700">
              <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                  {selected.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-neutral-900 dark:text-white">{selected.name}</p>
                <a href={`mailto:${selected.email}`} className="text-sm text-brand-600 dark:text-brand-400 hover:underline">{selected.email}</a>
              </div>
              <span className="text-xs text-neutral-400 flex-shrink-0">{new Date(selected.sentAt).toLocaleString(locale)}</span>
            </div>

            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed whitespace-pre-wrap mb-6">{selected.message}</p>

            <div className="flex items-center justify-between gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(selected.id)}
                icon={<Trash2 className="w-4 h-4" />}
                className="text-error-600 border-error-300 hover:bg-error-50 dark:text-error-400 dark:border-error-700 dark:hover:bg-error-900/20"
              >
                {t('messages.actions.delete')}
              </Button>
              <div className="flex gap-2">
                {selected.status !== 'replied' && (
                  <Button
                    size="sm"
                    onClick={() => markReplied(selected.id)}
                    icon={<CheckCheck className="w-4 h-4" />}
                  >
                    {t('messages.actions.markReplied')}
                  </Button>
                )}
                <a
                  href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors"
                >
                  <Mail className="w-4 h-4" /> {t('messages.actions.replyByEmail')}
                </a>
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
    </div>
  );
}
