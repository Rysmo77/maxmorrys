import { useState } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useTranslation } from 'react-i18next';
import {
  Button, DocLine, Field, GlassPanel, Icon, IconButton, LessonRow, Num, ProgressBar,
  Segmented, Skeleton, Switch, Tag, type IconName,
} from '@ds';
import { ConsolePage, ConsoleFilter, ConsoleList, ConsoleScope, ConsoleSplit } from '../../components/console';
import PublishPanel from './components/PublishPanel';
import { SiteEyebrow } from '../../components/site';
import { Modal } from '@/components/dialogs';
import ImageInput from '@/components/forms/ImageInput';
import RichEditor from '@/components/forms/RichEditor';
import { ConfirmDialog } from '@/components/dialogs';
import { Pagination } from '@/components/dialogs';
import SEOPanel from '../../components/shared/SEOPanel';
import { formatPrice, slugify } from '../../lib/utils';
import {
  useFormations, formationChecklist, LEVEL_KEYS, LESSON_TYPE_KEYS,
  type FormationStage, type FormationTab, type FormationFormState,
} from './formations/useFormations';
import type { PublishChecklist, PublishConditionId, PublishStage } from './formations/publishChecklist';
import type { Formation, Lesson } from '../../types';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * FORMATIONS · l'écran où le kit prend sa décision la plus structurante
 *
 *     « La checklist EST la définition de publiable. »
 *
 * ⚠️ CE N'EST PLUS VRAI, et le renversement est délibéré. Le pied de modale désactivait ses
 * boutons tant qu'une ligne était orange ; il ne le fait plus. La liste demeure — dans
 * l'onglet « Publier », dans le panneau latéral, et sous les boutons où elle NOMME ce qui
 * manque — mais elle informe au lieu de décider.
 *
 * ⚠️ Il y a désormais DEUX portes, avec deux listes distinctes : ANNONCER en « bientôt »
 * (quatre conditions, sans les leçons) et OUVRIR à la vente (cinq). Elles sont argumentées
 * une par une dans `formations/publishChecklist.ts`, qui fait foi sur ce sujet.
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
 *
 * ─── LA TROISIÈME COLONNE — `handoff_tableaux_de_bord` § FormationsDesktop ─────────────
 *
 * La checklist quitte le quatrième onglet d'une modale pour vivre EN FACE de la liste. Le
 * défaut qu'elle corrige est de séquence : pour savoir pourquoi un brouillon ne peut pas
 * être publié, il fallait l'ouvrir, aller à l'onglet « Publier », lire, fermer — puis
 * recommencer sur le suivant. C'est le geste le plus fréquent de l'écran. Elle reste aussi
 * dans l'éditeur, où elle sert au moment d'agir. Voir `PublishPanel`.
 *
 * L'ALERTE « TA BOUTIQUE EST FERMÉE » entre également, telle que la maquette la pose :
 * en tête de la colonne de travail, et SEULEMENT si la condition est vraie dans les données —
 * au moins une formation en base, aucune publiée. Les deux nombres viennent des compteurs
 * déjà calculés par `useFormations`, aucun n'est écrit à la main.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

const LESSON_ICONS: Record<Lesson['type'], IconName> = {
  video: 'video', text: 'doc', quiz: 'info', resource: 'download', mission: 'case',
};

