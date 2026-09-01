import { useTranslation } from 'react-i18next';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { useAuth } from '../../../contexts/AuthContext';
import { useFormat } from '../../../hooks/useFormat';
import type { User, Enrollment, Formation, ClubDigitosSubscription } from '../../../types';
import type { EditTab, EditForm, AddForm } from '../hooks/useAdminUsers';
import { Field, Icon } from '@ds';
import ConsoleListSkeleton from './ConsoleListSkeleton';

/* ── Edit User Modal ── */

interface UserEditModalProps {
  editUser: User | null;
  onClose: () => void;
  editTab: EditTab;
  editForm: EditForm;
  setEditForm: React.Dispatch<React.SetStateAction<EditForm>>;
  saving: boolean;
  handleEditTabChange: (tab: EditTab) => void;
  handleSaveUser: () => void;
  // Formations tab
  userEnrollments: Enrollment[];
  allFormations: Formation[];
  loadingEnrollments: boolean;
  addFormationId: string;
  setAddFormationId: (id: string) => void;
  addingFormation: boolean;
  removingId: string | null;
  unenrolledFormations: Formation[];
  handleAddEnrollment: () => void;
  handleRemoveEnrollment: (enrollment: { id: string; formationId: string }) => void;
  // Club tab
  clubSub: ClubDigitosSubscription | null;
  loadingClubSub: boolean;
  togglingClub: boolean;
  handleGrantClub: () => void;
  handleRevokeClub: (status: ClubDigitosSubscription['status']) => void;
  // Rysmo (tokens IA) tab
  rysmoQuota: { dayKey: string | null; dayCount: number; packBalance: number } | null;
  loadingRysmo: boolean;
  togglingRysmo: boolean;
  addTokenAmount: string;
  setAddTokenAmount: (v: string) => void;
  handleResetRysmo: () => void;
  handleAddRysmoTokens: () => void;
}

