import { useTranslation } from 'react-i18next';
import { Button, Field, GlassPanel, Icon, LessonRow, Num, Skeleton, Tag } from '@ds';
import { ConsolePage, ConsoleFilter, ConsoleList, ConsoleScope } from '../../components/console';
import Modal from '../../components/ui/Modal';
import ImageInput from '../../components/ui/ImageInput';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Pagination from '../../components/ui/Pagination';
import { slugify } from '../../lib/utils';
import { useFormat } from '../../hooks/useFormat';
import { useVideos, type VideoStage } from './videos/useVideos';
import type { Video } from '../../types';

/**
 * ─── VIDÉOS · pipeline « tout · publiées · brouillons » ─────────────────────────────────
 *
 * LE NOMBRE DE VUES A GARDÉ SA PLACE, MAIS PLUS SA FAUSSE ÉVIDENCE. Il était rendu en
 * `toLocaleString()` dans une colonne de tableau : un nombre nu, sans provenance ni date.
 * Il vient en réalité de l'API YouTube, recopié dans Firestore par `syncMediaStatsManual` —
 * donc lu en base, mais vrai ailleurs, et daté du dernier passage de la synchronisation.
 * Il passe désormais par `<Num>` avec cette source citée : c'est la même valeur, elle dit
 * seulement d'où elle vient.
 *
 * CE QUI A DISPARU : le tableau à six colonnes, la pastille de statut qui écrivait en base au
 * premier clic, le modal réécrit à la main, les deux ronds qui tournent.
 * ─────────────────────────────────────────────────────────────────────────────────────────
 */
