import { useEffect, useMemo, useState } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useTranslation } from 'react-i18next';
import type { TagTone } from '@ds';
import { Button, EmptyState, Field, GlassPanel, Icon, LessonRow, Num, Skeleton, StatTile, Tag, useToast } from '@ds';
import { ConsolePage, ConsoleFilter, ConsoleList, ConsoleScope, ConsoleSplit } from '../../components/console';
import TransactionPanel from './components/TransactionPanel';
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
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA TROISIÈME COLONNE — `handoff_tableaux_de_bord` § TransactionsDesktop
 *
 * · LA FICHE CESSE D'ÊTRE UNE LIGNE TRONQUÉE. Voir `TransactionPanel` : la référence
 *   complète, le moyen, le montant recalculé, le coupon, l'identifiant de charge — c'est
 *   ce qu'on rapproche du relevé du prestataire, et le rapprochement se fait un champ à la
 *   fois, la file toujours visible.
 *
 * · ET LA LIGNE REDEVIENT CONFORME. Elle portait une étiquette ET un bouton « Rembourser » :
 *   deux contrôles, dont un dans le `trailing` d'un `LessonRow` qui rend lui-même un
 *   `<button>` — donc un bouton imbriqué, inatteignable au clavier. Le remboursement part
 *   dans le panneau ; la ligne ne fait plus que sélectionner.
 *
 * · QUATRE CASES DE RELEVÉ AU LIEU DE DEUX. La maquette en pose quatre — encaissé, en
 *   attente, remboursé, taux d'échec — et les deux qui manquaient sont celles qui disent ce
 *   qui BLOQUE. Le taux d'échec porte son dénominateur : « sur N tentatives », parce qu'un
 *   pourcentage sur une tentative n'est pas un taux.
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
  /** La transaction ouverte dans le panneau. `null` = aucune, ce que le panneau sait dire. */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** Date de la MESURE, posée quand la lecture revient — pas au rendu. */
  const [asOf, setAsOf] = useState(() => new Date());
  /*
    ── LE TÉLÉPHONE GARDE EXACTEMENT L'ÉCRAN QU'IL AVAIT ────────────────────────────
    `ConsoleSplit` n'arme sa grille qu'à partir de 1080 px ; en dessous, le panneau
    redevient un bloc EMPILÉ SOUS la liste. Pour un panneau informatif c'est sans
    conséquence — c'est le cas du tableau de bord depuis le premier lot. Pour un panneau
    qui porte la seule ACTION de l'écran, ça l'est : toucher une ligne pousserait ce
    qu'on vient chercher hors de l'écran, derrière toute la longueur de la file.

    Le panneau n'est donc monté qu'au-delà de 1080 px, et sous cette largeur la ligne
    refait exactement ce qu'elle faisait avant. Un seul contenu, deux véhicules — c'est
    la même règle que `TutorPanel` applique côté espace apprenant, pour une raison
    voisine : ce qui coûte quelque chose ne se cache pas en CSS, il ne se monte pas.
  */
  const isWide = useMediaQuery('(min-width: 1080px)');

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
  const pendingAmount = transactions.filter((tx) => tx.status === 'pending').reduce((sum, tx) => sum + tx.amount, 0);
  const failedCount = transactions.filter((tx) => tx.status === 'failed').length;
  /* LE TAUX D'ÉCHEC PORTE SON DÉNOMINATEUR. Sur une seule tentative, « 0 % » et « 0 sur 1 »
     ne disent pas la même chose : le premier suggère une série, le second dit la vérité.
     À zéro tentative, il n'y a pas de taux — <Num> rend alors « non relevé ». */
  const attempts = transactions.length;
  const failureRate = attempts > 0 ? `${Math.round((failedCount / attempts) * 100)} %` : null;

  /* La sélection suit la LISTE FILTRÉE : un filtre qui masque la ligne ouverte laisserait
     un panneau qui parle d'une transaction devenue invisible. Le repli est la première
     ligne de la page courante — jamais rien, tant qu'il y a quelque chose à montrer. */
  const selected = filtered.find((tx) => tx.id === selectedId) ?? paged[0] ?? null;

  return (
    // `.play` en dur : voir AdminDashboard.
    <div className="play">
      <ConsolePage title={t('transactions.title')} sub={t('transactions.sub')}>
        <div className="mb-3.5 flex justify-end">
          <Button size="sm" tone="quiet" onClick={load} disabled={loading}>
            {t('transactions.refresh')}
          </Button>
        </div>

        <ConsoleSplit
          detailLabel={t('transactions.panelEyebrow')}
          detail={!isWide ? null : (
            <TransactionPanel
              tx={selected}
              loading={loading}
              asOf={asOf}
              onRefund={handleRefund}
              refunding={refunding === selected?.id}
            />
          )}
        >
        <ConsoleFilter
          className="rv"
          stages={stages.map((s) => stageLabels[s])}
          active={stageLabels[stage]}
          onSelect={(label) => setStage(stages.find((s) => stageLabels[s] === label) ?? 'all')}
          label={t('transactions.pipelineLabel')}
        />

        {/* Les quatre cases de la maquette. `stack:` puis `wide:` — les deux seules ruptures
            que le système déclare ; à 1080 la troisième colonne prend sa place, donc les
            cases restent à deux de front plutôt que de passer à quatre et de se réduire. */}
        <div className="mt-3.5 grid gap-2.5 stack:grid-cols-2">
          <StatTile
            label={t('transactions.statRevenue')}
            value={loading ? null : formatPrice(totalRevenue)}
            source="db"
            asOf={asOf}
            foot={<><Num value={pendingCount} source="db" asOf={asOf} /> {t('transactions.footPending', { count: pendingCount })}</>}
          />
          <StatTile
            label={t('transactions.statPending')}
            value={loading ? null : formatPrice(pendingAmount)}
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
          <StatTile
            label={t('transactions.statFailure')}
            value={loading ? null : failureRate}
            source="db"
            asOf={asOf}
            foot={<><Num value={attempts} source="db" asOf={asOf} /> {t('transactions.footAttempts', { count: attempts })}</>}
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
                  /* UNE action par ligne : sélectionner. Le remboursement vit dans le
                     panneau — un contrôle dans le `trailing` d'un `LessonRow` cliquable
                     serait un bouton imbriqué, donc inatteignable au clavier. */
                  trailing={(
                    <span className="flex items-center gap-2">
                      <Tag tone={STATUS_TONE[tx.status]}>{STATUS_LABELS[tx.status]}</Tag>
                      {/* Sous 1080 px il n'y a pas de panneau : le remboursement reprend sa
                          place sur la ligne, comme avant. Au-delà, il vit dans la fiche et
                          la ligne ne fait plus que sélectionner. */}
                      {!isWide && tx.status === 'completed' && (
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
                  )}
                  onClick={isWide ? () => setSelectedId(tx.id) : undefined}
                  last={i === paged.length - 1}
                />
              </li>
            ))}
          </ConsoleList>
        )}

        <div className="mt-4 flex justify-center">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>

        {/* Ce que le remboursement ne fait PAS. L'encart « pourquoi rejouer est sans risque »
            de la maquette, lui, a rejoint le panneau : il répond à une question qu'on se
            pose la fiche sous les yeux, pas en bas de la file. */}
        <GlassPanel level="night" padding={18} className="rv mt-3.5">
          <SiteEyebrow style={{ marginBottom: '6px' }}>{t('transactions.refundExplainTitle')}</SiteEyebrow>
          <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('transactions.refundExplainBody')}</p>
        </GlassPanel>

        <ConsoleScope>{t('transactions.scope')}</ConsoleScope>
        </ConsoleSplit>
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
