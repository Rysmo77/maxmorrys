import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, DocLine, EmptyState, GlassPanel, Icon, LessonRow, Tag } from '@ds';
import { ConsoleList, ConsoleScope } from '../../../components/console';
import ConsoleSheet from './ConsoleSheet';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import { getClubOpportunities, deleteClubOpportunity } from '../../../lib/firestore';
import { useFormat } from '../../../hooks/useFormat';
import type { ClubOpportunity } from '../../../types';
import ConsoleListSkeleton from './ConsoleListSkeleton';

/**
 * ── OPPORTUNITÉS — motif de console ─────────────────────────────────────────────────
 *
 * CET ÉCRAN ÉTAIT DÉJÀ CONFORME SUR LE POINT LE PLUS DIFFICILE : une action par ligne. Il
 * n'en gagne pas une seconde ici, il change seulement de matière — `Card` + `Badge` +
 * `<button>` nu deviennent `ConsoleList` + `LessonRow` + `Tag`, comme les huit autres.
 *
 * CE QUE LA FICHE APPORTE QUAND MÊME. La description était tronquée à deux lignes par
 * `line-clamp-2`, et le contact rendu en toutes lettres sur la ligne. Autrement dit :
 * l'information sur laquelle porte la décision n'était PAS lisible, et celle qui n'y sert
 * pas prenait la largeur. La fiche rend la description entière ; la ligne ne garde que ce
 * qui permet de choisir laquelle ouvrir.
 *
 * ZONE 1 · AUCUNE FILE, ET C'EST ÉCRIT AU PIED. `ClubOpportunity` ne porte pas de champ de
 * statut : une opportunité est publiée à l'instant où un membre l'écrit, elle n'est ni
 * modérée avant, ni close après, ni datée d'expiration. Une file « en attente / traitée »
 * serait vide en permanence — une étape toujours vide apprend faux.
 * ────────────────────────────────────────────────────────────────────────────────────
 */
const TINT: Record<ClubOpportunity['type'], string> = {
  mission: '--mm-bleu',
  emploi: '--mm-teal',
  partenariat: '--mm-violet',
  autre: '--ink-2',
};

export default function ClubOpportunitiesAdminTab() {
  const { t } = useTranslation('adminClub');
  const { formatDate } = useFormat();
  const TYPE_LABELS: Record<ClubOpportunity['type'], string> = {
    mission: t('opportunities.types.mission'),
    emploi: t('opportunities.types.emploi'),
    partenariat: t('opportunities.types.partenariat'),
    autre: t('opportunities.types.autre'),
  };
  const { addToast } = useToast();
  const confirm = useConfirmDialog();
  const [items, setItems] = useState<ClubOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => { getClubOpportunities().then((d) => { setItems(d); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const handleDelete = (item: ClubOpportunity) => {
    confirm.requestConfirm(t('opportunities.deleteConfirm', { title: item.title }), async () => {
      try {
        await deleteClubOpportunity(item.id);
        setItems((prev) => prev.filter((x) => x.id !== item.id));
        setOpenId(null);
        addToast('success', t('opportunities.deleted'));
      } catch { addToast('error', t('common.deleteError')); }
      confirm.closeConfirm();
    });
  };

  const sheet = items.find((x) => x.id === openId) ?? null;

  if (loading) return <ConsoleListSkeleton label={t('opportunities.listLabel')} />;

  return (
    <div>
      {items.length === 0 ? (
        <EmptyState
          glyph={<Icon name="handshake" size={26} color="var(--mm-teal)" />}
          glyphBackground="color-mix(in srgb, var(--mm-teal) 20%, transparent)"
          title={t('opportunities.empty')}
          body={t('opportunities.emptyBody')}
        />
      ) : (
        <ConsoleList label={t('opportunities.listLabel')}>
          {items.map((item, i) => (
            <li key={item.id}>
              <LessonRow
                onClick={() => setOpenId(item.id)}
                icon={<Icon name="handshake" size={14} color={`var(${TINT[item.type]})`} />}
                iconBackground={`color-mix(in srgb, var(${TINT[item.type]}) 20%, transparent)`}
                title={item.title}
                meta={[item.userName, formatDate(item.createdAt), item.budget || null]
                  .filter(Boolean).join(' · ')}
                trailing={<Tag tone="neutral">{TYPE_LABELS[item.type]}</Tag>}
                last={i === items.length - 1}
              />
            </li>
          ))}
        </ConsoleList>
      )}

      <ConsoleScope title={t('common.sectionScopeTitle')}>{t('opportunities.scope')}</ConsoleScope>

      <ConsoleSheet
        open={Boolean(sheet)}
        onClose={() => setOpenId(null)}
        closeLabel={t('common.close')}
        eyebrow={sheet ? TYPE_LABELS[sheet.type] : undefined}
        title={sheet?.title ?? ''}
        footer={sheet && (
          <>
            <Button size="sm" tone="quiet" onClick={() => handleDelete(sheet)} style={{ marginRight: 'auto' }}>
              {t('opportunities.delete')}
            </Button>
            <Button size="sm" tone="quiet" onClick={() => setOpenId(null)}>{t('common.close')}</Button>
          </>
        )}
      >
        {sheet && (
          <div>
            {/* La description ENTIÈRE. C'est elle qui dit si l'annonce a sa place au Club ;
                deux lignes tronquées ne permettaient pas de le savoir. */}
            <GlassPanel level="flat" padding={14}>
              <p className="m-0 whitespace-pre-wrap break-words text-small leading-[1.55] text-ink-2">
                {sheet.description}
              </p>
            </GlassPanel>
            <div className="mt-4">
              <DocLine label={t('opportunities.authorLabel')} value={sheet.userName} />
              <DocLine label={t('opportunities.dateLabel')} value={formatDate(sheet.createdAt)} />
              <DocLine label={t('opportunities.typeLabel')} value={TYPE_LABELS[sheet.type]} />
              {sheet.budget && <DocLine label={t('opportunities.budgetLabel')} value={sheet.budget} />}
              <DocLine label={t('opportunities.contactLabel')} value={sheet.contact} last />
            </div>
            <p className="m-0 mt-4 text-meta-2 leading-[1.55] text-ink-2">{t('opportunities.sheetNotice')}</p>
          </div>
        )}
      </ConsoleSheet>

      <ConfirmDialog
        open={confirm.open}
        onClose={confirm.closeConfirm}
        onConfirm={confirm.onConfirm}
        title={t('opportunities.deleteTitle')}
        message={confirm.message}
        confirmLabel={t('opportunities.confirmLabel')}
      />
    </div>
  );
}