export default function AdminVideos() {
  const { t } = useTranslation('admin');
  const { formatDate } = useFormat();
  const v = useVideos();

  const viewsSource = { cite: t('videos.console.viewsSource') };

  const stageKeys: VideoStage[] = ['all', 'published', 'draft'];
  const stageLabels: Record<VideoStage, string> = {
    all: `${t('videos.console.stageAll')} ${v.counts.all}`,
    published: `${t('videos.console.stagePublished')} ${v.counts.published}`,
    draft: `${t('videos.console.stageDrafts')} ${v.counts.draft}`,
  };

  const rowState = (item: Video) => (item.status === 'published'
    ? { tone: 'ok' as const, label: t('videos.statusPublished'), ink: 'var(--ok)' }
    : { tone: 'warn' as const, label: t('videos.statusDraft'), ink: 'var(--warn)' });

  return (
    <ConsolePage title={t('videos.title')} sub={t('videos.console.sub')}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-meta-2 text-ink-2">
          <Num
            value={v.loading ? null : v.counts.all}
            source="db"
            asOf={v.loadedAt ?? new Date()}
            unit={t('videos.console.countUnit')}
            showAsOf={!v.loading}
            fallback={t('videos.console.loadingCount')}
          />
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" tone="quiet" onClick={v.handleSync} disabled={v.syncing} loading={v.syncing}>
            {v.syncing ? t('videos.syncing') : t('videos.syncViews')}
          </Button>
          <Button size="sm" onClick={v.openNew}>{t('videos.newVideo')}</Button>
        </div>
      </div>

      {/* ── ZONE 1 · le filtre par statut ─────────────────────────────────────────────── */}
      <ConsoleFilter
        stages={stageKeys.map((k) => stageLabels[k])}
        active={stageLabels[v.stage]}
        onSelect={(label) => {
          const key = stageKeys.find((k) => stageLabels[k] === label);
          if (key) v.setStage(key);
        }}
        label={t('videos.console.filterLabel')}
      />

      <Field
        type="search"
        label={t('videos.console.searchLabel')}
        hideLabel
        placeholder={t('videos.searchPlaceholder')}
        value={v.search}
        onChange={v.setSearch}
      />

      {/* ── ZONE 2 · la liste dense, UNE action par ligne : ouvrir la fiche ────────────── */}
      <div className="mt-4">
        {v.loading ? (
          <ConsoleList label={t('videos.console.listLabel')}>
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="border-b border-[color:var(--border-hair)] py-4 last:border-0">
                <Skeleton height={18} label={i === 0 ? t('videos.console.loadingCount') : undefined} />
              </li>
            ))}
          </ConsoleList>
        ) : v.filtered.length === 0 ? (
          <GlassPanel level="night" padding={24}>
            <p className="m-0 text-center text-meta-2 text-ink-2">{t('videos.empty')}</p>
          </GlassPanel>
        ) : (
          <>
            <ConsoleList label={t('videos.console.listLabel')}>
              {v.paged.map((item, i) => {
                const st = rowState(item);
                return (
                  <li key={item.id}>
                    <LessonRow
                      icon={<Icon name="video" size={13} color={st.ink} />}
                      iconBackground={`color-mix(in srgb, ${st.ink} 18%, transparent)`}
                      title={item.title}
                      duration={item.duration
                        ? { value: item.duration, source: 'db', asOf: v.loadedAt ?? new Date() }
                        : undefined}
                      meta={(
                        <>
                          {[item.category, item.publishedAt ? formatDate(item.publishedAt) : null]
                            .filter(Boolean).join(' · ')}
                          {' · '}
                          <Num
                            value={item.views}
                            source={viewsSource}
                            asOf={v.loadedAt ?? new Date()}
                            unit={t('videos.console.viewsUnit')}
                          />
                        </>
                      )}
                      trailing={<Tag tone={st.tone}>{st.label}</Tag>}
                      onClick={() => v.openEdit(item)}
                      last={i === v.paged.length - 1}
                    />
                  </li>
                );
              })}
            </ConsoleList>
            <div className="mt-4 flex justify-center">
              <Pagination currentPage={v.page} totalPages={v.totalPages} onPageChange={v.setPage} />
            </div>
          </>
        )}
      </div>

      {/* ── ZONE 3 · ce que l'écran ne couvre pas ─────────────────────────────────────── */}
      <ConsoleScope>{t('videos.console.scope')}</ConsoleScope>

      {/* ── L'éditeur ─────────────────────────────────────────────────────────────────── */}
      <Modal
        open={v.modalOpen}
        onClose={() => v.setModalOpen(false)}
        title={v.editing ? t('videos.modalEditTitle') : t('videos.modalNewTitle')}
        size="lg"
      >
        <Field
          label={t('videos.fieldTitle')}
          value={v.form.title}
          onChange={(val) => { v.setField('title', val); if (!v.form.slug) v.setField('slug', slugify(val)); }}
          placeholder={t('videos.fieldTitlePlaceholder')}
        />
        <Field
          label={t('videos.fieldSlug')}
          value={v.form.slug}
          onChange={(val) => v.setField('slug', val)}
          placeholder="slug-de-la-video"
        />
        <Field
          label={t('videos.fieldSlugEn')}
          value={v.form.slug_en ?? ''}
          onChange={(val) => v.setField('slug_en', slugify(val))}
          placeholder="english-slug"
          hint={t('videos.console.slugEnHint')}
        />
        <div className="grid gap-4 stack:grid-cols-2">
          <Field
            label={t('videos.fieldCategory')}
            value={v.form.category}
            onChange={(val) => v.setField('category', val)}
            placeholder={t('videos.fieldCategoryPlaceholder')}
          />
          <Field
            label={t('videos.fieldDuration')}
            value={v.form.duration}
            onChange={(val) => v.setField('duration', val)}
            placeholder={t('videos.fieldDurationPlaceholder')}
          />
        </div>
        <div className="grid gap-4 stack:grid-cols-2">
          <Field
            label={t('videos.fieldPublishedAt')}
            type="date"
            value={v.form.publishedAt}
            onChange={(val) => v.setField('publishedAt', val)}
          />
          <Field
            as="select"
            label={t('videos.fieldStatus')}
            value={v.form.status}
            onChange={(val) => v.setField('status', val as Video['status'])}
            options={[
              { value: 'draft', label: t('videos.statusDraft') },
              { value: 'published', label: t('videos.statusPublished') },
            ]}
          />
        </div>
        <Field
          label={t('videos.fieldVideoUrl')}
          value={v.form.videoUrl}
          onChange={(val) => v.setField('videoUrl', val)}
          placeholder="https://www.youtube.com/watch?v=... ou youtu.be/..."
          hint={v.fetchingMeta ? t('videos.console.fetchingMeta') : undefined}
        />
        <div className="mt-4">
          <ImageInput
            label={t('videos.fieldThumbnail')}
            value={v.form.thumbnailUrl}
            onChange={(url) => v.setField('thumbnailUrl', url)}
            folder="videos"
          />
        </div>
        <Field
          as="textarea"
          rows={4}
          label={t('videos.fieldDescription')}
          value={v.form.description}
          onChange={(val) => v.setField('description', val)}
          placeholder={t('videos.fieldDescriptionPlaceholder')}
        />

        {v.editing && (
          <GlassPanel level="flat" padding={16} className="mt-4">
            <p className="m-0 text-meta-2 text-ink-2">
              {t('videos.colViews')}{' · '}
              <Num
                value={v.form.views}
                source={viewsSource}
                asOf={v.loadedAt ?? new Date()}
                unit={t('videos.console.viewsUnit')}
                showAsOf
              />
            </p>
            <p className="m-0 mt-1 text-small text-ink-2">{t('videos.console.viewsNote')}</p>
          </GlassPanel>
        )}

        <div className="mt-6 flex flex-col gap-3 border-t border-[color:var(--line)] pt-6 stack:flex-row stack:justify-end">
          {v.editing && (
            <Button size="sm" tone="ghost" onClick={v.deleteEditing}>
              {t('videos.confirmDeleteLabel')}
            </Button>
          )}
          <Button size="sm" tone="quiet" onClick={() => v.setModalOpen(false)}>
            {t('videos.cancel')}
          </Button>
          <Button
            size="sm"
            onClick={v.handleSave}
            disabled={v.saving || !v.form.title.trim()}
            loading={v.saving}
          >
            {v.saving ? t('videos.saving') : t('videos.save')}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={v.confirm.open}
        onClose={v.confirm.closeConfirm}
        onConfirm={v.confirm.onConfirm}
        title={t('videos.confirmDeleteTitle')}
        message={v.confirm.message}
        confirmLabel={t('videos.confirmDeleteLabel')}
      />
    </ConsolePage>
  );
}