export function UserEditModal({
  editUser, onClose, editTab, editForm, setEditForm, saving,
  handleEditTabChange, handleSaveUser,
  userEnrollments, allFormations, loadingEnrollments,
  addFormationId, setAddFormationId, addingFormation, removingId,
  unenrolledFormations, handleAddEnrollment, handleRemoveEnrollment,
  clubSub, loadingClubSub, togglingClub, handleGrantClub, handleRevokeClub,
  rysmoQuota, loadingRysmo, togglingRysmo, addTokenAmount, setAddTokenAmount,
  handleResetRysmo, handleAddRysmoTokens,
}: UserEditModalProps) {
  // Only an admin may grant the 'admin' role. Firestore rules enforce this
  // server-side too; gating the option avoids a misleading affordance for support.
  const { t } = useTranslation('adminClub');
  const { locale } = useFormat();
  const { userData } = useAuth();
  const canAssignAdmin = userData?.role === 'admin';
  return (
    <Modal open={!!editUser} onClose={onClose} title={t('userEdit.title')}>
      {editUser && (
        <div className="space-y-4">
          {/* User header */}
          <div className="flex items-center gap-3 p-4 bg-[color:var(--fill-1)] rounded-xl">
            <div className="w-12 h-12 rounded-full bg-[color-mix(in_srgb,var(--mm-bleu)_5%,transparent)] flex items-center justify-center flex-shrink-0 overflow-hidden">
              {editUser.photoURL ? (
                <img src={editUser.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-forme">
                  {(editUser.displayName || editUser.email || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="font-semibold text-ink">{editUser.displayName || t('userEdit.noName')}</p>
              <p className="text-sm text-ink-2">{editUser.email}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-[color:var(--fill-2)] rounded-xl p-1">
            {([
              { id: 'info', label: t('userEdit.tabs.info') },
              { id: 'formations', label: t('userEdit.tabs.formations') },
              { id: 'club', label: t('userEdit.tabs.club'), icon: 'crown' as const },
              { id: 'rysmo', label: t('userEdit.tabs.rysmo'), icon: 'bot' as const },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleEditTabChange(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  editTab === tab.id
                    ? 'bg-surface-sheet text-ink shadow-sm'
                    : 'text-ink-2 hover:text-ink dark:hover:text-ink-2'
                }`}
              >
                {'icon' in tab && <Icon name={tab.icon} size={14} className="text-transforme-txt" />}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Info tab */}
          {editTab === 'info' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field size="sm" label={t('userEdit.info.firstName')} value={editForm.firstName} onChange={(v) => setEditForm((p) => ({ ...p, firstName: v }))} placeholder={t('userEdit.info.firstName')} />
                <Field size="sm" label={t('userEdit.info.lastName')} value={editForm.lastName} onChange={(v) => setEditForm((p) => ({ ...p, lastName: v }))} placeholder={t('userEdit.info.lastName')} />
              </div>
              <Field size="sm" label={t('userEdit.info.displayName')} value={editForm.displayName} onChange={(v) => setEditForm((p) => ({ ...p, displayName: v }))} placeholder={t('userEdit.info.displayName')} />
              <Field size="sm" label={t('userEdit.info.email')} value={editForm.email} />
              <div className="grid grid-cols-2 gap-3">
                <Field size="sm" label={t('userEdit.info.phone')} value={editForm.phone} onChange={(v) => setEditForm((p) => ({ ...p, phone: v }))} placeholder={t('userEdit.info.phonePlaceholder')} />
                <Field size="sm" label={t('userEdit.info.whatsapp')} value={editForm.whatsapp} onChange={(v) => setEditForm((p) => ({ ...p, whatsapp: v }))} placeholder={t('userEdit.info.phonePlaceholder')} />
              </div>
              <Field size="sm" label={t('userEdit.info.linkedin')} type="url" value={editForm.linkedin} onChange={(v) => setEditForm((p) => ({ ...p, linkedin: v }))} placeholder="https://linkedin.com/in/..." />
              <Field size="sm" label={t('userEdit.info.birthDate')} type="date" value={editForm.birthDate} onChange={(v) => setEditForm((p) => ({ ...p, birthDate: v }))} />
              <Field size="sm" label={t('userEdit.info.bio')} as="textarea" value={editForm.bio} onChange={(v) => setEditForm((p) => ({ ...p, bio: v }))} rows={2} placeholder={t('userEdit.info.bioPlaceholder')} />
              <div className="space-y-1">
                <Field
                  size="sm"
                  as="select"
                  label={t('userEdit.info.role')}
                  value={editForm.role}
                  onChange={(v) => setEditForm((p) => ({ ...p, role: v as User['role'] }))}
                  options={[
                    { value: 'student', label: t('userEdit.info.roleStudent') },
                    { value: 'support', label: t('userEdit.info.roleSupport') },
                    // L'entrée « admin » n'apparaît que si la personne a le droit de
                    // l'attribuer — ou si l'utilisateur édité l'est déjà, sinon la modale
                    // afficherait un rôle vide pour un compte qui en a un.
                    ...(canAssignAdmin || editForm.role === 'admin'
                      ? [{ value: 'admin', label: t('userEdit.info.roleAdmin') }]
                      : []),
                  ]}
                />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <Button variant="outline" onClick={onClose}>{t('userEdit.info.cancel')}</Button>
                <Button onClick={handleSaveUser} disabled={saving} loading={saving} icon={<Icon name="save" size={16} />}>
                  {saving ? t('userEdit.info.saving') : t('userEdit.info.save')}
                </Button>
              </div>
            </div>
          )}

          {/* Formations tab */}
          {editTab === 'formations' && (
            <div className="space-y-4">
              {/* Add formation */}
              <div className="flex gap-2">
                <Field
                  size="sm"
                  as="select"
                  hideLabel
                  label={t('userEdit.formations.selectLabel')}
                  value={addFormationId}
                  onChange={setAddFormationId}
                  placeholder={t('userEdit.formations.selectPlaceholder')}
                  options={unenrolledFormations.map((f) => ({ value: f.id, label: f.title }))}
                  className="flex-1"
                  style={{ marginTop: 0 }}
                />
                <Button
                  size="sm"
                  onClick={handleAddEnrollment}
                  disabled={!addFormationId || addingFormation}
                  icon={<Icon name="plus" size={16} />}
                >
                  {t('userEdit.formations.activate')}
                </Button>
              </div>

              {/* Enrolled list */}
              {loadingEnrollments ? (
                <ConsoleListSkeleton />
              ) : userEnrollments.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-[color:var(--line)] rounded-xl">
                  <Icon name="book" size={32} className="text-ink-2 mx-auto mb-2" />
                  <p className="text-sm text-ink-2">{t('userEdit.formations.empty')}</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {userEnrollments.map((enrollment) => {
                    const formation = allFormations.find((f) => f.id === enrollment.formationId);
                    return (
                      <div key={enrollment.id} className="flex items-center gap-3 p-3 bg-[color:var(--fill-1)] rounded-xl">
                        <Icon name="check-circle" className={`w-4 h-4 flex-shrink-0 ${enrollment.progress === 100 ? 'text-ok' : 'text-ink-2'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink truncate">
                            {formation?.title ?? enrollment.formationId}
                          </p>
                          <p className="text-xs text-ink-2">{t('userEdit.formations.progress', { progress: enrollment.progress })}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveEnrollment(enrollment)}
                          disabled={removingId === enrollment.id}
                          className="p-1.5 rounded-lg text-ink-2 hover:text-stop hover:bg-[color-mix(in_srgb,var(--stop)_8%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--stop)_20%,transparent)] transition-colors flex-shrink-0"
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Club des Digitos tab */}
          {editTab === 'club' && (
            <div className="space-y-4">
              {loadingClubSub ? (
                <ConsoleListSkeleton />
              ) : (
                <>
                  {/* Status card */}
                  <div className={`rounded-2xl p-5 border ${
                    clubSub?.status === 'active'
                      ? 'bg-[color-mix(in_srgb,var(--mm-violet)_6%,transparent)] border-[color-mix(in_srgb,var(--mm-violet)_22%,transparent)]'
                      : clubSub?.status === 'pending'
                      ? 'bg-[color-mix(in_srgb,var(--warn)_4%,transparent)] border-[color-mix(in_srgb,var(--warn)_18%,transparent)]'
                      : 'bg-[color:var(--fill-1)] border-[color:var(--line)]'
                  }`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        clubSub?.status === 'active'
                          ? 'bg-[color-mix(in_srgb,var(--mm-violet)_18%,transparent)]'
                          : 'bg-[color:var(--fill-3)]'
                      }`}>
                        <Icon name="crown" className={`w-5 h-5 ${clubSub?.status === 'active' ? 'text-transforme-txt' : 'text-ink-2'}`} />
                      </div>
                      <div>
                        <p className="font-bold text-ink text-sm">{t('userEdit.club.title')}</p>
                        <p className={`text-xs font-semibold ${
                          clubSub?.status === 'active' ? 'text-transforme-txt' :
                          clubSub?.status === 'pending' ? 'text-warn' :
                          'text-ink-2'
                        }`}>
                          {!clubSub ? t('userEdit.club.noSubscription') :
                           clubSub.status === 'active' ? t('userEdit.club.statusActive') :
                           clubSub.status === 'pending' ? t('userEdit.club.statusPending') :
                           clubSub.status === 'expired' ? t('userEdit.club.statusExpired') : t('userEdit.club.statusCancelled')}
                        </p>
                      </div>
                    </div>

                    {clubSub && (
                      <div className="space-y-1 text-xs text-ink-2 mb-0">
                        <p>{t('userEdit.club.start', { date: new Date(clubSub.startedAt).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) })}</p>
                        <p>{t('userEdit.club.expiration', { date: new Date(clubSub.expiresAt).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) })}</p>
                        <p>{t('userEdit.club.renewal', { value: clubSub.autoRenew ? t('userEdit.club.renewalAuto') : t('userEdit.club.renewalManual') })}</p>
                        <p>{t('userEdit.club.amount', { amount: clubSub.amount?.toLocaleString(locale) ?? '' })}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    {(!clubSub || clubSub.status !== 'active') && (
                      <Button
                        className="w-full"
                        onClick={handleGrantClub}
                        disabled={togglingClub} loading={togglingClub}
                        icon={<Icon name="crown" size={16} />}
                      >
                        {togglingClub ? t('userEdit.club.granting') : t('userEdit.club.grant')}
                      </Button>
                    )}

                    {clubSub?.status === 'active' && (
                      <>
                        <Button
                          className="w-full"
                          onClick={() => {
                            // Renew 1 more year from now
                            handleGrantClub();
                          }}
                          disabled={togglingClub}
                          variant="outline"
                          icon={<Icon name="crown" size={16} />}
                        >
                          {t('userEdit.club.renew')}
                        </Button>
                        <button
                          onClick={() => handleRevokeClub('cancelled')}
                          disabled={togglingClub}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-stop text-stop hover:bg-[color-mix(in_srgb,var(--stop)_8%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--stop)_20%,transparent)] text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          <Icon name="close" size={16} />
                          {t('userEdit.club.revoke')}
                        </button>
                      </>
                    )}

                    {clubSub?.status === 'pending' && (
                      <Button
                        className="w-full"
                        onClick={() => handleRevokeClub('active')}
                        disabled={togglingClub}
                        icon={<Icon name="check-circle" size={16} />}
                      >
                        {togglingClub ? t('userEdit.club.granting') : t('userEdit.club.confirmPayment')}
                      </Button>
                    )}
                  </div>

                  <p className="text-xs text-ink-2 text-center">
                    {t('userEdit.club.note')}
                  </p>
                </>
              )}
            </div>
          )}

          {/* Tokens IA (Rysmo) tab */}
          {editTab === 'rysmo' && (
            <div className="space-y-4">
              {loadingRysmo ? (
                <ConsoleListSkeleton />
              ) : (
                <>
                  {/* Status card */}
                  <div className="rounded-2xl p-5 border bg-[color-mix(in_srgb,var(--mm-teal)_4%,transparent)] border-[color-mix(in_srgb,var(--mm-teal)_18%,transparent)]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[color-mix(in_srgb,var(--mm-teal)_9%,transparent)] flex items-center justify-center flex-shrink-0">
                        <Icon name="bot" size={20} className="text-digitalise-txt" />
                      </div>
                      <div>
                        <p className="font-bold text-ink text-sm">{t('userEdit.rysmo.title')}</p>
                        <p className="text-xs text-ink-2">{t('userEdit.rysmo.subtitle')}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-[color-mix(in_srgb,var(--paper)_60%,transparent)] p-3">
                        <p className="text-xs text-ink-2">{t('userEdit.rysmo.usedToday')}</p>
                        <p className="text-xl font-black text-ink">{rysmoQuota?.dayCount ?? 0}</p>
                      </div>
                      <div className="rounded-xl bg-[color-mix(in_srgb,var(--paper)_60%,transparent)] p-3">
                        <p className="text-xs text-ink-2">{t('userEdit.rysmo.prepaid')}</p>
                        <p className="text-xl font-black text-digitalise-txt">{rysmoQuota?.packBalance ?? 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Reset daily counter */}
                  <button
                    onClick={handleResetRysmo}
                    disabled={togglingRysmo}
                    aria-busy={togglingRysmo || undefined}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[color:var(--line)] text-ink-2 hover:bg-[color:var(--fill-1)] dark:hover:bg-[color-mix(in_srgb,var(--night-3)_30%,transparent)] text-sm font-medium transition-colors disabled:opacity-50${togglingRysmo ? ' mm-loading' : ''}`}
                  >
                    <Icon name="rotate" size={16} />
                    {t('userEdit.rysmo.reset')}
                  </button>

                  {/* Add tokens */}
                  <div className="space-y-2">
                    <label htmlFor="rysmo-add-tokens" className="text-xs font-semibold text-ink-2">{t('userEdit.rysmo.addLabel')}</label>
                    <div className="flex gap-2">
                      {/* Pas de `label` ici : le `<label htmlFor>` au-dessus est le libellé du
                          champ, et il est déjà lié. Un second libellé en sr-only ferait
                          annoncer le champ deux fois. */}
                      <Field
                        size="sm"
                        id="rysmo-add-tokens"
                        type="number"
                        inputMode="numeric"
                        min="1"
                        max="10000"
                        value={addTokenAmount}
                        onChange={setAddTokenAmount}
                        className="flex-1"
                        style={{ marginTop: 0 }}
                      />
                      <Button
                        size="sm"
                        onClick={handleAddRysmoTokens}
                        disabled={togglingRysmo}
                        icon={<Icon name="plus" size={16} />}
                      >
                        {t('userEdit.rysmo.add')}
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      {['30', '100', '300'].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setAddTokenAmount(preset)}
                          className="flex-1 py-1.5 rounded-lg border border-[color:var(--line)] text-xs font-medium text-ink-2 hover:border-digitalise hover:text-digitalise-txt transition-colors"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-ink-2 text-center">
                    {t('userEdit.rysmo.note')}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

/* ── Create User Modal ── */

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  addForm: AddForm;
  setAddForm: React.Dispatch<React.SetStateAction<AddForm>>;
  creatingUser: boolean;
  handleCreateUser: () => void;
}

export function CreateUserModal({
  open, onClose, addForm, setAddForm, creatingUser, handleCreateUser,
}: CreateUserModalProps) {
  const { t } = useTranslation('adminClub');
  return (
    <Modal open={open} onClose={onClose} title={t('userCreate.title')}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field size="sm" label={t('userCreate.firstName')} value={addForm.firstName} onChange={(v) => setAddForm((p) => ({ ...p, firstName: v }))} placeholder={t('userCreate.firstName')} />
          <Field size="sm" label={t('userCreate.lastName')} value={addForm.lastName} onChange={(v) => setAddForm((p) => ({ ...p, lastName: v }))} placeholder={t('userCreate.lastName')} />
        </div>
        <Field size="sm" required label={t('userCreate.displayName')} value={addForm.displayName} onChange={(v) => setAddForm((p) => ({ ...p, displayName: v }))} placeholder={t('userCreate.displayName')} />
        <Field size="sm" required type="email" inputMode="email" autoComplete="email" label={t('userCreate.email')} value={addForm.email} onChange={(v) => setAddForm((p) => ({ ...p, email: v }))} placeholder={t('userCreate.emailPlaceholder')} />
        <Field size="sm" required type="password" autoComplete="new-password" label={t('userCreate.password')} value={addForm.password} onChange={(v) => setAddForm((p) => ({ ...p, password: v }))} placeholder={t('userCreate.passwordPlaceholder')} />
        <Field size="sm" label={t('userCreate.phone')} type="tel" value={addForm.phone} onChange={(v) => setAddForm((p) => ({ ...p, phone: v }))} placeholder={t('userCreate.phonePlaceholder')} />
        {/* Aucune entrée « admin » : la Cloud Function `adminCreateUser` n'en crée jamais
            (elle force student/support). La promotion passe par la modale d'édition. */}
        <Field
          size="sm"
          as="select"
          label={t('userCreate.role')}
          value={addForm.role}
          onChange={(v) => setAddForm((p) => ({ ...p, role: v as AddForm['role'] }))}
          options={[
            { value: 'student', label: t('userCreate.roleStudent') },
            { value: 'support', label: t('userCreate.roleSupport') },
          ]}
        />
        <p className="text-xs text-ink-2">{t('userCreate.passwordNote')}</p>
        <div className="flex justify-end gap-3 pt-1">
          <Button variant="outline" onClick={onClose} icon={<Icon name="close" size={16} />}>{t('userCreate.cancel')}</Button>
          <Button
            onClick={handleCreateUser}
            disabled={creatingUser} loading={creatingUser}
            icon={<Icon name="plus" size={16} />}
          >
            {creatingUser ? t('userCreate.creating') : t('userCreate.create')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
