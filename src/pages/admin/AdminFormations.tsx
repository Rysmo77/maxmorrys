import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, Search, Edit2, Trash2, Loader2, Users, Star, ChevronDown, ChevronUp,
  GripVertical, Video, FileText, HelpCircle, Download, Target, ExternalLink, StarOff,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import ImageInput from '../../components/ui/ImageInput';
import RichEditor from '../../components/ui/RichEditor';
import { useToast } from '../../components/ui/Toast';
import { getAllFormations, saveFormation, deleteFormation } from '../../lib/firestore';
import { formatPrice, slugify } from '../../lib/utils';
import { generateSlugEn } from '../../lib/slugEn';
import { cn } from '../../lib/utils';
import type { Formation, Module, Lesson } from '../../types';
import SEOPanel from '../../components/shared/SEOPanel';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { usePagination } from '../../hooks/usePagination';
import { captureError } from '../../lib/sentry';

const lessonTypeIcons: Record<string, React.FC<{ className?: string }>> = {
  video: Video, text: FileText, quiz: HelpCircle, resource: Download, mission: Target,
};
const LEVEL_KEYS = ['debutant', 'intermediaire', 'avance'] as const;
const LESSON_TYPE_KEYS = ['video', 'text', 'quiz', 'resource', 'mission'] as const;

