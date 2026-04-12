import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  getAllUsers, adminUpdateUser, getUserEnrollments, getAllFormations,
  getClubSubscription, updateClubSubscriptionStatus, activateClubSubscription,
} from '../../../lib/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../config/firebase';
import type { User, Enrollment, Formation, ClubDigitosSubscription } from '../../../types';

const adminManageEnrollment = httpsCallable<
  { action: 'create' | 'delete'; userId: string; formationId: string },
  { success: boolean; enrollmentId?: string }
>(functions, 'adminManageEnrollment');

const adminCreateUser = httpsCallable(functions, 'adminCreateUser');

export type EditTab = 'info' | 'formations' | 'club';

export const emptyEditForm = {
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

export type EditForm = typeof emptyEditForm;

export const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors placeholder-neutral-400';

export const roleLabels: Record<string, string> = { admin: 'Admin', support: 'Support', student: 'Étudiant' };
export const roleVariants: Record<string, 'error' | 'warning' | 'default'> = { admin: 'error', support: 'warning', student: 'default' };

export interface AddForm {
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  role: User['role'];
}

const emptyAddForm: AddForm = {
  displayName: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  role: 'student',
};

export function useAdminUsers(addToast: (type: 'success' | 'error', message: string) => void) {
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

  // Club des Digitos tab
  const [clubSub, setClubSub] = useState<ClubDigitosSubscription | null>(null);
  const [loadingClubSub, setLoadingClubSub] = useState(false);
  const [togglingClub, setTogglingClub] = useState(false);

  // Add user modal
  const [showAddUser, setShowAddUser] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>(emptyAddForm);
  const [creatingUser, setCreatingUser] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getAllUsers().then((data) => {
      setUsers(data);
      setLoading(false);
    }).catch(() => {
      addToast('error', 'Erreur lors du chargement des utilisateurs.');
      setLoading(false);
    });
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  // Load all formations for the enrollment selector (once)
  useEffect(() => {
    getAllFormations().then(setAllFormations).catch(() => null);
  }, []);

  const openEditUser = useCallback((u: User) => {
    setEditUser(u);
    setEditTab('info');
    setClubSub(null);
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
  }, []);

  const loadUserEnrollments = useCallback(async (uid: string) => {
    setLoadingEnrollments(true);
    try {
      const enrollments = await getUserEnrollments(uid);
      setUserEnrollments(enrollments);
    } catch {
      addToast('error', 'Erreur lors du chargement des inscriptions.');
    } finally {
      setLoadingEnrollments(false);
    }
  }, [addToast]);

  const handleEditTabChange = useCallback((tab: EditTab) => {
    setEditTab(tab);
    if (tab === 'formations' && editUser) {
      loadUserEnrollments(editUser.uid);
    }
    if (tab === 'club' && editUser) {
      setLoadingClubSub(true);
      getClubSubscription(editUser.uid)
        .then((sub) => { setClubSub(sub); setLoadingClubSub(false); })
        .catch(() => setLoadingClubSub(false));
    }
  }, [editUser, loadUserEnrollments]);

  const handleGrantClub = useCallback(async () => {
    if (!editUser) return;
    setTogglingClub(true);
    try {
      await activateClubSubscription(
        editUser.uid,
        editUser.email,
        editUser.displayName || editUser.email,
        true,
      );
      // Immediately set to active (admin bypass)
      await updateClubSubscriptionStatus(editUser.uid, 'active');
      const sub = await getClubSubscription(editUser.uid);
      setClubSub(sub);
      addToast('success', 'Accès Club des Digitos activé.');
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Erreur lors de l\'activation du Club des Digitos.';
      addToast('error', msg);
    } finally {
      setTogglingClub(false);
    }
  }, [editUser, addToast]);

  const handleRevokeClub = useCallback(async (status: ClubDigitosSubscription['status']) => {
    if (!editUser) return;
    setTogglingClub(true);
    try {
      await updateClubSubscriptionStatus(editUser.uid, status);
      const sub = await getClubSubscription(editUser.uid);
      setClubSub(sub);
      addToast('success', status === 'cancelled' ? 'Accès révoqué.' : 'Statut mis à jour.');
    } catch {
      addToast('error', 'Erreur lors de la mise à jour.');
    } finally {
      setTogglingClub(false);
    }
  }, [editUser, addToast]);

  const handleSaveUser = useCallback(async () => {
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
  }, [editUser, editForm, addToast]);

  const handleAddEnrollment = useCallback(async () => {
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
  }, [editUser, addFormationId, loadUserEnrollments, addToast]);

  const handleRemoveEnrollment = useCallback(async (enrollment: { id: string; formationId: string }) => {
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
  }, [editUser, addToast]);

  const handleCreateUser = useCallback(async () => {
    if (!addForm.email || !addForm.password || !addForm.displayName) {
      addToast('error', 'Nom, email et mot de passe sont obligatoires.');
      return;
    }
    setCreatingUser(true);
    try {
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
      setAddForm(emptyAddForm);
      load();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Erreur lors de la création.';
      addToast('error', msg);
    } finally {
      setCreatingUser(false);
    }
  }, [addForm, addToast, load]);

  const filtered = useMemo(() => users.filter((u) =>
    u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  ), [users, search]);

  const enrolledFormationIds = new Set(userEnrollments.map((e) => e.formationId));
  const unenrolledFormations = allFormations.filter((f) => !enrolledFormationIds.has(f.id));

  return {
    // User list
    users, loading, search, setSearch, filtered, load,
    // Edit modal
    editUser, setEditUser, editTab, editForm, setEditForm, saving,
    openEditUser, handleEditTabChange, handleSaveUser,
    // Formations tab
    userEnrollments, allFormations, loadingEnrollments,
    addFormationId, setAddFormationId, addingFormation, removingId,
    unenrolledFormations, handleAddEnrollment, handleRemoveEnrollment,
    // Club tab
    clubSub, loadingClubSub, togglingClub,
    handleGrantClub, handleRevokeClub,
    // Add user modal
    showAddUser, setShowAddUser, addForm, setAddForm, creatingUser,
    handleCreateUser,
  };
}
