import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Button, ChipRow, Field, GlassPanel, Icon, LessonRow, Num, ProgressBar, Skeleton, Switch, Tag } from '@ds';
import { functions } from '../../../config/firebase';
import { db } from '../../../config/db';
import { useAuth } from '../../../contexts/AuthContext';
import { useFormat } from '../../../hooks/useFormat';
import { useToast } from '../../../components/ui/Toast';
import { updateUserProfile } from '../../../lib/firestore';
import {
  APP_NAME, TUTOR_DEFAULT_NAME, TUTOR_NAME_MAX, TUTOR_NAME_SUGGESTIONS, tutorName, validateTutorName,
} from '../../../lib/naming';
import type { RysmoProfile, ContentEngagement } from '../../../types';
import type { EnrolledFormation } from '../hooks/useStudentData';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LA MÉMOIRE DU RÉPÉTITEUR — consultable ET effaçable, sans passer par le support.
 *
 * Recomposé sur `ui_kits/plateforme/ScreensRysmo.js` § RysmoMemoire.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE NOM DU RÉPÉTITEUR N'EST ÉCRIT NULLE PART DANS CE FICHIER.
 *
 * Il vient de `tutorName(userData)` — le seul accesseur du dépôt (AD-12). Chaque phrase de
 * cet écran l'interpole par `{{tutor}}` depuis `lmsTabs.rysmoMemory`, y compris les toasts et
 * le titre de confirmation. Un « Rysmo » écrit en dur ici ne casserait rien de visible : il
 * laisserait simplement une personne qui a renommé son répétiteur le retrouver sous son
 * ancien nom à un endroit sur treize.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LES QUATRE CHOSES QUE CET ÉCRAN FAIT
 *
 * · RENOMMER — le kit en fait le titre de l'écran (« DONNE-LUI UN NOM »), et c'est le
 *   chemin court : le nom du répétiteur est un réglage de la RELATION, il appartient donc à
 *   l'endroit où cette relation se règle, pas à un menu de préférences générales.
 * · CONSULTER — le résumé, le niveau estimé, les sujets, les points à renforcer, plus les
 *   centres d'intérêt déduits de l'engagement contenus. Chaque ligne porte la date à
 *   laquelle la mémoire a été écrite (`profile.updatedAt`), pas la date d'aujourd'hui.
 * · EFFACER — `clearRysmoMemory` est immédiat. La confirmation est posée EN LIGNE, dans le
 *   panneau, et non dans `ConfirmDialog` : ce composant importe `lucide-react`, ce qui aurait
 *   mis une seconde famille d'icônes sur cet écran.
 * · COUPER — l'interrupteur de consentement écrit `preferences.aiMemoryConsent`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE RENOMMAGE : CE QUI LE REND SÛR
 *
 * `validateTutorName()` est L'AUTORITÉ sur la validité — deux bornes, larges à dessein.
 * Seule sa DÉCISION est reprise ici, pas son message : ses `reason` sont écrits en français
 * dans `lib/naming`, et cette plateforme est bilingue. Le motif rendu vient donc de
 * `lmsTabs`, dans la langue de la personne.
 *
 * LE CHEMIN DE RETOUR EXISTE, ET IL EST EXPLICITE. `validateTutorName` refuse la chaîne
 * vide — à raison : un champ vidé retomberait sur le défaut sans le dire, et personne ne
 * saurait si le nom a été effacé ou perdu. « Revenir à Répétiteur » est donc un bouton, qui
 * n'apparaît que lorsqu'un renommage est en vigueur, et qui écrit le nom par défaut.
 *
 * LE NOM DOIT SUIVRE PARTOUT, TOUT DE SUITE. `StudentLayout` recalcule `titleMap` et
 * `sidebarSections` à chaque rendu depuis `tutorName(userData)` — sans mémo. Il suffit donc
 * que `userData` change dans le contexte : `refreshUserData()` relit le document et appelle
 * `setUserData`, l'objet de contexte est mémoïsé sur `userData`, et tous les `useAuth()` se
 * re-rendent. L'onglet porte le nouveau nom sans rechargement.
 * ⚠️ `refreshUserData` AVALE SES ERREURS (`catch { }` dans `AuthContext`). Si la relecture
 * échoue, l'écriture, elle, a réussi : l'écran affiche le nouveau nom — `saveTutorName` pose
 * le brouillon lui-même — mais l'onglet garde l'ancien jusqu'au prochain chargement. C'est le
 * seul écart possible, et il est silencieux : il vaut d'être signalé plus haut que ce fichier.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const clearRysmoMemory = httpsCallable<Record<string, never>, { success: boolean }>(functions, 'clearRysmoMemory');

