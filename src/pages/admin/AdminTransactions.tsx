import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TagTone } from '@ds';
import { Button, EmptyState, Field, GlassPanel, Icon, LessonRow, Num, Skeleton, StatTile, Tag, useToast } from '@ds';
import { ConsolePage, ConsoleFilter, ConsoleList, ConsoleScope } from '../../components/console';
import { SiteEyebrow } from '../../components/site';
import { ConfirmDialog } from '@/components/dialogs';
import { Pagination } from '@/components/dialogs';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { usePagination } from '../../hooks/usePagination';
import { getAllTransactions, updateTransactionStatus } from '../../lib/firestore';
import { useFormat } from '../../hooks/useFormat';
import type { Transaction } from '../../types';

/**
 * L'ÉCRAN `TransactionsOps` DU KIT — réconciliation, et rien d'autre.
 *
 * LE CONSTAT `ds:check` DE LA LIGNE 141 TOMBE ICI, ET IL TOMBE PAR LA PORTE. L'ancien écran
 * écrivait `className="font-mono"` sur `{tx.id.slice(0, 12)}...` : de la monospace sur ce qui
 * ressemble à un nombre, hors de <Num> — règle 6, AD-5. Le déplacer ailleurs, ou le faire
 * disparaître en retirant la référence, n'aurait rien réglé : la référence est justement CE
 * QUE L'OPÉRATEUR RAPPROCHE avec le relevé du prestataire, elle doit rester lisible et
 * tabulaire. Elle passe donc par <Num source="db" asOf>, qui est le seul chemin du dépôt
 * vers `--f-mono` et qui exige de dire d'où vient la valeur. Plus une seule occurrence de
 * `font-mono` dans ce fichier : le constat ne se déplace pas, il n'a plus lieu d'être.
 *
 * DEUX ÉCARTS AVEC LE KIT, ASSUMÉS ET DOCUMENTÉS ICI :
 *
 *   • Le kit dessine « toutes · complétées · en attente · échouées » — il oublie l'étape
 *     `refunded`, qui existe en base, qui a un libellé traduit, et qui est le seul statut
 *     que cet écran sait ÉCRIRE. Elle est ajoutée : cinq étapes, toutes lues en base.
 *   • Le kit met DEUX actions sur sa fiche de transaction (« Rejouer le webhook » et
 *     « Marquer échouée »), ce que son propre motif interdit — « deux actions par ligne,
 *     c'est une hésitation par ligne ». Aucune des deux n'existe d'ailleurs dans ce dépôt :
 *     `updateTransactionStatus` n'écrit que `refunded`. Une action par ligne, et c'est
 *     celle-là.
 */

type Stage = 'all' | Transaction['status'];

const STATUS_TONE: Record<Transaction['status'], TagTone> = {
  pending: 'warn',
  completed: 'ok',
  refunded: 'neutral',
  failed: 'stop',
};

const STATUS_TINT: Record<Transaction['status'], string> = {
  pending: '--mm-orange',
  completed: '--ok',
  refunded: '--ink-2',
  failed: '--stop',
};

