import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Edit2, Trash2, ExternalLink, Loader2, Star, StarOff } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import ImageInput from '../../components/ui/ImageInput';
import RichEditor from '../../components/ui/RichEditor';
import { useToast } from '../../components/ui/Toast';
import { getAllPosts, savePost, deletePost } from '../../lib/firestore';
import { slugify, calculateReadTime } from '../../lib/utils';
import { generateSlugEn } from '../../lib/slugEn';
import { useFormat } from '../../hooks/useFormat';
import { BLOG_POLES, categoryToPole } from '../../lib/blogCategories';
import type { BlogPost } from '../../types';
import SEOPanel from '../../components/shared/SEOPanel';
import { captureError } from '../../lib/sentry';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import Pagination from '../../components/ui/Pagination';
import { usePagination } from '../../hooks/usePagination';

type FormState = {
  title: string;
  slug: string;
  slug_en: string;
  excerpt: string;
  content: string;
  category: string;
  coverImage: string;
  tags: string;
  publishedAt: string;
  status: 'draft' | 'published';
  featured: boolean;
  // SEO
  focusKeyword: string;
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  noIndex: boolean;
  canonicalUrl: string;
};

const todayIso = () => new Date().toISOString().split('T')[0];

const makeEmptyForm = (): FormState => ({
  title: '', slug: '', slug_en: '', excerpt: '', content: '', category: BLOG_POLES[0],
  coverImage: '', tags: '', publishedAt: todayIso(), status: 'draft', featured: false,
  focusKeyword: '', metaTitle: '', metaDescription: '', ogTitle: '',
  ogDescription: '', ogImage: '', twitterTitle: '', twitterDescription: '',
  twitterImage: '', noIndex: false, canonicalUrl: '',
});