export default function AdminFormations() {
  const { t } = useTranslation('admin');
  const f = useFormations();
  /** La formation ouverte dans le panneau des conditions. */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /*
    ── LE TÉLÉPHONE GARDE EXACTEMENT L'ÉCRAN QU'IL AVAIT ────────────────────────────
    `ConsoleSplit` n'arme sa grille qu'à partir de 1080 px ; en dessous, le panneau
    redevient un bloc EMPILÉ SOUS la liste. Pour un panneau informatif c'est sans
    conséquence — c'est le cas du tableau de bord depuis le premier lot. Pour un panneau
    qui porte la seule ACTION de l'écran, ça l'est : toucher une ligne pousserait ce
    qu'on vient chercher hors de l'écran, derrière toute la longueur de la file.

    Le panneau n'est donc monté qu'au-delà de 1080 px, et sous cette largeur la ligne
    refait exactement ce qu'elle faisait avant. Un seul contenu, deux véhicules — c'est
    la même règle que `TutorPanel` applique côté espace apprenant, pour une raison
    voisine : ce qui coûte quelque chose ne se cache pas en CSS, il ne se monte pas.
  */
  const isWide = useMediaQuery('(min-width: 1080px)');

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

  const stageKeys: FormationStage[] = ['all', 'published', 'comingSoon', 'draft'];
  const stageLabels: Record<FormationStage, string> = {
    all: `${t('formations.console.stageAll')} ${f.counts.all}`,
    published: `${t('formations.console.stagePublished')} ${f.counts.published}`,
    comingSoon: `${t('formations.console.stageComingSoon')} ${f.counts.comingSoon}`,
    draft: `${t('formations.console.stageDrafts')} ${f.counts.draft}`,
  };

  /* L'onglet n'apparaît que sur une formation DÉJÀ EN BASE : sans identifiant, il n'y a
     aucune liste à lire, et un onglet vide à l'ouverture d'un formulaire neuf est du bruit. */
  const tabKeys: FormationTab[] = f.editingId
    ? ['info', 'curriculum', 'settings', 'publish', 'waitlist']
    : ['info', 'curriculum', 'settings', 'publish'];
  const tabLabels: Record<FormationTab, string> = {
    info: t('formations.tabInfo'),
    curriculum: t('formations.tabCurriculum', { count: f.totalLessons }),
    settings: t('formations.tabSettings'),
    publish: t('formations.console.tabPublish'),
    waitlist: t('formations.console.tabWaitlist', { count: f.selectedWaitlistCount }),
  };

  /** L'état de la ligne. « À compléter » = la checklist n'est pas remplie. */
  const rowState = (item: Formation) => {
    if (item.status === 'published' && item.comingSoon) {
      // Publiée, mais fermée. Le ton `warn` le dit : c'est en ligne sans être en vente.
      return { tone: 'warn' as const, label: t('formations.console.tagComingSoon'), ink: 'var(--warn)' };
    }
    if (item.status === 'published') {
      return { tone: 'ok' as const, label: t('formations.statusPublished'), ink: 'var(--ok)' };
    }
    return formationChecklist(item).ready
      ? { tone: 'warn' as const, label: t('formations.console.tagReady'), ink: 'var(--warn)' }
      : { tone: 'stop' as const, label: t('formations.console.tagBlocked'), ink: 'var(--stop)' };
  };

  /*
   * ⚠️ LES LIBELLÉS DÉPENDENT DE LA PORTE, pas seulement de la condition.
   *
   * `modules` n'exige pas la même chose des deux côtés : « aucun module vide » pour ouvrir,
   * « au moins un module » pour annoncer. Servir le libellé d'ouverture sur la liste d'annonce
   * affichait donc une exigence qu'on venait précisément de lever — et laissait croire qu'il
   * fallait écrire les leçons pour publier un « bientôt ».
   */
  /* La liste détaillée montre la porte de l'état COURANT du document — c'est la même règle
     que `f.checklist` côté hook, et les deux doivent rester d'accord. */
  const etapeAffichee: PublishStage = f.form.comingSoon ? 'comingSoon' : 'live';
  const racine = (etape: PublishStage) => (etape === 'comingSoon' ? 'checkComingSoon' : 'check');
  const conditionLabel = (id: PublishConditionId, etape: PublishStage = 'live') =>
    t(`formations.console.${racine(etape)}.${id}.title`);

  /*
   * CE QUI MANQUE, NOMMÉ.
   *
   * Le pied de modale disait « une condition au moins n'est pas remplie — voir l'onglet
   * Publier », et l'onglet, lui, n'affichait la liste que d'UNE des deux portes. Il fallait
   * donc deviner laquelle bloquait, et sur une formation qu'on veut seulement ANNONCER, la
   * liste montrée était celle de l'ouverture — avec sa ligne « leçons » en rouge, impossible
   * à satisfaire par construction. Le message envoyait vers un écran qui égarait.
   */
  const manquantes = (list: PublishChecklist, etape: PublishStage) =>
    list.items.filter((c) => !c.ok).map((c) => conditionLabel(c.id, etape)).join(' · ');
  const conditionMeta = (
    id: PublishConditionId,
    ok: boolean,
    counts: { modules: number; lessons: number; emptyModules: number; emptyLessons: number },
    etape: PublishStage = 'live',
  ) => t(`formations.console.${racine(etape)}.${id}.${ok ? 'ok' : 'ko'}`, counts);

  /* La sélection suit la liste FILTRÉE : un filtre qui masque la ligne ouverte laisserait
     un panneau qui parle d'une formation devenue invisible. Le repli est la première ligne
     de la page courante — la console s'ouvre sur ce qui bloque, pas sur une colonne vide. */
  const selected = f.filtered.find((x) => x.id === selectedId) ?? f.paged[0] ?? null;

  /* LA BOUTIQUE EST FERMÉE : au moins une formation en base, aucune OUVERTE. La condition
     est lue dans les compteurs, jamais supposée — le kit écrit « 2 formations, 0 publiée »
     en quatre endroits qui se contredisent, et aucun de ces nombres n'est repris.

     ⚠️ `counts.published` ne compte plus que les formations ouvertes, précisément pour que
     cette ligne reste vraie : un catalogue entièrement en « bientôt » est une boutique
     fermée. Il a des fiches, des tarifs et des listes d'attente — il n'a rien à vendre. */
  const shopClosed = !f.loading && f.counts.all > 0 && f.counts.published === 0;

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

      <ConsoleSplit
        detailLabel={t('formations.console.panelEyebrow')}
        detail={!isWide ? null : (
          <PublishPanel
            formation={selected}
            loading={f.loading}
            onOpenFull={() => selected && f.openEdit(selected)}
          />
        )}
      >

      {/* ── L'alerte, en tête, et seulement si elle est VRAIE dans les données ─────────── */}
      {shopClosed && (
        <GlassPanel
          level="night"
          padding={18}
          className="rv mb-3.5"
          style={{ borderColor: 'color-mix(in srgb, var(--mm-orange) 40%, transparent)' }}
        >
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid h-[34px] w-[34px] flex-none place-items-center rounded-[11px]"
              style={{ background: 'color-mix(in srgb, var(--mm-orange) 22%, transparent)' }}
            >
              <Icon name="alert" size={18} color="var(--warn)" strokeWidth={2.6} />
            </span>
            <p className="m-0 flex-1 text-meta text-ink-2">
              <b className="text-warn">{t('formations.console.shopClosedTitle')}</b>{' '}
              {t('formations.console.shopClosedBody', { count: f.counts.all })}
            </p>
          </div>
        </GlassPanel>
      )}

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
                      /* La ligne SÉLECTIONNE, elle n'ouvre plus l'éditeur : les conditions
                         de publication s'affichent en face, et c'est ce qu'on vient lire.
                         L'éditeur s'ouvre depuis le panneau, une fois la raison connue. */
                      onClick={isWide ? () => setSelectedId(item.id) : () => f.openEdit(item)}
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
      </ConsoleSplit>

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
            <div className="grid gap-4 stack:grid-cols-3">
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
            <div className="grid gap-4 stack:grid-cols-3">
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

            {/* ── L'ANNONCE ──────────────────────────────────────────────────────────────
                Ce bloc ne s'affiche QUE sur une formation en « bientôt ». Sur une formation
                ouverte, ces trois réglages ne veulent rien dire, et `handleSave` les efface
                de toute façon à l'ouverture : les montrer laisserait croire qu'ils tiennent.

                Il est en lecture pure du document (`f.form.comingSoon`), donc il apparaît dès
                qu'on rouvre une formation annoncée, et disparaît dès qu'on l'ouvre. */}
            {f.form.comingSoon && (
              <GlassPanel level="flat" padding={18} className="mt-4">
                <SiteEyebrow>{t('formations.console.announceTitle')}</SiteEyebrow>
                <p className="m-0 mb-3 mt-1 text-small leading-[1.5] text-ink-2">
                  {t('formations.console.announceIntro')}
                </p>
                <Field
                  label={t('formations.fieldLaunchAt')}
                  type="date"
                  value={f.form.launchAt}
                  onChange={(v) => f.set('launchAt', v)}
                  hint={t('formations.console.launchAtHint')}
                />
                <Field
                  label={t('formations.fieldLaunchLabel')}
                  value={f.form.launchLabel}
                  onChange={(v) => f.set('launchLabel', v)}
                  placeholder={t('formations.fieldLaunchLabelPlaceholder')}
                  hint={t('formations.console.launchLabelHint')}
                />
                <div className="mt-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="m-0 text-meta font-semibold text-ink">{t('formations.optPreorderLabel')}</p>
                    <p className="m-0 text-meta-2 text-ink-2">{t('formations.optPreorderDesc')}</p>
                  </div>
                  <Switch
                    on={f.form.preorderEnabled}
                    label={t('formations.optPreorderLabel')}
                    onChange={(on) => f.set('preorderEnabled', on)}
                  />
                </div>
              </GlassPanel>
            )}

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

            {/* ── LES DEUX PORTES, CÔTE À CÔTE ──────────────────────────────────────────
                Publier n'est plus un seul geste : on peut ANNONCER une formation qui n'est pas
                écrite, ou l'OUVRIR. Chaque porte a sa liste, et sans ce résumé il fallait
                deviner laquelle était atteignable — la liste détaillée ci-dessous ne montre
                que celle de l'état courant. */}
            <GlassPanel level="flat" padding={18} className="mt-4">
              <SiteEyebrow>{t('formations.console.doorsTitle')}</SiteEyebrow>
              <div className="mt-2">
                {([
                  { cle: 'comingSoon' as const, liste: f.checklistComingSoon, libelle: t('formations.console.doorComingSoon') },
                  { cle: 'live' as const, liste: f.checklistLive, libelle: t('formations.console.doorLive') },
                ]).map((porte, i) => (
                  <LessonRow
                    key={porte.cle}
                    icon={(
                      <Icon
                        name={porte.liste.ready ? 'check' : 'alert'}
                        size={13}
                        color={porte.liste.ready ? 'var(--ok)' : 'var(--warn)'}
                      />
                    )}
                    iconBackground={`color-mix(in srgb, ${porte.liste.ready ? 'var(--ok)' : 'var(--warn)'} 18%, transparent)`}
                    title={porte.libelle}
                    meta={porte.liste.ready
                      ? t('formations.console.doorReady')
                      : t('formations.console.doorMissing', { conditions: manquantes(porte.liste, porte.cle) })}
                    trailing={(
                      <Tag tone={porte.liste.ready ? 'ok' : 'warn'}>
                        {porte.liste.ready
                          ? t('formations.console.doorTagReady')
                          : t('formations.console.doorTagBlocked')}
                      </Tag>
                    )}
                    last={i === 1}
                  />
                ))}
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
                    title={conditionLabel(c.id, etapeAffichee)}
                    meta={conditionMeta(c.id, c.ok, c.counts, etapeAffichee)}
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

            {/* ── LA LISTE D'ATTENTE ────────────────────────────────────────────────────
                Visible dès qu'il y a quelqu'un dessus, y compris APRÈS l'ouverture : c'est
                là qu'on déclenche l'alerte, et l'alerte ne se déclenche qu'une fois la
                formation ouverte. Le masquer après la bascule cacherait le bouton au moment
                exact où il sert. */}
            {f.editingId && (f.selectedWaitlistCount > 0 || f.form.comingSoon) && (
              <GlassPanel level="flat" padding={18} className="mt-4">
                <SiteEyebrow>{t('formations.console.waitlistTitle')}</SiteEyebrow>
                <div className="mt-2">
                  <Num
                    value={f.selectedWaitlistCount}
                    source="db"
                    asOf={f.loadedAt ?? new Date()}
                    unit={t('formations.console.waitlistUnit', { count: f.selectedWaitlistCount })}
                    showAsOf
                  />
                </div>

                <Button
                  size="sm"
                  tone="quiet"
                  fullWidth
                  className="mt-3"
                  onClick={() => f.editingId && f.handleNotifyWaitlist(f.editingId)}
                  disabled={
                    f.notifying || f.form.comingSoon || f.selectedWaitlistCount === 0 || f.waitlistAlreadyNotified
                  }
                  loading={f.notifying}
                >
                  {t('formations.console.waitlistNotifyAction')}
                </Button>

                {/* La raison du blocage est écrite À CÔTÉ du bouton. Un bouton inactif sans
                    explication se lit comme une panne. */}
                <p className="m-0 mt-2 text-small leading-[1.5] text-ink-2">
                  {f.waitlistAlreadyNotified
                    ? t('formations.console.waitlistAlreadySent')
                    : f.form.comingSoon
                      ? t('formations.console.waitlistNotifyBlocked')
                      : t('formations.console.waitlistNotifyReady')}
                </p>
              </GlassPanel>
            )}

            <p className="m-0 mt-3 text-small leading-[1.5] text-ink-2">
              {t('formations.console.checklistNotAGuard')}
            </p>
          </div>
        )}

        {/* ── LES INSCRITS ──────────────────────────────────────────────────────────────
            Ce que la liste d'attente a réellement produit, nom par nom. Le compteur du
            panneau de publication est un agrégat écrit par le serveur ; ici on lit les
            documents, ce qui permet de voir si le compteur et la collection s'accordent. */}
        {f.activeTab === 'waitlist' && (
          <div className="mt-1">
            <SiteEyebrow>{t('formations.console.waitlistTitle')}</SiteEyebrow>
            {f.waitlistLoading ? (
              <Skeleton height={72} radius="var(--r-xl)" />
            ) : f.waitlist.length === 0 ? (
              <GlassPanel level="flat" padding={18}>
                <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">
                  {t('formations.console.waitlistEmpty')}
                </p>
              </GlassPanel>
            ) : (
              <ConsoleList label={t('formations.console.waitlistTitle')}>
                {f.waitlist.map((entree, i) => (
                  <li key={entree.id}>
                    <LessonRow
                      icon={<Icon name="mail" size={13} color="var(--ink-2)" />}
                      iconBackground="var(--fill-2)"
                      title={entree.email}
                      meta={[
                        entree.createdAt.slice(0, 10),
                        entree.language.toUpperCase(),
                      ].join(' · ')}
                      trailing={entree.notifiedAt
                        ? <Tag tone="ok">{t('formations.console.waitlistNotifiedTag')}</Tag>
                        : <Tag tone="warn">{t('formations.console.waitlistPendingTag')}</Tag>}
                      last={i === f.waitlist.length - 1}
                    />
                  </li>
                ))}
              </ConsoleList>
            )}
          </div>
        )}

        <div className="mt-6 border-t border-[color:var(--line)] pt-6">
          <div className="flex flex-col gap-3 stack:flex-row stack:justify-end">
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
            {/* ── LES DEUX PORTES SONT OUVERTES EN PERMANENCE ──────────────────────────
                Les boutons ne se désactivaient plus qu'une fois la checklist complète. Ce
                verrou a été RETIRÉ sur décision explicite : la liste informe, elle ne décide
                plus. Le seul refus qui subsiste est celui de `handleSave` — titre et résumé —
                parce qu'un document sans eux n'a ni fiche ni URL exploitable.

                ⚠️ Ce qui protège réellement n'a pas bougé, et n'a jamais été ici :
                `resolveCheckoutTotal` (Worker) refuse le devis et le débit d'un document non
                publié ou fermé, et `isFreeFormation` (`firestore.rules`) refuse
                l'auto-inscription. Ces deux-là tiennent quoi qu'on publie. */}
            <Button
              size="sm"
              tone="quiet"
              onClick={() => f.handleSave('comingSoon')}
              disabled={f.saving}
              loading={f.saving}
            >
              {t('formations.publishComingSoon')}
            </Button>
            <Button
              size="sm"
              onClick={() => f.handleSave('published')}
              disabled={f.saving}
              loading={f.saving}
            >
              {f.editingId ? t('formations.update') : t('formations.publish')}
            </Button>
          </div>
          {/* L'AVERTISSEMENT REMPLACE LE VERROU. Il nomme ce qui manque pour la porte visée,
              et n'empêche rien — mais il ne disparaît pas non plus : publier une fiche sans
              couverture l'envoie au flux Meta avec le visuel générique du site, et l'ouvrir
              sans leçon vend un lecteur qui n'a rien à lire. */}
          {!f.checklistLive.ready && (
            <p className="m-0 mt-3 text-right text-small leading-[1.5] text-warn">
              {f.checklistComingSoon.ready
                ? t('formations.console.publishWarnOpenOnly', {
                  conditions: manquantes(f.checklistLive, 'live'),
                })
                : t('formations.console.publishWarnBoth', {
                  conditions: manquantes(f.checklistComingSoon, 'comingSoon'),
                })}
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
          <div className="grid gap-4 stack:grid-cols-2">
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
