import { useState, useEffect } from 'react';
import {
  Search, Mail, Calendar, Shield, Loader2, UserCog,
  Plus, X, Save, Trash2, BookOpen, CheckCircle,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import {
  getAllUsers, adminUpdateUser, getUserEnrollments, getAllFormations,
} from '../../lib/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';

const adminManageEnrollment = httpsCallable<
  { action: 'create' | 'delete'; userId: string; formationId: string },
  { success: boolean; enrollmentId?: string }
>(functions, 'adminManageEnrollment');
import type { User, Enrollment, Formation } from '../../types';

const roleLabels: Record<string, string> = { admin: 'Admin', support: 'Support', student: 'Étudiant' };
const roleVariants: Record<string, 'error' | 'warning' | 'default'> = { admin: 'error', support: 'warning', student: 'default' };

const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors placeholder-neutral-400';

type EditTab = 'info' | 'formations';

const emptyEditForm = {
  displayName: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  whatsapp: '',
  linkedin: '',
  bio: '',
  birthDate: '',
  role: 'student' as User['role'],
};

export default function AdminUsers() {
  const { addToast } = useToast();

  // Users list
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Edit user modal
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editTab, setEditTab] = useState<EditTab>('info');
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [saving, setSaving] = useState(false);

  // Formations tab in edit
  const [userEnrollments, setUserEnrollments] = useState<Enrollment[]>([]);
  const [allFormations, setAllFormations] = useState<Formation[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [addFormationId, setAddFormationId] = useState('');
  const [addingFormation, setAddingFormation] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Add user modal
  const [showAddUser, setShowAddUser] = useState(false);
  const [addForm, setAddForm] = useState({
    displayName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: 'student' as User['role'],
  });
  const [creatingUser, setCreatingUser] = useState(false);

  const load = () => {
    setLoading(true);
    getAllUsers().then((data) => {
      setUsers(data);
      setLoading(false);
    }).catch(() => {
      addToast('error', 'Erreur lors du chargement des utilisateurs.');
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  // Load all formations for the enrollment selector (once)
  useEffect(() => {
    getAllFormations().then(setAllFormations).catch(() => null);
  }, []);

  const openEditUser = (u: User) => {
    setEditUser(u);
    setEditTab('info');
    setEditForm({
      displayName: u.displayName || '',
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      email: u.email || '',
      phone: u.phone || '',
      whatsapp: u.whatsapp || '',
      linkedin: u.linkedin || '',
      bio: u.bio || '',
      birthDate: u.birthDate || '',
      role: u.role,
    });
  };

  const loadUserEnrollments = async (uid: string) => {
    setLoadingEnrollments(true);
    try {
      const enrollments = await getUserEnrollments(uid);
      setUserEnrollments(enrollments);
    } catch {
      addToast('error', 'Erreur lors du chargement des inscriptions.');
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const handleEditTabChange = (tab: EditTab) => {
    setEditTab(tab);
    if (tab === 'formations' && editUser) {
      loadUserEnrollments(editUser.uid);
    }
  };

  const handleSaveUser = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      await adminUpdateUser(editUser.uid, {
        displayName: editForm.displayName.trim() || editUser.displayName,
        firstName: editForm.firstName.trim() || undefined,
        lastName: editForm.lastName.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        whatsapp: editForm.whatsapp.trim() || undefined,
        linkedin: editForm.linkedin.trim() || undefined,
        bio: editForm.bio.trim() || undefined,
        birthDate: editForm.birthDate || undefined,
        role: editForm.role,
      });
      setUsers((prev) => prev.map((u) => u.uid === editUser.uid ? { ...u, ...editForm } : u));
      addToast('success', 'Utilisateur mis à jour.');
      setEditUser(null);
    } catch {
      addToast('error', 'Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddEnrollment = async () => {
    if (!editUser || !addFormationId) return;
    setAddingFormation(true);
    try {
      await adminManageEnrollment({ action: 'create', userId: editUser.uid, formationId: addFormationId });
      await loadUserEnrollments(editUser.uid);
      setAddFormationId('');
      addToast('success', 'Cours activé pour cet utilisateur.');
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Erreur lors de l\'activation du cours.';
      addToast('error', msg);
    } finally {
      setAddingFormation(false);
    }
  };

  const handleRemoveEnrollment = async (enrollment: { id: string; formationId: string }) => {
    setRemovingId(enrollment.id);
    try {
      await adminManageEnrollment({ action: 'delete', userId: editUser!.uid, formationId: enrollment.formationId });
      setUserEnrollments((prev) => prev.filter((e) => e.id !== enrollment.id));
      addToast('success', 'Inscription supprimée.');
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Erreur lors de la suppression.';
      addToast('error', msg);
    } finally {
      setRemovingId(null);
    }
  };

  const handleCreateUser = async () => {
    if (!addForm.email || !addForm.password || !addForm.displayName) {
      addToast('error', 'Nom, email et mot de passe sont obligatoires.');
      return;
    }
    setCreatingUser(true);
    try {
      const adminCreateUser = httpsCallable(functions, 'adminCreateUser');
      await adminCreateUser({
        email: addForm.email.trim(),
        password: addForm.password,
        displayName: addForm.displayName.trim(),
        firstName: addForm.firstName.trim(),
        lastName: addForm.lastName.trim(),
        phone: addForm.phone.trim(),
        role: addForm.role,
      });
      addToast('success', 'Utilisateur créé avec succès.');
      setShowAddUser(false);
      setAddForm({ displayName: '', firstName: '', lastName: '', email: '', password: '', phone: '', role: 'student' });
      load();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Erreur lors de la création.';
      addToast('error', msg);
    } finally {
      setCreatingUser(false);
    }
  };

  const filtered = users.filter((u) =>
    u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const enrolledFormationIds = new Set(userEnrollments.map((e) => e.formationId));
  const unenrolledFormations = allFormations.filter((f) => !enrolledFormationIds.has(f.id));

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Utilisateurs</h1>
          <p className="text-sm text-neutral-500">
            {loading ? 'Chargement...' : `${users.length} utilisateur${users.length !== 1 ? 's' : ''} inscrit${users.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            Actualiser
          </Button>
          <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAddUser(true)}>
            Ajouter un utilisateur
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un utilisateur..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-neutral-900 dark:text-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Utilisateur</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase hidden sm:table-cell">Rôle</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase hidden md:table-cell">Inscription</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">Aucun utilisateur trouvé.</td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.uid} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {u.photoURL ? (
                              <img src={u.photoURL} alt="" className="w-9 h-9 rounded-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                                {(u.displayName || u.email || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{u.displayName || '—'}</p>
                            <p className="text-xs text-neutral-400 flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3 flex-shrink-0" /> {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge variant={roleVariants[u.role]} size="sm">
                          <Shield className="w-3 h-3 mr-1" />
                          {roleLabels[u.role]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-500 hidden md:table-cell">
                        {u.createdAt ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEditUser(u)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                          title="Gérer l'utilisateur"
                        >
                          <UserCog className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Edit User Modal ── */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Gestion de l'utilisateur">
        {editUser && (
          <div className="space-y-4">
            {/* User header */}
            <div className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-700/30 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {editUser.photoURL ? (
                  <img src={editUser.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
                    {(editUser.displayName || editUser.email || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold text-neutral-900 dark:text-white">{editUser.displayName || '—'}</p>
                <p className="text-sm text-neutral-500">{editUser.email}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
              {(['info', 'formations'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleEditTabChange(tab)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    editTab === tab
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                  }`}
                >
                  {tab === 'info' ? 'Informations' : 'Formations'}
                </button>
              ))}
            </div>

            {/* Info tab */}
            {editTab === 'info' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500">Prénom</label>
                    <input value={editForm.firstName} onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))} placeholder="Prénom" className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500">Nom</label>
                    <input value={editForm.lastName} onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))} placeholder="Nom" className={inputCls} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">Nom affiché</label>
                  <input value={editForm.displayName} onChange={(e) => setEditForm((p) => ({ ...p, displayName: e.target.value }))} placeholder="Nom affiché" className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">Email</label>
                  <input value={editForm.email} disabled className={`${inputCls} opacity-60 cursor-not-allowed`} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500">Téléphone</label>
                    <input value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+221 77 000 00 00" className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500">WhatsApp</label>
                    <input value={editForm.whatsapp} onChange={(e) => setEditForm((p) => ({ ...p, whatsapp: e.target.value }))} placeholder="+221 77 000 00 00" className={inputCls} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">LinkedIn</label>
                  <input type="url" value={editForm.linkedin} onChange={(e) => setEditForm((p) => ({ ...p, linkedin: e.target.value }))} placeholder="https://linkedin.com/in/..." className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">Date de naissance</label>
                  <input type="date" value={editForm.birthDate} onChange={(e) => setEditForm((p) => ({ ...p, birthDate: e.target.value }))} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">Biographie</label>
                  <textarea value={editForm.bio} onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))} rows={2} placeholder="Biographie..." className={`${inputCls} resize-none`} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">Rôle</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value as User['role'] }))}
                    className={inputCls}
                  >
                    <option value="student">Étudiant</option>
                    <option value="support">Support</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-1">
                  <Button variant="outline" onClick={() => setEditUser(null)}>Annuler</Button>
                  <Button onClick={handleSaveUser} disabled={saving} icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}>
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </div>
              </div>
            )}

            {/* Formations tab */}
            {editTab === 'formations' && (
              <div className="space-y-4">
                {/* Add formation */}
                <div className="flex gap-2">
                  <select
                    value={addFormationId}
                    onChange={(e) => setAddFormationId(e.target.value)}
                    className={`${inputCls} flex-1`}
                  >
                    <option value="">— Sélectionner une formation —</option>
                    {unenrolledFormations.map((f) => (
                      <option key={f.id} value={f.id}>{f.title}</option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    onClick={handleAddEnrollment}
                    disabled={!addFormationId || addingFormation}
                    icon={addingFormation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  >
                    Activer
                  </Button>
                </div>

                {/* Enrolled list */}
                {loadingEnrollments ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
                ) : userEnrollments.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl">
                    <BookOpen className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
                    <p className="text-sm text-neutral-400">Aucune formation activée.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {userEnrollments.map((enrollment) => {
                      const formation = allFormations.find((f) => f.id === enrollment.formationId);
                      return (
                        <div key={enrollment.id} className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-700/30 rounded-xl">
                          <CheckCircle className={`w-4 h-4 flex-shrink-0 ${enrollment.progress === 100 ? 'text-success-500' : 'text-neutral-300'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                              {formation?.title ?? enrollment.formationId}
                            </p>
                            <p className="text-xs text-neutral-400">Progression : {enrollment.progress}%</p>
                          </div>
                          <button
                            onClick={() => handleRemoveEnrollment(enrollment)}
                            disabled={removingId === enrollment.id}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors flex-shrink-0"
                          >
                            {removingId === enrollment.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Add User Modal ── */}
      <Modal open={showAddUser} onClose={() => setShowAddUser(false)} title="Ajouter un utilisateur">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500">Prénom</label>
              <input value={addForm.firstName} onChange={(e) => setAddForm((p) => ({ ...p, firstName: e.target.value }))} placeholder="Prénom" className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500">Nom</label>
              <input value={addForm.lastName} onChange={(e) => setAddForm((p) => ({ ...p, lastName: e.target.value }))} placeholder="Nom" className={inputCls} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-500">Nom affiché <span className="text-error-500">*</span></label>
            <input value={addForm.displayName} onChange={(e) => setAddForm((p) => ({ ...p, displayName: e.target.value }))} placeholder="Nom affiché" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-500">Email <span className="text-error-500">*</span></label>
            <input type="email" value={addForm.email} onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))} placeholder="email@exemple.com" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-500">Mot de passe provisoire <span className="text-error-500">*</span></label>
            <input type="password" value={addForm.password} onChange={(e) => setAddForm((p) => ({ ...p, password: e.target.value }))} placeholder="Min. 6 caractères" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-500">Téléphone</label>
            <input type="tel" value={addForm.phone} onChange={(e) => setAddForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+221 77 000 00 00" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-500">Rôle</label>
            <select value={addForm.role} onChange={(e) => setAddForm((p) => ({ ...p, role: e.target.value as User['role'] }))} className={inputCls}>
              <option value="student">Étudiant</option>
              <option value="support">Support</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <p className="text-xs text-neutral-400">L'utilisateur pourra changer son mot de passe après connexion.</p>
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="outline" onClick={() => setShowAddUser(false)} icon={<X className="w-4 h-4" />}>Annuler</Button>
            <Button
              onClick={handleCreateUser}
              disabled={creatingUser}
              icon={creatingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            >
              {creatingUser ? 'Création...' : 'Créer l\'utilisateur'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
