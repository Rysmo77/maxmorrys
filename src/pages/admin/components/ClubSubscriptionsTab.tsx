import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, DocLine, EmptyState, Icon, LessonRow, Num, Tag } from '@ds';
import type { TagTone } from '@ds';
import { ConsoleFilter, ConsoleList, ConsoleScope } from '../../../components/console';
import ConsoleSheet from './ConsoleSheet';
import { useFormat } from '../../../hooks/useFormat';
import type { ClubDigitosSubscription } from '../../../types';

/**
 * ── ABONNEMENTS — motif de console ──────────────────────────────────────────────────
 *
 * ZONE 1 · LA FILE EXISTE, ET ELLE ÉTAIT LÀ DEPUIS TOUJOURS. `ClubDigitosSubscription`
 * porte `status: 'active' | 'pending' | 'expired' | 'cancelled'` en base ; l'écran affichait
 * pourtant les quatre états mélangés dans un tableau trié par rien. Le seul état qui APPELLE
 * un geste — « en attente de paiement » — se cherchait à l'œil, ligne par ligne.
 *
 * ZONE 2 · UNE SEULE ACTION PAR LIGNE : ouvrir la fiche. Les deux transitions existantes
 * (activer, annuler) n'ont pas disparu, elles sont descendues dans la feuille, où l'on voit
 * QUI on active, jusqu'à quand, et pour quel montant. Activer un accès d'un an depuis une
 * cellule de tableau large de trente pixels était le vrai risque de cet écran.
 *
 * CE QUI N'A PAS ÉTÉ AJOUTÉ. Le type autorise `expired` et `pending`, mais l'écran n'a
 * jamais su les écrire et il ne l'apprend pas ici : `expired` se déduit d'une date, `pending`
 * est posé par le tunnel de paiement. Les offrir en boutons ferait croire qu'un opérateur
 * peut remettre un abonnement en attente, ce qui ne veut rien dire.
 * ────────────────────────────────────────────────────────────────────────────────────
 */
type Status = ClubDigitosSubscription['status'];
type Stage = 'all' | Status;

const STAGES: Stage[] = ['all', 'pending', 'active', 'expired', 'cancelled'];

const TONE: Record<Status, TagTone> = {
  active: 'ok',
  pending: 'warn',
  expired: 'neutral',
  cancelled: 'stop',
};

const TINT: Record<Status, string> = {
  active: '--ok',
  pending: '--mm-orange',
  expired: '--ink-2',
  cancelled: '--stop',
};

interface ClubSubscriptionsTabProps {
  subscriptions: ClubDigitosSubscription[];
  handleSubStatus: (userId: string, status: ClubDigitosSubscription['status']) => Promise<void>;
  /** L'instant où la lecture a répondu. `null` tant qu'aucune n'a abouti (règle 6). */
  loadedAt: Date | null;
}

