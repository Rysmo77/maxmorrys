import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@ds';
import { getAllFormations, saveFormation, deleteFormation } from '../../../lib/firestore';
import { slugify } from '../../../lib/utils';
import { generateSlugEn } from '../../../lib/slugEn';
import { captureError } from '../../../lib/sentry';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import { usePagination } from '../../../hooks/usePagination';
import { buildPublishChecklist } from './publishChecklist';
import type { Formation, Module, Lesson } from '../../../types';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../config/firebase';

/**
 * L'ÉTAT DE L'ÉCRAN FORMATIONS, SORTI DU RENDU.
 *
 * C'était le plus gros fichier du dépôt : 623 lignes, dont un constructeur de curriculum
 * complet — modules, leçons, réordonnancement — déclaré au milieu du JSX. Extraire d'abord
 * était la seule façon de ne pas réécrire la logique et la mise en page dans le même geste :
 * aucun des treize tests du dépôt ne rend un composant.
 *
 * Les appels Firestore, les clés de toast et le calcul de `students`/`rating` conservés à
 * l'enregistrement sont repris à l'identique. Ce qui s'ajoute : `loadedAt` (la date du relevé)
 * et `checklist` (la définition de « publiable » — voir `publishChecklist.ts`).
 */

export const LEVEL_KEYS = ['debutant', 'intermediaire', 'avance'] as const;
export const LESSON_TYPE_KEYS = ['video', 'text', 'quiz', 'resource', 'mission'] as const;

export type FormationStage = 'all' | 'published' | 'draft';
export type FormationTab = 'info' | 'curriculum' | 'settings' | 'publish';

export type FormationFormState = {
  title: string;
  slug: string;
  slug_en: string;
  description: string;
  longDescription: string;
  category: string;
  price: string;
  promoPrice: string;
  level: 'debutant' | 'intermediaire' | 'avance';
  coverImage: string;
  duration: string;
  tags: string;
  status: 'draft' | 'published';
  featured: boolean;
  certificateEnabled: boolean;
  // SEO
  focusKeyword: string;
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  noIndex: boolean;
  canonicalUrl: string;
  modules: Module[];
};

const EMPTY_FORM: FormationFormState = {
  title: '', slug: '', slug_en: '', description: '', longDescription: '', category: '',
  price: '', promoPrice: '', level: 'debutant', coverImage: '', duration: '',
  tags: '', status: 'draft', featured: false, certificateEnabled: true,
  focusKeyword: '', metaTitle: '', metaDescription: '', ogTitle: '',
  ogDescription: '', ogImage: '', noIndex: false, canonicalUrl: '',
  modules: [],
};

const generateId = () => crypto.randomUUID();

/** La checklist de publication d'une formation DÉJÀ EN BASE, pour l'étiquette de sa ligne. */
export function formationChecklist(f: Formation) {
  return buildPublishChecklist({
    title: f.title ?? '',
    description: f.description ?? '',
    price: String(f.price ?? ''),
    promoPrice: f.promoPrice ? String(f.promoPrice) : '',
    coverImage: f.coverImage ?? '',
    modules: f.modules ?? [],
  });
}

/**
 * PRÉVENIR À LA PUBLICATION — appelée juste après un enregistrement en `published`.
 *
 * Elle ne s'adresse QU'aux comptes ayant coché « me prévenir à la publication » dans leurs
 * réglages, et elle est idempotente : un second enregistrement de la même formation ne
 * renvoie rien (marqueur `publishNotifiedAt` posé côté serveur).
 *
 * ⚠️ Elle NE PEUT PAS être un déclencheur Firestore : Workers ne sait pas s'abonner aux
 * événements de la base, et il ne reste plus de Cloud Function. C'est donc l'action qui
 * publie qui appelle l'endpoint — la forme de tout le reste du Worker.
 */
const notifyOnPublish = httpsCallable<
  { kind: 'formation' | 'article'; id: string },
  { ok: boolean; notified: number; alreadyNotified: boolean }
