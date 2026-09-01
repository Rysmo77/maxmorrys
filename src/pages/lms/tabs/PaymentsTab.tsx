import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, EmptyState, GlassPanel, Icon, LessonRow, Num, Skeleton, Tag } from '@ds';
import type { TagTone } from '@ds';
import { useLocalizedPath } from '../../../contexts/LanguageContext';
import { useFormat } from '../../../hooks/useFormat';
import { getUserTransactions } from '../../../lib/firestore';
import type { Transaction } from '../../../types';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * L'ÉCRAN « MES PAIEMENTS » — le bout manquant du chemin de l'argent.
 *
 * DEUX SURFACES LE DÉSIGNAIENT DÉJÀ, ET IL N'EXISTAIT PAS. `lms.json` promet en pied de
 * confirmation « Le reçu est dans ton espace. » (`paymentReturn.confirmedFoot`), et la liste
 * « Dans ton espace » de `screens-space.jsx` ouvre sur « Mes paiements · 1 transaction ». Un
 * acheteur qui suivait l'une ou l'autre n'arrivait nulle part. C'était le seul écran du
 * chemin de l'argent qui manquait : `Checkout` encaisse, `PaymentReturn` confirme, la console
 * (`AdminTransactions`) réconcilie — personne ne rendait ses propres paiements à l'acheteur.
 *
 * Recomposé sur `screens-pay-end.jsx` § IssueBloc — référence, statut, montant — mais rendu
 * en LISTE : IssueBloc dessine UNE transaction en plein écran au retour de la banque, ici il
 * y en a zéro, une ou vingt, et le motif de liste du dépôt est celui de `NotesTab`
 * (`GlassPanel level="flat"` + `LessonRow`).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LES DÉCISIONS, ET CE QU'ELLES ÉCARTENT
 *
 * · PAS DE <h1>. Le titre de l'écran est celui de la barre haute d'`AppShell`, alimentée par
 *   `titleMap` pour chaque route. En rendre un second ici donnait deux <h1> par écran et le
 *   même mot à quinze centimètres d'intervalle. C'est la décision déjà écrite dans
 *   `NotesTab` et dans les dix-neuf écrans de console (`ConsolePage`).
 *
 * · LA RÉFÉRENCE EST RENDUE ENTIÈRE, pas tronquée à douze caractères comme dans la console.
 *   Ce n'est pas la même personne qui lit : l'opérateur rapproche une colonne de références
 *   entre elles, l'acheteur rapproche CELLE-CI avec celle que `PaymentReturn` vient de lui
 *   montrer — et cet écran-là affiche l'identifiant complet. Deux troncatures différentes de
 *   la même valeur sur le même parcours, c'est un doute à chaque fois. D'où `overflowWrap`
 *   plutôt qu'un `slice` : la référence se coupe sur deux lignes au lieu de déborder de
 *   l'écran de base.
 *
 * · LE MONTANT EST `source="server"`, PAS `source="db"`. Règle 6 : « le montant débité est
 *   celui recalculé côté serveur, jamais celui transmis par le navigateur ». C'est le cas
 *   ici — `functions/src/payment.ts` écrit `amount` au moment de la charge, et le seul
 *   chemin d'écriture client (une formation gratuite) est cloué par `firestore.rules` à
 *   `amount == 0`. C'est aussi ce qu'écrit `PaymentReturn` pour le même champ ; deux
 *   provenances différentes pour une même valeur, sur un même parcours, ne s'expliqueraient
 *   pas. La référence, elle, reste `db` : elle n'est recalculée par personne.
 *
 * · CINQ TONS D'ÉTIQUETTE POUR QUATRE DEMANDÉS. Le brief en cite trois — `ok` payée, `warn`
 *   en attente, `stop` échouée. `Transaction['status']` en porte un quatrième, `refunded`,
 *   qui existe en base et que la console sait ÉCRIRE (`updateTransactionStatus`). L'ignorer
 *   aurait affiché une transaction remboursée comme « payée ». Elle prend `neutral`, comme
 *   dans `AdminTransactions` : un remboursement n'est ni un acquis, ni une alerte, ni un
 *   blocage — c'est une information.
 *
 * · LA LECTURE EST FAITE ICI, PAS DANS `StudentLayout`. Les autres onglets reçoivent leurs
 *   données du contexte de la coquille, qui les charge pour tout le monde. Un écran de
 *   paiements n'est visité qu'après un achat : le charger au montage de la coquille serait
 *   une lecture Firestore par session pour tous les apprenants, dont la quasi-totalité ne
 *   l'ouvriront jamais. La lecture suit donc le motif d'`AdminTransactions` — état local,
 *   `asOf` posée QUAND LA LECTURE REVIENT et non au rendu, sinon la date affichée est celle
 *   du dernier re-rendu et plus celle du relevé.
 *
 * · L'ÉCHEC DE LECTURE A SON PROPRE ÉTAT, et il n'est pas l'état vide. « 0 paiement » et
 *   « je n'ai pas pu lire » sont deux choses différentes, et les confondre ferait annoncer à
 *   un acheteur qu'il n'a rien payé. Le message dit le motif, la conséquence, la sortie —
 *   dans cet ordre — et la sortie est un bouton qui relit, pas une adresse à écrire.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/** Le ton de l'étiquette de statut. `refunded` est une information, pas une alerte. */
const STATUS_TONE: Record<Transaction['status'], TagTone> = {
  completed: 'ok',
  pending: 'warn',
  failed: 'stop',
  refunded: 'neutral',
};

/** La teinte de la puce de ligne. Jeton, jamais rgba : elle doit basculer sous `.dk`. */
const STATUS_TINT: Record<Transaction['status'], string> = {
  completed: '--ok',
  pending: '--mm-orange',
  failed: '--stop',
  refunded: '--ink-2',
};

