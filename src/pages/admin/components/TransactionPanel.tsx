import { useTranslation } from 'react-i18next';
import type { TagTone } from '@ds';
import { Button, DocLine, GlassPanel, Num, Pipeline, Tag } from '@ds';
import { SiteEyebrow } from '../../../components/site';
import { useFormat } from '../../../hooks/useFormat';
import type { Transaction } from '../../../types';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LA FICHE DE TRANSACTION — troisième colonne de l'écran de réconciliation.
 *
 * `handoff_tableaux_de_bord/dashboards-console.jsx` § TransactionsDesktop. Son
 * sélecteur résume l'intention en une phrase : « rejouer un webhook est sans risque,
 * et l'écran le dit » — c'est-à-dire à l'endroit exact où l'on hésite, pas trois
 * blocs plus bas.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CE PANNEAU CHANGE POUR LA LISTE, ET C'EST LE POINT
 *
 * La ligne de transaction portait DEUX contrôles dans son `trailing` : une étiquette
 * de statut ET un bouton « Rembourser » sur les lignes complétées. Le motif de la
 * console l'interdit — « deux actions par ligne, c'est une hésitation par ligne » — et
 * `LessonRow` a un problème plus concret avec ça : il rend un `<button>` dès qu'on lui
 * passe `onClick`, donc un contrôle dans `trailing` devient un bouton imbriqué,
 * inatteignable au clavier. C'est exactement l'arbitrage que `LeadPanel` a déjà tranché.
 *
 * Le remboursement vit donc ICI. La ligne ne fait plus qu'une chose : sélectionner.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TROIS ÉCARTS AVEC LA MAQUETTE, TOUS DU MÊME ORDRE : ELLE MONTRE CE QUE LE PRODUIT N'A PAS
 *
 * · « REJOUER LE WEBHOOK » N'EXISTE PAS COMME ACTION. Aucune fonction du dépôt ne
 *   rejoue une charge : `updateTransactionStatus` n'écrit que `refunded`. Un bouton
 *   inerte serait pire qu'absent — on croirait avoir relancé quelque chose. L'encart
 *   qui explique POURQUOI un rejeu serait sans risque reste, lui, parce qu'il décrit
 *   une propriété vraie du webhook et qu'il répond à la question qu'on se pose ici.
 *
 * · « MARQUER ÉCHOUÉE » NON PLUS. Même raison, et le motif n'en voudrait pas : ce
 *   serait la seconde action de la fiche.
 *
 * · LA DATE PEUT MANQUER. La maquette écrit « date non récupérée » en toutes lettres
 *   plutôt qu'un tiret, et elle a raison. <Num> rend « non relevé » sur une valeur
 *   absente : la distinction entre « je ne sais pas » et « rien » est portée par le
 *   composant, pas par une chaîne écrite ici.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const STATUS_TONE: Record<Transaction['status'], TagTone> = {
  pending: 'warn',
  completed: 'ok',
  refunded: 'neutral',
  failed: 'stop',
};

interface TransactionPanelProps {
  tx: Transaction | null;
  /** Vrai tant que la table n'est pas relevée : on n'annonce pas « aucune » avant de savoir. */
  loading: boolean;
  /** Date de la lecture qui a produit `tx`. */
  asOf: Date;
  /** Rembourse. Rendu par le parent, qui porte la liste et la confirmation. */
  onRefund: (id: string) => void;
  refunding: boolean;
}

export default function TransactionPanel({ tx, loading, asOf, onRefund, refunding }: TransactionPanelProps) {
  const { t } = useTranslation('admin');
  const { formatDate } = useFormat();

  const STATUS_LABELS: Record<Transaction['status'], string> = {
    pending: t('transactions.statusPending'),
    completed: t('transactions.statusCompleted'),
    refunded: t('transactions.statusRefunded'),
    failed: t('transactions.statusFailed'),
  };

  /* Le cycle d'une transaction, dans l'ordre. `refunded` est une SORTIE du cycle, pas une
     étape : la maquette l'oublie, la base la connaît, et la mettre en ligne droite après
     « payée » ferait croire qu'elle vient toujours après. Elle est portée par l'étiquette. */
  const STAGES = [
    t('transactions.stagePending'),
    t('transactions.stageCompleted'),
    t('transactions.stageFailed'),
  ];
  const STAGE_OF: Record<Transaction['status'], string | undefined> = {
    pending: STAGES[0],
    completed: STAGES[1],
    failed: STAGES[2],
    refunded: undefined,
  };

  if (loading) {
    return (
      <GlassPanel level="night" padding={18}>
        <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('transactions.panelLoading')}</p>
      </GlassPanel>
    );
  }

  if (!tx) {
    return (
      <GlassPanel level="night" padding={18}>
        <SiteEyebrow style={{ marginBottom: '6px' }}>{t('transactions.panelEyebrow')}</SiteEyebrow>
        <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('transactions.panelNone')}</p>
      </GlassPanel>
    );
  }

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <SiteEyebrow>{t('transactions.panelEyebrow')}</SiteEyebrow>
          <p className="m-0 mt-1.5 text-[17px] font-bold text-ink">
            <Num value={tx.transactionRef ?? tx.id.slice(0, 12)} source="db" asOf={asOf} />
          </p>
        </div>
        <Tag tone={STATUS_TONE[tx.status]}>{STATUS_LABELS[tx.status]}</Tag>
      </div>

      <Pipeline
        className="rv mt-4"
        style={{ ['--i' as string]: 1 }}
        stages={STAGES}
        active={STAGE_OF[tx.status]}
        label={t('transactions.panelPipelineLabel')}
      />

      <GlassPanel level="night" padding={18} className="rv mt-3.5" style={{ ['--i' as string]: 2 }}>
        <DocLine label={t('transactions.docMethod')} value={tx.paymentMethod} />
        <DocLine
          label={t('transactions.docAmount')}
          value={<Num value={tx.amount} unit={tx.currency} source="db" asOf={asOf} />}
        />
        <DocLine label={t('transactions.docItem')} value={tx.formationTitle ?? t('transactions.docItemUnknown')} />
        <DocLine
          label={t('transactions.docBuyer')}
          value={tx.userName || tx.userEmail || <Num value={null} source="db" asOf={asOf} />}
        />
        <DocLine
          label={t('transactions.docCoupon')}
          value={tx.couponCode ?? t('transactions.docCouponNone')}
        />
        <DocLine
          label={t('transactions.docCreated')}
          value={<Num value={tx.createdAt ? formatDate(tx.createdAt) : null} source="db" asOf={asOf} />}
        />
        <DocLine
          label={t('transactions.docCharge')}
          value={<Num value={tx.chargeId ?? null} source="db" asOf={asOf} />}
          last
        />
      </GlassPanel>

      {/* UNE action, et seulement quand elle est possible. Un bouton grisé en permanence
          sur les quatre autres statuts n'apprendrait rien qu'on ne lise déjà à l'étiquette. */}
      {tx.status === 'completed' && (
        <Button
          size="sm"
          tone="quiet"
          fullWidth
          loading={refunding}
          onClick={() => onRefund(tx.id)}
          style={{ marginTop: '14px' }}
        >
          {t('transactions.refundAction')}
        </Button>
      )}

      <GlassPanel level="night" padding={16} className="rv mt-4" style={{ ['--i' as string]: 3 }}>
        <SiteEyebrow style={{ marginBottom: '6px' }}>{t('transactions.replayTitle')}</SiteEyebrow>
        <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('transactions.replayBody')}</p>
      </GlassPanel>
    </>
  );
}
