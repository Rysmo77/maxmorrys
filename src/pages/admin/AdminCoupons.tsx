import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState, Field, Icon, LessonRow, Num, SearchPill, Skeleton, StatTile, Switch, Tag, useToast } from '@ds';
import { ConsolePage, ConsoleFilter, ConsoleList, ConsoleScope } from '../../components/console';
import { useReveal } from '../../components/site/useReveal';
import ConsoleSheet from './components/ConsoleSheet';
import { Pagination } from '@/components/dialogs';
import { ConfirmDialog } from '@/components/dialogs';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { usePagination } from '../../hooks/usePagination';
import { getAllCoupons, saveCoupon, deleteCoupon } from '../../lib/firestore';
import { useFormat } from '../../hooks/useFormat';
import type { Coupon } from '../../types';
import { captureError } from '../../lib/sentry';

const EMPTY: Omit<Coupon, 'id'> = {
  code: '', type: 'percentage', value: 10, maxUses: 100,
  usedCount: 0, expiresAt: '', active: true,
};

/**
 * LES QUATRE ÉTAPES DU KIT, RAPPORTÉES AUX TROIS REFUS DU SERVEUR.
 *
 * `functions/src/payment.ts` refuse un code pour exactement trois raisons : il n'est pas
 * `active`, sa date d'expiration est passée, ou `usedCount` a rejoint `maxUses`. Les étapes
 * « épuisés » et « expirés » du kit sont ces deux dernières, lues côté client sur les mêmes
 * champs. Rien ici ne bloque quoi que ce soit : le tunnel de paiement tranche seul, et c'est
 * dit dans le pied de l'écran.
 */
const STAGES = ['all', 'active', 'exhausted', 'expired'] as const;
type Stage = (typeof STAGES)[number];

const isExhausted = (c: Coupon): boolean => c.maxUses > 0 && c.usedCount >= c.maxUses;
const isExpired = (c: Coupon, now: number): boolean =>
  Boolean(c.expiresAt) && new Date(c.expiresAt).getTime() < now;
/** « Actif » au sens du serveur : le drapeau, ET les deux compteurs encore ouverts. */
const isServable = (c: Coupon, now: number): boolean =>
  c.active && !isExhausted(c) && !isExpired(c, now);

