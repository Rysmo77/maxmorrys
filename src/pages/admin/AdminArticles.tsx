import { useTranslation } from 'react-i18next';
import {
  Button, Field, GlassPanel, Icon, LessonRow, Num, Segmented, Skeleton, Switch, Tag,
} from '@ds';
import { ConsolePage, ConsoleFilter, ConsoleList, ConsoleScope } from '../../components/console';
import { Modal } from '@/components/dialogs';
import ImageInput from '@/components/forms/ImageInput';
import RichEditor from '@/components/forms/RichEditor';
import { ConfirmDialog } from '@/components/dialogs';
import { Pagination } from '@/components/dialogs';
import SEOPanel from '../../components/shared/SEOPanel';
import { slugify } from '../../lib/utils';
import { BLOG_POLES } from '../../lib/blogCategories';
import { useFormat } from '../../hooks/useFormat';
import { useArticles, type ArticleStage } from './articles/useArticles';
import type { BlogPost } from '../../types';

/**
 * ─── CONTENU · l'écran que le kit dessine EN ENTIER, sous le nom `ContenuOps` ────────────
 *
 * Trois zones, dans l'ordre du motif : le filtre par STATUT (jamais par date), la liste dense
 * à UNE action par ligne, le pied qui nomme ce que l'écran ne couvre pas.
 *
 * CE QUI A DISPARU, ET POURQUOI
 *
 *   • LE TABLEAU À CINQ COLONNES. Il portait quatre cibles par ligne — pastille de statut
 *     cliquable, modifier, voir, supprimer. « Deux actions par ligne, c'est une hésitation
 *     par ligne » : il y en avait quatre.
 *   • LA PASTILLE DE STATUT CLIQUABLE. Elle ressemblait à une étiquette et ÉCRIVAIT EN BASE
 *     au premier clic, sans confirmation ni annulation. Publier et dépublier restent
 *     possibles — depuis l'éditeur, où les deux boutons portent leur nom. Le geste n'est pas
 *     retiré, il cesse d'être accidentel.
 *   • `Card`, `Badge`, `Input`, le rond qui tourne : remplacés par `GlassPanel`, `Tag`,
 *     `Field`, `Skeleton`. Un doublon de primitive est une seconde source de vérité.
 *
 * L'ÉTIQUETTE « SLUG EN MANQUANT » — CE QU'ELLE DIT VRAIMENT. Le kit affiche « EN manquant »
 * pour un article publié en français seul. Le produit ne sait pas si une page a été rendue
 * sous /en : la traduction est produite au pré-rendu et mise en cache côté serveur. Ce que la
 * console PEUT lire, c'est `slug_en`. Sans lui, `contentPath()` retombe sur le slug français
 * et l'URL anglaise porte un slug français. L'étiquette dit donc ce qui est vérifiable, pas
 * ce que le dessin promettait.
 * ─────────────────────────────────────────────────────────────────────────────────────────
 */