export default function AdminTransactions() {
  const { t } = useTranslation('admin');
  const { formatDate, formatPrice } = useFormat();
  const { addToast } = useToast();
  const confirm = useConfirmDialog();

  const STATUS_LABELS: Record<Transaction['status'], string> = {
    pending: t('transactions.statusPending'),
    completed: t('transactions.statusCompleted'),
    refunded: t('transactions.statusRefunded'),
    failed: t('transactions.statusFailed'),
  };

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState<Stage>('all');
  const [refunding, setRefunding] = useState<string | null>(null);
  /** Date de la MESURE, posée quand la lecture revient — pas au rendu. */
  const [asOf, setAsOf] = useState(() => new Date());

  const load = () => {
    setLoading(true);
    getAllTransactions()
      .then((data) => { setTransactions(data); setAsOf(new Date()); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRefund = (id: string) => {
    confirm.requestConfirm(t('transactions.refundConfirmMessage'), async () => {
      setRefunding(id);
      try {
        await updateTransactionStatus(id, 'refunded');
        setTransactions((prev) => prev.map((tx) => tx.id === id ? { ...tx, status: 'refunded' } : tx));
        addToast('success', t('transactions.refundSuccess'));
      } catch {
        addToast('error', t('transactions.refundError'));
      } finally {
        setRefunding(null);
      }
      confirm.closeConfirm();
    });
  };

  const stages: Stage[] = ['all', 'completed', 'pending', 'refunded', 'failed'];
  const stageLabels: Record<Stage, string> = {
    all: t('transactions.stageAll'),
    completed: t('transactions.stageCompleted'),
    pending: t('transactions.stagePending'),
    refunded: t('transactions.stageRefunded'),
    failed: t('transactions.stageFailed'),
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return transactions.filter((tx) => {
      const matchSearch = !q || tx.id.toLowerCase().includes(q) || tx.userId.toLowerCase().includes(q)
        || (tx.userName ?? '').toLowerCase().includes(q)
        || (tx.userEmail ?? '').toLowerCase().includes(q)
        || (tx.formationTitle ?? '').toLowerCase().includes(q);
      const matchStage = stage === 'all' || tx.status === stage;
      return matchSearch && matchStage;
    });
  }, [transactions, search, stage]);

  const { paged, page, totalPages, setPage } = usePagination(filtered);

  // Les cases de relevé portent sur la TABLE ENTIÈRE, jamais sur ce que le filtre laisse voir.
  const totalRevenue = transactions.filter((tx) => tx.status === 'completed').reduce((sum, tx) => sum + tx.amount, 0);
  const totalRefunded = transactions.filter((tx) => tx.status === 'refunded').reduce((sum, tx) => sum + tx.amount, 0);
  const pendingCount = transactions.filter((tx) => tx.status === 'pending').length;
  const refundedCount = transactions.filter((tx) => tx.status === 'refunded').length;

  return (
    // `.play` en dur : voir AdminDashboard.
    <div className="play">
      <ConsolePage title={t('transactions.title')} sub={t('transactions.sub')}>
        <div className="mb-3.5 flex justify-end">
          <Button size="sm" tone="quiet" onClick={load} disabled={loading}>
            {t('transactions.refresh')}
          </Button>
        </div>

        <ConsoleFilter
          className="rv"
          stages={stages.map((s) => stageLabels[s])}
          active={stageLabels[stage]}
          onSelect={(label) => setStage(stages.find((s) => stageLabels[s] === label) ?? 'all')}
          label={t('transactions.pipelineLabel')}
        />

        <div className="mt-3.5 grid gap-2.5 stack:grid-cols-2">
          <StatTile
            label={t('transactions.statRevenue')}
            value={loading ? null : formatPrice(totalRevenue)}
            source="db"
            asOf={asOf}
            foot={<><Num value={pendingCount} source="db" asOf={asOf} /> {t('transactions.footPending', { count: pendingCount })}</>}
          />
          <StatTile
            label={t('transactions.statRefunds')}
            value={loading ? null : formatPrice(totalRefunded)}
            source="db"
            asOf={asOf}
            foot={<><Num value={refundedCount} source="db" asOf={asOf} /> {t('transactions.footRefunded', { count: refundedCount })}</>}
          />
        </div>

        <div className="mt-3.5 max-w-sm">
          <Field
            as="input"
            type="search"
            label={t('transactions.searchLabel')}
            hideLabel
            value={search}
            onChange={setSearch}
            placeholder={t('transactions.searchPlaceholder')}
            inputMode="search"
          />
        </div>

        <SiteEyebrow style={{ marginTop: '22px', marginBottom: '10px' }}>
          {stageLabels[stage]}
        </SiteEyebrow>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={60} radius="var(--r-l)" label={t('transactions.title')} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            glyph={<Icon name="card" size={26} color="var(--mm-bleu)" />}
            glyphBackground="color-mix(in srgb, var(--mm-bleu) 22%, transparent)"
            title={t('transactions.emptyTitle')}
            body={t('transactions.emptyBody')}
          />
        ) : (
          <ConsoleList label={t('transactions.listLabel')} className="rv">
            {paged.map((tx, i) => (
              <li key={tx.id}>
                <LessonRow
                  icon={<Icon name="card" size={14} color={`var(${STATUS_TINT[tx.status]})`} />}
                  iconBackground={`color-mix(in srgb, var(${STATUS_TINT[tx.status]}) 22%, transparent)`}
                  /* LA RÉFÉRENCE PASSE PAR <Num>, ET C'EST TOUT L'OBJET DE LA CORRECTION :
                     c'est une valeur lue en base, tabulaire, que l'opérateur rapproche
                     caractère par caractère avec le relevé du prestataire. */
                  title={<Num value={tx.transactionRef ?? tx.id.slice(0, 12)} source="db" asOf={asOf} />}
                  meta={
                    <>
                      <Num value={tx.amount} unit={tx.currency} source="db" asOf={asOf} />
                      {' · '}{tx.paymentMethod}
                      {' · '}{tx.userName || tx.userEmail || tx.formationTitle || formatDate(tx.createdAt)}
                    </>
                  }
                  trailing={
                    <span className="flex items-center gap-2">
                      <Tag tone={STATUS_TONE[tx.status]}>{STATUS_LABELS[tx.status]}</Tag>
                      {tx.status === 'completed' && (
                        <Button
                          size="sm"
                          tone="quiet"
                          onClick={() => handleRefund(tx.id)}
                          loading={refunding === tx.id}
                        >
                          {t('transactions.refundAction')}
                        </Button>
                      )}
                    </span>
                  }
                  last={i === paged.length - 1}
                />
              </li>
            ))}
          </ConsoleList>
        )}

        <div className="mt-4 flex justify-center">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>

        {/* Le kit met un encart « pourquoi rejouer est sans risque » à côté de son action.
            Ici l'action est le remboursement, et ce qu'elle ne fait PAS est plus important
            que ce qu'elle fait — d'où le même encart, avec le contenu de ce dépôt. */}
        <GlassPanel level="night" padding={18} className="rv mt-3.5">
          <SiteEyebrow style={{ marginBottom: '6px' }}>{t('transactions.refundExplainTitle')}</SiteEyebrow>
          <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('transactions.refundExplainBody')}</p>
        </GlassPanel>

        <ConsoleScope>{t('transactions.scope')}</ConsoleScope>
      </ConsolePage>

      <ConfirmDialog
        open={confirm.open}
        onClose={confirm.closeConfirm}
        onConfirm={confirm.onConfirm}
        title={t('transactions.confirmTitle')}
        message={confirm.message}
        confirmLabel={t('transactions.refundAction')}
        variant="warning"
      />
    </div>
  );
}
