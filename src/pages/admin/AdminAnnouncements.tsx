import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button, EmptyState, Field, Icon, LessonRow, Skeleton, StatTile, Switch, Tag,
} from '@ds';
import { ConsolePage, ConsoleFilter, ConsoleList, ConsoleScope } from '../../components/console';
import { useReveal } from '../../components/site/useReveal';
import ConsoleSheet from './components/ConsoleSheet';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { usePagination } from '../../hooks/usePagination';
import { getAllAnnouncements, saveAnnouncement, deleteAnnouncement } from '../../lib/firestore';
import { useFormat } from '../../hooks/useFormat';
import type { Announcement } from '../../types';
import { captureError } from '../../lib/sentry';

const EMPTY: Omit<Announcement, 'id'> = {
  title: '', content: '', type: 'info', active: true,
  startDate: new Date().toISOString().split('T')[0],
  endDate: '', link: '',
};

/**
 * LE PIPELINE DU KIT DIT « POP-UPS · TOUT · ACTIVES · TÉMOIN · ARRÊTÉES ». CET ÉCRAN N'EST PAS
 * CELUI-LÀ, ET L'ÉTAPE « TÉMOIN » N'A AUCUNE DONNÉE ICI.
 *
 * Ce que cet écran administre : la collection `announcements`, c'est-à-dire LE BANDEAU du site
 * public (`src/components/shared/AnnouncementBanner.tsx`). Un titre, un type, une fenêtre de
 * dates, un lien. Aucun champ de variante, aucune mesure, aucun compteur.
 *
 * Où vit réellement le groupe témoin : dans les POP-UPS CONTEXTUELLES, qui sont un autre
 * dispositif — `src/components/popups/PopupManager.tsx` assigne `treatment` ou `control` selon
 * une part de trafic réglée dans `settings/site` (écran Réglages), et le Worker écrit les
 * compteurs par variante dans `analytics/popups-YYYY-MM`, lus par `getPopupStats()` et affichés
 * dans Analytique. Rien de tout cela ne passe par ici.
 *
 * Poser une étape « témoin » sur ce pipeline aurait donc produit un filtre toujours vide, et
 * surtout laissé croire que le bandeau est comparé à un groupe témoin — il ne l'est pas. La
 * quatrième étape porte à la place la distinction que ces données rendent VRAIE et qu'un
 * opérateur cherche vraiment : « hors fenêtre », c'est-à-dire active au drapeau mais invisible
 * du site parce que sa fenêtre de dates ne couvre pas aujourd'hui. Le pied de l'écran nomme
 * l'écart en toutes lettres.
 */
const STAGES = ['all', 'live', 'outOfWindow', 'stopped'] as const;
type Stage = (typeof STAGES)[number];

/** La fenêtre EXACTE de `getActiveAnnouncements()` : c'est elle qui décide de l'affichage. */
const inWindow = (a: Announcement, today: string): boolean =>
  a.startDate <= today && (!a.endDate || a.endDate >= today);
const isLive = (a: Announcement, today: string): boolean => a.active && inWindow(a, today);
const isOutOfWindow = (a: Announcement, today: string): boolean => a.active && !inWindow(a, today);