type FormState = {
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

const EMPTY_FORM: FormState = {
  title: '', slug: '', slug_en: '', description: '', longDescription: '', category: '',
  price: '', promoPrice: '', level: 'debutant', coverImage: '', duration: '',
  tags: '', status: 'draft', featured: false, certificateEnabled: true,
  focusKeyword: '', metaTitle: '', metaDescription: '', ogTitle: '',
  ogDescription: '', ogImage: '', noIndex: false, canonicalUrl: '',
  modules: [],
};

function generateId() {
  return crypto.randomUUID();
}

export default function AdminFormations() {
  const { t } = useTranslation('admin');
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
  const { addToast } = useToast();
  const confirm = useConfirmDialog();
  const [list, setList] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState<'info' | 'curriculum' | 'settings'>('info');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [editingLesson, setEditingLesson] = useState<{ moduleId: string; lesson: Lesson } | null>(null);

  const load = () => {
    setLoading(true);
    getAllFormations().then((data) => {
      setList(data);
      setLoading(false);
    }).catch(() => {
      addToast('error', t('formations.toastLoadError'));
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setExpandedModules(new Set());
    setActiveTab('info');
    setShowModal(true);
  };

  const openEdit = (f: Formation) => {
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
  };

  const handleSave = async (status: 'draft' | 'published') => {
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
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
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
      await saveFormation(data, editingId ?? undefined);
      addToast('success', editingId ? t('formations.toastUpdated') : t('formations.toastCreated'));
      setShowModal(false);
      load();
    } catch (error: unknown) {
      captureError(error, { context: 'Save formation failed' });
      addToast('error', error instanceof Error ? error.message : t('formations.toastSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    confirm.requestConfirm(t('formations.confirmDelete'), async () => {
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
    });
  };

  const toggleStatus = async (f: Formation) => {
    const newStatus = f.status === 'published' ? 'draft' : 'published';
    try {
      await saveFormation({ ...f, status: newStatus } as Omit<Formation, 'id'>, f.id);
      setList((prev) => prev.map((item) => item.id === f.id ? { ...item, status: newStatus } : item));
    } catch {
      addToast('error', t('formations.toastStatusError'));
    }
  };

  // ── Curriculum helpers ──
  const addModule = () => {
    const newModule: Module = { id: generateId(), title: t('formations.newModuleTitle'), order: form.modules.length + 1, lessons: [] };
    set('modules', [...form.modules, newModule]);
    setExpandedModules((prev) => new Set(prev).add(newModule.id));
  };

  const updateModule = (moduleId: string, title: string) => {
    set('modules', form.modules.map((m) => m.id === moduleId ? { ...m, title } : m));
  };

  const deleteModule = (moduleId: string) => {
    set('modules', form.modules.filter((m) => m.id !== moduleId));
  };

  const moveModule = (index: number, dir: -1 | 1) => {
    const newModules = [...form.modules];
    const target = index + dir;
    if (target < 0 || target >= newModules.length) return;
    [newModules[index], newModules[target]] = [newModules[target], newModules[index]];
    set('modules', newModules.map((m, i) => ({ ...m, order: i + 1 })));
  };

  const addLesson = (moduleId: string) => {
    const mod = form.modules.find((m) => m.id === moduleId);
    const newLesson: Lesson = {
      id: generateId(),
      title: t('formations.newLessonTitle'),
      type: 'video',
      duration: '10min',
      content: '',
      order: (mod?.lessons.length ?? 0) + 1,
      isFree: false,
    };
    setEditingLesson({ moduleId, lesson: newLesson });
  };

  const openEditLesson = (moduleId: string, lesson: Lesson) => {
    setEditingLesson({ moduleId, lesson: { ...lesson } });
  };

  const saveLesson = () => {
    if (!editingLesson) return;
    const { moduleId, lesson } = editingLesson;
    set('modules', form.modules.map((m) => {
      if (m.id !== moduleId) return m;
      const exists = m.lessons.some((l) => l.id === lesson.id);
      return {
        ...m,
        lessons: exists
          ? m.lessons.map((l) => l.id === lesson.id ? lesson : l)
          : [...m.lessons, lesson],
      };
    }));
    setEditingLesson(null);
  };

  const deleteLesson = (moduleId: string, lessonId: string) => {
    set('modules', form.modules.map((m) =>
      m.id === moduleId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) } : m
    ));
  };

  const moveLesson = (moduleId: string, index: number, dir: -1 | 1) => {
    set('modules', form.modules.map((m) => {
      if (m.id !== moduleId) return m;
      const lessons = [...m.lessons];
      const target = index + dir;
      if (target < 0 || target >= lessons.length) return m;
      [lessons[index], lessons[target]] = [lessons[target], lessons[index]];
      return { ...m, lessons: lessons.map((l, i) => ({ ...l, order: i + 1 })) };
    }));
  };

  const totalLessons = form.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const filtered = list.filter((f) => (f.title ?? '').toLowerCase().includes(search.toLowerCase()) || (f.category ?? '').toLowerCase().includes(search.toLowerCase()));
  const { paged, page, totalPages, setPage } = usePagination(filtered);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('formations.pageTitle')}</h1>
          <p className="text-sm text-neutral-500">{loading ? t('formations.loading') : t('formations.count', { count: list.length })}</p>
        </div>
        <Button onClick={openNew} icon={<Plus className="w-4 h-4" />}>{t('formations.newFormation')}</Button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('formations.searchPlaceholder')} className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-neutral-900 dark:text-white" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : filtered.length === 0 ? (
        <Card><p className="text-center text-neutral-500 py-8">{t('formations.emptyState')}</p></Card>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paged.map((f) => (
              <Card key={f.id} padding="none" className="overflow-hidden">
                {f.coverImage && <img src={f.coverImage} alt={f.title} className="w-full h-36 object-cover" loading="lazy" />}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant="brand" size="sm">{f.category}</Badge>
                    <Badge size="sm">{levelLabels[f.level]}</Badge>
                    <button onClick={() => toggleStatus(f)}>
                      <Badge variant={f.status === 'published' ? 'success' : 'warning'} size="sm">
                        {f.status === 'published' ? t('formations.statusPublished') : t('formations.statusDraft')}
                      </Badge>
                    </button>
                  </div>
                  <h3 className="font-bold text-neutral-900 dark:text-white mb-1 text-sm line-clamp-2">{f.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-neutral-500 mb-3">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {f.students ?? 0}</span>
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-accent-500" /> {f.rating ?? 0}</span>
                    <span>{t('formations.cardModulesLessons', { modules: f.modules?.length ?? 0, lessons: f.modules?.reduce((a, m) => a + m.lessons.length, 0) ?? 0 })}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-brand-600 dark:text-brand-400">{formatPrice(f.promoPrice || f.price)}</p>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(f)} title={t('formations.editAction')} aria-label={t('formations.editAction')} className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {f.status === 'published' && (
                        <a href={`/formations/${f.slug}`} target="_blank" rel="noopener noreferrer" title={t('formations.viewAction')} aria-label={t('formations.viewAction')} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button onClick={() => handleDelete(f.id)} title={t('formations.deleteAction')} aria-label={t('formations.deleteAction')} className="p-1.5 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="flex justify-center mt-4">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}

      {/* Formation builder */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? t('formations.modalEditTitle') : t('formations.modalNewTitle')} size="xl">
        <div className="flex gap-1 mb-6 border-b border-neutral-200 dark:border-neutral-700">
          {[
            { key: 'info', label: t('formations.tabInfo') },
            { key: 'curriculum', label: t('formations.tabCurriculum', { count: totalLessons }) },
            { key: 'settings', label: t('formations.tabSettings') },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === tab.key ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'info' && (
          <div className="space-y-4">
            <Input label={t('formations.fieldTitle')} value={form.title} onChange={(e) => { set('title', e.target.value); if (!editingId) set('slug', slugify(e.target.value)); }} placeholder={t('formations.fieldTitlePlaceholder')} />
            <Input label={t('formations.fieldShortDesc')} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder={t('formations.fieldShortDescPlaceholder')} />
            <RichEditor label={t('formations.fieldLongDesc')} value={form.longDescription} onChange={(v) => set('longDescription', v)} minHeight="280px" />
            <div className="grid sm:grid-cols-3 gap-4">
              <Input label={t('formations.fieldCategory')} value={form.category} onChange={(e) => set('category', e.target.value)} placeholder={t('formations.fieldCategoryPlaceholder')} />
              <Input label={t('formations.fieldPrice')} type="number" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="0" />
              <Input label={t('formations.fieldPromoPrice')} type="number" value={form.promoPrice} onChange={(e) => set('promoPrice', e.target.value)} placeholder={t('formations.fieldPromoPricePlaceholder')} />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('formations.fieldLevel')}</label>
                <select value={form.level} onChange={(e) => set('level', e.target.value as FormState['level'])} className="w-full rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
                  {LEVEL_KEYS.map((lvl) => <option key={lvl} value={lvl}>{levelLabels[lvl]}</option>)}
                </select>
              </div>
              <Input label={t('formations.fieldDuration')} value={form.duration} onChange={(e) => set('duration', e.target.value)} placeholder={t('formations.fieldDurationPlaceholder')} />
              <Input label={t('formations.fieldTags')} value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder={t('formations.fieldTagsPlaceholder')} />
            </div>
            <ImageInput label={t('formations.fieldCoverImage')} value={form.coverImage} onChange={(url) => set('coverImage', url)} folder="formations" />
          </div>
        )}

        {activeTab === 'curriculum' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-500">{t('formations.modulesLessonsSummary', { modules: form.modules.length, lessons: totalLessons })}</p>
              <Button size="sm" onClick={addModule} icon={<Plus className="w-3.5 h-3.5" />}>{t('formations.addModule')}</Button>
            </div>
            {form.modules.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl">
                <p className="text-neutral-400 mb-3">{t('formations.noModules')}</p>
                <Button size="sm" onClick={addModule} icon={<Plus className="w-3.5 h-3.5" />}>{t('formations.createModule')}</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {form.modules.map((module, mIndex) => (
                  <div key={module.id} className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 p-3 bg-neutral-50 dark:bg-neutral-700/50">
                      <GripVertical className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      <input
                        value={module.title}
                        onChange={(e) => updateModule(module.id, e.target.value)}
                        className="flex-1 bg-transparent text-sm font-semibold text-neutral-900 dark:text-white focus:outline-none"
                        placeholder={t('formations.moduleTitlePlaceholder')}
                      />
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => moveModule(mIndex, -1)} disabled={mIndex === 0} aria-label={t('formations.moveUp')} className="p-1 rounded text-neutral-400 hover:text-neutral-600 disabled:opacity-30 transition-colors"><ChevronUp className="w-3.5 h-3.5" /></button>
                        <button onClick={() => moveModule(mIndex, 1)} disabled={mIndex === form.modules.length - 1} aria-label={t('formations.moveDown')} className="p-1 rounded text-neutral-400 hover:text-neutral-600 disabled:opacity-30 transition-colors"><ChevronDown className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setExpandedModules((prev) => { const n = new Set(prev); if (n.has(module.id)) { n.delete(module.id); } else { n.add(module.id); } return n; })} aria-label={t('formations.toggleModule')} className="p-1 rounded text-neutral-400 hover:text-neutral-600 transition-colors">
                          {expandedModules.has(module.id) ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => deleteModule(module.id)} aria-label={t('formations.deleteModule')} className="p-1 rounded text-neutral-400 hover:text-error-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    {expandedModules.has(module.id) && (
                      <div className="p-3 space-y-2">
                        {module.lessons.length === 0 ? (
                          <p className="text-xs text-neutral-400 text-center py-2">{t('formations.noLessonsInModule')}</p>
                        ) : (
                          module.lessons.map((lesson, lIndex) => {
                            const LIcon = lessonTypeIcons[lesson.type] ?? FileText;
                            return (
                              <div key={lesson.id} className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 group">
                                <GripVertical className="w-3.5 h-3.5 text-neutral-300 flex-shrink-0" />
                                <LIcon className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-neutral-900 dark:text-white truncate">{lesson.title}</p>
                                  <p className="text-xs text-neutral-400">{lessonTypeLabels[lesson.type]} · {lesson.duration}{lesson.isFree ? t('formations.lessonFreeSuffix') : ''}</p>
                                </div>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => moveLesson(module.id, lIndex, -1)} disabled={lIndex === 0} aria-label={t('formations.moveUp')} className="p-1 rounded text-neutral-400 hover:text-neutral-600 disabled:opacity-30"><ChevronUp className="w-3 h-3" /></button>
                                  <button onClick={() => moveLesson(module.id, lIndex, 1)} disabled={lIndex === module.lessons.length - 1} aria-label={t('formations.moveDown')} className="p-1 rounded text-neutral-400 hover:text-neutral-600 disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button>
                                  <button onClick={() => openEditLesson(module.id, lesson)} aria-label={t('formations.editLesson')} className="p-1 rounded text-neutral-400 hover:text-brand-600"><Edit2 className="w-3 h-3" /></button>
                                  <button onClick={() => deleteLesson(module.id, lesson.id)} aria-label={t('formations.deleteLesson')} className="p-1 rounded text-neutral-400 hover:text-error-600"><Trash2 className="w-3 h-3" /></button>
                                </div>
                              </div>
                            );
                          })
                        )}
                        <button onClick={() => addLesson(module.id)} className="w-full flex items-center justify-center gap-2 p-2 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-600 text-xs text-neutral-500 hover:border-brand-400 hover:text-brand-500 transition-colors">
                          <Plus className="w-3.5 h-3.5" /> {t('formations.addLesson')}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-5">
            {/* Toggles éditoriaux */}
            <div className="space-y-2">
              {[
                { key: 'featured' as const, label: t('formations.optFeaturedLabel'), desc: t('formations.optFeaturedDesc') },
                { key: 'certificateEnabled' as const, label: t('formations.optCertificateLabel'), desc: t('formations.optCertificateDesc') },
              ].map((opt) => (
                <div key={opt.key} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700/30 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">{opt.label}</p>
                    <p className="text-xs text-neutral-500">{opt.desc}</p>
                  </div>
                  <button type="button" onClick={() => set(opt.key, !form[opt.key])} className={cn('p-2 rounded-xl transition-colors', form[opt.key] ? 'text-accent-500 bg-accent-50 dark:bg-accent-900/20' : 'text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700')}>
                    {form[opt.key] ? <Star className="w-5 h-5 fill-current" /> : <StarOff className="w-5 h-5" />}
                  </button>
                </div>
              ))}
            </div>
            {/* Slug */}
            <Input label={t('formations.fieldSlug')} value={form.slug} onChange={(e) => set('slug', slugify(e.target.value))} placeholder="nom-de-la-formation" />
            {/* Slug EN */}
            <Input label={t('formations.fieldSlugEn')} value={form.slug_en} onChange={(e) => set('slug_en', slugify(e.target.value))} placeholder="english-slug" />
            {/* SEOPanel complet (sans Twitter) */}
            <SEOPanel
              title={form.title}
              slug={form.slug}
              content={form.longDescription || form.description}
              excerpt={form.description}
              coverImage={form.coverImage}
              siteUrl="https://maxmorrys.me"
              basePath="formations"
              focusKeyword={form.focusKeyword}
              metaTitle={form.metaTitle}
              metaDescription={form.metaDescription}
              ogTitle={form.ogTitle}
              ogDescription={form.ogDescription}
              ogImage={form.ogImage}
              noIndex={form.noIndex}
              canonicalUrl={form.canonicalUrl}
              onChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))}
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-700 mt-6">
          <Button variant="outline" onClick={() => setShowModal(false)}>{t('formations.cancel')}</Button>
          <Button variant="outline" onClick={() => handleSave('draft')} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            {t('formations.saveDraft')}
          </Button>
          <Button onClick={() => handleSave('published')} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            {editingId ? t('formations.update') : t('formations.publish')}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        onClose={confirm.closeConfirm}
        onConfirm={confirm.onConfirm}
        title={t('formations.confirmDeleteTitle')}
        message={confirm.message}
        confirmLabel={t('formations.deleteAction')}
      />

      {/* Lesson editor */}
      {editingLesson && (
        <Modal open={!!editingLesson} onClose={() => setEditingLesson(null)} title={t('formations.lessonModalTitle')} size="lg">
          <div className="space-y-4">
            <Input
              label={t('formations.lessonTitle')}
              value={editingLesson.lesson.title}
              onChange={(e) => setEditingLesson((prev) => prev ? { ...prev, lesson: { ...prev.lesson, title: e.target.value } } : prev)}
              placeholder={t('formations.lessonTitlePlaceholder')}
            />
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('formations.lessonTypeLabel')}</label>
                <select
                  value={editingLesson.lesson.type}
                  onChange={(e) => setEditingLesson((prev) => prev ? { ...prev, lesson: { ...prev.lesson, type: e.target.value as Lesson['type'] } } : prev)}
                  className="w-full rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  {LESSON_TYPE_KEYS.map((v) => <option key={v} value={v}>{lessonTypeLabels[v]}</option>)}
                </select>
              </div>
              <Input
                label={t('formations.lessonDuration')}
                value={editingLesson.lesson.duration}
                onChange={(e) => setEditingLesson((prev) => prev ? { ...prev, lesson: { ...prev.lesson, duration: e.target.value } } : prev)}
                placeholder={t('formations.lessonDurationPlaceholder')}
              />
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingLesson.lesson.isFree}
                    onChange={(e) => setEditingLesson((prev) => prev ? { ...prev, lesson: { ...prev.lesson, isFree: e.target.checked } } : prev)}
                    className="rounded accent-brand-600 w-4 h-4"
                  />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">{t('formations.lessonFree')}</span>
                </label>
              </div>
            </div>
            {editingLesson.lesson.type === 'video' && (
              <Input
                label={t('formations.lessonVideoUrl')}
                value={editingLesson.lesson.videoUrl ?? ''}
                onChange={(e) => setEditingLesson((prev) => prev ? { ...prev, lesson: { ...prev.lesson, videoUrl: e.target.value } } : prev)}
                placeholder={t('formations.lessonVideoUrlPlaceholder')}
              />
            )}
            <RichEditor
              label={t('formations.lessonContent')}
              value={editingLesson.lesson.content}
              onChange={(v) => setEditingLesson((prev) => prev ? { ...prev, lesson: { ...prev.lesson, content: v } } : prev)}
              minHeight="250px"
              placeholder={t('formations.lessonContentPlaceholder')}
            />
            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <Button variant="outline" onClick={() => setEditingLesson(null)}>{t('formations.cancel')}</Button>
              <Button onClick={saveLesson}>{t('formations.saveLesson')}</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
