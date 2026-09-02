import { useEffect, useMemo, useState } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState, Field, Icon, LessonRow, Skeleton, StatTile, Tag, useToast } from '@ds';
import { ConsolePage, ConsoleFilter, ConsoleList, ConsoleScope, ConsoleSplit } from '../../components/console';
import UserPanel from './components/UserPanel';
import { SiteEyebrow } from '../../components/site';
import { Pagination } from '@/components/dialogs';
import { usePagination } from '../../hooks/usePagination';
import { useFormat } from '../../hooks/useFormat';
import { useAdminUsers } from './hooks/useAdminUsers';
import { UserEditModal, CreateUserModal } from './components/UserEditModal';
import type { User } from '../../types';

/**
 * LES COMPTES, SUR LE MOTIF DE CONSOLE.
 *
 * ⚠️ LE PIPELINE DU KIT NE PEUT PAS ÊTRE REPRIS TEL QUEL, ET C'EST UN MANQUE DE DONNÉES,
 * PAS UN CHOIX DE STYLE. Le kit annonce « tout · apprenants · admins · suspendus ». Les
 * trois premières étapes se lisent en base — `User.role` vaut `student`, `admin` ou
 * `support`. La quatrième n'existe nulle part : ni `User`, ni les règles Firestore, ni les
 * Cloud Functions ne portent d'état suspendu, et rien dans le dépôt ne permet d'en compter
 * un. Afficher « suspendus » aurait produit un zéro PERMANENT que l'opérateur lirait comme
 * « personne n'est suspendu » alors qu'il faut lire « la suspension n'existe pas » — la
 * confusion exacte que <Num> a été écrit pour empêcher.
 *
 * L'étape est donc remplacée par `support`, qui, elle, se compte — et le rôle support est
 * précisément celui dont dépend le garde de cette console (`lib/adminAccess`). Ce que la
 * quatrième étape du kit promettait est écrit noir sur blanc dans le pied de l'écran.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA TROISIÈME COLONNE — `handoff_tableaux_de_bord` § UtilisateursDesktop
 *
 * · LA FICHE SE LIT SANS OUVRIR DE MODALE. Voir `UserPanel`. Il ne montre QUE ce que le
 *   document utilisateur porte déjà : aucune lecture de plus à chaque changement de
 *   sélection, dans un écran fait pour faire défiler la file.
 *
 * · ET LA LIGNE REDEVIENT CONFORME. Elle portait une étiquette de rôle ET un bouton
 *   « Gérer » — deux contrôles pour une ligne, ce que le motif interdit, et un bouton dans
 *   le `trailing` d'un `LessonRow` qu'on rend maintenant cliquable serait un bouton
 *   imbriqué. « Gérer » part dans le panneau ; la ligne ne fait plus que sélectionner.
 */

type Stage = 'all' | User['role'];