export default function ClubSubscriptionsTab({ subscriptions, handleSubStatus, loadedAt }: ClubSubscriptionsTabProps) {
  const { t } = useTranslation('adminClub');
  const { formatDate } = useFormat();
  const [stage, setStage] = useState<Stage>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  /** Les compteurs portent sur la COLLECTION entière, jamais sur l'affichage filtré. */
  const bar = useMemo(() => STAGES.map((s) => {
    const label = s === 'all' ? t('subscriptions.stages.all') : t(`subscriptions.status.${s}`);
    const n = s === 'all' ? subscriptions.length : subscriptions.filter((x) => x.status === s).length;
    return { key: s, text: `${label} ${n}` };
  }), [subscriptions, t]);

  const filtered = useMemo(
    () => subscriptions.filter((s) => stage === 'all' || s.status === stage),
    [subscriptions, stage],
  );

  const sheet = subscriptions.find((s) => s.id === openId) ?? null;

  const act = async (sub: ClubDigitosSubscription, status: Status) => {
    setWorking(true);
    await handleSubStatus(sub.userId, status);
    setWorking(false);
    setOpenId(null);
  };

  return (
    <div>
      <ConsoleFilter
        stages={bar.map((s) => s.text)}
        active={bar.find((s) => s.key === stage)?.text}
        onSelect={(text) => {
          const hit = bar.find((s) => s.text === text);
          if (hit) setStage(hit.key);
        }}
        label={t('subscriptions.pipelineLabel')}
      />

      <div className="mt-4">
        {filtered.length === 0 ? (
          <EmptyState
            glyph={<Icon name="card" size={26} color="var(--mm-teal)" />}
            glyphBackground="color-mix(in srgb, var(--mm-teal) 20%, transparent)"
            title={t('subscriptions.empty')}
            body={stage === 'all' ? t('subscriptions.emptyAll') : t('subscriptions.emptyStage')}
          />
        ) : (
          <ConsoleList label={t('subscriptions.listLabel')}>
            {filtered.map((sub, i) => (
              <li key={sub.id}>
                <LessonRow
                  onClick={() => setOpenId(sub.id)}
                  icon={<Icon name="card" size={14} color={`var(${TINT[sub.status]})`} />}
                  iconBackground={`color-mix(in srgb, var(${TINT[sub.status]}) 20%, transparent)`}
                  title={sub.userName || sub.userEmail || sub.userId}
                  meta={[
                    t(`subscriptions.status.${sub.status}`),
                    t('subscriptions.metaExpires', { date: formatDate(sub.expiresAt) }),
                    sub.autoRenew ? t('subscriptions.renew.auto') : t('subscriptions.renew.manual'),
                  ].join(' · ')}
                  trailing={<Tag tone={TONE[sub.status]}>{t(`subscriptions.status.${sub.status}`)}</Tag>}
                  last={i === filtered.length - 1}
                />
              </li>
            ))}
          </ConsoleList>
        )}
      </div>

      <ConsoleScope title={t('common.sectionScopeTitle')}>{t('subscriptions.scope')}</ConsoleScope>

      <ConsoleSheet
        open={Boolean(sheet)}
        onClose={() => setOpenId(null)}
        closeLabel={t('common.close')}
        eyebrow={sheet ? t(`subscriptions.status.${sheet.status}`) : undefined}
        title={sheet ? (sheet.userName || sheet.userEmail || sheet.userId) : ''}
        footer={sheet && (
          <>
            {sheet.status !== 'active' && (
              <Button size="sm" onClick={() => { void act(sheet, 'active'); }} loading={working}>
                {t('subscriptions.activate')}
              </Button>
            )}
            {sheet.status === 'active' && (
              <Button size="sm" tone="quiet" onClick={() => { void act(sheet, 'cancelled'); }} loading={working}>
                {t('subscriptions.cancelAccess')}
              </Button>
            )}
            <Button size="sm" tone="quiet" onClick={() => setOpenId(null)}>{t('common.close')}</Button>
          </>
        )}
      >
        {sheet && (
          <div>
            <DocLine label={t('subscriptions.table.member')} value={sheet.userEmail || sheet.userId} />
            <DocLine label={t('subscriptions.table.status')} value={t(`subscriptions.status.${sheet.status}`)} />
            <DocLine label={t('subscriptions.table.start')} value={formatDate(sheet.startedAt)} />
            <DocLine label={t('subscriptions.table.expiration')} value={formatDate(sheet.expiresAt)} />
            <DocLine
              label={t('subscriptions.table.renewal')}
              value={sheet.autoRenew ? t('subscriptions.renew.auto') : t('subscriptions.renew.manual')}
            />
            {/* Le montant vient du document d'abonnement, et il porte sa date de relevé :
                c'est LUI qu'additionne la case « Revenus Club » de l'en-tête. */}
            <DocLine
              label={t('subscriptions.amountLabel')}
              value={<Num value={loadedAt ? sheet.amount : null} unit="FCFA" source="db" asOf={loadedAt ?? new Date()} />}
              last
            />
            <p className="m-0 mt-4 text-meta-2 leading-[1.55] text-ink-2">{t('subscriptions.sheetNotice')}</p>
          </div>
        )}
      </ConsoleSheet>
    </div>
  );
}