export default function AdminCoupons() {
  const { t } = useTranslation('admin');
  const { formatDate } = useFormat();
  const { addToast } = useToast();
  const confirm = useConfirmDialog();
  const reveal = useReveal<HTMLDivElement>();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  /** Date du relevé : l'instant où la requête a répondu. Aucun compteur ne s'affiche sans elle. */
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [stage, setStage] = useState<Stage>('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<Omit<Coupon, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getAllCoupons()
      .then((data) => { setCoupons(data); setLoadedAt(new Date()); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setModalOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({ code: c.code, type: c.type, value: c.value, maxUses: c.maxUses, usedCount: c.usedCount, expiresAt: c.expiresAt?.split('T')[0] ?? '', active: c.active });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) return;
    setSaving(true);
    try {
      await saveCoupon({ ...form, code: form.code.toUpperCase().trim(), id: editing?.id });
      addToast('success', editing ? t('coupons.toasts.updated') : t('coupons.toasts.created'));
      setModalOpen(false);
      load();
    } catch (error: unknown) {
      captureError(error, { context: 'Save coupon failed' });
      addToast('error', error instanceof Error ? error.message : t('coupons.toasts.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    // La feuille se referme d'abord : deux dialogues ouverts, ce sont deux pièges de focus.
    setModalOpen(false);
    confirm.requestConfirm(t('coupons.confirmDelete'), async () => {
      try {
        await deleteCoupon(id);
        setCoupons((prev) => prev.filter((c) => c.id !== id));
        addToast('success', t('coupons.toasts.deleted'));
      } catch {
        addToast('error', t('coupons.toasts.deleteError'));
      }
      confirm.closeConfirm();
    });
  };

  const now = loadedAt?.getTime() ?? Date.now();

  const counts = useMemo(() => ({
    servable: coupons.filter((c) => isServable(c, now)).length,
    uses: coupons.reduce((sum, c) => sum + (c.usedCount ?? 0), 0),
  }), [coupons, now]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return coupons.filter((c) => {
      if (q && !c.code.toLowerCase().includes(q)) return false;
      if (stage === 'active') return isServable(c, now);
      if (stage === 'exhausted') return isExhausted(c);
      if (stage === 'expired') return isExpired(c, now);
      return true;
    });
  }, [coupons, search, stage, now]);

  const { paged, page, totalPages, setPage } = usePagination(filtered);

  const stageLabels = STAGES.map((s) => t(`coupons.stages.${s}`));

  /** L'état d'une ligne : un seul, celui qui décide du refus au paiement. */
  const stateTag = (c: Coupon) => {
    if (!c.active) return <Tag tone="neutral">{t('coupons.tags.off')}</Tag>;
    if (isExpired(c, now)) return <Tag tone="stop">{t('coupons.tags.expired')}</Tag>;
    if (isExhausted(c)) return <Tag tone="warn">{t('coupons.tags.exhausted')}</Tag>;
    return <Tag tone="ok">{t('coupons.tags.active')}</Tag>;
  };

  return (
    <div>
      <ConsolePage title={t('coupons.title')} sub={t('coupons.consoleSub')}>
        <ConsoleFilter
          label={t('coupons.stagesLabel')}
          stages={stageLabels}
          active={t(`coupons.stages.${stage}`)}
          onSelect={(label) => {
            const index = stageLabels.indexOf(label);
            if (index >= 0) setStage(STAGES[index]);
          }}
        />

        {loadedAt && (
          <div className="mt-3.5 grid grid-cols-2 gap-2.5">
            <StatTile
              label={t('coupons.tiles.servable')}
              value={counts.servable}
              source="db"
              asOf={loadedAt}
              foot={t('coupons.tiles.servableFoot')}
            />
            <StatTile
              label={t('coupons.tiles.uses')}
              value={counts.uses}
              source="db"
              asOf={loadedAt}
              foot={t('coupons.tiles.usesFoot')}
            />
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <SearchPill
            label={t('coupons.searchLabel')}
            labelHidden
            placeholder={t('coupons.searchPlaceholder')}
            icon={<Icon name="search" size={16} color="var(--text-muted)" />}
            value={search}
            onChange={setSearch}
            height={46}
            style={{ flex: '1 1 220px' }}
          />
          <Button size="sm" onClick={openNew}>{t('coupons.new')}</Button>
        </div>

        <div className="mt-3">
          {loading || !loadedAt ? (
            <div className="space-y-2.5">
              {[0, 1, 2].map((i) => <Skeleton key={i} height={56} radius="var(--r-m)" label={t('coupons.loading')} />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              glyph={<Icon name="card" size={26} color="var(--mm-violet)" />}
              glyphBackground="color-mix(in srgb, var(--mm-violet) 18%, transparent)"
              title={t('coupons.empty')}
              body={t('coupons.emptyBody')}
              action={<Button onClick={openNew}>{t('coupons.new')}</Button>}
            />
          ) : (
            <ConsoleList label={t('coupons.listLabel')}>
              {paged.map((c, i) => (
                <li key={c.id}>
                  <LessonRow
                    onClick={() => openEdit(c)}
                    icon={<Icon name="card" size={14} color="var(--mm-violet)" />}
                    iconBackground="color-mix(in srgb, var(--mm-violet) 20%, transparent)"
                    title={c.code}
                    meta={(
                      <>
                        <Num
                          value={c.value}
                          unit={c.type === 'percentage' ? '%' : 'FCFA'}
                          source="db"
                          asOf={loadedAt}
                        />
                        {' · '}
                        <Num value={`${c.usedCount}/${c.maxUses}`} source="db" asOf={loadedAt} />
                        {` ${t('coupons.rowUses')} · `}
                        {c.expiresAt
                          ? t('coupons.rowExpires', { date: formatDate(c.expiresAt) })
                          : t('coupons.rowNoExpiry')}
                      </>
                    )}
                    trailing={stateTag(c)}
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
          <ConsoleScope>{t('coupons.scope')}</ConsoleScope>
        </div>
      </ConsolePage>

      <ConsoleSheet
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        closeLabel={t('coupons.modal.close')}
        eyebrow={t('coupons.consoleSub')}
        title={editing ? t('coupons.modal.editTitle') : t('coupons.modal.newTitle')}
        footer={(
          <>
            {editing && (
              <Button size="sm" tone="quiet" onClick={() => handleDelete(editing.id)} style={{ marginRight: 'auto' }}>
                {t('coupons.actions.delete')}
              </Button>
            )}
            <Button size="sm" tone="quiet" onClick={() => setModalOpen(false)}>{t('coupons.actions.cancel')}</Button>
            <Button size="sm" onClick={handleSave} loading={saving} disabled={!form.code.trim()}>
              {saving ? t('coupons.actions.saving') : t('coupons.actions.save')}
            </Button>
          </>
        )}
      >
        <Field
          label={t('coupons.form.code')}
          value={form.code}
          onChange={(v) => setForm((p) => ({ ...p, code: v.toUpperCase() }))}
          placeholder={t('coupons.form.codePlaceholder')}
          autoComplete="off"
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            as="select"
            label={t('coupons.form.type')}
            value={form.type}
            onChange={(v) => setForm((p) => ({ ...p, type: v as Coupon['type'] }))}
            options={[
              { value: 'percentage', label: t('coupons.form.typePercentage') },
              { value: 'fixed', label: t('coupons.form.typeFixed') },
            ]}
          />
          <Field
            type="number"
            inputMode="numeric"
            label={t('coupons.form.value', { unit: form.type === 'percentage' ? '%' : 'FCFA' })}
            value={String(form.value)}
            onChange={(v) => setForm((p) => ({ ...p, value: Number(v) || 0 }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            type="number"
            inputMode="numeric"
            label={t('coupons.form.maxUses')}
            value={String(form.maxUses)}
            onChange={(v) => setForm((p) => ({ ...p, maxUses: Number(v) || 0 }))}
          />
          <Field
            type="date"
            label={t('coupons.form.expiration')}
            value={form.expiresAt}
            onChange={(v) => setForm((p) => ({ ...p, expiresAt: v }))}
          />
        </div>
        <div className="flex items-start justify-between gap-4 pt-1">
          <div className="min-w-0">
            <p className="m-0 text-meta font-semibold text-ink">{t('coupons.form.activeLabel')}</p>
            <p className="m-0 mt-1 text-meta-2 text-ink-2">{t('coupons.form.activeHint')}</p>
          </div>
          <Switch
            on={form.active}
            label={t('coupons.form.activeLabel')}
            onChange={(on) => setForm((p) => ({ ...p, active: on }))}
          />
        </div>
      </ConsoleSheet>

      <ConfirmDialog
        open={confirm.open}
        onClose={confirm.closeConfirm}
        onConfirm={confirm.onConfirm}
        title={t('coupons.confirmTitle')}
        message={confirm.message}
        confirmLabel={t('coupons.actions.delete')}
      />
    </div>
  );
}