>(functions, 'notifyOnPublish');

export function useFormations() {
  const { t } = useTranslation('admin');
  const { addToast } = useToast();
  const confirm = useConfirmDialog();

  const [list, setList] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState<FormationStage>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormationFormState>(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState<FormationTab>('info');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [editingLesson, setEditingLesson] = useState<{ moduleId: string; lesson: Lesson } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getAllFormations().then((data) => {
      setList(data);
      setLoadedAt(new Date());
      setLoading(false);
    }).catch(() => {
      addToast('error', t('formations.toastLoadError'));
      setLoading(false);
    });
  }, [addToast, t]);

  // Au MONTAGE SEULEMENT, comme avant l'extraction. `load` dépend de `t`, dont l'identité
  // change à chaque bascule de langue : le mettre en dépendance relancerait une lecture
  // Firestore complète à chaque changement de langue, ce que l'écran ne faisait pas.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const set = useCallback(<K extends keyof FormationFormState>(key: K, value: FormationFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const openNew = useCallback(() => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setExpandedModules(new Set());
    setActiveTab('info');
    setShowModal(true);
  }, []);

  const openEdit = useCallback((f: Formation) => {
    setEditingId(f.id);
    setForm({
      title: f.title,
      slug: f.slug,
      slug_en: f.slug_en ?? '',
      description: f.description,
      longDescription: f.longDescription,
      category: f.category,
      price: String(f.price),
      promoPrice: f.promoPrice ? String(f.promoPrice) : '',
      level: f.level,
      coverImage: f.coverImage,
      duration: f.duration,
      tags: f.tags?.join(', ') ?? '',
      status: f.status,
      featured: f.featured ?? false,
      certificateEnabled: f.certificateEnabled ?? true,
      focusKeyword: f.focusKeyword ?? '',
      metaTitle: f.metaTitle ?? '',
      metaDescription: f.metaDescription ?? f.description,
      ogTitle: f.ogTitle ?? '',
      ogDescription: f.ogDescription ?? '',
      ogImage: f.ogImage ?? f.coverImage,
      noIndex: f.noIndex ?? false,
      canonicalUrl: f.canonicalUrl ?? '',
      modules: f.modules ?? [],
    });
    setExpandedModules(new Set());
    setActiveTab('info');
    setShowModal(true);
  }, []);

  const handleSave = useCallback(async (status: 'draft' | 'published') => {
    if (!form.title.trim() || !form.description.trim()) {
      addToast('error', t('formations.toastTitleDescRequired'));
      return;
    }
    setSaving(true);
    try {
      const slug = form.slug || slugify(form.title);
      const slug_en = form.slug_en || await generateSlugEn(form.title);
      const existing = editingId ? list.find((f) => f.id === editingId) : null;
      const data = {
        title: form.title.trim(),
        slug,
        slug_en,
        description: form.description.trim(),
        longDescription: form.longDescription,
        category: form.category.trim(),
        price: Number(form.price) || 0,
        promoPrice: form.promoPrice ? Number(form.promoPrice) : null,
        level: form.level,
        coverImage: form.coverImage.trim(),
        duration: form.duration.trim(),
        tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        status,
        featured: form.featured,
        certificateEnabled: form.certificateEnabled,
        focusKeyword: form.focusKeyword.trim(),
        metaTitle: form.metaTitle.trim(),
        metaDescription: form.metaDescription.trim() || form.description.trim(),
        ogTitle: form.ogTitle.trim(),
        ogDescription: form.ogDescription.trim(),
        ogImage: form.ogImage.trim() || form.coverImage.trim(),
        noIndex: form.noIndex,
        canonicalUrl: form.canonicalUrl.trim(),
        modules: form.modules,
        students: existing?.students ?? 0,
        rating: existing?.rating ?? 0,
      } as Omit<Formation, 'id'>;
      const savedId = await saveFormation(data, editingId ?? undefined);
      addToast('success', editingId ? t('formations.toastUpdated') : t('formations.toastCreated'));

      /*
       * L'ALERTE PART APRÈS L'ENREGISTREMENT, ET SON ÉCHEC NE LE DÉFAIT PAS.
       *
       * La formation est publiée : c'est le fait qui compte, et il est acquis. Si l'envoi
       * échoue, on le DIT — sans transformer une publication réussie en erreur, ni laisser
       * croire que des gens ont été prévenus. Le marqueur `publishNotifiedAt` n'étant alors
       * pas posé, un second enregistrement rejouera l'envoi.
       */
      if (status === 'published' && savedId) {
        try {
          const { data: envoi } = await notifyOnPublish({ kind: 'formation', id: savedId });
          if (envoi.notified > 0) {
            addToast('success', t('formations.toastNotified', { count: envoi.notified }));
          }
        } catch (error: unknown) {
          captureError(error, { context: 'Notify on formation publish failed' });
          addToast('error', t('formations.toastNotifyError'));
        }
      }

      setShowModal(false);
      load();
    } catch (error: unknown) {
      captureError(error, { context: 'Save formation failed' });
      addToast('error', error instanceof Error ? error.message : t('formations.toastSaveError'));
    } finally {
      setSaving(false);
    }
  }, [addToast, editingId, form, list, load, t]);

  const doDelete = useCallback(async (id: string) => {
    try {
      await deleteFormation(id);
      setList((prev) => prev.filter((f) => f.id !== id));
      addToast('success', t('formations.toastDeleted'));
      confirm.closeConfirm();
    } catch (error: unknown) {
      captureError(error, { context: 'Delete formation failed' });
      addToast('error', error instanceof Error ? error.message : t('formations.toastDeleteError'));
      confirm.closeConfirm();
    }
  }, [addToast, confirm, t]);

  /** Supprime depuis l'éditeur : la fiche ouverte se referme d'abord. */
  const deleteEditing = useCallback(() => {
    if (!editingId) return;
    const id = editingId;
    // L'éditeur se ferme AVANT la demande de confirmation : deux `Modal` ouverts en même
    // temps, ce sont deux pièges de focus concurrents sur le même `window.keydown`.
    setShowModal(false);
    confirm.requestConfirm(t('formations.confirmDelete'), () => doDelete(id));
  }, [confirm, doDelete, editingId, t]);

  // ── Curriculum : mêmes opérations qu'avant l'extraction ──────────────────────────────
  const addModule = useCallback(() => {
    const id = generateId();
    // L'`order` se calcule DANS l'updater, à partir de `prev` : le lire hors de lui donnerait
    // le compte d'un rendu précédent si deux ajouts se suivent dans le même lot.
    setForm((prev) => ({
      ...prev,
      modules: [...prev.modules, {
        id, title: t('formations.newModuleTitle'), order: prev.modules.length + 1, lessons: [],
      }],
    }));
    setExpandedModules((prev) => new Set(prev).add(id));
  }, [t]);

  const updateModule = useCallback((moduleId: string, title: string) => {
    setForm((prev) => ({
      ...prev,
      modules: prev.modules.map((m) => (m.id === moduleId ? { ...m, title } : m)),
    }));
  }, []);

  const deleteModule = useCallback((moduleId: string) => {
    setForm((prev) => ({ ...prev, modules: prev.modules.filter((m) => m.id !== moduleId) }));
  }, []);

  const moveModule = useCallback((index: number, dir: -1 | 1) => {
    setForm((prev) => {
      const next = [...prev.modules];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, modules: next.map((m, i) => ({ ...m, order: i + 1 })) };
    });
  }, []);

  const toggleModule = useCallback((moduleId: string) => {
    setExpandedModules((prev) => {
      const n = new Set(prev);
      if (n.has(moduleId)) n.delete(moduleId); else n.add(moduleId);
      return n;
    });
  }, []);

  const addLesson = useCallback((moduleId: string) => {
    const mod = form.modules.find((m) => m.id === moduleId);
    setEditingLesson({
      moduleId,
      lesson: {
        id: generateId(),
        title: t('formations.newLessonTitle'),
        type: 'video',
        duration: '10min',
        content: '',
        order: (mod?.lessons.length ?? 0) + 1,
        isFree: false,
      },
    });
  }, [form.modules, t]);

  const openEditLesson = useCallback((moduleId: string, lesson: Lesson) => {
    setEditingLesson({ moduleId, lesson: { ...lesson } });
  }, []);

  const saveLesson = useCallback(() => {
    if (!editingLesson) return;
    const { moduleId, lesson } = editingLesson;
    setForm((prev) => ({
      ...prev,
      modules: prev.modules.map((m) => {
        if (m.id !== moduleId) return m;
        const exists = m.lessons.some((l) => l.id === lesson.id);
        return {
          ...m,
          lessons: exists
            ? m.lessons.map((l) => (l.id === lesson.id ? lesson : l))
            : [...m.lessons, lesson],
        };
      }),
    }));
    setEditingLesson(null);
  }, [editingLesson]);

  const deleteLesson = useCallback((moduleId: string, lessonId: string) => {
    setForm((prev) => ({
      ...prev,
      modules: prev.modules.map((m) => (m.id === moduleId
        ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) }
        : m)),
    }));
  }, []);

  const moveLesson = useCallback((moduleId: string, index: number, dir: -1 | 1) => {
    setForm((prev) => ({
      ...prev,
      modules: prev.modules.map((m) => {
        if (m.id !== moduleId) return m;
        const lessons = [...m.lessons];
        const target = index + dir;
        if (target < 0 || target >= lessons.length) return m;
        [lessons[index], lessons[target]] = [lessons[target], lessons[index]];
        return { ...m, lessons: lessons.map((l, i) => ({ ...l, order: i + 1 })) };
      }),
    }));
  }, []);

  const patchLesson = useCallback((patch: Partial<Lesson>) => {
    setEditingLesson((prev) => (prev ? { ...prev, lesson: { ...prev.lesson, ...patch } } : prev));
  }, []);

  // ── La définition de « publiable », recalculée à chaque frappe ───────────────────────
  const checklist = useMemo(() => buildPublishChecklist({
    title: form.title,
    description: form.description,
    price: form.price,
    promoPrice: form.promoPrice,
    coverImage: form.coverImage,
    modules: form.modules,
  }), [form.title, form.description, form.price, form.promoPrice, form.coverImage, form.modules]);

  const totalLessons = checklist.items[0].counts.lessons;

  const counts = useMemo(() => ({
    all: list.length,
    published: list.filter((f) => f.status === 'published').length,
    draft: list.filter((f) => f.status !== 'published').length,
  }), [list]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return list.filter((f) => {
      const matchSearch = !needle
        || (f.title ?? '').toLowerCase().includes(needle)
        || (f.category ?? '').toLowerCase().includes(needle);
      const matchStage = stage === 'all'
        || (stage === 'published' ? f.status === 'published' : f.status !== 'published');
      return matchSearch && matchStage;
    });
  }, [list, search, stage]);

  const pagination = usePagination(filtered);

  return {
    list, loading, loadedAt, saving,
    search, setSearch,
    stage, setStage, counts,
    filtered, ...pagination,
    showModal, setShowModal, editingId,
    form, set, setForm,
    activeTab, setActiveTab,
    expandedModules, toggleModule,
    editingLesson, setEditingLesson, patchLesson,
    openNew, openEdit, handleSave, deleteEditing,
    addModule, updateModule, deleteModule, moveModule,
    addLesson, openEditLesson, saveLesson, deleteLesson, moveLesson,
    checklist, totalLessons,
    confirm,
  };
}
