import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, Award, Play,
  Sun, Moon, ArrowLeft, GraduationCap, LayoutDashboard,
  FileText, Settings, Bell, CheckCircle,
  Search, Plus, X, Edit3, LogOut,
  BarChart2, Send, Inbox, User, Save, Trash2,
  Loader2, BookMarked, Camera, Phone, Linkedin, Globe2, ExternalLink, Star, MessageSquareQuote,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../components/ui/Toast';
import {
  getUserEnrollments, getUserNotes, saveNote, deleteNote, createDoc,
  getUserCertificates, getUserMessages, issueCertificate, getFormationsByIds,
  updateUserProfile, getMyTestimonial, submitTestimonial,
} from '../../lib/firestore';
import { cn, formatDate } from '../../lib/utils';
import type { Enrollment, Formation, ContactMessage, Certificate, Testimonial } from '../../types';
import type { Note } from '../../lib/firestore';
import { updateProfile } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../config/firebase';

type Tab = 'dashboard' | 'courses' | 'notes' | 'profile' | 'messages' | 'achievements' | 'settings';

interface EnrolledFormation {
  enrollment: Enrollment;
  formation: Formation | null;
}

const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors placeholder-neutral-400';

const socialLinks = [
  {
    label: 'Chaîne WhatsApp',
    desc: 'Rejoins la chaîne officielle',
    url: 'https://whatsapp.com/channel/0029Vb2mX9zDjiOe1qo3IR1H',
    color: 'bg-green-500',
  },
  {
    label: 'Instagram',
    desc: '@maxmorrys',
    url: 'https://instagram.com/maxmorrys',
    color: 'bg-gradient-to-br from-purple-500 to-pink-500',
  },
  {
    label: 'YouTube',
    desc: 'Formations et tutoriels gratuits',
    url: 'https://youtube.com/@maxmorrys',
    color: 'bg-red-600',
  },
  {
    label: 'TikTok',
    desc: 'Conseils en format court',
    url: 'https://tiktok.com/@maxmorrys',
    color: 'bg-neutral-900 dark:bg-neutral-700',
  },
];

