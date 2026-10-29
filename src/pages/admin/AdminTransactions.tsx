import { useEffect, useMemo, useState } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useTranslation } from 'react-i18next';
import type { TagTone } from '@ds';
import { Field, Num, Skeleton, useToast } from '@ds';
import { ConsoleCard, ConsoleKpi, ConsoleStatus } from '../../components/console';
import TransactionPanel from './components/TransactionPanel';
import { ConfirmDialog } from '@/components/dialogs';
import { agregerRevenu, type LigneBusiness } from '../../lib/admin/revenue';
import type { AdminSpace } from '../../lib/admin/consoleNav';
import {
  CBtn, ConsoleChips, ConsoleGrid, ConsoleScreen, ConsoleStack, ConsoleToolbar, HonestEmpty,
} from './components/ConsoleParts';
import { SPACE_TONE, spaceLabels, type SpaceFilterValue } from './components/consoleUtils';
import { Pagination } from '@/components/dialogs';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { usePagination } from '../../hooks/usePagination';
import { getAllTransactions, resendTransactionMail, updateTransactionStatus } from '../../lib/firestore';
import { invalidateConsoleCounts } from '../../lib/admin/consoleCounts';
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

/** L'espace de console d'une ligne de revenu (`Transaction.ligne`). */
const LIGNE_SPACE: Record<LigneBusiness, AdminSpace> = {
  formation: 'edu',
  club: 'club',
  rysmoSubscription: 'rysmo',
  rysmoPack: 'rysmo',
};