interface RysmoMemoryTabProps {
  enrolledFormations: EnrolledFormation[];
}

export default function RysmoMemoryTab({ enrolledFormations }: RysmoMemoryTabProps) {
  const { t } = useTranslation('lmsTabs');
  const { user, userData, refreshUserData } = useAuth();
  const { addToast } = useToast();
  const { formatDate } = useFormat();

  const tutor = tutorName(userData);
  const consent = userData?.preferences?.aiMemoryConsent !== false;
  const [profile, setProfile] = useState<RysmoProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [topCategories, setTopCategories] = useState<string[]>([]);
  const [recentContent, setRecentContent] = useState<ContentEngagement[]>([]);
  const [draftName, setDraftName] = useState(tutor);
  const [nameError, setNameError] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [savingConsent, setSavingConsent] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setLoadingProfile(true);
    try {
      const snap = await getDoc(doc(db, 'rysmoProfiles', user.uid));
      setProfile(snap.exists() ? (snap.data() as RysmoProfile) : null);
    } catch {
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
    // Centres d'intérêt déduits de l'engagement contenus
    try {
      const engSnap = await getDocs(query(
        collection(db, `users/${user.uid}/engagement`),
        orderBy('lastAt', 'desc'),
        limit(12),
      ));
      const items = engSnap.docs.map((d) => d.data() as ContentEngagement);
      const byCat = new Map<string, number>();
      items.forEach((e) => {
        const score = Math.min(e.scrollPctMax ?? 0, 100) / 100 + Math.min(e.dwellSec ?? 0, 600) / 600 + Math.min(e.mediaSec ?? 0, 1800) / 1800;
        byCat.set(e.category || 'général', (byCat.get(e.category || 'général') ?? 0) + score);
      });
      setTopCategories([...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c]) => c));
      setRecentContent(items.slice(0, 5));
    } catch {
      setTopCategories([]);
      setRecentContent([]);
    }
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  /*
   * LE BROUILLON SUIT LE NOM COMMITTÉ, ET C'EST OBLIGATOIRE ICI.
   *
   * `useState(tutor)` ne lit sa valeur qu'au PREMIER rendu. Or `userData` est encore `null` à
   * ce moment-là — `tutorName()` rend alors le défaut, exprès, pour que l'écran s'affiche au
   * lieu de clignoter. Sans cette synchronisation, quelqu'un qui a renommé son répétiteur
   * « Tonton » ouvrait cet écran sur un champ affichant « Répétiteur », et l'enregistrer
   * l'aurait renommé à son insu.
   *
   * La comparaison porte sur la CHAÎNE : un `refreshUserData()` déclenché par l'interrupteur
   * de consentement change l'objet `userData` sans changer le nom, et ne vient donc pas
   * écraser ce que la personne est en train de taper.
   */
  useEffect(() => {
    setDraftName(tutor);
    setNameError(null);
  }, [tutor]);

  /**
   * Écrit le nom. `validateTutorName` décide ; le motif affiché est traduit ici.
   *
   * `refreshUserData()` est attendu AVANT le toast : le message annonce un nom qui doit déjà
   * être celui de l'onglet quand on lève les yeux.
   */
  const saveTutorName = async (raw: string) => {
    if (!user) return;
    const verdict = validateTutorName(raw);
    if (!verdict.ok) {
      setNameError(
        raw.trim().length === 0
          ? t('rysmoMemory.renameErrorEmpty')
          : t('rysmoMemory.renameErrorTooLong', { max: TUTOR_NAME_MAX }),
      );
      return;
    }
    setNameError(null);
    setSavingName(true);
    try {
      await updateUserProfile(user.uid, { tutorName: verdict.value });
      await refreshUserData();
      setDraftName(verdict.value);
      addToast('success', t('rysmoMemory.toastRenamed', { tutor: verdict.value }));
    } catch {
      addToast('error', t('rysmoMemory.toastRenameError'));
    } finally {
      setSavingName(false);
    }
  };

  const handleToggleConsent = async (checked: boolean) => {
    if (!user || !userData) return;
    setSavingConsent(true);
    try {
      await updateUserProfile(user.uid, { preferences: { ...userData.preferences, aiMemoryConsent: checked } });
      await refreshUserData();
      addToast('success', checked ? t('rysmoMemory.toastMemoryOn') : t('rysmoMemory.toastMemoryOff'));
    } catch {
      addToast('error', t('rysmoMemory.toastUpdateError'));
    } finally {
      setSavingConsent(false);
    }
  };

  const handleClear = async () => {
    if (!user) return;
    setClearing(true);
    try {
      await clearRysmoMemory({});
      setProfile(null);
      setTopCategories([]);
      setRecentContent([]);
      addToast('success', t('rysmoMemory.toastResetSuccess'));
    } catch {
      addToast('error', t('rysmoMemory.toastResetError'));
    } finally {
      setClearing(false);
      setConfirming(false);
    }
  };

  const inProgress = enrolledFormations.filter((ef) => ef.enrollment.progress < 100);
  const completed = enrolledFormations.filter((ef) => ef.enrollment.progress >= 100);

  /* La mémoire porte SA date d'écriture, pas celle d'aujourd'hui : c'est ce qui distingue
     « il sait ça depuis le 12 août » de « il vient de le réapprendre ». */
  const memoryAsOf = profile?.updatedAt ? new Date(profile.updatedAt) : new Date();
  const asOf = new Date();

  const renamed = tutor !== TUTOR_DEFAULT_NAME;
  const dirty = draftName.trim() !== tutor;

  return (
    <div className="space-y-[16px]">
      {/* ── LE RENOMMAGE ──
          En tête, pas enfoui : c'est la première chose qu'on veut faire en arrivant ici.
          Un répétiteur qu'on peut nommer est un répétiteur qu'on tutoie sans effort. */}
      <section>
        <p className="mm-eyebrow m-0">{t('rysmoMemory.renameEyebrow')}</p>
        <h2 className="m-0 mt-[4px] font-display text-dsp-xs text-ink">{t('rysmoMemory.renameTitle')}</h2>

        <GlassPanel level="hero" padding={20} className="mt-[12px]">
          <Field
            label={t('rysmoMemory.renameLabel')}
            value={draftName}
            onChange={(v) => { setDraftName(v); if (nameError) setNameError(null); }}
            maxLength={TUTOR_NAME_MAX}
            error={nameError ?? undefined}
            hint={
              nameError
                ? undefined
                : renamed
                  ? t('rysmoMemory.renameHintCustom', { default: TUTOR_DEFAULT_NAME })
                  : t('rysmoMemory.renameHintDefault', { default: TUTOR_DEFAULT_NAME })
            }
            style={{ marginTop: 0 }}
          />

          {/* Quatre propositions plutôt qu'un champ vide : modifier un nom est une décision
              beaucoup plus facile que d'en produire un. `value` est TOUJOURS passé — sans
              lui, <ChipRow> activerait sa première pilule et prétendrait un choix fait. */}
          <ChipRow
            label={t('rysmoMemory.renameSuggestionsLabel')}
            options={TUTOR_NAME_SUGGESTIONS}
            value={draftName}
            onChange={(name) => { setDraftName(name); setNameError(null); }}
            height={40}
            style={{ marginTop: '14px' }}
          />

          <div className="mt-[14px] flex flex-wrap gap-[8px]">
            <Button
              tone="transforme"
              size="sm"
              fullWidth={false}
              disabled={!dirty || savingName}
              loading={savingName}
              onClick={() => void saveTutorName(draftName)}
            >
              {savingName ? t('rysmoMemory.renameSaving') : t('rysmoMemory.renameSave')}
            </Button>
            {/* Le chemin de retour. Il n'existe que lorsqu'il y a quelque chose à annuler —
                et il écrit le nom par défaut plutôt que de vider le champ, parce qu'un champ
                vidé retomberait sur « Répétiteur » sans jamais le dire. */}
            {renamed && (
              <Button
                tone="quiet"
                size="sm"
                fullWidth={false}
                disabled={savingName}
                onClick={() => void saveTutorName(TUTOR_DEFAULT_NAME)}
              >
                {t('rysmoMemory.renameReset', { default: TUTOR_DEFAULT_NAME })}
              </Button>
            )}
          </div>

          {/* Ce que le renommage change, et ce qu'il ne change pas. « Rysmo » est le nom de
              l'APPLICATION : il ne se renomme pas, et il vient de `lib/naming`. */}
          <p className="m-0 mt-[12px] text-small leading-[1.5]" style={{ color: 'var(--text-muted)' }}>
            {t('rysmoMemory.renameNote', { app: APP_NAME })}
          </p>
        </GlassPanel>
      </section>

      {/* ── Le consentement ──────────────────────────────────────────────────── */}
      <GlassPanel level="flat" padding={18}>
        <div className="flex items-start gap-[11px]">
          <span aria-hidden="true" className="mt-[2px] flex-shrink-0" style={{ color: 'var(--mm-violet-t)' }}>
            <Icon name="lock" size={17} strokeWidth={2.4} />
          </span>
          <p className="m-0 text-meta-2 leading-[1.5]" style={{ color: 'var(--text-muted)' }}>
            {t('rysmoMemory.consentIntro', { tutor })}
          </p>
        </div>
        <div className="mt-[14px] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="m-0 text-meta font-semibold text-ink">{t('rysmoMemory.memoryLabel', { tutor })}</p>
            <p className="m-0 mt-[2px] text-small" style={{ color: 'var(--text-muted)' }}>
              {savingConsent
                ? t('rysmoMemory.updating')
                : consent ? t('rysmoMemory.memoryOn') : t('rysmoMemory.memoryOff')}
            </p>
          </div>
          <Switch
            on={consent}
            label={t('rysmoMemory.memoryLabel', { tutor })}
            disabled={savingConsent}
            onChange={(v) => void handleToggleConsent(v)}
          />
        </div>
      </GlassPanel>

      {/* ── Ce qu'il retient ─────────────────────────────────────────────────── */}
      <section>
        <p className="mm-eyebrow m-0">{t('rysmoMemory.memoryEyebrow')}</p>
        <h2 className="m-0 mt-[4px] font-display text-dsp-xs text-ink">{t('rysmoMemory.remembersTitle')}</h2>

        {loadingProfile ? (
          <div className="mt-[12px] grid gap-[8px]">
            {[0, 1].map((i) => <Skeleton key={i} height={54} radius="var(--r-m)" label={t('rysmoMemory.loading')} />)}
          </div>
        ) : !consent ? (
          <GlassPanel level="flat" padding={18} className="mt-[12px]">
            <p className="m-0 text-meta" style={{ color: 'var(--text-muted)' }}>{t('rysmoMemory.disabledText')}</p>
          </GlassPanel>
        ) : !profile ? (
          <GlassPanel level="flat" padding={18} className="mt-[12px]">
            <p className="m-0 text-meta" style={{ color: 'var(--text-muted)' }}>{t('rysmoMemory.noMemoriesText')}</p>
          </GlassPanel>
        ) : (
          <GlassPanel level="flat" padding="6px 18px" className="mt-[12px]">
            {profile.summary && (
              <LessonRow
                state="plain"
                icon={<Icon name="chat" size={14} style={{ color: 'var(--mm-violet-t)' }} />}
                iconBackground="color-mix(in srgb, var(--mm-violet) 12%, transparent)"
                title={profile.summary}
                meta={
                  <>
                    {t('rysmoMemory.summary')}
                    {profile.updatedAt && (
                      <> · <Num value={formatDate(profile.updatedAt)} source="db" asOf={memoryAsOf} /></>
                    )}
                  </>
                }
              />
            )}
            {profile.level && (
              <LessonRow
                state="plain"
                icon={<Icon name="bars" size={14} style={{ color: 'var(--mm-violet-t)' }} />}
                iconBackground="color-mix(in srgb, var(--mm-violet) 12%, transparent)"
                title={profile.level}
                meta={t('rysmoMemory.estimatedLevel')}
              />
            )}
            {profile.topics?.length > 0 && (
              <div className="border-b border-[color:var(--border-hair)] py-[13px]">
                <p className="mm-eyebrow m-0 mb-[7px]">{t('rysmoMemory.topics')}</p>
                <div className="flex flex-wrap gap-[6px]">
                  {profile.topics.map((topic) => <Tag key={topic}>{topic}</Tag>)}
                </div>
              </div>
            )}
            {profile.weakSpots?.length > 0 && (
              <div className="py-[13px]">
                <p className="mm-eyebrow m-0 mb-[7px]">{t('rysmoMemory.weakSpots')}</p>
                <div className="flex flex-wrap gap-[6px]">
                  {profile.weakSpots.map((spot) => <Tag key={spot} tone="warn">{spot}</Tag>)}
                </div>
              </div>
            )}
          </GlassPanel>
        )}

        {/* ── L'effacement. Deux temps, en ligne, sans feuille modale. ────────── */}
        {consent && (
          <div className="mt-[14px]">
            {confirming ? (
              <GlassPanel level="flat" padding={18}>
                <p className="m-0 text-meta font-semibold text-ink">{t('rysmoMemory.confirmTitle', { tutor })}</p>
                <p className="m-0 mt-[5px] text-meta-2 leading-[1.5]" style={{ color: 'var(--text-muted)' }}>
                  {t('rysmoMemory.confirmText')}
                </p>
                <div className="mt-[14px] flex flex-wrap gap-[8px]">
                  <Button tone="quiet" size="sm" fullWidth={false} onClick={() => setConfirming(false)} disabled={clearing}>
                    {t('notes.cancel')}
                  </Button>
                  <Button
                    tone="primary"
                    size="sm"
                    fullWidth={false}
                    loading={clearing}
                    disabled={clearing}
                    onClick={() => void handleClear()}
                  >
                    {clearing ? t('rysmoMemory.confirmResetting') : t('rysmoMemory.confirmReset')}
                  </Button>
                </div>
              </GlassPanel>
            ) : (
              <>
                <Button tone="quiet" onClick={() => setConfirming(true)} style={{ color: 'var(--stop)' }}>
                  {t('rysmoMemory.reset')}
                </Button>
                <p className="m-0 mt-[8px] text-small" style={{ color: 'var(--text-muted)' }}>
                  {t('rysmoMemory.resetHint')}
                </p>
              </>
            )}
          </div>
        )}

        {/* L'encart de vérité : ce que l'effacement fait, et ce que cet écran ne fait pas. */}
        <GlassPanel level="truth" className="mt-[14px]">
          <p className="mm-eyebrow m-0 mb-[6px]">{t('rysmoMemory.clearTitle')}</p>
          <p className="m-0 text-meta-2 leading-[1.5]" style={{ color: 'var(--text-muted)' }}>
            {t('rysmoMemory.clearBody')}
          </p>
          {/*
            POURQUOI L'EFFACEMENT EST GLOBAL, ET PAS LIGNE À LIGNE.

            La maquette (`screens-rysmo.jsx` § RysmoMemoire) pose un bouton « Oublier » sur
            chaque ligne et annonce « tu peux en retirer une, ou tout effacer ». Ce n'est pas
            implémentable honnêtement ici, et la raison est dans le modèle :

            `rysmoProfiles/{uid}` est en écriture SERVEUR SEULE (`firestore.rules`), et il est
            RÉGÉNÉRÉ par `persistAndSummarize` à partir du transcript de `rysmoConversations`
            dès que le seuil de résumé est franchi. Retirer un sujet du profil sans retirer les
            messages qui l'ont produit le ferait donc revenir au résumé suivant — et on ne sait
            pas remonter d'un sujet résumé aux messages qui l'ont nourri.

            L'effacement global, lui, supprime les DEUX documents : le sujet ne revient pas.
            C'est pour ça qu'il est le seul geste offert, et l'écran le dit plutôt que de poser
            un bouton qui promettrait d'oublier sans oublier.
          */}
          <p className="m-0 mt-[10px] text-meta-2 text-ink-2 leading-[1.5]">
            {t('rysmoMemory.clearWhyAll')}
          </p>
        </GlassPanel>
        <div className="mt-[12px] flex flex-wrap gap-[6px]">
          <Tag>{t('rysmoMemory.tagPrivate')}</Tag>
          <Tag tone="ok">{t('rysmoMemory.tagErasable')}</Tag>
        </div>
      </section>

      {/* ── Les centres d'intérêt déduits de l'activité ──────────────────────── */}
      {consent && (topCategories.length > 0 || recentContent.length > 0) && (
        <section>
          <p className="mm-eyebrow m-0">{t('rysmoMemory.interestsTitle')}</p>
          <p className="m-0 mt-[4px] text-meta-2" style={{ color: 'var(--text-muted)' }}>
            {t('rysmoMemory.interestsSubtitle')}
          </p>
          <GlassPanel level="flat" padding={18} className="mt-[10px]">
            {topCategories.length > 0 && (
              <>
                <p className="mm-eyebrow m-0 mb-[7px]">{t('rysmoMemory.favoriteCategories')}</p>
                <div className="flex flex-wrap gap-[6px]">
                  {topCategories.map((c) => <Tag key={c}>{c}</Tag>)}
                </div>
              </>
            )}
            {recentContent.length > 0 && (
              <div className={topCategories.length > 0 ? 'mt-[14px]' : undefined}>
                <p className="mm-eyebrow m-0 mb-[7px]">{t('rysmoMemory.recentlyViewed')}</p>
                {recentContent.map((e, i) => (
                  <LessonRow
                    key={`${e.slug}-${i}`}
                    state="plain"
                    icon={<Icon name={e.type === 'article' ? 'doc' : e.type === 'video' ? 'video' : 'play'} size={14} />}
                    title={e.title}
                    meta={e.category}
                    last={i === recentContent.length - 1}
                  />
                ))}
              </div>
            )}
          </GlassPanel>
        </section>
      )}

      {/* ── Le parcours, qui l'oriente même sans mémoire ─────────────────────── */}
      <section>
        <p className="mm-eyebrow m-0">{t('rysmoMemory.journeyTitle')}</p>
        <p className="m-0 mt-[4px] text-meta-2" style={{ color: 'var(--text-muted)' }}>
          {t('rysmoMemory.journeySubtitle', { tutor })}
        </p>
        <GlassPanel level="flat" padding={18} className="mt-[10px]">
          {enrolledFormations.length === 0 ? (
            <p className="m-0 text-meta" style={{ color: 'var(--text-muted)' }}>{t('rysmoMemory.noFormation')}</p>
          ) : (
            <>
              {inProgress.length > 0 && (
                <>
                  <p className="mm-eyebrow m-0 mb-[8px]">{t('rysmoMemory.inProgress')}</p>
                  {inProgress.map((ef) => (
                    <div key={ef.enrollment.id} className="mb-[12px]">
                      <p className="m-0 mb-[5px] truncate text-meta-2 text-ink">
                        {ef.formation?.title ?? ef.enrollment.formationId}
                      </p>
                      <ProgressBar
                        value={ef.enrollment.progress}
                        source="db"
                        asOf={asOf}
                        height={6}
                        label={t('rysmoMemory.progressLabel')}
                        readout
                      />
                    </div>
                  ))}
                </>
              )}
              {completed.length > 0 && (
                <div className={inProgress.length > 0 ? 'mt-[6px]' : undefined}>
                  <p className="mm-eyebrow m-0 mb-[8px]">{t('rysmoMemory.completed')}</p>
                  <div className="flex flex-wrap gap-[6px]">
                    {completed.map((ef) => (
                      <Tag key={ef.enrollment.id} tone="ok">{ef.formation?.title ?? ef.enrollment.formationId}</Tag>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </GlassPanel>
      </section>
    </div>
  );
}