export default function StudentDashboard() {
  const { user, userData, signOut, refreshUserData } = useAuth();
  const { theme, setTheme } = useTheme();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [enrolledFormations, setEnrolledFormations] = useState<EnrolledFormation[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [noteSearch, setNoteSearch] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteForm, setNoteForm] = useState({ title: '', content: '' });
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Messages
  const [sentMessages, setSentMessages] = useState<ContactMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [msgForm, setMsgForm] = useState({ subject: '', message: '' });
  const [sendingMsg, setSendingMsg] = useState(false);
  const [showMsgForm, setShowMsgForm] = useState(false);

  // Achievements / Certificates
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(false);

  // Profile
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    phone: '',
    whatsapp: '',
    linkedin: '',
    bio: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Testimonial
  const [myTestimonial, setMyTestimonial] = useState<Testimonial | null>(null);
  const [loadingTestimonial, setLoadingTestimonial] = useState(false);
  const [testimonialForm, setTestimonialForm] = useState({ content: '', rating: 5 });
  const [submittingTestimonial, setSubmittingTestimonial] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoadingEnrollments(true);
    getUserEnrollments(user.uid).then(async (enrollments) => {
      const ids = enrollments.map((e) => e.formationId);
      const formations = await getFormationsByIds(ids).catch(() => [] as Formation[]);
      const formationMap = new Map(formations.map((f) => [f.id, f]));
      setEnrolledFormations(enrollments.map((enrollment) => ({
        enrollment,
        formation: formationMap.get(enrollment.formationId) ?? null,
      })));
      setLoadingEnrollments(false);
    }).catch(() => setLoadingEnrollments(false));
  }, [user]);

  useEffect(() => {
    if (!user || activeTab !== 'notes') return;
    setLoadingNotes(true);
    getUserNotes(user.uid).then((data) => {
      setNotes(data);
      setLoadingNotes(false);
    }).catch(() => setLoadingNotes(false));
  }, [user, activeTab]);

  useEffect(() => {
    if (!user?.email || activeTab !== 'messages') return;
    setLoadingMessages(true);
    getUserMessages(user.email).then((data) => {
      setSentMessages(data);
      setLoadingMessages(false);
    }).catch(() => setLoadingMessages(false));
  }, [user, activeTab]);

  useEffect(() => {
    if (!user || activeTab !== 'achievements') return;
    setLoadingCerts(true);
    getUserCertificates(user.uid).then((data) => {
      setCertificates(data);
      setLoadingCerts(false);
    }).catch(() => setLoadingCerts(false));
  }, [user, activeTab]);

  // Load student's testimonial when profile tab opens
  useEffect(() => {
    if (!user || activeTab !== 'profile') return;
    setLoadingTestimonial(true);
    getMyTestimonial(user.uid).then((t) => {
      setMyTestimonial(t);
      setLoadingTestimonial(false);
    }).catch(() => setLoadingTestimonial(false));
  }, [user, activeTab]);

  // Populate profile form from userData
  useEffect(() => {
    if (userData) {
      setProfileForm({
        displayName: userData.displayName || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        birthDate: userData.birthDate || '',
        phone: userData.phone || '',
        whatsapp: userData.whatsapp || '',
        linkedin: userData.linkedin || '',
        bio: userData.bio || '',
      });
    }
  }, [userData]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const openNewNote = () => {
    setEditingNote(null);
    setNoteForm({ title: '', content: '' });
    setShowNoteForm(true);
  };

  const openEditNote = (note: Note) => {
    setEditingNote(note);
    setNoteForm({ title: note.title, content: note.content });
    setShowNoteForm(true);
  };

  const handleSaveNote = async () => {
    if (!user || !noteForm.title.trim()) return;
    setSavingNote(true);
    try {
      const now = new Date().toISOString();
      await saveNote(user.uid, {
        title: noteForm.title.trim(),
        content: noteForm.content,
        createdAt: editingNote?.createdAt ?? now,
        updatedAt: now,
      }, editingNote?.id);
      const updatedNotes = await getUserNotes(user.uid);
      setNotes(updatedNotes);
      setShowNoteForm(false);
      addToast('success', editingNote ? 'Note mise à jour.' : 'Note créée.');
    } catch {
      addToast('error', 'Erreur lors de l\'enregistrement.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!user) return;
    await deleteNote(user.uid, noteId).catch(() => addToast('error', 'Erreur de suppression.'));
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    addToast('success', 'Note supprimée.');
  };

  const displayName = userData?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Étudiant';

  const handleSendMessage = async () => {
    if (!user?.email || !msgForm.subject.trim() || !msgForm.message.trim()) return;
    setSendingMsg(true);
    try {
      await createDoc('messages', {
        name: displayName,
        email: user.email,
        subject: msgForm.subject.trim(),
        message: msgForm.message.trim(),
        sentAt: new Date().toISOString(),
        status: 'new',
        userId: user.uid,
      });
      setMsgForm({ subject: '', message: '' });
      setShowMsgForm(false);
      addToast('success', 'Message envoyé avec succès !');
      getUserMessages(user.email).then(setSentMessages).catch(() => null);
    } catch {
      addToast('error', 'Erreur lors de l\'envoi. Veuillez réessayer.');
    } finally {
      setSendingMsg(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      addToast('error', 'La photo ne doit pas dépasser 2 Mo.');
      return;
    }
    setUploadingPhoto(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileRef = storageRef(storage, `avatars/${user.uid}/profile.${ext}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      await updateProfile(user, { photoURL: url });
      await updateUserProfile(user.uid, { photoURL: url });
      await refreshUserData();
      addToast('success', 'Photo de profil mise à jour.');
    } catch {
      addToast('error', 'Erreur lors du téléchargement de la photo.');
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const newDisplayName = profileForm.displayName.trim()
        || `${profileForm.firstName} ${profileForm.lastName}`.trim()
        || displayName;

      if (newDisplayName !== user.displayName) {
        await updateProfile(user, { displayName: newDisplayName });
      }

      await updateUserProfile(user.uid, {
        displayName: newDisplayName,
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        birthDate: profileForm.birthDate || undefined,
        phone: profileForm.phone.trim() || undefined,
        whatsapp: profileForm.whatsapp.trim() || undefined,
        linkedin: profileForm.linkedin.trim() || undefined,
        bio: profileForm.bio.trim() || undefined,
      });

      await refreshUserData();
      addToast('success', 'Profil mis à jour avec succès.');
    } catch {
      addToast('error', 'Erreur lors de la mise à jour du profil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSubmitTestimonial = async () => {
    if (!user || !testimonialForm.content.trim()) return;
    setSubmittingTestimonial(true);
    try {
      await submitTestimonial({
        userId: user.uid,
        name: displayName,
        avatar: user.photoURL || userData?.photoURL || '',
        role: 'Étudiant',
        content: testimonialForm.content.trim(),
        rating: testimonialForm.rating,
      });
      const t = await getMyTestimonial(user.uid);
      setMyTestimonial(t);
      setTestimonialForm({ content: '', rating: 5 });
      addToast('success', 'Merci pour ton témoignage ! Il sera visible après validation.');
    } catch {
      addToast('error', 'Erreur lors de l\'envoi du témoignage.');
    } finally {
      setSubmittingTestimonial(false);
    }
  };

  const avgProgress = enrolledFormations.length > 0
    ? Math.round(enrolledFormations.reduce((a, ef) => a + ef.enrollment.progress, 0) / enrolledFormations.length)
    : 0;

  const completedCount = enrolledFormations.filter((ef) => ef.enrollment.progress === 100).length;

  const navItems: { id: Tab; icon: React.FC<{ className?: string }>; label: string }[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { id: 'courses', icon: BookOpen, label: 'Mes formations' },
    { id: 'notes', icon: BookMarked, label: 'Mes notes' },
    { id: 'achievements', icon: Award, label: 'Succès & Certificats' },
    { id: 'messages', icon: Inbox, label: 'Messages' },
    { id: 'profile', icon: User, label: 'Profil' },
    { id: 'settings', icon: Settings, label: 'Paramètres' },
  ];

  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const photoURL = user?.photoURL || userData?.photoURL;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col transition-transform duration-300',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <Link to="/" className="flex items-center gap-2 group" onClick={() => setMobileMenuOpen(false)}>
            <GraduationCap className="w-6 h-6 text-brand-500" />
            <span className="font-black text-neutral-900 dark:text-white">Max-Morrys</span>
            <ArrowLeft className="w-4 h-4 text-neutral-400 ml-auto group-hover:text-brand-500 transition-colors" />
          </Link>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {photoURL ? (
                <img src={photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{initials}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{displayName}</p>
              <p className="text-xs text-neutral-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                activeTab === item.id
                  ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white',
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 space-y-1">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-6 h-16 flex items-center gap-4">
          <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <LayoutDashboard className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-neutral-900 dark:text-white text-sm sm:text-base">
              {navItems.find((n) => n.id === activeTab)?.label}
            </h1>
          </div>
          <button className="p-2 rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors relative">
            <Bell className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full">
          {/* ── DASHBOARD ── */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Welcome */}
              <div className="bg-gradient-to-r from-brand-500 to-brand-700 rounded-2xl p-6 text-white">
                <h2 className="text-xl font-bold mb-1">Bonjour, {displayName.split(' ')[0]} 👋</h2>
                <p className="text-brand-100 text-sm">Continue ton apprentissage là où tu t'es arrêté.</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: BookOpen, label: 'Formations', value: enrolledFormations.length, color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-50 dark:bg-brand-900/20' },
                  { icon: CheckCircle, label: 'Terminées', value: completedCount, color: 'text-success-600 dark:text-success-400', bg: 'bg-success-50 dark:bg-success-900/20' },
                  { icon: BarChart2, label: 'Progression moy.', value: `${avgProgress}%`, color: 'text-accent-600 dark:text-accent-400', bg: 'bg-accent-50 dark:bg-accent-900/20' },
                  { icon: Award, label: 'Certificats', value: completedCount, color: 'text-warning-600 dark:text-warning-400', bg: 'bg-warning-50 dark:bg-warning-900/20' },
                ].map((s, i) => (
                  <div key={i} className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4">
                    <div className={`p-2 rounded-xl ${s.bg} w-fit mb-2`}>
                      <s.icon className={`w-4 h-4 ${s.color}`} />
                    </div>
                    <p className="text-xl font-bold text-neutral-900 dark:text-white">{s.value}</p>
                    <p className="text-xs text-neutral-500">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Continue learning */}
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white mb-3">Continuer l'apprentissage</h3>
                {loadingEnrollments ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
                ) : enrolledFormations.length === 0 ? (
                  <div className="bg-white dark:bg-neutral-800 border border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl p-8 text-center">
                    <BookOpen className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                    <p className="text-neutral-500 mb-3">Tu n'es inscrit à aucune formation.</p>
                    <Link to="/formations">
                      <Button size="sm">Découvrir les formations</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {enrolledFormations.filter((ef) => ef.enrollment.progress < 100).slice(0, 3).map(({ enrollment, formation }) => (
                      <div key={enrollment.id} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 flex items-center gap-4">
                        {formation?.coverImage && (
                          <img src={formation.coverImage} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" loading="lazy" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-neutral-900 dark:text-white truncate">{formation?.title ?? 'Formation'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                              <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${enrollment.progress}%` }} />
                            </div>
                            <span className="text-xs text-neutral-500 flex-shrink-0">{enrollment.progress}%</span>
                          </div>
                        </div>
                        {formation && (
                          <Link to={`/cours/${formation.slug}`}>
                            <Button size="sm" icon={<Play className="w-3.5 h-3.5" />}>Continuer</Button>
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── COURSES ── */}
          {activeTab === 'courses' && (
            <div className="space-y-4">
              {loadingEnrollments ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
              ) : enrolledFormations.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl">
                  <BookOpen className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-500 mb-4">Tu n'as pas encore de formation.</p>
                  <Link to="/formations"><Button>Voir les formations</Button></Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {enrolledFormations.map(({ enrollment, formation }) => (
                    <div key={enrollment.id} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden">
                      {formation?.coverImage && (
                        <img src={formation.coverImage} alt="" className="w-full h-32 object-cover" loading="lazy" />
                      )}
                      <div className="p-4">
                        <p className="font-bold text-neutral-900 dark:text-white text-sm line-clamp-2 mb-2">{formation?.title ?? 'Formation'}</p>
                        <div className="mb-2">
                          <div className="flex justify-between text-xs text-neutral-500 mb-1">
                            <span>Progression</span>
                            <span>{enrollment.progress}%</span>
                          </div>
                          <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${enrollment.progress}%` }} />
                          </div>
                        </div>
                        <p className="text-xs text-neutral-400 mb-3">{enrollment.completedLessons.length} leçon{enrollment.completedLessons.length !== 1 ? 's' : ''} complétée{enrollment.completedLessons.length !== 1 ? 's' : ''}</p>
                        <div className="flex gap-2">
                          {formation && (
                            <Link to={`/cours/${formation.slug}`} className="flex-1">
                              <Button size="sm" className="w-full" icon={enrollment.progress === 100 ? <CheckCircle className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}>
                                {enrollment.progress === 100 ? 'Revoir' : 'Continuer'}
                              </Button>
                            </Link>
                          )}
                          {enrollment.progress === 100 && enrollment.certificateIssued && (
                            <Button size="sm" variant="outline" icon={<Award className="w-3.5 h-3.5" />}>Certificat</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── NOTES ── */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              {showNoteForm ? (
                <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 space-y-4">
                  <h3 className="font-bold text-neutral-900 dark:text-white">{editingNote ? 'Modifier la note' : 'Nouvelle note'}</h3>
                  <input
                    value={noteForm.title}
                    onChange={(e) => setNoteForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Titre de la note..."
                    className={inputCls}
                  />
                  <textarea
                    value={noteForm.content}
                    onChange={(e) => setNoteForm((p) => ({ ...p, content: e.target.value }))}
                    placeholder="Contenu de la note..."
                    rows={8}
                    className={`${inputCls} resize-y font-mono`}
                  />
                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => setShowNoteForm(false)} icon={<X className="w-4 h-4" />}>Annuler</Button>
                    <Button onClick={handleSaveNote} disabled={savingNote || !noteForm.title.trim()} icon={savingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}>
                      {savingNote ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input value={noteSearch} onChange={(e) => setNoteSearch(e.target.value)} placeholder="Rechercher une note..." className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-neutral-900 dark:text-white" />
                    </div>
                    <Button size="sm" onClick={openNewNote} icon={<Plus className="w-4 h-4" />}>Nouvelle note</Button>
                  </div>
                  {loadingNotes ? (
                    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
                  ) : notes.filter((n) => n.title.toLowerCase().includes(noteSearch.toLowerCase()) || n.content.toLowerCase().includes(noteSearch.toLowerCase())).length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl">
                      <FileText className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                      <p className="text-neutral-500 mb-3">Aucune note. Prends des notes pendant tes cours.</p>
                      <Button size="sm" onClick={openNewNote} icon={<Plus className="w-4 h-4" />}>Créer une note</Button>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {notes
                        .filter((n) => n.title.toLowerCase().includes(noteSearch.toLowerCase()) || n.content.toLowerCase().includes(noteSearch.toLowerCase()))
                        .map((note) => (
                          <div key={note.id} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 group">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="font-semibold text-neutral-900 dark:text-white text-sm line-clamp-1">{note.title}</h4>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <button onClick={() => openEditNote(note)} className="p-1 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => handleDeleteNote(note.id)} className="p-1 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                            <p className="text-xs text-neutral-500 line-clamp-3 mb-3">{note.content}</p>
                            <p className="text-xs text-neutral-400">{formatDate(note.updatedAt)}</p>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── MESSAGES ── */}
          {activeTab === 'messages' && (
            <div className="space-y-4">
              {showMsgForm ? (
                <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-neutral-900 dark:text-white">Nouveau message</h3>
                    <button onClick={() => setShowMsgForm(false)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-500">De</label>
                    <div className="px-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-700 text-sm text-neutral-500">
                      {displayName} &lt;{user?.email}&gt;
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-500">Sujet</label>
                    <input
                      value={msgForm.subject}
                      onChange={(e) => setMsgForm((p) => ({ ...p, subject: e.target.value }))}
                      placeholder="Ex: Question sur la formation..."
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-500">Message</label>
                    <textarea
                      value={msgForm.message}
                      onChange={(e) => setMsgForm((p) => ({ ...p, message: e.target.value }))}
                      placeholder="Décris ta demande..."
                      rows={6}
                      className={`${inputCls} resize-y`}
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setShowMsgForm(false)}>Annuler</Button>
                    <Button
                      onClick={handleSendMessage}
                      disabled={sendingMsg || !msgForm.subject.trim() || !msgForm.message.trim()}
                      icon={sendingMsg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    >
                      {sendingMsg ? 'Envoi...' : 'Envoyer'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-neutral-900 dark:text-white">Messages envoyés</h3>
                  <Button size="sm" onClick={() => setShowMsgForm(true)} icon={<Plus className="w-4 h-4" />}>Nouveau message</Button>
                </div>
              )}

              {!showMsgForm && (
                loadingMessages ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
                ) : sentMessages.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl">
                    <Inbox className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                    <p className="text-neutral-500 mb-3">Aucun message envoyé. Une question ? Contacte-nous.</p>
                    <Button size="sm" onClick={() => setShowMsgForm(true)} icon={<Send className="w-4 h-4" />}>Envoyer un message</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sentMessages.map((msg) => (
                      <div key={msg.id} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-semibold text-neutral-900 dark:text-white text-sm">{msg.subject}</p>
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0',
                            msg.status === 'new' ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400' :
                            msg.status === 'read' ? 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500' :
                            'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400'
                          )}>
                            {msg.status === 'new' ? 'Envoyé' : msg.status === 'read' ? 'Lu' : 'Répondu'}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 line-clamp-2">{msg.message}</p>
                        <p className="text-xs text-neutral-400 mt-2">{formatDate(msg.sentAt)}</p>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}

          {/* ── ACHIEVEMENTS ── */}
          {activeTab === 'achievements' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white mb-1">Certificats obtenus</h3>
                <p className="text-sm text-neutral-500">Complète une formation à 100% pour obtenir ton certificat.</p>
              </div>
              {loadingCerts ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
              ) : certificates.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl">
                  <Award className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-500 mb-2">Aucun certificat pour l'instant.</p>
                  <p className="text-sm text-neutral-400">Termine une formation pour débloquer ton premier certificat.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {certificates.map((cert) => (
                    <div key={cert.id} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center mx-auto mb-4">
                        <Award className="w-8 h-8 text-warning-500" />
                      </div>
                      <p className="font-bold text-neutral-900 dark:text-white text-sm mb-1 line-clamp-2">{cert.formationTitle}</p>
                      <p className="text-xs text-neutral-400 mb-3">Obtenu le {formatDate(cert.issuedAt)}</p>
                      <p className="text-xs font-mono bg-neutral-100 dark:bg-neutral-700 text-neutral-500 rounded-lg px-3 py-1.5">{cert.certificateCode}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Formations to complete */}
              {enrolledFormations.filter((ef) => ef.enrollment.progress === 100 && !certificates.find((c) => c.formationId === ef.enrollment.formationId)).length > 0 && (
                <div>
                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-3 text-sm">Formations terminées — Certificat à réclamer</h4>
                  <div className="space-y-3">
                    {enrolledFormations
                      .filter((ef) => ef.enrollment.progress === 100 && !certificates.find((c) => c.formationId === ef.enrollment.formationId))
                      .map(({ enrollment, formation }) => (
                        <div key={enrollment.id} className="flex items-center gap-4 bg-white dark:bg-neutral-800 border border-success-200 dark:border-success-800 rounded-2xl p-4">
                          <CheckCircle className="w-8 h-8 text-success-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-neutral-900 dark:text-white text-sm truncate">{formation?.title ?? 'Formation'}</p>
                            <p className="text-xs text-success-600 dark:text-success-400">Terminée à 100%</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            icon={<Award className="w-4 h-4" />}
                            onClick={async () => {
                              if (!user || !formation) return;
                              try {
                                await issueCertificate(user.uid, enrollment.formationId, formation.title);
                                const updated = await getUserCertificates(user.uid);
                                setCertificates(updated);
                                addToast('success', 'Certificat généré !');
                              } catch {
                                addToast('error', 'Erreur lors de la génération.');
                              }
                            }}
                          >
                            Obtenir
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PROFILE ── */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl space-y-6">

              {/* Photo de profil */}
              <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6">
                <h3 className="font-bold text-neutral-900 dark:text-white mb-5">Photo de profil</h3>
                <div className="flex items-center gap-5">
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center overflow-hidden ring-4 ring-brand-50 dark:ring-brand-900/20">
                      {photoURL ? (
                        <img src={photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">{initials}</span>
                      )}
                    </div>
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center shadow-lg transition-colors disabled:opacity-60"
                    >
                      {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    </button>
                    <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900 dark:text-white">{displayName}</p>
                    <p className="text-sm text-neutral-500">{user?.email}</p>
                    <p className="text-xs text-neutral-400 mt-1">JPG, PNG ou GIF · Max 2 Mo</p>
                  </div>
                </div>
              </div>

              {/* Informations personnelles */}
              <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6">
                <h3 className="font-bold text-neutral-900 dark:text-white mb-5">Informations personnelles</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-neutral-500">Prénom</label>
                    <input
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))}
                      placeholder="Ton prénom"
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-neutral-500">Nom de famille</label>
                    <input
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm((p) => ({ ...p, lastName: e.target.value }))}
                      placeholder="Ton nom"
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-semibold text-neutral-500">
                      Nom affiché <span className="font-normal text-neutral-400">(visible sur la plateforme)</span>
                    </label>
                    <input
                      value={profileForm.displayName}
                      onChange={(e) => setProfileForm((p) => ({ ...p, displayName: e.target.value }))}
                      placeholder="Ton nom d'affichage"
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-semibold text-neutral-500">Adresse email</label>
                    <input
                      value={user?.email || ''}
                      disabled
                      className={`${inputCls} opacity-60 cursor-not-allowed`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-neutral-500">Date de naissance</label>
                    <input
                      type="date"
                      value={profileForm.birthDate}
                      onChange={(e) => setProfileForm((p) => ({ ...p, birthDate: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-neutral-500 flex items-center gap-1.5">
                      <Phone className="w-3 h-3" /> Téléphone
                    </label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+221 77 000 00 00"
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-neutral-500">WhatsApp</label>
                    <input
                      type="tel"
                      value={profileForm.whatsapp}
                      onChange={(e) => setProfileForm((p) => ({ ...p, whatsapp: e.target.value }))}
                      placeholder="+221 77 000 00 00"
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-neutral-500 flex items-center gap-1.5">
                      <Linkedin className="w-3 h-3" /> LinkedIn
                    </label>
                    <input
                      type="url"
                      value={profileForm.linkedin}
                      onChange={(e) => setProfileForm((p) => ({ ...p, linkedin: e.target.value }))}
                      placeholder="https://linkedin.com/in/ton-profil"
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-semibold text-neutral-500">Biographie</label>
                    <textarea
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
                      placeholder="Parle-nous de toi en quelques lignes..."
                      rows={3}
                      className={`${inputCls} resize-y`}
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-5">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    icon={savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  >
                    {savingProfile ? 'Enregistrement...' : 'Enregistrer le profil'}
                  </Button>
                </div>
              </div>

              {/* Rejoindre la communauté */}
              <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6">
                <h3 className="font-bold text-neutral-900 dark:text-white mb-1">Rejoins la communauté</h3>
                <p className="text-sm text-neutral-500 mb-5">Suis Max-Morrys sur les réseaux pour ne rien manquer.</p>
                <div className="space-y-2">
                  {socialLinks.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors group"
                    >
                      <div className={`w-10 h-10 rounded-xl ${link.color} flex items-center justify-center flex-shrink-0`}>
                        <Globe2 className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{link.label}</p>
                        <p className="text-xs text-neutral-400">{link.desc}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-neutral-300 group-hover:text-brand-500 transition-colors flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Témoignage */}
              <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquareQuote className="w-5 h-5 text-brand-500" />
                  <h3 className="font-bold text-neutral-900 dark:text-white">Ton témoignage</h3>
                </div>
                <p className="text-sm text-neutral-500 mb-5">Partage ton expérience sur la plateforme Max-Morrys.</p>

                {loadingTestimonial ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-brand-500" /></div>
                ) : myTestimonial ? (
                  <div className="space-y-3">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={`w-4 h-4 ${n <= myTestimonial.rating ? 'text-accent-500' : 'text-neutral-300 dark:text-neutral-700'}`} fill="currentColor" />
                      ))}
                    </div>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 italic">"{myTestimonial.content}"</p>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-xs px-2.5 py-1 rounded-full font-semibold',
                        myTestimonial.status === 'pending' ? 'bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400' :
                        myTestimonial.status === 'approved' ? 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400' :
                        'bg-error-100 dark:bg-error-900/30 text-error-600 dark:text-error-400'
                      )}>
                        {myTestimonial.status === 'pending' ? 'En attente de validation' :
                         myTestimonial.status === 'approved' ? 'Approuvé et publié' : 'Non retenu'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 mb-1.5">Ta note</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setTestimonialForm((p) => ({ ...p, rating: n }))}
                            className="focus:outline-none transition-transform hover:scale-110"
                          >
                            <Star className={`w-7 h-7 ${n <= testimonialForm.rating ? 'text-accent-500' : 'text-neutral-300 dark:text-neutral-700'}`} fill="currentColor" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 mb-1.5">Ton message</label>
                      <textarea
                        value={testimonialForm.content}
                        onChange={(e) => setTestimonialForm((p) => ({ ...p, content: e.target.value }))}
                        placeholder="Décris ton expérience sur la plateforme Max-Morrys..."
                        rows={4}
                        className={`${inputCls} resize-y`}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSubmitTestimonial}
                        disabled={submittingTestimonial || !testimonialForm.content.trim()}
                        icon={submittingTestimonial ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      >
                        {submittingTestimonial ? 'Envoi...' : 'Envoyer mon témoignage'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mon parcours */}
              <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6">
                <h3 className="font-bold text-neutral-900 dark:text-white mb-4">Mon parcours</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-700">
                    <span className="text-neutral-500">Formations inscrites</span>
                    <span className="font-medium text-neutral-900 dark:text-white">{enrolledFormations.length}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-700">
                    <span className="text-neutral-500">Formations terminées</span>
                    <span className="font-medium text-neutral-900 dark:text-white">{completedCount}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-neutral-500">Membre depuis</span>
                    <span className="font-medium text-neutral-900 dark:text-white">
                      {userData?.createdAt ? formatDate(userData.createdAt) : '—'}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ── SETTINGS ── */}
          {activeTab === 'settings' && (
            <div className="max-w-lg space-y-4">
              <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6">
                <h3 className="font-bold text-neutral-900 dark:text-white mb-4">Apparence</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">Thème</p>
                    <p className="text-xs text-neutral-500">Mode clair ou sombre</p>
                  </div>
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
                  </button>
                </div>
              </div>
              <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6">
                <h3 className="font-bold text-neutral-900 dark:text-white mb-4">Compte</h3>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-error-300 dark:border-error-700 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 text-sm font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Se déconnecter
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
