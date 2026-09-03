import { useState, useEffect, useMemo } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useTranslation } from 'react-i18next';
import type { TagTone } from '@ds';
import { Button, EmptyState, Field, GlassPanel, Icon, LessonRow, Skeleton, Tag, useToast } from '@ds';
import { ConsolePage, ConsoleFilter, ConsoleList, ConsoleScope, ConsoleSplit } from '../../components/console';
import { SiteEyebrow } from '../../components/site';
import { ConfirmDialog, Modal } from '@/components/dialogs';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { subscribeMessages, updateMessageStatus, deleteMessage } from '../../lib/firestore';
import { useFormat } from '../../hooks/useFormat';
import type { ContactMessage } from '../../types';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';
import { captureError } from '../../lib/sentry';

/**
 * RÉPONDRE ÉCRIT TROIS CHOSES, ET C'EST LE SERVEUR QUI LES ÉCRIT.
 *
 * La réponse sur le message, la notification dans l'espace de son auteur, l'e-mail. Le
 * client n'en écrit AUCUNE : `notifications/{uid}/items` est fermé à l'écriture cliente par
 * les règles, et l'envoi passe par un binding qui n'existe que dans le runtime Workers.
 *
 * Déclarée au niveau module, avec ses génériques : c'est la convention du dépôt, et elle
 * évite de reconstruire la référence à chaque rendu.
 */
const replyToMessage = httpsCallable<
  { messageId: string; reply: string },
  { ok: boolean; notified: boolean; emailSent: boolean; emailError?: string }
