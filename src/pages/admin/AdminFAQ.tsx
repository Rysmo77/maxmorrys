import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ChipRow, EmptyState, Field, Icon, LessonRow, Num, Skeleton, StatTile, Tag, useToast } from '@ds';
import { ConsolePage, ConsoleFilter, ConsoleList, ConsoleScope } from '../../components/console';
import { useReveal } from '../../components/site/useReveal';
import ConsoleSheet from './components/ConsoleSheet';
import { Pagination } from '@/components/dialogs';
import { ConfirmDialog } from '@/components/dialogs';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { usePagination } from '../../hooks/usePagination';
import { getAllFAQ, saveFAQItem, deleteFAQItem } from '../../lib/firestore';
import { faqSlug, hasAuthoredSlug } from '../../lib/faq/slug';
import type { FAQ } from '../../types';
import { captureError } from '../../lib/sentry';

const EMPTY: Omit<FAQ, 'id'> = { question: '', answer: '', category: '', order: 0, slug: '' };

/**
 * LES TROIS ÉTAPES DE LA FAQ, ET CE QU'ELLES DISENT DU PRODUIT.
 *
 * Le kit donne le pipeline « tout · publiées · sans page », avec des compteurs de démonstration
 * égaux — 12, 12, 12. Ce n'est pas une coïncidence de maquette, c'est la forme réelle des
 * données :
 *
 *   • `publiées` vaut TOUT. Le type `FAQ` n'a pas de champ d'état : une question est en ligne
 *     dès l'enregistrement, il n'existe ni brouillon ni file de relecture.
 *   • `slug dérivé` compte les questions dont l'ADRESSE N'EST PAS FIGÉE.
 *
 * ⚠️ CETTE SECONDE ÉTAPE A CHANGÉ DE SENS, ET PAS DE FAÇON COSMÉTIQUE. Elle comptait
 * autrefois les questions « sans page » — c'était TOUTES, puisque `/faq` était une route
 * unique. `/faq/:slug` existe maintenant, et l'écran `FaqQuestion` du kit avec lui : toute
 * question a donc une page. Ce qui reste à surveiller est plus fin et plus dangereux — le
 * slug DÉRIVÉ du texte de la question, qui rend la page atteignable immédiatement mais
 * DÉPLACE l'adresse dès qu'on reformule la question. Un lien partagé meurt, une position en
 * recherche se perd, et rien ne le signale. Renseigner le champ « adresse » fige l'URL.
 */
const STAGES = ['all', 'published', 'derivedSlug'] as const;
type Stage = (typeof STAGES)[number];

/** Une question n'a pas d'état de brouillon : elle est en ligne dès l'enregistrement. */
const isPublished = (): boolean => true;
/** Vrai quand l'adresse est figée à la main, et ne suivra donc pas le texte de la question. */
const hasStableSlug = (f: FAQ): boolean => hasAuthoredSlug(f);