export default function AdminArticles() {
  const { t } = useTranslation('admin');
  const { formatDate } = useFormat();
  const { addToast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(makeEmptyForm);
  const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content');
  const confirm = useConfirmDialog();

  const load = () => {
    setLoading(true);
    getAllPosts().then((data) => {
      setPosts(data);
      setLoading(false);
    }).catch(() => {
      addToast('error', t('articles.toastLoadError'));
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const openNew = () => {
    setEditingId(null);
    setForm(makeEmptyForm());
    setActiveTab('content');
    setShowModal(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditingId(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      slug_en: post.slug_en ?? '',
      excerpt: post.excerpt,
      content: post.content,
      category: categoryToPole(post.category),
      coverImage: post.coverImage,
      tags: post.tags?.join(', ') ?? '',
      publishedAt: post.publishedAt ? post.publishedAt.split('T')[0] : todayIso(),
      status: post.status === 'published' ? 'published' : 'draft',
      featured: post.featured ?? false,
      focusKeyword: post.focusKeyword ?? '',
      metaTitle: post.metaTitle ?? '',
      metaDescription: post.metaDescription ?? post.excerpt,
      ogTitle: post.ogTitle ?? '',
      ogDescription: post.ogDescription ?? '',
      ogImage: post.ogImage ?? post.coverImage,
      twitterTitle: post.twitterTitle ?? '',
      twitterDescription: post.twitterDescription ?? '',
      twitterImage: post.twitterImage ?? '',
      noIndex: post.noIndex ?? false,
      canonicalUrl: post.canonicalUrl ?? '',
    });
    setActiveTab('content');
    setShowModal(true);
  };

  const handleSave = async (status: 'draft' | 'published') => {
    if (!form.title.trim() || !form.excerpt.trim()) {
      addToast('error', t('articles.toastTitleExcerptRequired'));
      return;
    }
    setSaving(true);
    try {
      const slug = form.slug || slugify(form.title);
      const slug_en = form.slug_en || await generateSlugEn(form.title);
      const postData = {
        title: form.title.trim(),
        slug,
        slug_en,
        excerpt: form.excerpt.trim(),
        content: form.content,
        category: form.category.trim(),
        coverImage: form.coverImage.trim(),
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        author: 'Max-Morrys',
        publishedAt: form.publishedAt || todayIso(),
        readTime: calculateReadTime(form.content),
        featured: form.featured,
        status,
        focusKeyword: form.focusKeyword.trim(),
        metaTitle: form.metaTitle.trim(),
        metaDescription: form.metaDescription.trim() || form.excerpt.trim(),
        ogTitle: form.ogTitle.trim(),
        ogDescription: form.ogDescription.trim(),
        ogImage: form.ogImage.trim() || form.coverImage.trim(),
        twitterTitle: form.twitterTitle.trim(),
        twitterDescription: form.twitterDescription.trim(),
        twitterImage: form.twitterImage.trim(),
        noIndex: form.noIndex,
        canonicalUrl: form.canonicalUrl.trim(),
      } as Omit<BlogPost, 'id'>;
      await savePost(postData, editingId ?? undefined);
      addToast('success', editingId ? t('articles.toastUpdated') : t('articles.toastCreated'));
      setShowModal(false);
      load();
    } catch (error: unknown) {
      captureError(error, { context: 'Save article failed' });
      addToast('error', error instanceof Error ? error.message : t('articles.toastSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const doDelete = useCallback(async (id: string) => {
    try {
      await deletePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      addToast('success', t('articles.toastDeleted'));
    } catch {
      addToast('error', t('articles.toastDeleteError'));
    }
    confirm.closeConfirm();
  }, [addToast, confirm, t]);

  const handleDelete = (id: string) => {
    confirm.requestConfirm(t('articles.confirmDeleteMessage'), () => doDelete(id));
  };

  const toggleStatus = async (post: BlogPost) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    try {
      await savePost({ ...post, status: newStatus } as Omit<BlogPost, 'id'>, post.id);
      setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, status: newStatus } : p));
    } catch {
      addToast('error', t('articles.toastUpdateError'));
    }
  };

  const filtered = posts.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const { paged, page, totalPages, setPage } = usePagination(filtered);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('articles.title')}</h1>
          <p className="text-sm text-neutral-500">
            {loading ? t('articles.loading') : t('articles.totalCount', { count: posts.length })}
          </p>
        </div>
        <Button onClick={openNew} icon={<Plus className="w-4 h-4" />}>{t('articles.newArticle')}</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('articles.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-neutral-900 dark:text-white"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'published', 'draft'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === s
                  ? 'bg-brand-500 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-600'
              }`}
            >
              {s === 'all' ? t('articles.filterAll') : s === 'published' ? t('articles.filterPublished') : t('articles.filterDrafts')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : (
        <>
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">{t('articles.colArticle')}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase hidden md:table-cell">{t('articles.colCategory')}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase hidden sm:table-cell">{t('articles.colDate')}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">{t('articles.colStatus')}</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">{t('articles.colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-500">{t('articles.emptyState')}</td></tr>
                  ) : (
                    paged.map((post) => (
                      <tr key={post.id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {post.coverImage && (
                              <img src={post.coverImage} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 hidden sm:block" loading="lazy" />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-neutral-900 dark:text-white truncate max-w-xs">{post.title}</p>
                              <p className="text-xs text-neutral-400">{t('articles.readTime', { count: post.readTime })}{post.featured ? t('articles.featuredSuffix') : ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {post.category && <Badge variant="brand" size="sm">{post.category}</Badge>}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-500 hidden sm:table-cell">
                          {post.publishedAt ? formatDate(post.publishedAt) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleStatus(post)}>
                            <Badge variant={post.status === 'published' ? 'success' : 'warning'} size="sm">
                              {post.status === 'published' ? t('articles.statusPublished') : t('articles.statusDraft')}
                            </Badge>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(post)} className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors" title={t('articles.actionEdit')}>
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {post.status === 'published' && post.slug && (
                              <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors" title={t('articles.actionView')}>
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            <button onClick={() => handleDelete(post.id)} className="p-1.5 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors" title={t('articles.actionDelete')}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="flex justify-center mt-4">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}

      {/* Article editor modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? t('articles.modalEditTitle') : t('articles.modalNewTitle')} size="xl">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-neutral-200 dark:border-neutral-700">
          {[{ key: 'content', label: t('articles.tabContent') }, { key: 'seo', label: t('articles.tabSeo') }].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.key
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'content' && (
          <div className="space-y-4">
            <Input
              label={t('articles.fieldTitleLabel')}
              value={form.title}
              onChange={(e) => {
                set('title', e.target.value);
                if (!editingId) set('slug', slugify(e.target.value));
              }}
              placeholder={t('articles.fieldTitlePlaceholder')}
            />
            <Input
              label={t('articles.fieldExcerptLabel')}
              value={form.excerpt}
              onChange={(e) => set('excerpt', e.target.value)}
              placeholder={t('articles.fieldExcerptPlaceholder')}
            />
            <RichEditor
              label={t('articles.fieldContentLabel')}
              value={form.content}
              onChange={(v) => set('content', v)}
              minHeight="400px"
              placeholder={t('articles.fieldContentPlaceholder')}
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="category" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t('articles.fieldCategoryLabel')}
                </label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-white dark:focus:border-brand-400"
                >
                  {BLOG_POLES.map((pole) => (
                    <option key={pole} value={pole}>{pole}</option>
                  ))}
                </select>
              </div>
              <Input label={t('articles.fieldTagsLabel')} value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="SEO, Growth, Digital" />
            </div>
            <Input
              label={t('articles.fieldPublishDateLabel')}
              type="date"
              value={form.publishedAt}
              onChange={(e) => set('publishedAt', e.target.value)}
            />
            <ImageInput label={t('articles.fieldCoverImageLabel')} value={form.coverImage} onChange={(url) => set('coverImage', url)} folder="articles" />
          </div>
        )}

        {activeTab === 'seo' && (
          <div className="space-y-5">
            {/* Toggle featured — option éditoriale, hors SEOPanel */}
            <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700/30 rounded-xl">
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">{t('articles.featuredTitle')}</p>
                <p className="text-xs text-neutral-500">{t('articles.featuredDescription')}</p>
              </div>
              <button
                type="button"
                onClick={() => set('featured', !form.featured)}
                className={`p-2 rounded-xl transition-colors ${form.featured ? 'text-accent-500 bg-accent-50 dark:bg-accent-900/20' : 'text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}
              >
                {form.featured ? <Star className="w-5 h-5 fill-current" /> : <StarOff className="w-5 h-5" />}
              </button>
            </div>
            {/* Slug */}
            <Input
              label={t('articles.fieldSlugLabel')}
              value={form.slug}
              onChange={(e) => set('slug', slugify(e.target.value))}
              placeholder="mon-super-article"
            />
            {/* Slug EN */}
            <Input
              label={t('articles.fieldSlugEnLabel')}
              value={form.slug_en}
              onChange={(e) => set('slug_en', slugify(e.target.value))}
              placeholder="english-slug"
            />
            {/* SEOPanel complet */}
            <SEOPanel
              title={form.title}
              slug={form.slug}
              content={form.content}
              excerpt={form.excerpt}
              coverImage={form.coverImage}
              siteUrl="https://maxmorrys.me"
              basePath="blog"
              focusKeyword={form.focusKeyword}
              metaTitle={form.metaTitle}
              metaDescription={form.metaDescription}
              ogTitle={form.ogTitle}
              ogDescription={form.ogDescription}
              ogImage={form.ogImage}
              twitterTitle={form.twitterTitle}
              twitterDescription={form.twitterDescription}
              twitterImage={form.twitterImage}
              noIndex={form.noIndex}
              canonicalUrl={form.canonicalUrl}
              onChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))}
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-700 mt-6">
          <Button variant="outline" onClick={() => setShowModal(false)}>{t('articles.cancel')}</Button>
          <Button variant="outline" onClick={() => handleSave('draft')} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            {t('articles.saveDraft')}
          </Button>
          <Button onClick={() => handleSave('published')} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            {editingId ? t('articles.update') : t('articles.publish')}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        onClose={confirm.closeConfirm}
        onConfirm={confirm.onConfirm}
        title={t('articles.confirmDeleteTitle')}
        message={confirm.message}
        confirmLabel={t('articles.confirmDeleteLabel')}
      />
    </div>
  );
}
