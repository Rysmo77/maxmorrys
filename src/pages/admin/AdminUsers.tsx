import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState, Field, Icon, LessonRow, Skeleton, StatTile, Tag } from '@ds';
import { ConsolePage, ConsoleFilter, ConsoleList, ConsoleScope } from '../../components/console';
import { SiteEyebrow } from '../../components/site';
import Pagination from '../../components/ui/Pagination';
import { useToast } from '../../components/ui/Toast';
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

        <ConsoleFilter
          className="rv"
          stages={stages.map((s) => stageLabels[s])}
          active={stageLabels[stage]}
          onSelect={(label) => setStage(stages.find((s) => stageLabels[s] === label) ?? 'all')}
          label={t('users.pipelineLabel')}
        />

        <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
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
                {/* UN ÉTAT ET UNE ACTION PAR LIGNE : le rôle est l'état, « Gérer » est
                    l'action. La ligne elle-même n'est pas cliquable — sinon le bouton
                    de fin deviendrait un bouton dans un bouton, inatteignable au clavier. */}
                <LessonRow
                  icon={<Icon name="user" size={14} color="var(--mm-bleu)" />}
                  iconBackground="color-mix(in srgb, var(--mm-bleu) 22%, transparent)"
                  title={u.displayName || u.email || t('users.noName')}
                  duration={u.createdAt
                    ? { value: new Date(u.createdAt).toLocaleDateString(locale), source: 'db', asOf }
                    : undefined}
                  meta={u.email}
                  trailing={
                    <span className="flex items-center gap-2">
                      <Tag tone={u.role === 'admin' ? 'stop' : u.role === 'support' ? 'warn' : 'neutral'}>
                        {roleLabels[u.role]}
                      </Tag>
                      <Button size="sm" tone="quiet" onClick={() => openEditUser(u)}>
                        {t('users.manage')}
                      </Button>
                    </span>
                  }
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
