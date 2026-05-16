import { useState, useEffect, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, Award, ArrowLeft, GraduationCap, LayoutDashboard,
  Settings, BookMarked, Crown, Lock, LogOut, Sun, Moon,
  User, Inbox, Loader2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../components/ui/Toast';
import NotificationDropdown from '../../components/ui/NotificationDropdown';
import { useStudentData } from './hooks/useStudentData';
import { useNotes } from './hooks/useNotes';
import { getUserMessages, getUserCertificates, getClubSubscription } from '../../lib/firestore';
import { cn } from '../../lib/utils';
import Onboarding from './Onboarding';
import type { ContactMessage, Certificate, ClubDigitosSubscription } from '../../types';

// Lazy-loaded tabs
const DashboardTab = lazy(() => import('./tabs/DashboardTab'));
const CoursesTab = lazy(() => import('./tabs/CoursesTab'));
const NotesTab = lazy(() => import('./tabs/NotesTab'));
const MessagesTab = lazy(() => import('./tabs/MessagesTab'));
const AchievementsTab = lazy(() => import('./tabs/AchievementsTab'));
const ProfileTab = lazy(() => import('./tabs/ProfileTab'));
const SettingsTab = lazy(() => import('./tabs/SettingsTab'));
const ClubTab = lazy(() => import('./tabs/ClubTab'));

type Tab = 'dashboard' | 'courses' | 'notes' | 'profile' | 'messages' | 'achievements' | 'settings' | 'club';

function TabLoader() {
  return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>;
}

export default function StudentDashboard() {
  const { user, userData, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Shared data hooks
  const { enrolledFormations, loadingEnrollments, avgProgress, completedCount } = useStudentData(user?.uid);
  const notesHook = useNotes(user?.uid, activeTab === 'notes');

  // Messages state
  const [sentMessages, setSentMessages] = useState<ContactMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Certificates state
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(false);

  // Club subscription (for sidebar lock icon)
  const [clubSubscription, setClubSubscription] = useState<ClubDigitosSubscription | null | undefined>(undefined);

  // Onboarding for first-time users
  useEffect(() => {
    if (userData && userData.onboardingCompleted === undefined) {
      setShowOnboarding(true);
    }
  }, [userData]);

  // Load messages when tab opens
  useEffect(() => {
    if (!user || activeTab !== 'messages') return;
    setLoadingMessages(true);
    getUserMessages(user.uid).then((data) => {
      setSentMessages(data);
      setLoadingMessages(false);
    }).catch(() => { setLoadingMessages(false); addToast('error', 'Impossible de charger tes messages.'); });
  }, [user, activeTab]);

  // Load certificates when tab opens (achievements or courses)
  useEffect(() => {
    if (!user || (activeTab !== 'achievements' && activeTab !== 'courses')) return;
    setLoadingCerts(true);
    getUserCertificates(user.uid).then((data) => {
      setCertificates(data);
      setLoadingCerts(false);
    }).catch(() => { setLoadingCerts(false); addToast('error', 'Impossible de charger tes certificats.'); });
  }, [user, activeTab]);

  // Load club subscription status for sidebar
  useEffect(() => {
    if (!user) return;
    getClubSubscription(user.uid).then(setClubSubscription).catch(() => null);
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const displayName = userData?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Étudiant';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const photoURL = user?.photoURL || userData?.photoURL;

  const isClubActive = clubSubscription?.status === 'active' && new Date(clubSubscription.expiresAt) > new Date();
  const isClubPending = clubSubscription?.status === 'pending';

  const navItems: { id: Tab; icon: React.FC<{ className?: string }>; label: string; club?: boolean }[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { id: 'courses', icon: BookOpen, label: 'Mes formations' },
    { id: 'notes', icon: BookMarked, label: 'Mes notes' },
    { id: 'achievements', icon: Award, label: 'Succès & Certificats' },
    { id: 'messages', icon: Inbox, label: 'Messages' },
    { id: 'profile', icon: User, label: 'Profil' },
    { id: 'settings', icon: Settings, label: 'Paramètres' },
    { id: 'club', icon: Crown, label: 'Club des Digitos', club: true },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      {/* Onboarding overlay */}
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col transition-transform duration-300',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <Link to="/" className="flex items-center gap-2 group" onClick={() => setMobileMenuOpen(false)}>
            <GraduationCap className="w-6 h-6 text-brand-500" />
            <span className="font-black text-neutral-900 dark:text-white">Max-Morrys</span>
            <ArrowLeft className="w-4 h-4 text-neutral-400 ml-auto group-hover:text-brand-500 transition-colors" />
          </Link>
        </div>

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

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                item.club
                  ? activeTab === item.id
                    ? 'bg-plum-50 dark:bg-plum-900/30 text-plum-700 dark:text-plum-300'
                    : 'text-plum-600 dark:text-plum-400 hover:bg-plum-50 dark:hover:bg-plum-900/20'
                  : activeTab === item.id
                    ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white',
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.club && !isClubActive && <Lock className="w-3 h-3 flex-shrink-0 opacity-60" />}
              {item.club && isClubPending && (
                <span className="text-xs bg-plum-100 dark:bg-plum-900/50 text-plum-700 dark:text-plum-300 px-1.5 py-0.5 rounded-full font-semibold">En attente</span>
              )}
            </button>
          ))}
        </nav>

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
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-6 h-16 flex items-center gap-4">
          <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <LayoutDashboard className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-neutral-900 dark:text-white text-sm sm:text-base">
              {navItems.find((n) => n.id === activeTab)?.label}
            </h1>
          </div>
          <NotificationDropdown />
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full">
          <Suspense fallback={<TabLoader />}>
            {activeTab === 'dashboard' && (
              <DashboardTab
                displayName={displayName}
                userId={user?.uid}
                enrolledFormations={enrolledFormations}
                loadingEnrollments={loadingEnrollments}
                avgProgress={avgProgress}
                completedCount={completedCount}
              />
            )}
            {activeTab === 'courses' && (
              <CoursesTab
                enrolledFormations={enrolledFormations}
                loadingEnrollments={loadingEnrollments}
                certificates={certificates}
              />
            )}
            {activeTab === 'notes' && (
              <NotesTab
                notes={notesHook.notes}
                filteredNotes={notesHook.filteredNotes}
                loadingNotes={notesHook.loadingNotes}
                showNoteForm={notesHook.showNoteForm}
                editingNote={notesHook.editingNote}
                noteForm={notesHook.noteForm}
                savingNote={notesHook.savingNote}
                noteSearch={notesHook.noteSearch}
                setNoteSearch={notesHook.setNoteSearch}
                setNoteForm={notesHook.setNoteForm}
                openNewNote={notesHook.openNewNote}
                openEditNote={notesHook.openEditNote}
                setShowNoteForm={notesHook.setShowNoteForm}
                onSaveNote={notesHook.handleSaveNote}
                onDeleteNote={notesHook.handleDeleteNote}
                addToast={addToast}
              />
            )}
            {activeTab === 'messages' && user && (
              <MessagesTab
                userId={user.uid}
                userEmail={user.email || ''}
                displayName={displayName}
                sentMessages={sentMessages}
                setSentMessages={setSentMessages}
                loadingMessages={loadingMessages}
                addToast={addToast}
              />
            )}
            {activeTab === 'achievements' && user && (
              <AchievementsTab
                userId={user.uid}
                certificates={certificates}
                setCertificates={setCertificates}
                loadingCerts={loadingCerts}
                enrolledFormations={enrolledFormations}
                addToast={addToast}
              />
            )}
            {activeTab === 'profile' && (
              <ProfileTab
                enrolledFormations={enrolledFormations}
                completedCount={completedCount}
              />
            )}
            {activeTab === 'settings' && (
              <SettingsTab
                theme={theme}
                setTheme={setTheme}
                onSignOut={handleSignOut}
              />
            )}
            {activeTab === 'club' && (
              <ClubTab enrolledFormations={enrolledFormations} />
            )}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
