import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../config/firebase';
import { useToast } from '@ds';
import { getAllPosts, savePost, deletePost } from '../../../lib/firestore';
import { slugify, calculateReadTime } from '../../../lib/utils';
import { generateSlugEn } from '../../../lib/slugEn';
import { BLOG_POLES, categoryToPole } from '../../../lib/blogCategories';
import { captureError } from '../../../lib/sentry';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import { usePagination } from '../../../hooks/usePagination';
import type { BlogPost } from '../../../types';

/**
 * L'ÉTAT DE L'ÉCRAN ÉDITORIAL, SORTI DU RENDU.
 *
 * `AdminArticles` portait 474 lignes dont la moitié était un formulaire de vingt champs
 * déclaré au milieu du JSX. Recomposer la vue ET la logique dans le même geste, sans qu'un
 * seul test ne rende ce composant, revient à réécrire à l'aveugle : les treize tests du
 * dépôt portent tous sur `lib/`. L'extraction se fait donc D'ABORD, à l'identique — mêmes
 * appels Firestore, mêmes clés de toast, mêmes gardes — et la recomposition ensuite.
 *
 * Rien ici n'a changé de comportement. Ce qui s'ajoute est `loadedAt` : la date du relevé,
 * sans laquelle aucun compteur de cet écran ne peut s'afficher (règle 6).
 */

/**
 * Alerte de publication.
 *
 * ⚠️ ELLE EXISTAIT ET N'ÉTAIT JAMAIS APPELÉE POUR UN ARTICLE. Le handler serveur gère deux
 * types depuis toujours — `formation` et `article` — et seul le premier avait un appelant
 * (`admin/formations/useFormations.ts`). Autrement dit, l'alerte était branchée sur le seul
 * territoire qui n'a rien à publier — 0 formation publiée au relevé du 30 août — et absente
 * de celui qui compte 46 articles. Les abonnés à `preferences.notifyOnPublish` ne recevaient
 * donc jamais rien.
 *
 * ⚠️ Ce n'est PAS un déclencheur Firestore : Workers ne sait pas s'abonner aux événements de
 * la base, et il ne reste plus de Cloud Function depuis le plan Spark. C'est donc l'action qui
 * publie qui appelle l'endpoint — la forme de tout le reste du Worker.
 */
const notifyOnPublish = httpsCallable<
  { kind: 'formation' | 'article'; id: string },
  { ok: boolean; notified: number; alreadyNotified: boolean }
>(functions, 'notifyOnPublish');

export type ArticleStage = 'all' | 'published' | 'draft';

export type ArticleFormState = {
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

export const makeEmptyArticleForm = (): ArticleFormState => ({
  title: '', slug: '', slug_en: '', excerpt: '', content: '', category: BLOG_POLES[0],
  coverImage: '', tags: '', publishedAt: todayIso(), status: 'draft', featured: false,
  focusKeyword: '', metaTitle: '', metaDescription: '', ogTitle: '',
  ogDescription: '', ogImage: '', twitterTitle: '', twitterDescription: '',
  twitterImage: '', noIndex: false, canonicalUrl: '',
});

export function useArticles() {
  const { t } = useTranslation('admin');
  const { addToast } = useToast();
  const confirm = useConfirmDialog();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState<ArticleStage>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ArticleFormState>(makeEmptyArticleForm);
  const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content');

  const load = useCallback(() => {
    setLoading(true);
    getAllPosts().then((data) => {
      setPosts(data);
      setLoadedAt(new Date());
      setLoading(false);
    }).catch(() => {
      addToast('error', t('articles.toastLoadError'));
      setLoading(false);
    });
  }, [addToast, t]);

  // Au MONTAGE SEULEMENT, comme avant l'extraction. `load` dépend de `t`, dont l'identité
  // change à chaque bascule de langue : le mettre en dépendance relancerait une lecture
  // Firestore complète à chaque changement de langue, ce que l'écran ne faisait pas.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const set = useCallback(<K extends keyof ArticleFormState>(key: K, value: ArticleFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const openNew = useCallback(() => {
    setEditingId(null);
    setForm(makeEmptyArticleForm());
    setActiveTab('content');
    setShowModal(true);
  }, []);

  const openEdit = useCallback((post: BlogPost) => {
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
  }, []);

  const handleSave = useCallback(async (status: 'draft' | 'published') => {
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
        tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
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
      const savedId = await savePost(postData, editingId ?? undefined);
      addToast('success', editingId ? t('articles.toastUpdated') : t('articles.toastCreated'));

      /*
        L'article est publié : c'est le fait qui compte, et il est acquis. Si l'envoi échoue, on
        le DIT — sans transformer une publication réussie en erreur, ni laisser croire que des
        gens ont été prévenus. Le marqueur `publishNotifiedAt` n'étant alors pas posé côté
        serveur, un second enregistrement rejouera l'envoi.
      */
      if (status === 'published' && savedId) {
        try {
          const { data: envoi } = await notifyOnPublish({ kind: 'article', id: savedId });
          if (envoi.notified > 0) {
            addToast('success', t('articles.toastNotified', { count: envoi.notified }));
          }
        } catch (error: unknown) {
          captureError(error, { context: 'Notify on article publish failed' });
          addToast('error', t('articles.toastNotifyError'));
        }
      }

      setShowModal(false);
      load();
    } catch (error: unknown) {
      captureError(error, { context: 'Save article failed' });
      addToast('error', error instanceof Error ? error.message : t('articles.toastSaveError'));
    } finally {
      setSaving(false);
    }
  }, [addToast, editingId, form, load, t]);

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

  /** Supprime depuis l'éditeur : la fiche ouverte se referme d'abord. */
  const deleteEditing = useCallback(() => {
    if (!editingId) return;
    const id = editingId;
    // L'éditeur se ferme AVANT la demande de confirmation : deux `Modal` ouverts en même
    // temps, ce sont deux pièges de focus concurrents sur le même `window.keydown`.
    setShowModal(false);
    confirm.requestConfirm(t('articles.confirmDeleteMessage'), () => doDelete(id));
  }, [confirm, doDelete, editingId, t]);

  const counts = useMemo(() => ({
    all: posts.length,
    published: posts.filter((p) => p.status === 'published').length,
    draft: posts.filter((p) => p.status !== 'published').length,
  }), [posts]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return posts.filter((p) => {
      const matchSearch = !needle
        || p.title.toLowerCase().includes(needle)
        || (p.category?.toLowerCase().includes(needle) ?? false);
      const matchStage = stage === 'all'
        || (stage === 'published' ? p.status === 'published' : p.status !== 'published');
      return matchSearch && matchStage;
    });
  }, [posts, search, stage]);

  const pagination = usePagination(filtered);

  return {
    posts, loading, loadedAt, saving,
    search, setSearch,
    stage, setStage, counts,
    filtered, ...pagination,
    showModal, setShowModal, editingId,
    form, set, setForm,
    activeTab, setActiveTab,
    openNew, openEdit, handleSave, deleteEditing,
    confirm,
  };
}