interface PaymentsTabProps {
  /** L'apprenant dont on lit les paiements. Le `where` sur ce champ est ce qui rend la
   *  requête admissible au regard de `firestore.rules` — voir `getUserTransactions`. */
  userId: string;
}

export default function PaymentsTab({ userId }: PaymentsTabProps) {
  const { t } = useTranslation('lmsTabs');
  const { formatDate } = useFormat();
  const navigate = useNavigate();
  const path = useLocalizedPath();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [readFailed, setReadFailed] = useState(false);
  /** La date du RELEVÉ : l'instant où la lecture est revenue, pas celui du rendu. */
  const [asOf, setAsOf] = useState(() => new Date());

  const load = useCallback(() => {
    setLoading(true);
    setReadFailed(false);
    getUserTransactions(userId)
      .then((rows) => {
        setTransactions(rows);
        setAsOf(new Date());
      })
      .catch(() => setReadFailed(true))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const statusLabel: Record<Transaction['status'], string> = {
    completed: t('payments.statusCompleted'),
    pending: t('payments.statusPending'),
    failed: t('payments.statusFailed'),
    refunded: t('payments.statusRefunded'),
  };

  return (
    <div className="mx-auto max-w-4xl px-[18px] py-6">
      {/* ── Le compte, daté ──────────────────────────────────────────────────
          Il n'est pas décoratif : « 0 paiement · relevé du 01/09 » est une information,
          un tiret n'en est pas une. Il ne s'affiche donc pas tant qu'il n'est pas relevé —
          pendant la lecture, c'est un squelette à sa forme, jamais un zéro provisoire. */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        {loading ? (
          <Skeleton width={168} height={17} label={t('payments.loadingLabel')} />
        ) : (
          <p className="m-0 text-meta-2" style={{ color: 'var(--text-muted)' }}>
            <Num
              value={readFailed ? null : transactions.length}
              source="db"
              asOf={asOf}
              showAsOf={!readFailed}
              fallback={t('payments.countUnread')}
            />{' '}
            {readFailed ? null : t('payments.countLabel', { count: transactions.length })}
          </p>
        )}
        <Tag>{t('payments.receiptTag')}</Tag>
      </div>

      {loading ? (
        /* Le squelette a la FORME EXACTE de la liste — trois lignes de 62 px dans le même
           panneau plat — pour que rien ne saute quand les vraies arrivent. Jamais un rond
           qui tourne : il ne dit ni ce qui se passe, ni combien de temps. */
        <div className="mt-[14px] grid gap-[8px]">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={62} radius="var(--r-m)" label={t('payments.loadingLabel')} />
          ))}
        </div>
      ) : readFailed ? (
        <GlassPanel level="hero" padding={22} className="mt-[14px]">
          <EmptyState
            glyph={<Icon name="alert" size={26} style={{ color: 'var(--stop)' }} />}
            glyphBackground="color-mix(in srgb, var(--stop) 14%, transparent)"
            title={t('payments.errorTitle')}
            body={t('payments.errorBody')}
            action={<Button tone="forme" onClick={load}>{t('payments.errorRetry')}</Button>}
          />
        </GlassPanel>
      ) : transactions.length === 0 ? (
        <GlassPanel level="hero" padding={22} className="mt-[14px]">
          <EmptyState
            glyph={<Icon name="card" size={26} style={{ color: 'var(--mm-bleu)' }} />}
            glyphBackground="color-mix(in srgb, var(--mm-bleu) 14%, transparent)"
            title={t('payments.emptyTitle')}
            body={t('payments.emptyText')}
            action={
              <Button tone="forme" onClick={() => navigate(path('/formations'))}>
                {t('payments.emptyAction')}
              </Button>
            }
          />
        </GlassPanel>
      ) : (
        <GlassPanel level="flat" padding="6px 18px" className="mt-[14px]">
          {transactions.map((tx, i) => (
            <LessonRow
              key={tx.id}
              state="plain"
              icon={<Icon name="card" size={14} style={{ color: `var(${STATUS_TINT[tx.status]})` }} />}
              iconBackground={`color-mix(in srgb, var(${STATUS_TINT[tx.status]}) 16%, transparent)`}
              /* La référence est une valeur lue en base, tabulaire, que l'acheteur rapproche
                 caractère par caractère avec celle du reçu. <Num> est le seul chemin du dépôt
                 vers la monospace, et il exige de dire d'où elle vient. */
              title={
                <Num
                  value={tx.transactionRef ?? tx.id}
                  source="db"
                  asOf={asOf}
                  style={{ overflowWrap: 'anywhere' }}
                />
              }
              meta={
                <>
                  <Num value={tx.amount} unit={tx.currency || 'XOF'} source="server" asOf={asOf} />
                  {' · '}{formatDate(tx.createdAt)}
                  {tx.formationTitle ? ` · ${tx.formationTitle}` : null}
                </>
              }
              trailing={
                <span className="flex flex-shrink-0">
                  <Tag tone={STATUS_TONE[tx.status]}>{statusLabel[tx.status]}</Tag>
                </span>
              }
              last={i === transactions.length - 1}
            />
          ))}
        </GlassPanel>
      )}

      {/* L'encart de vérité : ce que cet écran NE fait PAS. Un sourcil, un paragraphe. */}
      <GlassPanel level="truth" className="mt-[16px]">
        <p className="mm-eyebrow m-0 mb-[6px]">{t('payments.truthTitle')}</p>
        <p className="m-0 text-meta-2 leading-[1.5]" style={{ color: 'var(--text-muted)' }}>
          {t('payments.truthBody')}
        </p>
      </GlassPanel>
    </div>
  );
}
