import { useState, useEffect } from 'react';
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
import { cn } from '../../lib/utils';
import type { Formation, Module, Lesson } from '../../types';

const levelLabels: Record<string, string> = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' };
const lessonTypeIcons: Record<string, React.FC<{ className?: string }>> = {
  video: Video, text: FileText, quiz: HelpCircle, resource: Download, mission: Target,
};
const lessonTypeLabels: Record<string, string> = {
  video: 'Vidéo', text: 'Texte', quiz: 'Quiz', resource: 'Ressource', mission: 'Mission',
};

type FormState = {
  title: string;
  slug: string;
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
  metaDescription: string;
  modules: Module[];
};

const EMPTY_FORM: FormState = {
  title: '', slug: '', description: '', longDescription: '', category: '',
  price: '', promoPrice: '', level: 'debutant', coverImage: '', duration: '',
  tags: '', status: 'draft', featured: false, certificateEnabled: true,
  metaDescription: '', modules: [],
};

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export default function AdminFormations() {
  const { addToast } = useToast();
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
      addToast('error', 'Erreur lors du chargement des formations.');
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
      metaDescription: (f as Formation & { metaDescription?: string }).metaDescription ?? f.description,
      modules: f.modules ?? [],
    });
    setExpandedModules(new Set());
    setActiveTab('info');
    setShowModal(true);
  };

  const handleSave = async (status: 'draft' | 'published') => {
    if (!form.title.trim() || !form.description.trim()) {
      addToast('error', 'Le titre et la description sont requis.');
      return;
    }
    setSaving(true);
    try {
      const slug = form.slug || slugify(form.title);
      const existing = editingId ? list.find((f) => f.id === editingId) : null;
      const data = {
        title: form.title.trim(),
        slug,
        description: form.description.trim(),
        longDescription: form.longDescription,
        category: form.category.trim(),
        price: Number(form.price) || 0,
        promoPrice: form.promoPrice ? Number(form.promoPrice) : undefined,
        level: form.level,
        coverImage: form.coverImage.trim(),
        duration: form.duration.trim(),
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        status,
        featured: form.featured,
        certificateEnabled: form.certificateEnabled,
        metaDescription: form.metaDescription.trim() || form.description.trim(),
        modules: form.modules,
        students: existing?.students ?? 0,
        rating: existing?.rating ?? 0,
      } as Omit<Formation, 'id'> & { metaDescription: string };
      await saveFormation(data, editingId ?? undefined);
      addToast('success', editingId ? 'Formation mise à jour.' : 'Formation créée.');
      setShowModal(false);
      load();
    } catch {
      addToast('error', 'Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette formation ?')) return;
    await deleteFormation(id).catch(() => addToast('error', 'Erreur de suppression.'));
    addToast('success', 'Formation supprimée.');
    setList((prev) => prev.filter((f) => f.id !== id));
  };

  const toggleStatus = async (f: Formation) => {
    const newStatus = f.status === 'published' ? 'draft' : 'published';
    try {
      await saveFormation({ ...f, status: newStatus } as Omit<Formation, 'id'>, f.id);
      setList((prev) => prev.map((item) => item.id === f.id ? { ...item, status: newStatus } : item));
    } catch {
      addToast('error', 'Erreur de mise à jour.');
    }
  };

  // ── Curriculum helpers ──
  const addModule = () => {
    const newModule: Module = { id: generateId(), title: 'Nouveau module', order: form.modules.length + 1, lessons: [] };
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
      title: 'Nouvelle leçon',
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
  const filtered = list.filter((f) => f.title.toLowerCase().includes(search.toLowerCase()) || f.category?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Formations</h1>
          <p className="text-sm text-neutral-500">{loading ? 'Chargement...' : `${list.length} formation${list.length !== 1 ? 's' : ''}`}</p>
        </div>
        <Button onClick={openNew} icon={<Plus className="w-4 h-4" />}>Nouvelle formation</Button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-neutral-900 dark:text-white" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : filtered.length === 0 ? (
        <Card><p className="text-center text-neutral-500 py-8">Aucune formation. Créez-en une !</p></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((f) => (
            <Card key={f.id} padding="none" className="overflow-hidden">
              {f.coverImage && <img src={f.coverImage} alt={f.title} className="w-full h-36 object-cover" loading="lazy" />}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant="brand" size="sm">{f.category}</Badge>
                  <Badge size="sm">{levelLabels[f.level]}</Badge>
                  <button onClick={() => toggleStatus(f)}>
                    <Badge variant={f.status === 'published' ? 'success' : 'warning'} size="sm">
                      {f.status === 'published' ? 'Publiée' : 'Brouillon'}
                    </Badge>
                  </button>
                </div>
                <h3 className="font-bold text-neutral-900 dark:text-white mb-1 text-sm line-clamp-2">{f.title}</h3>
                <div className="flex items-center gap-3 text-xs text-neutral-500 mb-3">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {f.students ?? 0}</span>
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 text-accent-500" /> {f.rating ?? 0}</span>
                  <span>{f.modules?.length ?? 0} mod · {f.modules?.reduce((a, m) => a + m.lessons.length, 0) ?? 0} leçons</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-brand-600 dark:text-brand-400">{formatPrice(f.promoPrice || f.price)}</p>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(f)} className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {f.status === 'published' && (
                      <a href={`/formations/${f.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button onClick={() => handleDelete(f.id)} className="p-1.5 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Formation builder */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Modifier la formation' : 'Nouvelle formation'} size="xl">
        <div className="flex gap-1 mb-6 border-b border-neutral-200 dark:border-neutral-700">
          {[
            { key: 'info', label: 'Informations' },
            { key: 'curriculum', label: `Curriculum (${totalLessons} leçons)` },
            { key: 'settings', label: 'SEO & Options' },
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
            <Input label="Titre *" value={form.title} onChange={(e) => { set('title', e.target.value); if (!editingId) set('slug', slugify(e.target.value)); }} placeholder="Titre de la formation" />
            <Input label="Description courte *" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Résumé affiché dans les listings" />
            <RichEditor label="Description complète" value={form.longDescription} onChange={(v) => set('longDescription', v)} minHeight="280px" />
            <div className="grid sm:grid-cols-3 gap-4">
              <Input label="Catégorie" value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="Marketing, SEO..." />
              <Input label="Prix (XOF)" type="number" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="0" />
              <Input label="Prix promo (XOF)" type="number" value={form.promoPrice} onChange={(e) => set('promoPrice', e.target.value)} placeholder="Laisser vide" />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Niveau</label>
                <select value={form.level} onChange={(e) => set('level', e.target.value as FormState['level'])} className="w-full rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
                  <option value="debutant">Débutant</option>
                  <option value="intermediaire">Intermédiaire</option>
                  <option value="avance">Avancé</option>
                </select>
              </div>
              <Input label="Durée totale" value={form.duration} onChange={(e) => set('duration', e.target.value)} placeholder="ex: 8h30" />
              <Input label="Tags (virgule)" value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="SEO, Growth..." />
            </div>
            <ImageInput label="Image de couverture" value={form.coverImage} onChange={(url) => set('coverImage', url)} folder="formations" />
          </div>
        )}

        {activeTab === 'curriculum' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-500">{form.modules.length} module{form.modules.length !== 1 ? 's' : ''} · {totalLessons} leçon{totalLessons !== 1 ? 's' : ''}</p>
              <Button size="sm" onClick={addModule} icon={<Plus className="w-3.5 h-3.5" />}>Ajouter un module</Button>
            </div>
            {form.modules.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl">
                <p className="text-neutral-400 mb-3">Aucun module. Commencez par en créer un.</p>
                <Button size="sm" onClick={addModule} icon={<Plus className="w-3.5 h-3.5" />}>Créer un module</Button>
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
                        placeholder="Titre du module"
                      />
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => moveModule(mIndex, -1)} disabled={mIndex === 0} className="p-1 rounded text-neutral-400 hover:text-neutral-600 disabled:opacity-30 transition-colors"><ChevronUp className="w-3.5 h-3.5" /></button>
                        <button onClick={() => moveModule(mIndex, 1)} disabled={mIndex === form.modules.length - 1} className="p-1 rounded text-neutral-400 hover:text-neutral-600 disabled:opacity-30 transition-colors"><ChevronDown className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setExpandedModules((prev) => { const n = new Set(prev); n.has(module.id) ? n.delete(module.id) : n.add(module.id); return n; })} className="p-1 rounded text-neutral-400 hover:text-neutral-600 transition-colors">
                          {expandedModules.has(module.id) ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => deleteModule(module.id)} className="p-1 rounded text-neutral-400 hover:text-error-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    {expandedModules.has(module.id) && (
                      <div className="p-3 space-y-2">
                        {module.lessons.length === 0 ? (
                          <p className="text-xs text-neutral-400 text-center py-2">Aucune leçon dans ce module.</p>
                        ) : (
                          module.lessons.map((lesson, lIndex) => {
                            const LIcon = lessonTypeIcons[lesson.type] ?? FileText;
                            return (
                              <div key={lesson.id} className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 group">
                                <GripVertical className="w-3.5 h-3.5 text-neutral-300 flex-shrink-0" />
                                <LIcon className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-neutral-900 dark:text-white truncate">{lesson.title}</p>
                                  <p className="text-xs text-neutral-400">{lessonTypeLabels[lesson.type]} · {lesson.duration}{lesson.isFree ? ' · Gratuit' : ''}</p>
                                </div>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => moveLesson(module.id, lIndex, -1)} disabled={lIndex === 0} className="p-1 rounded text-neutral-400 hover:text-neutral-600 disabled:opacity-30"><ChevronUp className="w-3 h-3" /></button>
                                  <button onClick={() => moveLesson(module.id, lIndex, 1)} disabled={lIndex === module.lessons.length - 1} className="p-1 rounded text-neutral-400 hover:text-neutral-600 disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button>
                                  <button onClick={() => openEditLesson(module.id, lesson)} className="p-1 rounded text-neutral-400 hover:text-brand-600"><Edit2 className="w-3 h-3" /></button>
                                  <button onClick={() => deleteLesson(module.id, lesson.id)} className="p-1 rounded text-neutral-400 hover:text-error-600"><Trash2 className="w-3 h-3" /></button>
                                </div>
                              </div>
                            );
                          })
                        )}
                        <button onClick={() => addLesson(module.id)} className="w-full flex items-center justify-center gap-2 p-2 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-600 text-xs text-neutral-500 hover:border-brand-400 hover:text-brand-500 transition-colors">
                          <Plus className="w-3.5 h-3.5" /> Ajouter une leçon
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
          <div className="space-y-4">
            <Input label="Slug (URL)" value={form.slug} onChange={(e) => set('slug', slugify(e.target.value))} placeholder="nom-de-la-formation" />
            <Input label="Meta description SEO" value={form.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} placeholder="Description pour les moteurs de recherche (150-160 car.)" />
            <div className="space-y-2">
              {[
                { key: 'featured' as const, label: 'Formation à la une', desc: 'Mettre en avant sur la page d\'accueil' },
                { key: 'certificateEnabled' as const, label: 'Certificat de complétion', desc: 'Délivrer un certificat à la fin de la formation' },
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
            <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800">
              <p className="text-xs text-neutral-400 mb-2 font-medium uppercase tracking-wide">Aperçu Google</p>
              <p className="text-blue-600 dark:text-blue-400 text-sm font-medium truncate">{form.title || 'Titre de la formation'}</p>
              <p className="text-green-700 dark:text-green-500 text-xs mb-1">maxmorrys.com/formations/{form.slug || 'slug-formation'}</p>
              <p className="text-neutral-600 dark:text-neutral-400 text-xs line-clamp-2">{form.metaDescription || form.description || 'Description...'}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-700 mt-6">
          <Button variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
          <Button variant="outline" onClick={() => handleSave('draft')} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Brouillon
          </Button>
          <Button onClick={() => handleSave('published')} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            {editingId ? 'Mettre à jour' : 'Publier'}
          </Button>
        </div>
      </Modal>

      {/* Lesson editor */}
      {editingLesson && (
        <Modal open={!!editingLesson} onClose={() => setEditingLesson(null)} title="Éditer la leçon" size="lg">
          <div className="space-y-4">
            <Input
              label="Titre de la leçon *"
              value={editingLesson.lesson.title}
              onChange={(e) => setEditingLesson((prev) => prev ? { ...prev, lesson: { ...prev.lesson, title: e.target.value } } : prev)}
              placeholder="Titre..."
            />
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Type</label>
                <select
                  value={editingLesson.lesson.type}
                  onChange={(e) => setEditingLesson((prev) => prev ? { ...prev, lesson: { ...prev.lesson, type: e.target.value as Lesson['type'] } } : prev)}
                  className="w-full rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  {Object.entries(lessonTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <Input
                label="Durée"
                value={editingLesson.lesson.duration}
                onChange={(e) => setEditingLesson((prev) => prev ? { ...prev, lesson: { ...prev.lesson, duration: e.target.value } } : prev)}
                placeholder="ex: 15min"
              />
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingLesson.lesson.isFree}
                    onChange={(e) => setEditingLesson((prev) => prev ? { ...prev, lesson: { ...prev.lesson, isFree: e.target.checked } } : prev)}
                    className="rounded accent-brand-600 w-4 h-4"
                  />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">Leçon gratuite</span>
                </label>
              </div>
            </div>
            {editingLesson.lesson.type === 'video' && (
              <Input
                label="URL de la vidéo"
                value={editingLesson.lesson.videoUrl ?? ''}
                onChange={(e) => setEditingLesson((prev) => prev ? { ...prev, lesson: { ...prev.lesson, videoUrl: e.target.value } } : prev)}
                placeholder="https://youtube.com/... ou lien direct"
              />
            )}
            <RichEditor
              label="Contenu de la leçon"
              value={editingLesson.lesson.content}
              onChange={(v) => setEditingLesson((prev) => prev ? { ...prev, lesson: { ...prev.lesson, content: v } } : prev)}
              minHeight="250px"
              placeholder="Description, instructions, quiz... en markdown"
            />
            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <Button variant="outline" onClick={() => setEditingLesson(null)}>Annuler</Button>
              <Button onClick={saveLesson}>Enregistrer la leçon</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