export default function AdminTransactions() {
  const { t } = useTranslation('admin');
  const { locale } = useFormat();
  const { t: te } = useTranslation('admin');
  const k = (s: string, o?: Record<string, unknown>) => te(`p2.tx.${s}`, o);
  const [space, setSpace] = useState<SpaceFilterValue>('all');
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
  const [resending, setResending] = useState<string | null>(null);
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

  /*
    LA RELANCE DES COURRIERS.

    Pas de confirmation préalable, contrairement au remboursement : l'opération est
    idempotente côté serveur — il relit `purchaseNoticeSentAt`, `invoiceSentAt` et le
    numéro de facture avant d'agir. Demander « êtes-vous sûr ? » devant une action sans
    conséquence apprend à l'opérateur à cliquer « oui » sans lire, ce qui coûte cher le
    jour où la question compte vraiment.

    L'état local est remis à jour depuis le bilan rendu par le serveur, et non deviné :
    un envoi peut réussir pour la confirmation et échouer pour la facture.
  */
  const handleResend = async (id: string) => {
    setResending(id);
    try {
      const bilan = await resendTransactionMail(id);
      const maintenant = new Date().toISOString();
      setTransactions((prev) => prev.map((tx) => tx.id !== id ? tx : {
        ...tx,
        invoiceNumber: bilan.numero ?? tx.invoiceNumber,
        purchaseNoticeSentAt: bilan.confirmation === 'envoye' ? maintenant : tx.purchaseNoticeSentAt,
        invoiceSentAt: bilan.facture === 'envoye' ? maintenant : tx.invoiceSentAt,
        mailPending: bilan.enAttente,
      }));
      if (bilan.enAttente) {
        // On rend le motif : « ça n'a pas marché » sans dire pourquoi n'aide personne.
        addToast('error', t('transactions.mailResendError', { error: bilan.erreur ?? '' }));
      } else if (bilan.confirmation === 'deja' && bilan.facture === 'deja') {
        addToast('info', t('transactions.mailResendNothing'));
      } else {
        addToast('success', t('transactions.mailResendSuccess'));
        invalidateConsoleCounts();
      }
    } catch {
      addToast('error', t('transactions.mailResendError', { error: '' }));
    } finally {
      setResending(null);
    }
  };

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
      const matchSpace = space === 'all' || (tx.ligne ? LIGNE_SPACE[tx.ligne] : null) === space;
      return matchSearch && matchStage && matchSpace;
    });
  }, [transactions, search, stage, space]);

  const { paged, page, totalPages, setPage } = usePagination(filtered);

  // Les cases de relevé portent sur la TABLE ENTIÈRE, jamais sur ce que le filtre laisse voir.
  const pendingCount = transactions.filter((tx) => tx.status === 'pending').length;

  /* La sélection suit la LISTE FILTRÉE : un filtre qui masque la ligne ouverte laisserait
     un panneau qui parle d'une transaction devenue invisible. Le repli est la première
     ligne de la page courante — jamais rien, tant qu'il y a quelque chose à montrer. */
  const selected = filtered.find((tx) => tx.id === selectedId) ?? paged[0] ?? null;

  /* ── Les relevés de la maquette, sur 30 jours glissants, lus dans les transactions ── */
  const since30 = useMemo(() => new Date(asOf.getTime() - 30 * 86_400_000).toISOString(), [asOf]);
  const bilan30 = useMemo(() => agregerRevenu(transactions, since30), [transactions, since30]);
  const last30 = transactions.filter((tx) => (tx.createdAt ?? '') >= since30);
  const refunded30 = last30.filter((tx) => tx.status === 'refunded').length;
  const codes30 = last30.filter((tx) => tx.status === 'completed' && tx.couponCode).length;
  const codeUses = useMemo(() => {
    const m = new Map<string, number>();
    transactions.forEach((tx) => { if (tx.couponCode && tx.status === 'completed') m.set(tx.couponCode, (m.get(tx.couponCode) ?? 0) + 1); });
    return [...m].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [transactions]);

  const spaceOf = (tx: Transaction): AdminSpace | null => (tx.ligne ? LIGNE_SPACE[tx.ligne] : null);
  const shown = paged;
  const spaceTag = (tx: Transaction) => {
    const s = spaceOf(tx);
    return s ? <ConsoleStatus tone={SPACE_TONE[s]}>{t(`console.spaces.${s}`)}</ConsoleStatus> : <span className="text-ink-3">—</span>;
  };
  const statusTag = (tx: Transaction) => (
    <span className="flex flex-wrap items-center gap-1.5">
      {tx.mailPending && <ConsoleStatus tone="warn">{t('transactions.mailStuckTag')}</ConsoleStatus>}
      <ConsoleStatus tone={STATUS_TONE[tx.status]}>{STATUS_LABELS[tx.status]}</ConsoleStatus>
    </span>
  );
  const shortDate = (iso: string) => {
    const d = new Date(iso);
    return Number.isFinite(d.getTime())
      ? `${d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`
      : null;
  };

  return (
    <div>
      <ConsoleScreen label={t('transactions.title')}>
        <ConsoleToolbar space={space} onSpace={setSpace} labels={spaceLabels(t, 'console')} hideSpacesOnPhone>
          <CBtn onClick={load} disabled={loading}>{t('transactions.refresh')}</CBtn>
        </ConsoleToolbar>

        <div className="grid grid-cols-2 gap-2.5 wide:grid-cols-4 wide:gap-3">
          <ConsoleKpi icon="card" label={k('kpiCashed')} value={loading ? null : bilan30.brut} unit="XOF" source="db" asOf={asOf} sourceLine={k('kpiDaily')} />
          <ConsoleKpi icon="clock" label={k('kpiPending')} value={loading ? null : pendingCount} source="db" asOf={asOf} sourceLine={k('kpiPendingSrc')} />
          <ConsoleKpi icon="rotate" label={k('kpiRefunded')} value={loading ? null : refunded30} source="db" asOf={asOf} sourceLine={k('kpiRefundedSrc')} />
          <ConsoleKpi icon="tag" label={k('kpiCodes')} value={loading ? null : codes30} source="db" asOf={asOf} sourceLine={k('kpiCodesSrc')} />
        </div>

        <ConsoleGrid side={360}>
          <ConsoleCard as="section" title={t('transactions.title')}>
            <ConsoleChips<Stage>
              label={t('transactions.pipelineLabel')}
              items={stages.map((s) => ({ id: s, label: stageLabels[s] }))}
              value={stage}
              onChange={(s) => { setStage(s); setPage(1); }}
            />
            <div className="mb-3 max-w-sm">
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

            {loading ? (
              <div className="flex flex-col gap-2">
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={48} label={i === 0 ? t('transactions.title') : undefined} />)}
              </div>
            ) : shown.length === 0 ? (
              <HonestEmpty icon="card" title={t('transactions.emptyTitle')} body={t('transactions.emptyBody')} />
            ) : (
              <>
                <div className="hidden overflow-x-auto stack:block">
                  <table className="mm-ctable" aria-label={t('transactions.listLabel')}>
                    <thead>
                      <tr>
                        <th scope="col">{k('colDate')}</th>
                        <th scope="col">{k('colWho')}</th>
                        <th scope="col">{k('colSpace')}</th>
                        <th scope="col" className="text-right">{k('colAmount')}</th>
                        <th scope="col">{k('colStatus')}</th>
                        {!isWide && <th scope="col"><span className="sr-only">{t('transactions.colAction')}</span></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {shown.map((tx) => (
                        <tr
                          key={tx.id}
                          className={isWide && selected?.id === tx.id ? 'is-sel cursor-pointer' : isWide ? 'cursor-pointer' : undefined}
                          onClick={isWide ? () => setSelectedId(tx.id) : undefined}
                        >
                          <td className="whitespace-nowrap text-ink-3"><Num value={shortDate(tx.createdAt)} source="db" asOf={asOf} /></td>
                          <td>
                            <b>{tx.userName || tx.userEmail || '—'}</b>
                            <small>{[tx.formationTitle, tx.couponCode, tx.paymentMethod].filter(Boolean).join(' · ')}</small>
                          </td>
                          <td>{spaceTag(tx)}</td>
                          <td className="whitespace-nowrap text-right font-semibold"><Num value={tx.amount} unit={tx.currency} source="db" asOf={asOf} /></td>
                          <td>{statusTag(tx)}</td>
                          {!isWide && (
                            <td className="text-right">
                              {tx.status === 'completed' && (
                                <CBtn onClick={() => handleRefund(tx.id)} disabled={refunding === tx.id}>{t('transactions.refundAction')}</CBtn>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="stack:hidden">
                  {shown.map((tx) => (
                    <div key={tx.id} className="mm-mrow" style={{ alignItems: 'flex-start' }}>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-1.5">
                          {spaceTag(tx)}
                          <Num value={shortDate(tx.createdAt)} source="db" asOf={asOf} className="text-[11px] text-ink-3" />
                        </div>
                        <b className="block text-[14px]">{tx.userName || tx.userEmail || '—'}</b>
                        <span className="text-[12px] text-ink-3">{[tx.formationTitle, tx.paymentMethod].filter(Boolean).join(' · ')}</span>
                        <div className="mt-1.5">{statusTag(tx)}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <b className="whitespace-nowrap"><Num value={tx.amount} unit={tx.currency} source="db" asOf={asOf} /></b>
                        {tx.status === 'completed' && (
                          <CBtn onClick={() => handleRefund(tx.id)} disabled={refunding === tx.id}>{t('transactions.refundAction')}</CBtn>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-center">
                  <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              </>
            )}
          </ConsoleCard>

          <ConsoleStack>
            <ConsoleCard as="section" title={k('byLine')} aside={k('days30')}>
              {loading ? <Skeleton height={80} /> : bilan30.lignes.length === 0 ? (
                <HonestEmpty icon="bars" title={k('byLineEmpty')} />
              ) : bilan30.lignes.map((l) => {
                const s = l.ligne ? LIGNE_SPACE[l.ligne] : null;
                return (
                  <div key={l.ligne ?? 'none'} className="mm-mrow">
                    {s ? <ConsoleStatus tone={SPACE_TONE[s]}>{t(`console.spaces.${s}`)}</ConsoleStatus> : <ConsoleStatus tone="mute">—</ConsoleStatus>}
                    <span className="flex-1 text-[13.5px]">{k(`line.${l.ligne ?? 'none'}`)}</span>
                    <b><Num value={l.brut} unit="F" source="db" asOf={asOf} /></b>
                  </div>
                );
              })}
            </ConsoleCard>

            {isWide && (
              <ConsoleCard as="section" title={k('refundTitle')}>
                <p className="m-0 mb-3 text-[13px] leading-[1.5] text-ink-2">{t('transactions.refundExplainBody')}</p>
                <TransactionPanel
                  tx={selected}
                  loading={loading}
                  asOf={asOf}
                  onRefund={handleRefund}
                  refunding={refunding === selected?.id}
                  onResend={handleResend}
                  resending={resending === selected?.id}
                />
              </ConsoleCard>
            )}

            <ConsoleCard as="section" title={k('codesTitle')} aside={<CBtn href="/admin/coupons">{k('codesAll')}</CBtn>}>
              {codeUses.length === 0 ? (
                <HonestEmpty icon="tag" title={k('codesEmpty')} />
              ) : codeUses.map(([code, n]) => (
                <div key={code} className="mm-mrow">
                  <code className="flex-1 truncate text-[12.5px] font-semibold">{code}</code>
                  <span className="text-[11.5px] text-ink-3"><Num value={n} source="db" asOf={asOf} /> {k('uses', { count: n })}</span>
                </div>
              ))}
            </ConsoleCard>
          </ConsoleStack>
        </ConsoleGrid>
      </ConsoleScreen>

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
