import { useTranslation } from 'react-i18next';
import {
  Button, DocLine, Field, GlassPanel, Icon, IconButton, LessonRow, Num, ProgressBar,
  Segmented, Skeleton, Switch, Tag, type IconName,
} from '@ds';
import { ConsolePage, ConsoleFilter, ConsoleList, ConsoleScope } from '../../components/console';
import { SiteEyebrow } from '../../components/site';
import Modal from '../../components/ui/Modal';
import ImageInput from '../../components/ui/ImageInput';
import RichEditor from '../../components/ui/RichEditor';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Pagination from '../../components/ui/Pagination';
import SEOPanel from '../../components/shared/SEOPanel';
import { formatPrice, slugify } from '../../lib/utils';
import {
  useFormations, formationChecklist, LEVEL_KEYS, LESSON_TYPE_KEYS,
  type FormationStage, type FormationTab, type FormationFormState,
} from './formations/useFormations';
import type { PublishConditionId } from './formations/publishChecklist';
import type { Formation, Lesson } from '../../types';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * FORMATIONS · l'écran où le kit prend sa décision la plus structurante
 *
 *     « La checklist EST la définition de publiable. »
 *
 * Publier n'est pas un interrupteur : c'est une liste de conditions vérifiables, et le bouton
 * reste inactif tant qu'une ligne est orange. L'onglet « Publier » de l'éditeur porte cette
 * liste ; le bouton du pied la lit. Les cinq conditions retenues, et les trois conditions du
 * DESSIN qui n'ont aucun répondant dans ce produit, sont argumentées une par une dans
 * `formations/publishChecklist.ts`.
 *
 * ─── CE QUI A DISPARU DE CET ÉCRAN, ET POURQUOI ────────────────────────────────────────
 *
 *   • LA NOTE EN ÉTOILES ET LE NOMBRE D'INSCRITS (`f.rating`, `f.students`). Deux des interdits
 *     absolus du système, affichés sur chaque carte. La base compte deux formations, aucune
 *     publiée, deux inscriptions à 0 % : ces chiffres n'ont jamais rien mesuré. Ils ont déjà
 *     été retirés de `Formations.tsx` et de `FormationDetail.tsx` pour cette raison ;
 *     l'administration était le dernier endroit où ils s'affichaient encore. Les CHAMPS
 *     restent en base et `handleSave` continue de les recopier — rien n'est perdu.
 *   • LA POIGNÉE DE GLISSEMENT (`GripVertical`) DU CONSTRUCTEUR DE CURRICULUM. Elle promettait
 *     un réordonnancement par glisser-déposer qui N'EXISTE PAS : aucun gestionnaire n'y était
 *     branché. Une affordance qui ne répond pas est un défaut, pas une décoration. Les
 *     chevrons, eux, réordonnent réellement — ils restent.
 *   • LA GRILLE DE CARTES À TROIS ACTIONS. Remplacée par la liste dense du motif : un état,
 *     une action — ouvrir la fiche.
 *   • LES DEUX FAMILLES D'ICÔNES. `lucide-react` a quitté cet écran : le jeu du design system
 *     couvre tout ce qu'il faisait ici.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

const LESSON_ICONS: Record<Lesson['type'], IconName> = {
  video: 'video', text: 'doc', quiz: 'info', resource: 'download', mission: 'case',
};

