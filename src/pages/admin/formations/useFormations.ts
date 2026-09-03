import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@ds';
import { getAllFormations, saveFormation, deleteFormation, listWaitlist } from '../../../lib/firestore';
import { slugify } from '../../../lib/utils';
import { generateSlugEn } from '../../../lib/slugEn';
import { captureError } from '../../../lib/sentry';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import { usePagination } from '../../../hooks/usePagination';
import { buildPublishChecklist, type PublishStage } from './publishChecklist';
import type { Formation, Module, Lesson, WaitlistEntry } from '../../../types';
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

/**
 * Le pipeline de la console. « publié » y désigne désormais ce qui est OUVERT : une formation
 * en Coming Soon est publiée elle aussi, mais la ranger avec les autres rendrait invisible la
 * seule question qui compte dans cet écran — qu'est-ce qui est réellement en vente.
 */
export type FormationStage = 'all' | 'published' | 'comingSoon' | 'draft';
export type FormationTab = 'info' | 'curriculum' | 'settings' | 'publish' | 'waitlist';

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
  comingSoon: boolean;
  launchAt: string;
  launchLabel: string;
  preorderEnabled: boolean;
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
  comingSoon: false, launchAt: '', launchLabel: '', preorderEnabled: false,
  focusKeyword: '', metaTitle: '', metaDescription: '', ogTitle: '',
  ogDescription: '', ogImage: '', noIndex: false, canonicalUrl: '',
  modules: [],
};

const generateId = () => crypto.randomUUID();

/**
 * La checklist de publication d'une formation DÉJÀ EN BASE, pour l'étiquette de sa ligne.
 *
 * ⚠️ L'étape se lit sur le DOCUMENT, pas sur l'intention en cours. Sans ça, toute formation en
 * Coming Soon — qui n'a par construction aucune leçon — s'afficherait « incomplète » dans la
 * liste et dans le panneau latéral, éternellement, alors qu'elle est exactement dans l'état
 * qu'on a voulu pour elle.
 */