export default function AdminUsers() {
  const { t } = useTranslation('admin');
  const { locale } = useFormat();
  const { addToast } = useToast();
  const state = useAdminUsers(addToast);

  const roleLabels: Record<User['role'], string> = {
    admin: t('users.roleAdmin'),
    support: t('users.roleSupport'),
    student: t('users.roleStudent'),
  };

  const {
    users, loading, search, setSearch, filtered, load,
    setEditUser,
    openEditUser,
    showAddUser, setShowAddUser,
  } = state;

  /** Zone 1 — les quatre étapes du kit, dont la quatrième est celle qui a une source. */
  const [stage, setStage] = useState<Stage>('all');
  /** Le compte ouvert dans le panneau. `null` = aucun, ce que le panneau sait dire. */
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
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
  const stageLabels: Record<Stage, string> = {
    all: t('users.stageAll'),
    student: t('users.stageStudents'),
    admin: t('users.stageAdmins'),
    support: t('users.stageSupport'),
  };
  const stages: Stage[] = ['all', 'student', 'admin', 'support'];
  const tileLabels: Record<Stage, string> = {
    all: t('users.tileAll'),
    student: t('users.tileStudents'),
    admin: t('users.tileAdmins'),
    support: t('users.tileSupport'),
  };

  /** Le relevé date de la dernière réponse de la requête, pas du rendu : une case de
   *  console porte la date de sa MESURE. */
  const [asOf, setAsOf] = useState(() => new Date());
  useEffect(() => { if (!loading) setAsOf(new Date()); }, [users, loading]);

  /** Les compteurs portent sur la BASE ENTIÈRE, pas sur ce que la recherche laisse voir. */
  const counts = useMemo(() => ({
    all: users.length,
    student: users.filter((u) => u.role === 'student').length,
    admin: users.filter((u) => u.role === 'admin').length,
    support: users.filter((u) => u.role === 'support').length,
  }), [users]);

  // `filtered` porte déjà la recherche du hook ; l'étape s'y ajoute sans la remplacer.
  const shown = useMemo(
    () => (stage === 'all' ? filtered : filtered.filter((u) => u.role === stage)),
    [filtered, stage],
  );

  const { paged, page, totalPages, setPage } = usePagination(shown);

  /* La sélection suit la liste VISIBLE : un filtre qui masque la ligne ouverte laisserait un
     panneau qui parle d'un compte devenu invisible. Le repli est la première ligne de la
     page courante — jamais rien tant qu'il y a quelqu'un à montrer. */
  const selected = shown.find((u) => u.uid === selectedUid) ?? paged[0] ?? null;

  return (
    // `.play` en dur : voir AdminDashboard — sans lui, `.rv` reste à `opacity: 0` et le
    // pied obligatoire du motif ne s'affiche pas du tout.
    <div className="play">
      <ConsolePage title={t('users.title')} sub={t('users.sub')}>
        <div className="mb-3.5 flex flex-wrap items-center justify-end gap-2">
          <Button size="sm" tone="quiet" onClick={load} disabled={loading}>
            {t('users.refresh')}
          </Button>
          <Button size="sm" onClick={() => setShowAddUser(true)}>
            {t('users.addUser')}
          </Button>
        </div>

        <ConsoleSplit
          detailLabel={t('users.panelEyebrow')}
          detail={!isWide ? null : (
            <UserPanel
              user={selected}
              loading={loading}
              asOf={asOf}
              onOpenFull={() => selected && openEditUser(selected)}
            />
          )}
        >
        <ConsoleFilter
          className="rv"
          stages={stages.map((s) => stageLabels[s])}
          active={stageLabels[stage]}
          onSelect={(label) => setStage(stages.find((s) => stageLabels[s] === label) ?? 'all')}
          label={t('users.pipelineLabel')}
        />

        {/* Deux cases de front à partir de la tablette. Elles passaient à QUATRE en `wide:`,
            au moment précis où la troisième colonne prend 380 px : chaque case tombait sous
            120 px de large et son libellé se coupait. */}
        <div className="mt-3.5 grid gap-2.5 stack:grid-cols-2">
          {stages.map((s) => (
            <StatTile
              key={s}
              label={tileLabels[s]}
              value={loading ? null : counts[s]}
              source="db"
              asOf={asOf}
            />
          ))}
        </div>

        <div className="mt-3.5 max-w-sm">
          <Field
            as="input"
            type="search"
            label={t('users.searchLabel')}
            hideLabel
            value={search}
            onChange={setSearch}
            placeholder={t('users.searchPlaceholder')}
            inputMode="search"
          />
        </div>

        <SiteEyebrow style={{ marginTop: '22px', marginBottom: '10px' }}>
          {stageLabels[stage]}
        </SiteEyebrow>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={60} radius="var(--r-l)" label={t('users.loading')} />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <EmptyState
            glyph={<Icon name="users" size={26} color="var(--mm-bleu)" />}
            glyphBackground="color-mix(in srgb, var(--mm-bleu) 22%, transparent)"
            title={t('users.emptyTitle')}
            body={t('users.emptyBody')}
          />
        ) : (
          <ConsoleList label={t('users.listLabel')} className="rv">
            {paged.map((u, i) => (
              <li key={u.uid}>
                {/* UN ÉTAT ET UNE ACTION PAR LIGNE : le rôle est l'état, sélectionner est
                    l'action. « Gérer » vit dans le panneau — un bouton dans le `trailing`
                    d'une ligne elle-même cliquable serait un bouton imbriqué, donc
                    inatteignable au clavier. */}
                <LessonRow
                  icon={<Icon name="user" size={14} color="var(--mm-bleu)" />}
                  iconBackground="color-mix(in srgb, var(--mm-bleu) 22%, transparent)"
                  title={u.displayName || u.email || t('users.noName')}
                  duration={u.createdAt
                    ? { value: new Date(u.createdAt).toLocaleDateString(locale), source: 'db', asOf }
                    : undefined}
                  meta={u.email}
                  trailing={
                    <Tag tone={u.role === 'admin' ? 'stop' : u.role === 'support' ? 'warn' : 'neutral'}>
                      {roleLabels[u.role]}
                    </Tag>
                  }
                  onClick={isWide ? () => setSelectedUid(u.uid) : () => openEditUser(u)}
                  last={i === paged.length - 1}
                />
              </li>
            ))}
          </ConsoleList>
        )}

        <div className="mt-4 flex justify-center">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>

        <ConsoleScope>{t('users.scope')}</ConsoleScope>
        </ConsoleSplit>
      </ConsolePage>

      {/* ── Fiche d'édition ── */}
      <UserEditModal
        editUser={state.editUser}
        onClose={() => setEditUser(null)}
        editTab={state.editTab}
        editForm={state.editForm}
        setEditForm={state.setEditForm}
        saving={state.saving}
        handleEditTabChange={state.handleEditTabChange}
        handleSaveUser={state.handleSaveUser}
        userEnrollments={state.userEnrollments}
        allFormations={state.allFormations}
        loadingEnrollments={state.loadingEnrollments}
        addFormationId={state.addFormationId}
        setAddFormationId={state.setAddFormationId}
        addingFormation={state.addingFormation}
        removingId={state.removingId}
        unenrolledFormations={state.unenrolledFormations}
        handleAddEnrollment={state.handleAddEnrollment}
        handleRemoveEnrollment={state.handleRemoveEnrollment}
        clubSub={state.clubSub}
        loadingClubSub={state.loadingClubSub}
        togglingClub={state.togglingClub}
        handleGrantClub={state.handleGrantClub}
        handleRevokeClub={state.handleRevokeClub}
        rysmoQuota={state.rysmoQuota}
        loadingRysmo={state.loadingRysmo}
        togglingRysmo={state.togglingRysmo}
        addTokenAmount={state.addTokenAmount}
        setAddTokenAmount={state.setAddTokenAmount}
        handleResetRysmo={state.handleResetRysmo}
        handleAddRysmoTokens={state.handleAddRysmoTokens}
      />

      {/* ── Création de compte ── */}
      <CreateUserModal
        open={showAddUser}
        onClose={() => setShowAddUser(false)}
        addForm={state.addForm}
        setAddForm={state.setAddForm}
        creatingUser={state.creatingUser}
        handleCreateUser={state.handleCreateUser}
      />
    </div>
  );
}
