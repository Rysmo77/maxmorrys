import { useTranslation } from 'react-i18next';
import { Button, Field, GlassPanel, Icon, LessonRow, Num, Skeleton, Tag } from '@ds';
import { ConsolePage, ConsoleFilter, ConsoleList, ConsoleScope } from '../../components/console';
import Modal from '../../components/ui/Modal';
import ImageInput from '../../components/ui/ImageInput';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Pagination from '../../components/ui/Pagination';
import { slugify } from '../../lib/utils';
import { useFormat } from '../../hooks/useFormat';
import { usePodcasts, isImported, type PodcastStage } from './podcasts/usePodcasts';
import type { Podcast } from '../../types';

/**
 * ─── PODCASTS · pipeline « tout · publiés · importés » ───────────────────────────────────
 *
 * La troisième étape N'EST PAS un statut. Un épisode rapatrié de Spotify porte
 * `spotifyEpisodeId` et naît en brouillon : « importés » est la file de relecture, la seule
 * chose qui attend vraiment sur cet écran. C'est le sens du motif — « un opérateur unique
 * cherche ce qui attend ».
 *
 * CE QUI A DISPARU
 *   • Le tableau à cinq colonnes et ses trois cibles par ligne.
 *   • La pastille de statut qui écrivait en base au premier clic, sans confirmation. Le statut
 *     se change dans l'éditeur, sur un champ qui porte son nom.
 *   • Le modal réécrit à la main (recul, en-tête collant, croix en caractère « ✕ ») : remplacé
 *     par `Modal`, qui piège le focus, ferme à Échap et rend le bouton de fermeture nommé.
 *   • Les deux ronds qui tournent : `Skeleton` pour la liste, un liseré de bouton pour les
 *     deux appels distants.
 * ─────────────────────────────────────────────────────────────────────────────────────────
 */