export default function AdminFormations() {
  const { t } = useTranslation('admin');
  const f = useFormations();

  const levelLabels: Record<string, string> = {
    debutant: t('formations.levelDebutant'),
    intermediaire: t('formations.levelIntermediaire'),
    avance: t('formations.levelAvance'),
  };
  const lessonTypeLabels: Record<string, string> = {
    video: t('formations.lessonTypeVideo'),
    text: t('formations.lessonTypeText'),
    quiz: t('formations.lessonTypeQuiz'),
    resource: t('formations.lessonTypeResource'),
    mission: t('formations.lessonTypeMission'),
  };

  const stageKeys: FormationStage[] = ['all', 'published', 'draft'];
  const stageLabels: Record<FormationStage, string> = {
    all: `${t('formations.console.stageAll')} ${f.counts.all}`,
    published: `${t('formations.console.stagePublished')} ${f.counts.published}`,
    draft: `${t('formations.console.stageDrafts')} ${f.counts.draft}`,
  };

  const tabKeys: FormationTab[] = ['info', 'curriculum', 'settings', 'publish'];
  const tabLabels: Record<FormationTab, string> = {
    info: t('formations.tabInfo'),
    curriculum: t('formations.tabCurriculum', { count: f.totalLessons }),
    settings: t('formations.tabSettings'),
    publish: t('formations.console.tabPublish'),
  };

  /** L'état de la ligne. « À compléter » = la checklist n'est pas remplie. */
  const rowState = (item: Formation) => {
    if (item.status === 'published') {
      return { tone: 'ok' as const, label: t('formations.statusPublished'), ink: 'var(--ok)' };
    }
    return formationChecklist(item).ready
      ? { tone: 'warn' as const, label: t('formations.console.tagReady'), ink: 'var(--warn)' }
      : { tone: 'stop' as const, label: t('formations.console.tagBlocked'), ink: 'var(--stop)' };
  };

  const conditionLabel = (id: PublishConditionId) => t(`formations.console.check.${id}.title`);
  const conditionMeta = (
    id: PublishConditionId,
    ok: boolean,
    counts: { modules: number; lessons: number; emptyModules: number; emptyLessons: number },
  ) => t(`formations.console.check.${id}.${ok ? 'ok' : 'ko'}`, counts);

  return (
    <ConsolePage title={t('formations.pageTitle')} sub={t('formations.console.sub')}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-meta-2 text-ink-2">
          <Num
            value={f.loading ? null : f.counts.all}
            source="db"
            asOf={f.loadedAt ?? new Date()}
            unit={t('formations.console.countUnit')}
            showAsOf={!f.loading}
            fallback={t('formations.console.loadingCount')}
          />
        </p>
        <Button size="sm" onClick={f.openNew}>{t('formations.newFormation')}</Button>
      </div>

      {/* ── ZONE 1 · le filtre par statut ─────────────────────────────────────────────── */}
      <ConsoleFilter
        stages={stageKeys.map((k) => stageLabels[k])}
        active={stageLabels[f.stage]}
        onSelect={(label) => {
          const key = stageKeys.find((k) => stageLabels[k] === label);
          if (key) f.setStage(key);
        }}
        label={t('formations.console.filterLabel')}
      />

      <Field
        type="search"
        label={t('formations.console.searchLabel')}
        hideLabel
        placeholder={t('formations.searchPlaceholder')}
        value={f.search}
        onChange={f.setSearch}
      />

      {/* ── ZONE 2 · la liste dense, UNE action par ligne : ouvrir la fiche ────────────── */}
      <div className="mt-4">
        {f.loading ? (
          <ConsoleList label={t('formations.console.listLabel')}>
            {[0, 1, 2].map((i) => (
              <li key={i} className="border-b border-[color:var(--border-hair)] py-4 last:border-0">
                <Skeleton height={18} label={i === 0 ? t('formations.loading') : undefined} />
              </li>
            ))}
          </ConsoleList>
        ) : f.filtered.length === 0 ? (
          <GlassPanel level="night" padding={24}>
            <p className="m-0 text-center text-meta-2 text-ink-2">{t('formations.emptyState')}</p>
          </GlassPanel>
        ) : (
          <>
            <ConsoleList label={t('formations.console.listLabel')}>
              {f.paged.map((item, i) => {
                const st = rowState(item);
                const mods = item.modules?.length ?? 0;
                const lessons = item.modules?.reduce((acc, m) => acc + m.lessons.length, 0) ?? 0;
                return (
                  <li key={item.id}>
                    <LessonRow
                      icon={<Icon name="book" size={14} color={st.ink} />}
                      iconBackground={`color-mix(in srgb, ${st.ink} 18%, transparent)`}
                      title={item.title}
                      duration={{
                        value: formatPrice(item.promoPrice || item.price),
                        source: 'db',
                        asOf: f.loadedAt ?? new Date(),
                      }}
                      meta={(
                        <>
                          {[item.category, levelLabels[item.level]].filter(Boolean).join(' · ')}
                          {' · '}
                          <Num
                            value={mods}
                            source="db"
                            asOf={f.loadedAt ?? new Date()}
                            unit={t('formations.console.unitModules')}
                          />
                          {' · '}
                          <Num
                            value={lessons}
                            source="db"
                            asOf={f.loadedAt ?? new Date()}
                            unit={t('formations.console.unitLessons')}
                          />
                        </>
                      )}
                      trailing={<Tag tone={st.tone}>{st.label}</Tag>}
                      onClick={() => f.openEdit(item)}
                      last={i === f.paged.length - 1}
                    />
                  </li>
                );
              })}
            </ConsoleList>
            <div className="mt-4 flex justify-center">
              <Pagination currentPage={f.page} totalPages={f.totalPages} onPageChange={f.setPage} />
            </div>
          </>
        )}
      </div>

      {/* ── ZONE 3 · ce que l'écran ne couvre pas ─────────────────────────────────────── */}
      <ConsoleScope>{t('formations.console.scope')}</ConsoleScope>

      {/* ── L'éditeur ─────────────────────────────────────────────────────────────────── */}
      <Modal
        open={f.showModal}
        onClose={() => f.setShowModal(false)}
        title={f.editingId ? t('formations.modalEditTitle') : t('formations.modalNewTitle')}
        size="xl"
      >
        <Segmented
          options={tabKeys.map((k) => tabLabels[k])}
          value={tabLabels[f.activeTab]}
          onChange={(label) => {
            const key = tabKeys.find((k) => tabLabels[k] === label);
            if (key) f.setActiveTab(key);
          }}
          label={t('formations.console.tabsLabel')}
        />

        {f.activeTab === 'info' && (
          <div>
            <Field
              label={t('formations.fieldTitle')}
              value={f.form.title}
              onChange={(v) => { f.set('title', v); if (!f.editingId) f.set('slug', slugify(v)); }}
              placeholder={t('formations.fieldTitlePlaceholder')}
            />
            <Field
              label={t('formations.fieldShortDesc')}
              value={f.form.description}
              onChange={(v) => f.set('description', v)}
              placeholder={t('formations.fieldShortDescPlaceholder')}
            />
            <div className="mt-4">
              <RichEditor
                label={t('formations.fieldLongDesc')}
                value={f.form.longDescription}
                onChange={(v) => f.set('longDescription', v)}
                minHeight="280px"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label={t('formations.fieldCategory')}
                value={f.form.category}
                onChange={(v) => f.set('category', v)}
                placeholder={t('formations.fieldCategoryPlaceholder')}
              />
              <Field
                label={t('formations.fieldPrice')}
                type="number"
                inputMode="numeric"
                value={f.form.price}
                onChange={(v) => f.set('price', v)}
                placeholder="0"
              />
              <Field
                label={t('formations.fieldPromoPrice')}
                type="number"
                inputMode="numeric"
                value={f.form.promoPrice}
                onChange={(v) => f.set('promoPrice', v)}
                placeholder={t('formations.fieldPromoPricePlaceholder')}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                as="select"
                label={t('formations.fieldLevel')}
                value={f.form.level}
                onChange={(v) => f.set('level', v as FormationFormState['level'])}
                options={LEVEL_KEYS.map((lvl) => ({ value: lvl, label: levelLabels[lvl] }))}
              />
              <Field
                label={t('formations.fieldDuration')}
                value={f.form.duration}
                onChange={(v) => f.set('duration', v)}
                placeholder={t('formations.fieldDurationPlaceholder')}
              />
              <Field
                label={t('formations.fieldTags')}
                value={f.form.tags}
                onChange={(v) => f.set('tags', v)}
                placeholder={t('formations.fieldTagsPlaceholder')}
              />
            </div>
            <div className="mt-4">
              <ImageInput
                label={t('formations.fieldCoverImage')}
                value={f.form.coverImage}
                onChange={(url) => f.set('coverImage', url)}
                folder="formations"
              />
            </div>
          </div>
        )}

        {f.activeTab === 'curriculum' && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="m-0 text-meta-2 text-ink-2">
                <Num
                  value={f.form.modules.length}
                  source="db"
                  asOf={f.checklist.asOf}
                  unit={t('formations.console.unitModules')}
                />
                {' · '}
                <Num
                  value={f.totalLessons}
                  source="db"
                  asOf={f.checklist.asOf}
                  unit={t('formations.console.unitLessons')}
                />
              </p>
              <Button size="sm" tone="quiet" onClick={f.addModule}>{t('formations.addModule')}</Button>
            </div>

            {f.form.modules.length === 0 ? (
              <GlassPanel level="flat" padding={24}>
                <p className="m-0 mb-3 text-center text-meta-2 text-ink-2">{t('formations.noModules')}</p>
                <div className="flex justify-center">
                  <Button size="sm" onClick={f.addModule}>{t('formations.createModule')}</Button>
                </div>
              </GlassPanel>
            ) : (
              f.form.modules.map((module, mIndex) => (
                <GlassPanel key={module.id} level="flat" padding={12}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Field
                      className="flex-1"
                      style={{ marginTop: 0 }}
                      label={t('formations.moduleTitlePlaceholder')}
                      hideLabel
                      value={module.title}
                      onChange={(v) => f.updateModule(module.id, v)}
                      placeholder={t('formations.moduleTitlePlaceholder')}
                    />
                    <IconButton label={t('formations.moveUp')} disabled={mIndex === 0} onClick={() => f.moveModule(mIndex, -1)}>
                      <Icon name="chevron" size={15} style={{ transform: 'rotate(180deg)' }} />
                    </IconButton>
                    <IconButton
                      label={t('formations.moveDown')}
                      disabled={mIndex === f.form.modules.length - 1}
                      onClick={() => f.moveModule(mIndex, 1)}
                    >
                      <Icon name="chevron" size={15} />
                    </IconButton>
                    <IconButton label={t('formations.toggleModule')} onClick={() => f.toggleModule(module.id)}>
                      <Icon
                        name="chevron"
                        size={15}
                        style={f.expandedModules.has(module.id) ? { transform: 'rotate(180deg)' } : undefined}
                      />
                    </IconButton>
                    <IconButton label={t('formations.deleteModule')} onClick={() => f.deleteModule(module.id)}>
                      <Icon name="trash" size={15} />
                    </IconButton>
                  </div>

                  {f.expandedModules.has(module.id) && (
                    <div className="mt-3">
                      {module.lessons.length === 0 ? (
                        <p className="m-0 py-2 text-center text-small text-ink-2">
                          {t('formations.noLessonsInModule')}
                        </p>
                      ) : (
                        <ul className="m-0 list-none p-0" aria-label={module.title}>
                          {module.lessons.map((lesson, lIndex) => (
                            <li key={lesson.id} className="flex flex-wrap items-center gap-2">
                              <LessonRow
                                style={{ flex: 1 }}
                                icon={<Icon name={LESSON_ICONS[lesson.type]} size={13} color="var(--ink-2)" />}
                                title={lesson.title}
                                meta={`${lessonTypeLabels[lesson.type]} · ${lesson.duration}${lesson.isFree ? t('formations.lessonFreeSuffix') : ''}`}
                                onClick={() => f.openEditLesson(module.id, lesson)}
                                last
                              />
                              <IconButton
                                label={t('formations.moveUp')}
                                disabled={lIndex === 0}
                                onClick={() => f.moveLesson(module.id, lIndex, -1)}
                              >
                                <Icon name="chevron" size={14} style={{ transform: 'rotate(180deg)' }} />
                              </IconButton>
                              <IconButton
                                label={t('formations.moveDown')}
                                disabled={lIndex === module.lessons.length - 1}
                                onClick={() => f.moveLesson(module.id, lIndex, 1)}
                              >
                                <Icon name="chevron" size={14} />
                              </IconButton>
                              <IconButton
                                label={t('formations.deleteLesson')}
                                onClick={() => f.deleteLesson(module.id, lesson.id)}
                              >
                                <Icon name="trash" size={14} />
                              </IconButton>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="mt-2">
                        <Button size="sm" tone="quiet" fullWidth onClick={() => f.addLesson(module.id)}>
                          {t('formations.addLesson')}
                        </Button>
                      </div>
                    </div>
                  )}
                </GlassPanel>
              ))
            )}
          </div>
        )}

        {f.activeTab === 'settings' && (
          <div>
            <GlassPanel level="flat" padding={16} className="mt-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="m-0 text-meta font-semibold text-ink">{t('formations.optFeaturedLabel')}</p>
                  <p className="m-0 text-meta-2 text-ink-2">{t('formations.optFeaturedDesc')}</p>
                </div>
                <Switch
                  on={f.form.featured}
                  label={t('formations.optFeaturedLabel')}
                  onChange={(on) => f.set('featured', on)}
                />
              </div>
              <div className="mt-4 flex items-center justify-between gap-4">
                <div>
                  <p className="m-0 text-meta font-semibold text-ink">{t('formations.optCertificateLabel')}</p>
                  <p className="m-0 text-meta-2 text-ink-2">{t('formations.optCertificateDesc')}</p>
                </div>
                <Switch
                  on={f.form.certificateEnabled}
                  label={t('formations.optCertificateLabel')}
                  onChange={(on) => f.set('certificateEnabled', on)}
                />
              </div>
            </GlassPanel>
            <Field
              label={t('formations.fieldSlug')}
              value={f.form.slug}
              onChange={(v) => f.set('slug', slugify(v))}
              placeholder="nom-de-la-formation"
            />
            <Field
              label={t('formations.fieldSlugEn')}
              value={f.form.slug_en}
              onChange={(v) => f.set('slug_en', slugify(v))}
              placeholder="english-slug"
              hint={t('formations.console.slugEnHint')}
            />
            <div className="mt-4">
              <SEOPanel
                title={f.form.title}
                slug={f.form.slug}
                content={f.form.longDescription || f.form.description}
                excerpt={f.form.description}
                coverImage={f.form.coverImage}
                siteUrl="https://maxmorrys.me"
                basePath="formations"
                focusKeyword={f.form.focusKeyword}
                metaTitle={f.form.metaTitle}
                metaDescription={f.form.metaDescription}
                ogTitle={f.form.ogTitle}
                ogDescription={f.form.ogDescription}
                ogImage={f.form.ogImage}
                noIndex={f.form.noIndex}
                canonicalUrl={f.form.canonicalUrl}
                onChange={(field, value) => f.setForm((prev) => ({ ...prev, [field]: value }))}
              />
            </div>
          </div>
        )}

        {/* ── « Publiable » : la liste EST la condition ──────────────────────────────── */}
        {f.activeTab === 'publish' && (
          <div className="mt-4">
            <GlassPanel level="flat" padding={18}>
              <p className="m-0 text-meta font-semibold text-ink">
                {f.form.title || t('formations.console.untitled')}
              </p>
              <p className="m-0 mt-1 text-meta-2 text-ink-2">
                <Num value={f.form.modules.length} source="db" asOf={f.checklist.asOf} unit={t('formations.console.unitModules')} />
                {' · '}
                <Num value={f.totalLessons} source="db" asOf={f.checklist.asOf} unit={t('formations.console.unitLessons')} />
                {' · '}
                <Num value={formatPrice(Number(f.form.promoPrice) || Number(f.form.price) || 0)} source="db" asOf={f.checklist.asOf} />
              </p>
              <div className="mt-3">
                <ProgressBar
                  value={f.checklist.percent}
                  source={{ cite: t('formations.console.checklistSource') }}
                  asOf={f.checklist.asOf}
                  label={t('formations.console.checklistProgressLabel')}
                  readout
                />
              </div>
            </GlassPanel>

            <SiteEyebrow style={{ marginTop: '22px' }}>{t('formations.console.checklistTitle')}</SiteEyebrow>
            <ConsoleList label={t('formations.console.checklistTitle')}>
              {f.checklist.items.map((c, i) => (
                <li key={c.id}>
                  <LessonRow
                    icon={(
                      <Icon
                        name={c.ok ? 'check' : 'alert'}
                        size={13}
                        color={c.ok ? 'var(--ok)' : 'var(--warn)'}
                      />
                    )}
                    iconBackground={`color-mix(in srgb, ${c.ok ? 'var(--ok)' : 'var(--warn)'} 18%, transparent)`}
                    title={conditionLabel(c.id)}
                    meta={conditionMeta(c.id, c.ok, c.counts)}
                    trailing={(
                      <Tag tone={c.ok ? 'ok' : 'warn'}>
                        {c.ok ? t('formations.console.condReady') : t('formations.console.condTodo')}
                      </Tag>
                    )}
                    last={i === f.checklist.items.length - 1}
                  />
                </li>
              ))}
            </ConsoleList>

            <p className="m-0 mt-3 text-small leading-[1.5] text-ink-2">
              {t('formations.console.checklistRule')}
            </p>

            <GlassPanel level="flat" padding={18} className="mt-4">
              <SiteEyebrow>{t('formations.console.triggersTitle')}</SiteEyebrow>
              <DocLine label={t('formations.console.triggerCatalog')} value={t('formations.console.triggerCatalogValue')} />
              <DocLine label={t('formations.console.triggerSitemap')} value={t('formations.console.triggerSitemapValue')} />
              <DocLine label={t('formations.console.triggerMeta')} value={t('formations.console.triggerMetaValue')} />
              <DocLine label={t('formations.console.triggerNotify')} value={t('formations.console.triggerNotifyValue')} />
              <DocLine label={t('formations.console.triggerEmail')} value={t('formations.console.triggerEmailValue')} last />
            </GlassPanel>

            <p className="m-0 mt-3 text-small leading-[1.5] text-ink-2">
              {t('formations.console.checklistNotAGuard')}
            </p>
          </div>
        )}

        <div className="mt-6 border-t border-[color:var(--line)] pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            {f.editingId && (
              <>
                <Button size="sm" tone="ghost" onClick={f.deleteEditing}>
                  {t('formations.deleteAction')}
                </Button>
                {f.form.status === 'published' && f.form.slug && (
                  <Button size="sm" tone="ghost" href={`/formations/${f.form.slug}`} target="_blank">
                    {t('formations.viewAction')}
                  </Button>
                )}
              </>
            )}
            <Button size="sm" tone="quiet" onClick={() => f.setShowModal(false)}>
              {t('formations.cancel')}
            </Button>
            <Button size="sm" tone="quiet" onClick={() => f.handleSave('draft')} disabled={f.saving} loading={f.saving}>
              {t('formations.saveDraft')}
            </Button>
            {/* Le bouton NE S'ACTIVE PAS tant qu'une condition manque. C'est la décision du kit. */}
            <Button
              size="sm"
              onClick={() => f.handleSave('published')}
              disabled={f.saving || !f.checklist.ready}
              loading={f.saving}
            >
              {f.editingId ? t('formations.update') : t('formations.publish')}
            </Button>
          </div>
          {!f.checklist.ready && (
            <p className="m-0 mt-3 text-right text-small leading-[1.5] text-ink-2">
              {t('formations.console.publishBlocked')}
            </p>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={f.confirm.open}
        onClose={f.confirm.closeConfirm}
        onConfirm={f.confirm.onConfirm}
        title={t('formations.confirmDeleteTitle')}
        message={f.confirm.message}
        confirmLabel={t('formations.deleteAction')}
      />

      {/* ── L'éditeur de leçon ────────────────────────────────────────────────────────── */}
      {f.editingLesson && (
        <Modal
          open={Boolean(f.editingLesson)}
          onClose={() => f.setEditingLesson(null)}
          title={t('formations.lessonModalTitle')}
          size="lg"
        >
          <Field
            label={t('formations.lessonTitle')}
            value={f.editingLesson.lesson.title}
            onChange={(v) => f.patchLesson({ title: v })}
            placeholder={t('formations.lessonTitlePlaceholder')}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              as="select"
              label={t('formations.lessonTypeLabel')}
              value={f.editingLesson.lesson.type}
              onChange={(v) => f.patchLesson({ type: v as Lesson['type'] })}
              options={LESSON_TYPE_KEYS.map((v) => ({ value: v, label: lessonTypeLabels[v] }))}
            />
            <Field
              label={t('formations.lessonDuration')}
              value={f.editingLesson.lesson.duration}
              onChange={(v) => f.patchLesson({ duration: v })}
              placeholder={t('formations.lessonDurationPlaceholder')}
            />
          </div>
          <GlassPanel level="flat" padding={16} className="mt-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="m-0 text-meta font-semibold text-ink">{t('formations.lessonFree')}</p>
                <p className="m-0 text-meta-2 text-ink-2">{t('formations.console.lessonFreeNote')}</p>
              </div>
              <Switch
                on={f.editingLesson.lesson.isFree}
                label={t('formations.lessonFree')}
                onChange={(on) => f.patchLesson({ isFree: on })}
              />
            </div>
          </GlassPanel>
          {f.editingLesson.lesson.type === 'video' && (
            <Field
              label={t('formations.lessonVideoUrl')}
              value={f.editingLesson.lesson.videoUrl ?? ''}
              onChange={(v) => f.patchLesson({ videoUrl: v })}
              placeholder={t('formations.lessonVideoUrlPlaceholder')}
            />
          )}
          <div className="mt-4">
            <RichEditor
              label={t('formations.lessonContent')}
              value={f.editingLesson.lesson.content}
              onChange={(v) => f.patchLesson({ content: v })}
              minHeight="250px"
              placeholder={t('formations.lessonContentPlaceholder')}
            />
          </div>
          <div className="mt-6 flex justify-end gap-3 border-t border-[color:var(--line)] pt-6">
            <Button size="sm" tone="quiet" onClick={() => f.setEditingLesson(null)}>
              {t('formations.cancel')}
            </Button>
            <Button size="sm" onClick={f.saveLesson}>{t('formations.saveLesson')}</Button>
          </div>
        </Modal>
      )}
    </ConsolePage>
  );
}