export default function AdminAnnouncements() {
  const { t } = useTranslation('admin');
  const { formatDate } = useFormat();
  const { addToast } = useToast();
  const confirm = useConfirmDialog();
  const reveal = useReveal<HTMLDivElement>();
  const TYPE_LABELS: Record<Announcement['type'], string> = {
    info: t('announcements.typeInfo'),
    promo: t('announcements.typePromo'),
    update: t('announcements.typeUpdate'),
  };
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  /** Date du relevé : l'instant où la requête a répondu. Aucun compteur ne s'affiche sans elle. */
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [stage, setStage] = useState<Stage>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState<Omit<Announcement, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getAllAnnouncements()
      .then((data) => { setAnnouncements(data); setLoadedAt(new Date()); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY, startDate: new Date().toISOString().split('T')[0] });
    setModalOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditing(a);
    setForm({ title: a.title, content: a.content, type: a.type, active: a.active, startDate: a.startDate?.split('T')[0] ?? '', endDate: a.endDate?.split('T')[0] ?? '', link: a.link ?? '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await saveAnnouncement({ ...form, id: editing?.id });
      addToast('success', editing ? t('announcements.toastUpdated') : t('announcements.toastCreated'));
      setModalOpen(false);
      load();
    } catch (error: unknown) {
      captureError(error, { context: 'Save announcement failed' });
      addToast('error', error instanceof Error ? error.message : t('announcements.toastSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    // La feuille se referme d'abord : deux dialogues ouverts, ce sont deux pièges de focus.
    setModalOpen(false);
    confirm.requestConfirm(t('announcements.confirmDeleteMessage'), async () => {
      try {
        await deleteAnnouncement(id);
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        addToast('success', t('announcements.toastDeleted'));
      } catch (error: unknown) {
        captureError(error, { context: 'Delete announcement failed' });
        addToast('error', t('announcements.toastDeleteError'));
      }
      confirm.closeConfirm();
    });
  };

  /** Le jour du relevé, au format ISO court — la comparaison se fait sur des chaînes. */
  const today = (loadedAt ?? new Date()).toISOString().split('T')[0];

  const counts = useMemo(() => ({
    live: announcements.filter((a) => isLive(a, today)).length,
    outOfWindow: announcements.filter((a) => isOutOfWindow(a, today)).length,
  }), [announcements, today]);

  const filtered = useMemo(() => announcements.filter((a) => {
    if (stage === 'live') return isLive(a, today);
    if (stage === 'outOfWindow') return isOutOfWindow(a, today);
    if (stage === 'stopped') return !a.active;
    return true;
  }), [announcements, stage, today]);

  const { paged, page, totalPages, setPage } = usePagination(filtered);

  const stageLabels = STAGES.map((s) => t(`announcements.stages.${s}`));

  /** Un seul état par ligne : celui qui décide de ce que voit un visiteur aujourd'hui. */
  const stateTag = (a: Announcement) => {
    if (!a.active) return <Tag tone="neutral">{t('announcements.tags.stopped')}</Tag>;
    if (isLive(a, today)) return <Tag tone="ok">{t('announcements.tags.live')}</Tag>;
    if (a.startDate > today) return <Tag tone="warn">{t('announcements.tags.scheduled')}</Tag>;
    return <Tag tone="stop">{t('announcements.tags.over')}</Tag>;
  };

  return (
    <div>
      <ConsolePage title={t('announcements.title')} sub={t('announcements.consoleSub')}>
        <ConsoleFilter
          label={t('announcements.stagesLabel')}
          stages={stageLabels}
          active={t(`announcements.stages.${stage}`)}
          onSelect={(label) => {
            const index = stageLabels.indexOf(label);
            if (index >= 0) setStage(STAGES[index]);
          }}
        />

        {loadedAt && (
          <div className="mt-3.5 grid grid-cols-2 gap-2.5">
            <StatTile
              label={t('announcements.tiles.live')}
              value={counts.live}
              source="db"
              asOf={loadedAt}
              foot={t('announcements.tiles.liveFoot')}
            />
            <StatTile
              label={t('announcements.tiles.outOfWindow')}
              value={counts.outOfWindow}
              source="db"
              asOf={loadedAt}
              foot={t('announcements.tiles.outOfWindowFoot')}
            />
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={openNew}>{t('announcements.newAnnouncement')}</Button>
        </div>

        <div className="mt-3">
          {loading || !loadedAt ? (
            <div className="space-y-2.5">
              {[0, 1, 2].map((i) => <Skeleton key={i} height={56} radius="var(--r-m)" label={t('announcements.loading')} />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              glyph={<Icon name="bell" size={26} color="var(--mm-orange)" />}
              glyphBackground="color-mix(in srgb, var(--mm-orange) 18%, transparent)"
              title={t('announcements.empty')}
              body={t('announcements.emptyBody')}
              action={<Button onClick={openNew}>{t('announcements.newAnnouncement')}</Button>}
            />
          ) : (
            <ConsoleList label={t('announcements.listLabel')}>
              {paged.map((a, i) => (
                <li key={a.id}>
                  <LessonRow
                    onClick={() => openEdit(a)}
                    icon={<Icon name="bell" size={14} color="var(--mm-orange)" />}
                    iconBackground="color-mix(in srgb, var(--mm-orange) 20%, transparent)"
                    title={a.title}
                    meta={(
                      <>
                        {TYPE_LABELS[a.type]}
                        {` · ${t('announcements.dateFrom', { date: formatDate(a.startDate) })}`}
                        {a.endDate ? ` ${t('announcements.dateTo', { date: formatDate(a.endDate) })}` : ''}
                      </>
                    )}
                    trailing={stateTag(a)}
                    last={i === paged.length - 1}
                  />
                </li>
              ))}
            </ConsoleList>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}

        {/* `.rv` ne rend rien tant qu'un ancêtre ne porte pas `.play`, et la console n'en pose
            aucun : sans déclencheur, le pied du motif — obligatoire — resterait à `opacity: 0`.
            L'observateur est posé sur le PIED lui-même et non sur la page : au seuil de 12 %,
            un écran plus haut que huit fois la fenêtre ne l'atteindrait jamais. */}
        <div ref={reveal}>
          <ConsoleScope>{t('announcements.scope')}</ConsoleScope>
        </div>
      </ConsolePage>

      <ConsoleSheet
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        closeLabel={t('announcements.ariaClose')}
        eyebrow={t('announcements.consoleSub')}
        title={editing ? t('announcements.modalEditTitle') : t('announcements.modalNewTitle')}
        footer={(
          <>
            {editing && (
              <Button size="sm" tone="quiet" onClick={() => handleDelete(editing.id)} style={{ marginRight: 'auto' }}>
                {t('announcements.confirmDeleteLabel')}
              </Button>
            )}
            <Button size="sm" tone="quiet" onClick={() => setModalOpen(false)}>{t('announcements.cancel')}</Button>
            <Button size="sm" onClick={handleSave} loading={saving} disabled={!form.title.trim()}>
              {saving ? t('announcements.saving') : t('announcements.save')}
            </Button>
          </>
        )}
      >
        <Field
          label={t('announcements.labelTitle')}
          value={form.title}
          onChange={(v) => setForm((p) => ({ ...p, title: v }))}
          placeholder={t('announcements.placeholderTitle')}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            as="select"
            label={t('announcements.labelType')}
            value={form.type}
            onChange={(v) => setForm((p) => ({ ...p, type: v as Announcement['type'] }))}
            options={[
              { value: 'info', label: t('announcements.typeInfo') },
              { value: 'promo', label: t('announcements.typePromo') },
              { value: 'update', label: t('announcements.typeUpdate') },
            ]}
          />
          <div className="flex items-end justify-between gap-3 pb-2">
            <span className="text-meta-2 text-ink-2">
              {form.active ? t('announcements.statusActive') : t('announcements.statusInactive')}
            </span>
            <Switch
              on={form.active}
              label={form.active ? t('announcements.ariaDeactivate') : t('announcements.ariaActivate')}
              onChange={(on) => setForm((p) => ({ ...p, active: on }))}
            />
          </div>
        </div>
        <Field
          as="textarea"
          rows={3}
          label={t('announcements.labelContent')}
          value={form.content}
          onChange={(v) => setForm((p) => ({ ...p, content: v }))}
          placeholder={t('announcements.placeholderContent')}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            type="date"
            label={t('announcements.labelStartDate')}
            value={form.startDate}
            onChange={(v) => setForm((p) => ({ ...p, startDate: v }))}
          />
          <Field
            type="date"
            label={t('announcements.labelEndDate')}
            value={form.endDate}
            onChange={(v) => setForm((p) => ({ ...p, endDate: v }))}
          />
        </div>
        <Field
          type="url"
          label={t('announcements.labelLink')}
          value={form.link ?? ''}
          onChange={(v) => setForm((p) => ({ ...p, link: v }))}
          placeholder="https://..."
          hint={t('announcements.linkHint')}
        />
      </ConsoleSheet>

      <ConfirmDialog
        open={confirm.open}
        onClose={confirm.closeConfirm}
        onConfirm={confirm.onConfirm}
        title={t('announcements.confirmDeleteTitle')}
        message={confirm.message}
        confirmLabel={t('announcements.confirmDeleteLabel')}
      />
    </div>
  );
}