>(functions, 'replyToMessage');

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
 *
 * ── LA FICHE PASSE EN TROISIÈME COLONNE ────────────────────────────────────────────
 *
 * `handoff_tableaux_de_bord` ne dessine PAS cet écran : il n'est modélisé nulle part dans
 * les vingt-quatre pages. Il suit donc le motif des écrans qui le sont, et en particulier
 * `ProspectsDesktop`, dont il est le jumeau — une file de demandes entrantes qu'une seule
 * personne qualifie. « Le détail cesse d'être un écran séparé. La file reste visible pendant
 * qu'on traite. »
 *
 * ⚠️ ET UNE MODALE NE DEVIENT PAS UN PANNEAU SANS PRÉCAUTION, POUR CET ÉCRAN-CI.
 * `openMessage` marque le message COMME LU à l'ouverture. Un panneau qui se remplirait tout
 * seul avec la première ligne — le repli que les autres écrans appliquent — marquerait donc
 * un message lu que personne n'a ouvert, et le ferait disparaître de la file « à traiter ».
 * La sélection reste ici explicite : tant qu'on n'a rien choisi, le panneau le dit.
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
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  /*
    ── UN SEUL CONTENU, DEUX VÉHICULES ─────────────────────────────────────────────
    `ConsoleSplit` n'arme sa grille qu'à partir de 1080 px : en dessous, le panneau
    s'empilerait SOUS la file, donc toucher un message pousserait le message lui-même
    hors de l'écran, derrière toute la liste. Sur un écran dont le travail est
    précisément de lire, c'est le pire endroit possible.

    Le même `messagePanel` est donc rendu dans la colonne au-delà de 1080 px, et dans un
    dialogue en dessous. Ce n'est pas une duplication : c'est une seule définition, posée
    dans deux contenants — et le téléphone garde exactement l'écran qu'il avait.
  */
  const isWide = useMediaQuery('(min-width: 1080px)');

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

  /*
   * ⚠️ CE QUI A DISPARU ICI : « marquer répondu », un drapeau posé À LA MAIN.
   *
   * Il faisait passer l'étiquette au vert sans qu'aucune réponse n'existe nulle part — la
   * personne voyait « Répondu » dans son espace et n'avait rien à lire. Le statut n'est plus
   * une déclaration : il est la CONSÉQUENCE d'une réponse écrite, et c'est le serveur qui
   * le pose, dans le même geste que la notification et l'e-mail.
   */
  const handleReply = async () => {
    if (!selected || reply.trim().length < 2) return;
    setSending(true);
    try {
      const { data } = await replyToMessage({ messageId: selected.id, reply: reply.trim() });
      const envoyee = { ...selected, reply: reply.trim(), repliedAt: new Date().toISOString(), status: 'replied' as const };
      setSelected(envoyee);
      setReply('');
      /*
       * L'e-mail peut échouer sans que la réponse soit perdue — elle est enregistrée et
       * lisible dans l'espace. On le DIT plutôt que de le taire : un succès affiché sur un
       * envoi qui n'a pas eu lieu ferait attendre une réponse déjà écrite.
       */
      if (data.emailSent) addToast('success', t('messages.toast.replySent'));
      else addToast('error', t('messages.toast.replyNoEmail'));
    } catch (error: unknown) {
      captureError(error, { context: 'Reply to contact message failed' });
      addToast('error', t('messages.toast.replyError'));
    }
    setSending(false);
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

  /*
    LE PANNEAU. Sans sélection il n'est PAS nul : `ConsoleSplit` supprimerait la colonne, et
    la mise en page sauterait au premier clic hors d'une ligne. Il dit « rien de sélectionné ».
  */
  const messagePanel = selected ? (
    <>
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--mm-bleu)_16%,transparent)] text-meta-2 font-bold text-forme"
        >
          {selected.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate font-medium text-ink">{selected.name}</p>
          {/* L'adresse reste un `mailto:` : c'est le seul canal de réponse du produit, et
              il vit hors de l'application. Le pied de l'écran le dit déjà. */}
          <a href={`mailto:${selected.email}`} className="truncate text-meta-2 text-forme hover:underline">
            {selected.email}
          </a>
        </div>
        <Tag tone={TONE[selected.status]}>{statusLabels[selected.status]}</Tag>
      </div>

      <GlassPanel level="night" padding={18} className="rv mt-4" style={{ ['--i' as string]: 1 }}>
        <SiteEyebrow style={{ marginBottom: '6px' }}>{selected.subject}</SiteEyebrow>
        <p className="m-0 text-meta-2 text-ink-3">{new Date(selected.sentAt).toLocaleString(locale)}</p>
        <p className="m-0 mt-3 whitespace-pre-wrap text-meta leading-relaxed text-ink-2">{selected.message}</p>
      </GlassPanel>

      {/* La réponse déjà envoyée, relue telle qu'elle est partie. Sans elle, on ne saurait
          pas ce qu'on a écrit — et on répondrait deux fois la même chose. */}
      {selected.reply && (
        <GlassPanel level="flat" padding={18} className="mt-3">
          <SiteEyebrow style={{ marginBottom: '6px' }}>{t('messages.replySent')}</SiteEyebrow>
          {selected.repliedAt && (
            <p className="m-0 text-meta-2 text-ink-3">{new Date(selected.repliedAt).toLocaleString(locale)}</p>
          )}
          <p className="m-0 mt-3 whitespace-pre-wrap text-meta leading-relaxed text-ink-2">{selected.reply}</p>
        </GlassPanel>
      )}

      <div className="mt-4">
        <Field
          as="textarea"
          rows={5}
          label={t('messages.replyLabel')}
          placeholder={t('messages.replyPlaceholder')}
          value={reply}
          onChange={setReply}
          maxLength={5000}
        />
        <Button
          size="sm"
          fullWidth
          loading={sending}
          disabled={sending || reply.trim().length < 2}
          onClick={() => { void handleReply(); }}
          style={{ marginTop: '10px' }}
        >
          {t('messages.actions.sendReply')}
        </Button>
        {/* Ce que le geste déclenche, dit avant de le déclencher. */}
        <p className="mt-2 mb-0 text-meta-2 text-ink-3">
          {selected.userId ? t('messages.replyNoteAccount') : t('messages.replyNoteGuest')}
        </p>
      </div>
      <Button
        size="sm"
        tone="ghost"
        fullWidth
        onClick={() => handleDelete(selected.id)}
        style={{ marginTop: '8px' }}
      >
        {t('messages.actions.delete')}
      </Button>
    </>
  ) : (
    <GlassPanel level="night" padding={18}>
      <SiteEyebrow style={{ marginBottom: '6px' }}>{t('messages.panelEyebrow')}</SiteEyebrow>
      <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('messages.panelNone')}</p>
    </GlassPanel>
  );

  return (
    <ConsolePage title={t('messages.title')} sub={t('messages.sub')}>
      <ConsoleSplit detailLabel={t('messages.panelEyebrow')} detail={isWide ? messagePanel : null}>
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
      </ConsoleSplit>

      {/* Le même panneau, en dialogue, sous 1080 px. `Modal` piège le focus et ferme à
          Échap — ce qu'une colonne n'a pas à faire, puisqu'elle ne recouvre rien. */}
      <Modal
        open={!isWide && !!selected}
        onClose={() => setSelected(null)}
        title={selected?.subject || t('messages.panelEyebrow')}
        size="lg"
      >
        {messagePanel}
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