export default function AdminPodcasts() {
  const { t } = useTranslation('admin');
  const { formatDate } = useFormat();
  const p = usePodcasts();

  const stageKeys: PodcastStage[] = ['all', 'published', 'imported'];
  const stageLabels: Record<PodcastStage, string> = {
    all: `${t('podcasts.console.stageAll')} ${p.counts.all}`,
    published: `${t('podcasts.console.stagePublished')} ${p.counts.published}`,
    imported: `${t('podcasts.console.stageImported')} ${p.counts.imported}`,
  };

  const rowState = (ep: Podcast) => (ep.status === 'published'
    ? { tone: 'ok' as const, label: t('podcasts.statusPublished'), ink: 'var(--ok)' }
    : isImported(ep)
      ? { tone: 'stop' as const, label: t('podcasts.console.tagToReview'), ink: 'var(--stop)' }
      : { tone: 'warn' as const, label: t('podcasts.statusDraft'), ink: 'var(--warn)' });

  return (
    <ConsolePage title={t('podcasts.title')} sub={t('podcasts.console.sub')}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-meta-2 text-ink-2">
          <Num
            value={p.loading ? null : p.counts.all}
            source="db"
            asOf={p.loadedAt ?? new Date()}
            unit={t('podcasts.console.countUnit')}
            showAsOf={!p.loading}
            fallback={t('podcasts.console.loadingCount')}
          />
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" tone="quiet" onClick={p.handleImport} disabled={p.importing} loading={p.importing}>
            {p.importing ? t('podcasts.importing') : t('podcasts.importFromSpotify')}
          </Button>
          <Button size="sm" tone="quiet" onClick={p.handleSync} disabled={p.syncing} loading={p.syncing}>
            {p.syncing ? t('podcasts.syncing') : t('podcasts.syncPopularity')}
          </Button>
          <Button size="sm" onClick={p.openNew}>{t('podcasts.newPodcast')}</Button>
        </div>
      </div>

      {/* ── ZONE 1 · le filtre par statut ─────────────────────────────────────────────── */}
      <ConsoleFilter
        stages={stageKeys.map((k) => stageLabels[k])}
        active={stageLabels[p.stage]}
        onSelect={(label) => {
          const key = stageKeys.find((k) => stageLabels[k] === label);
          if (key) p.setStage(key);
        }}
        label={t('podcasts.console.filterLabel')}
      />

      <Field
        type="search"
        label={t('podcasts.console.searchLabel')}
        hideLabel
        placeholder={t('podcasts.searchPlaceholder')}
        value={p.search}
        onChange={p.setSearch}
      />

      {/* ── ZONE 2 · la liste dense, UNE action par ligne : ouvrir la fiche ────────────── */}
      <div className="mt-4">
        {p.loading ? (
          <ConsoleList label={t('podcasts.console.listLabel')}>
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="border-b border-[color:var(--border-hair)] py-4 last:border-0">
                <Skeleton height={18} label={i === 0 ? t('podcasts.console.loadingCount') : undefined} />
              </li>
            ))}
          </ConsoleList>
        ) : p.filtered.length === 0 ? (
          <GlassPanel level="night" padding={24}>
            <p className="m-0 text-center text-meta-2 text-ink-2">{t('podcasts.emptyState')}</p>
          </GlassPanel>
        ) : (
          <>
            <ConsoleList label={t('podcasts.console.listLabel')}>
              {p.paged.map((ep, i) => {
                const st = rowState(ep);
                return (
                  <li key={ep.id}>
                    <LessonRow
                      icon={<Icon name="play" size={13} color={st.ink} />}
                      iconBackground={`color-mix(in srgb, ${st.ink} 18%, transparent)`}
                      title={ep.title}
                      duration={ep.duration
                        ? { value: ep.duration, source: 'db', asOf: p.loadedAt ?? new Date() }
                        : undefined}
                      meta={[
                        ep.category,
                        ep.publishedAt ? formatDate(ep.publishedAt) : null,
                        isImported(ep) ? t('podcasts.console.fromSpotify') : null,
                      ].filter(Boolean).join(' · ')}
                      trailing={<Tag tone={st.tone}>{st.label}</Tag>}
                      onClick={() => p.openEdit(ep)}
                      last={i === p.paged.length - 1}
                    />
                  </li>
                );
              })}
            </ConsoleList>
            <div className="mt-4 flex justify-center">
              <Pagination currentPage={p.page} totalPages={p.totalPages} onPageChange={p.setPage} />
            </div>
          </>
        )}
      </div>

      {/* ── ZONE 3 · ce que l'écran ne couvre pas ─────────────────────────────────────── */}
      <ConsoleScope>{t('podcasts.console.scope')}</ConsoleScope>

      {/* ── L'éditeur ─────────────────────────────────────────────────────────────────── */}
      <Modal
        open={p.modalOpen}
        onClose={() => p.setModalOpen(false)}
        title={p.editing ? t('podcasts.modalEditTitle') : t('podcasts.modalNewTitle')}
        size="lg"
      >
        <Field
          label={t('podcasts.fieldTitle')}
          value={p.form.title}
          onChange={(v) => { p.setField('title', v); if (!p.form.slug) p.setField('slug', slugify(v)); }}
          placeholder={t('podcasts.fieldTitlePlaceholder')}
        />
        <Field
          label={t('podcasts.fieldSlug')}
          value={p.form.slug}
          onChange={(v) => p.setField('slug', v)}
          placeholder={t('podcasts.fieldSlugPlaceholder')}
        />
        <Field
          label={t('podcasts.fieldSlugEn')}
          value={p.form.slug_en ?? ''}
          onChange={(v) => p.setField('slug_en', slugify(v))}
          placeholder="english-slug"
          hint={t('podcasts.console.slugEnHint')}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t('podcasts.fieldCategory')}
            value={p.form.category}
            onChange={(v) => p.setField('category', v)}
            placeholder={t('podcasts.fieldCategoryPlaceholder')}
          />
          <Field
            label={t('podcasts.fieldDuration')}
            value={p.form.duration}
            onChange={(v) => p.setField('duration', v)}
            placeholder={t('podcasts.fieldDurationPlaceholder')}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t('podcasts.fieldPublishedAt')}
            type="date"
            value={p.form.publishedAt}
            onChange={(v) => p.setField('publishedAt', v)}
          />
          <Field
            as="select"
            label={t('podcasts.fieldStatus')}
            value={p.form.status}
            onChange={(v) => p.setField('status', v as Podcast['status'])}
            options={[
              { value: 'draft', label: t('podcasts.statusDraft') },
              { value: 'published', label: t('podcasts.statusPublished') },
            ]}
          />
        </div>
        <Field
          label={t('podcasts.fieldAudioUrl')}
          value={p.form.audioUrl}
          onChange={(v) => p.setField('audioUrl', v)}
          placeholder="https://open.spotify.com/episode/..."
          hint={p.fetchingMeta ? t('podcasts.console.fetchingMeta') : undefined}
        />
        <div className="mt-4">
          <ImageInput
            label={t('podcasts.fieldCoverImage')}
            value={p.form.coverImage}
            onChange={(url) => p.setField('coverImage', url)}
            folder="podcasts"
          />
        </div>
        <Field
          as="textarea"
          rows={4}
          label={t('podcasts.fieldDescription')}
          value={p.form.description}
          onChange={(v) => p.setField('description', v)}
          placeholder={t('podcasts.fieldDescriptionPlaceholder')}
        />
        <Field
          as="textarea"
          rows={5}
          label={t('podcasts.fieldTranscript')}
          value={p.form.transcript ?? ''}
          onChange={(v) => p.setField('transcript', v)}
          placeholder={t('podcasts.fieldTranscriptPlaceholder')}
        />

        <div className="mt-6 flex flex-col gap-3 border-t border-[color:var(--line)] pt-6 sm:flex-row sm:justify-end">
          {p.editing && (
            <Button size="sm" tone="ghost" onClick={p.deleteEditing}>
              {t('podcasts.confirmDeleteLabel')}
            </Button>
          )}
          <Button size="sm" tone="quiet" onClick={() => p.setModalOpen(false)}>
            {t('podcasts.cancel')}
          </Button>
          <Button
            size="sm"
            onClick={p.handleSave}
            disabled={p.saving || !p.form.title.trim()}
            loading={p.saving}
          >
            {p.saving ? t('podcasts.saving') : t('podcasts.save')}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={p.confirm.open}
        onClose={p.confirm.closeConfirm}
        onConfirm={p.confirm.onConfirm}
        title={t('podcasts.confirmDeleteTitle')}
        message={p.confirm.message}
        confirmLabel={t('podcasts.confirmDeleteLabel')}
      />
    </ConsolePage>
  );
}