export default function AdminArticles() {
  const { t } = useTranslation('admin');
  const { formatDate } = useFormat();
  const a = useArticles();

  const stageKeys: ArticleStage[] = ['all', 'published', 'draft'];
  const stageLabels: Record<ArticleStage, string> = {
    all: `${t('articles.console.stageAll')} ${a.counts.all}`,
    published: `${t('articles.console.stagePublished')} ${a.counts.published}`,
    draft: `${t('articles.console.stageDrafts')} ${a.counts.draft}`,
  };

  /** L'état de la ligne : publié, publié sans slug anglais, brouillon. Jamais une action. */
  const rowState = (post: BlogPost) => {
    if (post.status !== 'published') {
      return { tone: 'warn' as const, label: t('articles.statusDraft'), ink: 'var(--warn)' };
    }
    if (!post.slug_en) {
      return { tone: 'stop' as const, label: t('articles.console.tagEnMissing'), ink: 'var(--stop)' };
    }
    return { tone: 'ok' as const, label: t('articles.statusPublished'), ink: 'var(--ok)' };
  };

  const tabs = [t('articles.tabContent'), t('articles.tabSeo')];
  const activeTabLabel = a.activeTab === 'content' ? tabs[0] : tabs[1];

  return (
    <ConsolePage title={t('articles.title')} sub={t('articles.console.sub')}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-meta-2 text-ink-2">
          <Num
            value={a.loading ? null : a.counts.all}
            source="db"
            asOf={a.loadedAt ?? new Date()}
            unit={t('articles.console.countUnit')}
            showAsOf={!a.loading}
            fallback={t('articles.console.loadingCount')}
          />
        </p>
        <Button size="sm" onClick={a.openNew}>{t('articles.newArticle')}</Button>
      </div>

      {/* ── ZONE 1 · le filtre par statut ─────────────────────────────────────────────── */}
      <ConsoleFilter
        stages={stageKeys.map((k) => stageLabels[k])}
        active={stageLabels[a.stage]}
        onSelect={(label) => {
          const key = stageKeys.find((k) => stageLabels[k] === label);
          if (key) a.setStage(key);
        }}
        label={t('articles.console.filterLabel')}
      />

      <Field
        type="search"
        label={t('articles.console.searchLabel')}
        hideLabel
        placeholder={t('articles.searchPlaceholder')}
        value={a.search}
        onChange={a.setSearch}
      />

      {/* ── ZONE 2 · la liste dense, UNE action par ligne : ouvrir la fiche ────────────── */}
      <div className="mt-4">
        {a.loading ? (
          <ConsoleList label={t('articles.console.listLabel')}>
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="border-b border-[color:var(--border-hair)] py-4 last:border-0">
                <Skeleton height={18} label={i === 0 ? t('articles.loading') : undefined} />
              </li>
            ))}
          </ConsoleList>
        ) : a.filtered.length === 0 ? (
          <GlassPanel level="night" padding={24}>
            <p className="m-0 text-center text-meta-2 text-ink-2">{t('articles.emptyState')}</p>
          </GlassPanel>
        ) : (
          <>
            <ConsoleList label={t('articles.console.listLabel')}>
              {a.paged.map((post, i) => {
                const st = rowState(post);
                return (
                  <li key={post.id}>
                    <LessonRow
                      icon={<Icon name="doc" size={14} color={st.ink} />}
                      iconBackground={`color-mix(in srgb, ${st.ink} 18%, transparent)`}
                      title={post.title}
                      duration={post.readTime
                        ? {
                          value: t('articles.readTime', { count: post.readTime }),
                          source: 'db',
                          asOf: a.loadedAt ?? new Date(),
                        }
                        : undefined}
                      meta={[
                        post.category,
                        post.publishedAt ? formatDate(post.publishedAt) : null,
                        post.featured ? t('articles.console.featuredShort') : null,
                      ].filter(Boolean).join(' · ')}
                      trailing={<Tag tone={st.tone}>{st.label}</Tag>}
                      onClick={() => a.openEdit(post)}
                      last={i === a.paged.length - 1}
                    />
                  </li>
                );
              })}
            </ConsoleList>
            <div className="mt-4 flex justify-center">
              <Pagination currentPage={a.page} totalPages={a.totalPages} onPageChange={a.setPage} />
            </div>
          </>
        )}
      </div>

      {/* ── ZONE 3 · ce que l'écran ne couvre pas ─────────────────────────────────────── */}
      <ConsoleScope>{t('articles.console.scope')}</ConsoleScope>

      {/* ── L'éditeur ─────────────────────────────────────────────────────────────────── */}
      <Modal
        open={a.showModal}
        onClose={() => a.setShowModal(false)}
        title={a.editingId ? t('articles.modalEditTitle') : t('articles.modalNewTitle')}
        size="xl"
      >
        <Segmented
          options={tabs}
          value={activeTabLabel}
          onChange={(label) => a.setActiveTab(label === tabs[1] ? 'seo' : 'content')}
          label={t('articles.console.tabsLabel')}
        />

        {a.activeTab === 'content' && (
          <div>
            <Field
              label={t('articles.fieldTitleLabel')}
              value={a.form.title}
              onChange={(v) => {
                a.set('title', v);
                if (!a.editingId) a.set('slug', slugify(v));
              }}
              placeholder={t('articles.fieldTitlePlaceholder')}
            />
            <Field
              label={t('articles.fieldExcerptLabel')}
              value={a.form.excerpt}
              onChange={(v) => a.set('excerpt', v)}
              placeholder={t('articles.fieldExcerptPlaceholder')}
            />
            <div className="mt-4">
              <RichEditor
                label={t('articles.fieldContentLabel')}
                value={a.form.content}
                onChange={(v) => a.set('content', v)}
                minHeight="400px"
                placeholder={t('articles.fieldContentPlaceholder')}
              />
            </div>
            <div className="grid gap-4 stack:grid-cols-2">
              <Field
                as="select"
                label={t('articles.fieldCategoryLabel')}
                value={a.form.category}
                onChange={(v) => a.set('category', v)}
                options={BLOG_POLES.map((pole) => ({ value: pole, label: pole }))}
              />
              <Field
                label={t('articles.fieldTagsLabel')}
                value={a.form.tags}
                onChange={(v) => a.set('tags', v)}
                placeholder="SEO, Growth, Digital"
              />
            </div>
            <Field
              label={t('articles.fieldPublishDateLabel')}
              type="date"
              value={a.form.publishedAt}
              onChange={(v) => a.set('publishedAt', v)}
            />
            <div className="mt-4">
              <ImageInput
                label={t('articles.fieldCoverImageLabel')}
                value={a.form.coverImage}
                onChange={(url) => a.set('coverImage', url)}
                folder="articles"
              />
            </div>
          </div>
        )}

        {a.activeTab === 'seo' && (
          <div>
            <GlassPanel level="flat" padding={16} className="mt-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="m-0 text-meta font-semibold text-ink">{t('articles.featuredTitle')}</p>
                  <p className="m-0 text-meta-2 text-ink-2">{t('articles.featuredDescription')}</p>
                </div>
                <Switch
                  on={a.form.featured}
                  label={t('articles.featuredTitle')}
                  onChange={(on) => a.set('featured', on)}
                />
              </div>
            </GlassPanel>
            <Field
              label={t('articles.fieldSlugLabel')}
              value={a.form.slug}
              onChange={(v) => a.set('slug', slugify(v))}
              placeholder="mon-super-article"
            />
            <Field
              label={t('articles.fieldSlugEnLabel')}
              value={a.form.slug_en}
              onChange={(v) => a.set('slug_en', slugify(v))}
              placeholder="english-slug"
              hint={t('articles.console.slugEnHint')}
            />
            <div className="mt-4">
              <SEOPanel
                title={a.form.title}
                slug={a.form.slug}
                content={a.form.content}
                excerpt={a.form.excerpt}
                coverImage={a.form.coverImage}
                siteUrl="https://maxmorrys.me"
                basePath="blog"
                focusKeyword={a.form.focusKeyword}
                metaTitle={a.form.metaTitle}
                metaDescription={a.form.metaDescription}
                ogTitle={a.form.ogTitle}
                ogDescription={a.form.ogDescription}
                ogImage={a.form.ogImage}
                twitterTitle={a.form.twitterTitle}
                twitterDescription={a.form.twitterDescription}
                twitterImage={a.form.twitterImage}
                noIndex={a.form.noIndex}
                canonicalUrl={a.form.canonicalUrl}
                onChange={(field, value) => a.setForm((prev) => ({ ...prev, [field]: value }))}
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 border-t border-[color:var(--line)] pt-6 stack:flex-row stack:justify-end">
          {a.editingId && (
            <>
              <Button size="sm" tone="ghost" onClick={a.deleteEditing}>
                {t('articles.actionDelete')}
              </Button>
              {a.form.status === 'published' && a.form.slug && (
                <Button size="sm" tone="ghost" href={`/blog/${a.form.slug}`} target="_blank">
                  {t('articles.actionView')}
                </Button>
              )}
            </>
          )}
          <Button size="sm" tone="quiet" onClick={() => a.setShowModal(false)}>
            {t('articles.cancel')}
          </Button>
          <Button size="sm" tone="quiet" onClick={() => a.handleSave('draft')} disabled={a.saving} loading={a.saving}>
            {t('articles.saveDraft')}
          </Button>
          <Button size="sm" onClick={() => a.handleSave('published')} disabled={a.saving} loading={a.saving}>
            {a.editingId ? t('articles.update') : t('articles.publish')}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={a.confirm.open}
        onClose={a.confirm.closeConfirm}
        onConfirm={a.confirm.onConfirm}
        title={t('articles.confirmDeleteTitle')}
        message={a.confirm.message}
        confirmLabel={t('articles.confirmDeleteLabel')}
      />
    </ConsolePage>
  );
}