export default function AdminFAQ() {
  const { t } = useTranslation('admin');
  const { addToast } = useToast();
  const confirm = useConfirmDialog();
  const reveal = useReveal<HTMLDivElement>();
  const [faq, setFaq] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  /** Date du relevé : l'instant où la requête a répondu. Aucun compteur ne s'affiche sans elle. */
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [stage, setStage] = useState<Stage>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [form, setForm] = useState<Omit<FAQ, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getAllFAQ().then((data) => { setFaq(data); setLoadedAt(new Date()); setLoading(false); })
      .catch(() => { addToast('error', t('faq.toasts.loadError')); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const categories = ['all', ...Array.from(new Set(faq.map((f) => f.category).filter(Boolean)))];

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY, order: faq.length + 1 });
    setModalOpen(true);
  };

  const openEdit = (f: FAQ) => {
    setEditing(f);
    setForm({ question: f.question, answer: f.answer, category: f.category, order: f.order, slug: f.slug ?? '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) return;
    setSaving(true);
    try {
      await saveFAQItem({ ...form, id: editing?.id });
      addToast('success', editing ? t('faq.toasts.updated') : t('faq.toasts.created'));
      setModalOpen(false);
      load();
    } catch (error: unknown) {
      captureError(error, { context: 'Save FAQ item failed' });
      addToast('error', error instanceof Error ? error.message : t('faq.toasts.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    // La feuille se referme AVANT la demande de confirmation : deux dialogues ouverts, ce sont
    // deux pièges de focus qui se disputent la touche Tab.
    setModalOpen(false);
    confirm.requestConfirm(t('faq.confirmDelete.message'), async () => {
      try {
        await deleteFAQItem(id);
        setFaq((prev) => prev.filter((f) => f.id !== id));
        addToast('success', t('faq.toasts.deleted'));
      } catch (error: unknown) {
        captureError(error, { context: 'Delete FAQ item failed' });
        addToast('error', error instanceof Error ? error.message : t('faq.toasts.deleteError'));
      }
      confirm.closeConfirm();
    });
  };

  const derivedSlugCount = useMemo(() => faq.filter((f) => !hasStableSlug(f)).length, [faq]);

  const filtered = useMemo(() => faq.filter((f) => {
    if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;
    if (stage === 'published') return isPublished();
    if (stage === 'derivedSlug') return !hasStableSlug(f);
    return true;
  }), [faq, categoryFilter, stage]);

  const { paged, page, totalPages, setPage } = usePagination(filtered);

  const stageLabels = STAGES.map((s) => t(`faq.stages.${s}`));
  const categoryLabels = categories.map((c) => (c === 'all' ? t('faq.filterAll') : c));

  return (
    <div>
      <ConsolePage title={t('faq.title')} sub={t('faq.consoleSub')}>
        <ConsoleFilter
          label={t('faq.stagesLabel')}
          stages={stageLabels}
          active={t(`faq.stages.${stage}`)}
          onSelect={(label) => {
            const index = stageLabels.indexOf(label);
            if (index >= 0) setStage(STAGES[index]);
          }}
        />

        {categories.length > 2 && (
          <ChipRow
            label={t('faq.categoriesLabel')}
            options={categoryLabels}
            value={categoryLabels[Math.max(0, categories.indexOf(categoryFilter))]}
            onChange={(option) => {
              // Par INDEX, jamais par libellé : une catégorie qui s'appellerait « Toutes »
              // se confondrait avec l'entrée « toutes catégories ».
              const index = categoryLabels.indexOf(option);
              if (index >= 0) setCategoryFilter(categories[index]);
            }}
            height={36}
            style={{ marginTop: '12px' }}
          />
        )}

        {loadedAt && (
          <div className="mt-3.5 grid grid-cols-2 gap-2.5">
            <StatTile
              label={t('faq.tiles.questions')}
              value={faq.length}
              source="db"
              asOf={loadedAt}
              foot={t('faq.tiles.questionsFoot')}
            />
            <StatTile
              label={t('faq.tiles.derivedSlug')}
              value={derivedSlugCount}
              source="db"
              asOf={loadedAt}
              foot={t('faq.tiles.derivedSlugFoot')}
            />
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={openNew}>{t('faq.newQuestion')}</Button>
        </div>

        <div className="mt-3">
          {loading || !loadedAt ? (
            <div className="space-y-2.5">
              {[0, 1, 2].map((i) => <Skeleton key={i} height={56} radius="var(--r-m)" label={t('faq.loading')} />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              glyph={<Icon name="chat" size={26} color="var(--mm-bleu)" />}
              glyphBackground="color-mix(in srgb, var(--mm-bleu) 18%, transparent)"
              title={t('faq.empty')}
              body={t('faq.emptyBody')}
              action={<Button onClick={openNew}>{t('faq.newQuestion')}</Button>}
            />
          ) : (
            <ConsoleList label={t('faq.listLabel')}>
              {paged.map((f, i) => (
                <li key={f.id}>
                  <LessonRow
                    onClick={() => openEdit(f)}
                    icon={<Icon name="chat" size={14} color="var(--mm-bleu)" />}
                    iconBackground="color-mix(in srgb, var(--mm-bleu) 20%, transparent)"
                    title={f.question}
                    meta={(
                      <>
                        {t('faq.rowOrder')}
                        {' '}
                        <Num value={f.order} source="db" asOf={loadedAt} />
                        {f.category ? ` · ${f.category}` : ''}
                      </>
                    )}
                    trailing={<Tag tone="ok">{t('faq.tags.online')}</Tag>}
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
          <ConsoleScope>{t('faq.scope')}</ConsoleScope>
        </div>
      </ConsolePage>

      <ConsoleSheet
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        closeLabel={t('faq.modal.close')}
        eyebrow={t('faq.consoleSub')}
        title={editing ? t('faq.modal.editTitle') : t('faq.modal.newTitle')}
        footer={(
          <>
            {editing && (
              <Button size="sm" tone="quiet" onClick={() => handleDelete(editing.id)} style={{ marginRight: 'auto' }}>
                {t('faq.actions.delete')}
              </Button>
            )}
            <Button size="sm" tone="quiet" onClick={() => setModalOpen(false)}>{t('faq.actions.cancel')}</Button>
            <Button
              size="sm"
              onClick={handleSave}
              loading={saving}
              disabled={!form.question.trim() || !form.answer.trim()}
            >
              {saving ? t('faq.actions.saving') : t('faq.actions.save')}
            </Button>
          </>
        )}
      >
        <Field
          label={t('faq.form.questionLabel')}
          value={form.question}
          onChange={(v) => setForm((p) => ({ ...p, question: v }))}
          placeholder={t('faq.form.questionPlaceholder')}
        />
        <Field
          as="textarea"
          rows={5}
          label={t('faq.form.answerLabel')}
          value={form.answer}
          onChange={(v) => setForm((p) => ({ ...p, answer: v }))}
          placeholder={t('faq.form.answerPlaceholder')}
        />
        {/*
          L'ADRESSE DE LA PAGE. Vide, elle se dérive de la question — la page existe tout de
          suite, mais son URL SUIT le texte : corriger une faute de frappe déplace la page.
          Renseignée, elle est figée, et les liens déjà partagés survivent à toute réécriture.
        */}
        <Field
          label={t('faq.form.slugLabel')}
          value={form.slug ?? ''}
          onChange={(v) => setForm((p) => ({ ...p, slug: v }))}
          placeholder={form.question ? faqSlug({ question: form.question, slug: '' }) : t('faq.form.slugPlaceholder')}
          hint={t('faq.form.slugHint')}
        />

        <div className="grid grid-cols-2 gap-4">
          <Field
            label={t('faq.form.categoryLabel')}
            value={form.category}
            onChange={(v) => setForm((p) => ({ ...p, category: v }))}
            placeholder={t('faq.form.categoryPlaceholder')}
          />
          <Field
            type="number"
            inputMode="numeric"
            label={t('faq.form.orderLabel')}
            hint={t('faq.form.orderHint')}
            value={String(form.order)}
            onChange={(v) => setForm((p) => ({ ...p, order: Number(v) || 0 }))}
          />
        </div>
      </ConsoleSheet>

      <ConfirmDialog
        open={confirm.open}
        onClose={confirm.closeConfirm}
        onConfirm={confirm.onConfirm}
        title={t('faq.confirmDelete.title')}
        message={confirm.message}
        confirmLabel={t('faq.confirmDelete.confirmLabel')}
      />
    </div>
  );
}
