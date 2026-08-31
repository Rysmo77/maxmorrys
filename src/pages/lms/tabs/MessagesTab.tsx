import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState, Field, GlassPanel, Icon, LessonRow, Num, Skeleton, Tag } from '@ds';
import { useFormat } from '../../../hooks/useFormat';
import { createDoc, getUserMessages } from '../../../lib/firestore';
import type { ContactMessage } from '../../../types';
import { captureError } from '../../../lib/sentry';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * L'ÉCRAN « MES MESSAGES » — un écran de PILE, pas un des cinq à barre d'onglets.
 *
 * Recomposé sur `ScreensCompte.js` : panneau de verre pour le formulaire, champs <Field>,
 * lignes de liste, et l'encart de vérité qui dit par où revient la réponse.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI A DISPARU, ET POURQUOI
 *
 * · « L'ÉQUIPE MAX-MORRYS TE RÉPOND SOUS 24 H ». Deux mensonges dans une phrase de sept mots.
 *   Il n'y a pas d'équipe — la page « à propos » dit « je préfère répondre moi-même », et
 *   c'est de là que vient tout ce qui est plafonné dans le produit. Et il n'y a AUCUN CANAL
 *   D'ENVOI D'E-MAIL : un délai de réponse annoncé sur un canal qui n'existe pas est une
 *   promesse que rien ne peut tenir. L'encart de vérité dit désormais ce qui se passe
 *   réellement : la réponse arrive dans les notifications, dans l'application.
 *
 * · LES TROIS `<label>` ORPHELINS. Le formulaire posait des `<label>` non associés à leurs
 *   champs — invisibles pour un lecteur d'écran, et sans effet au clic. <Field> lie le
 *   libellé au contrôle par un `id` généré.
 *
 * L'ÉTAT D'UN MESSAGE EST UNE INFORMATION, PAS UNE COULEUR. Les trois états passent par
 * <Tag>, dont les tons viennent des jetons et basculent seuls sous `.dk`.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

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
  const { t } = useTranslation('lmsTabs');
  const { formatDate } = useFormat();
  const [showMsgForm, setShowMsgForm] = useState(false);
  const [msgForm, setMsgForm] = useState({ subject: '', message: '' });
  const [sendingMsg, setSendingMsg] = useState(false);

  /* La date du relevé : l'instant de la lecture qui a produit cette liste. */
  const asOf = new Date();

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
      addToast('success', t('messages.toastSuccess'));
      getUserMessages(userId).then(setSentMessages).catch(() => null);
    } catch (error: unknown) {
      captureError(error, { context: 'Failed to send message' });
      addToast('error', error instanceof Error ? error.message : t('messages.toastError'));
    } finally {
      setSendingMsg(false);
    }
  };

  /* Les quatre tons de <Tag> disent l'ÉTAT, pas la catégorie : `warn` = en attente de
     réponse, `neutral` = lu, `ok` = répondu. Il n'y en a pas de cinquième. */
  const statusTone = (status: ContactMessage['status']): 'ok' | 'warn' | 'neutral' =>
    status === 'replied' ? 'ok' : status === 'read' ? 'neutral' : 'warn';
  const statusLabel = (status: ContactMessage['status']) =>
    status === 'new' ? t('messages.statusSent') : status === 'read' ? t('messages.statusRead') : t('messages.statusReplied');

  return (
    <div className="mx-auto max-w-4xl px-[18px] py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="m-0 font-display text-dsp-xs text-ink">{t('messages.screenTitle')}</h1>
          <p className="m-0 mt-[2px] text-meta-2" style={{ color: 'var(--text-muted)' }}>
            <Num value={sentMessages.length} source="db" asOf={asOf} /> {t('messages.countLabel')}
          </p>
        </div>
        {!showMsgForm && (
          <Button tone="forme" size="sm" fullWidth={false} onClick={() => setShowMsgForm(true)}>
            {t('messages.newMessage')}
          </Button>
        )}
      </div>

      {showMsgForm ? (
        <GlassPanel level="hero" padding={22} className="mt-[18px]">
          <p className="mm-eyebrow m-0">{t('messages.from')}</p>
          <p className="m-0 mt-[3px] text-meta" style={{ color: 'var(--text-muted)' }}>
            {displayName} · {userEmail}
          </p>
          <Field
            label={t('messages.subjectLabel')}
            value={msgForm.subject}
            onChange={(v) => setMsgForm((p) => ({ ...p, subject: v }))}
            placeholder={t('messages.subjectPlaceholder')}
            maxLength={200}
          />
          <Field
            as="textarea"
            label={t('messages.messageLabel')}
            value={msgForm.message}
            onChange={(v) => setMsgForm((p) => ({ ...p, message: v }))}
            placeholder={t('messages.messagePlaceholder')}
            rows={8}
            maxLength={2000}
          />
          <div className="mt-[17px] flex gap-[8px]">
            <Button tone="quiet" onClick={() => setShowMsgForm(false)}>{t('messages.cancel')}</Button>
            <Button
              tone="forme"
              onClick={() => void handleSendMessage()}
              disabled={sendingMsg || !msgForm.subject.trim() || !msgForm.message.trim()}
              loading={sendingMsg}
            >
              {sendingMsg ? t('messages.sending') : t('messages.send')}
            </Button>
          </div>
        </GlassPanel>
      ) : loadingMessages ? (
        <div className="mt-[18px] grid gap-[8px]">
          {[0, 1, 2].map((i) => <Skeleton key={i} height={62} radius="var(--r-m)" label={t('messages.loadingLabel')} />)}
        </div>
      ) : sentMessages.length === 0 ? (
        <GlassPanel level="hero" padding={22} className="mt-[18px]">
          <EmptyState
            glyph={<Icon name="send" size={26} style={{ color: 'var(--mm-bleu)' }} />}
            glyphBackground="color-mix(in srgb, var(--mm-bleu) 14%, transparent)"
            title={t('messages.emptyTitle')}
            body={t('messages.emptyText')}
            action={<Button tone="forme" onClick={() => setShowMsgForm(true)}>{t('messages.sendMessage')}</Button>}
          />
        </GlassPanel>
      ) : (
        <GlassPanel level="flat" padding="6px 18px" className="mt-[18px]">
          {sentMessages.map((msg, i) => (
            <LessonRow
              key={msg.id}
              state="plain"
              icon={<Icon name="send" size={14} />}
              title={msg.subject}
              meta={formatDate(msg.sentAt)}
              trailing={<Tag tone={statusTone(msg.status)}>{statusLabel(msg.status)}</Tag>}
              last={i === sentMessages.length - 1}
            />
          ))}
        </GlassPanel>
      )}

      {/* L'encart de vérité : par où la réponse revient, et ce que le produit ne sait pas faire. */}
      <GlassPanel level="truth" className="mt-[16px]">
        <p className="mm-eyebrow m-0 mb-[6px]">{t('messages.truthTitle')}</p>
        <p className="m-0 text-meta-2 leading-[1.5]" style={{ color: 'var(--text-muted)' }}>{t('messages.truthBody')}</p>
      </GlassPanel>
    </div>
  );
}