export function formationChecklist(f: Formation) {
  return buildPublishChecklist({
    title: f.title ?? '',
    description: f.description ?? '',
    price: String(f.price ?? ''),
    promoPrice: f.promoPrice ? String(f.promoPrice) : '',
    coverImage: f.coverImage ?? '',
    modules: f.modules ?? [],
  }, f.comingSoon ? 'comingSoon' : 'live');
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

/**
 * PRÉVENIR LA LISTE D'ATTENTE — le jour de l'ouverture, et sur un geste explicite.
 *
 * Volontairement PAS appelée par `handleSave` : ouvrir une formation et prévenir les gens qui
 * l'attendent sont deux décisions. On ouvre parfois à 23 h en corrigeant une coquille, et
 * l'e-mail promis est unique — il ne doit pas partir en effet de bord d'un enregistrement.
 *
 * Son marqueur d'idempotence est `waitlistNotifiedAt`, distinct de `publishNotifiedAt`.
 */
const notifyWaitlist = httpsCallable<
  { formationId: string },
  { ok: boolean; notified: number; mailsEnvoyes?: number; mailsEchoues?: number; alreadyNotified: boolean }
>(functions, 'notifyWaitlist');

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
      comingSoon: f.comingSoon ?? false,
      launchAt: f.launchAt ?? '',
      launchLabel: f.launchLabel ?? '',
      preorderEnabled: f.preorderEnabled ?? false,
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

  /**
   * TROIS INTENTIONS, DEUX STATUTS.
   *
   * `comingSoon` et `published` écrivent tous deux `status: 'published'` — c'est le principe
   * du drapeau, qui laisse les règles de lecture et toutes les requêtes du produit intactes.
   * Ce qui les sépare tient dans un booléen, et dans ce que la fiche montre.
   */
  const handleSave = useCallback(async (intent: 'draft' | 'comingSoon' | 'published') => {
    if (!form.title.trim() || !form.description.trim()) {
      addToast('error', t('formations.toastTitleDescRequired'));
      return;
    }
    setSaving(true);
    try {
      const status: 'draft' | 'published' = intent === 'draft' ? 'draft' : 'published';
      const comingSoon = intent === 'comingSoon';

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
        comingSoon,
        /*
         * Écrits même à vide, et c'est nécessaire : `saveFormation` fusionne (`setDoc` en
         * `merge`). Sans réécriture explicite, une date d'ouverture posée puis retirée — ou
         * une précommande refermée — survivrait au document, invisible dans le formulaire et
         * bien vivante sur la fiche publique. Le passage en ouverture doit tout effacer.
         */
        launchAt: comingSoon ? form.launchAt.trim() : '',
        launchLabel: comingSoon ? form.launchLabel.trim() : '',
        preorderEnabled: comingSoon && form.preorderEnabled,
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
      /*
       * ⚠️ PAS D'ALERTE SUR UNE PUBLICATION EN « BIENTÔT », ET C'EST LE PIÈGE LE PLUS CHER.
       *
       * `notifyOnPublish` annonce « une nouvelle formation est en ligne » — ce qui serait faux
       * pour une fiche qu'on ne peut ni lire ni acheter. Surtout, il pose `publishNotifiedAt`
       * AVANT d'écrire : déclenché ici, il consommerait le jeton d'idempotence, et l'alerte du
       * jour de la VRAIE ouverture ne partirait jamais — sans erreur, sans trace, et sans que
       * rien à l'écran ne le laisse deviner.
       *
       * Les gens qui attendent cette formation-là sont prévenus autrement : par la liste
       * d'attente, sur un geste explicite, à l'ouverture.
       */
      if (intent === 'published' && savedId) {
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

  /**
   * PRÉVENIR LA LISTE D'ATTENTE. Geste explicite, jamais automatique.
   *
   * Le serveur refuse tant que la formation porte encore le drapeau `comingSoon` : on ouvre
   * d'abord, on annonce ensuite. Il refuse aussi le second envoi — l'e-mail promis est unique.
   */
  const [notifying, setNotifying] = useState(false);

  const handleNotifyWaitlist = useCallback(async (id: string) => {
    setNotifying(true);
    try {
      const { data: envoi } = await notifyWaitlist({ formationId: id });
      if (envoi.alreadyNotified) {
        addToast('info', t('formations.toastWaitlistAlready'));
      } else {
        addToast('success', t('formations.toastWaitlistNotified', { count: envoi.notified }));
      }
      load();
    } catch (error: unknown) {
      captureError(error, { context: 'Notify formation waitlist failed' });
      addToast('error', error instanceof Error ? error.message : t('formations.toastWaitlistError'));
    } finally {
      setNotifying(false);
    }
  }, [addToast, load, t]);

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

  // ── Les deux définitions de « publiable », recalculées à chaque frappe ───────────────
  /*
   * DEUX LISTES, ET LES DEUX EN PERMANENCE. Chaque bouton du pied de modale a sa propre
   * condition d'activation : on doit pouvoir dire « prêt pour une annonce, pas pour une
   * ouverture » sans faire basculer l'écran d'un mode à l'autre.
   */
  const checklistFor = useCallback((etape: PublishStage) => buildPublishChecklist({
    title: form.title,
    description: form.description,
    price: form.price,
    promoPrice: form.promoPrice,
    coverImage: form.coverImage,
    modules: form.modules,
  }, etape), [form.title, form.description, form.price, form.promoPrice, form.coverImage, form.modules]);

  const checklistLive = useMemo(() => checklistFor('live'), [checklistFor]);
  const checklistComingSoon = useMemo(() => checklistFor('comingSoon'), [checklistFor]);

  /*
   * `checklist` reste la liste AFFICHÉE, et elle suit ce qu'on est en train de faire : éditer
   * une formation déjà en « bientôt » montre ses conditions à elle, pas celles de l'ouverture.
   */
  const checklist = form.comingSoon ? checklistComingSoon : checklistLive;

  const totalLessons = checklistLive.items[0].counts.lessons;

  const counts = useMemo(() => ({
    all: list.length,
    // « publiées » = OUVERTES. Une formation à venir a son propre compartiment : les confondre
    // masquerait la seule question de cet écran — qu'est-ce qui est réellement en vente.
    published: list.filter((f) => f.status === 'published' && !f.comingSoon).length,
    comingSoon: list.filter((f) => f.status === 'published' && f.comingSoon === true).length,
    draft: list.filter((f) => f.status !== 'published').length,
  }), [list]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return list.filter((f) => {
      const matchSearch = !needle
        || (f.title ?? '').toLowerCase().includes(needle)
        || (f.category ?? '').toLowerCase().includes(needle);
      const publiee = f.status === 'published';
      const matchStage = stage === 'all'
        || (stage === 'published' && publiee && !f.comingSoon)
        || (stage === 'comingSoon' && publiee && f.comingSoon === true)
        || (stage === 'draft' && !publiee);
      return matchSearch && matchStage;
    });
  }, [list, search, stage]);

  const pagination = usePagination(filtered);

  /*
   * Les deux chiffres de la liste d'attente sont lus sur le DOCUMENT en base, pas sur le
   * formulaire : ils sont écrits par le serveur (`joinWaitlist`, `notifyWaitlist`) et n'ont
   * donc aucun miroir dans l'état d'édition. Les recopier dans `FormationFormState` aurait
   * créé un second exemplaire qu'un enregistrement aurait pu écraser.
   */
  /*
   * Les inscrits ne sont lus QU'À L'OUVERTURE DE L'ONGLET. C'est une collection qui peut
   * compter des centaines de documents, et la console s'ouvre le plus souvent pour éditer un
   * titre : la charger au montage ferait payer une lecture par formation ouverte à quiconque
   * ne regarde jamais cet onglet.
   */
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [waitlistLoading, setWaitlistLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== 'waitlist' || !editingId) return;
    let vivant = true;
    setWaitlistLoading(true);
    listWaitlist(editingId)
      .then((r) => { if (vivant) setWaitlist(r); })
      .catch((error: unknown) => {
        captureError(error, { context: `listWaitlist(${editingId})` });
        if (vivant) setWaitlist([]);
      })
      .finally(() => { if (vivant) setWaitlistLoading(false); });
    return () => { vivant = false; };
  }, [activeTab, editingId]);

  const editing = editingId ? list.find((x) => x.id === editingId) ?? null : null;
  const selectedWaitlistCount = editing?.waitlistCount ?? 0;
  const waitlistAlreadyNotified = typeof editing?.waitlistNotifiedAt === 'string';

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
    checklist, checklistLive, checklistComingSoon, totalLessons,
    notifying, handleNotifyWaitlist, selectedWaitlistCount, waitlistAlreadyNotified,
    waitlist, waitlistLoading,
    confirm,
  };
}
