import { useEffect, useState, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, BookMarked, Award, Inbox, User, Settings, Crown, Home, Bot,
} from 'lucide-react';
import AppShell from './AppShell';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';
import { useStudentData, type EnrolledFormation } from '../../pages/lms/hooks/useStudentData';
import { useNotes } from '../../pages/lms/hooks/useNotes';
import {
  getUserMessages, getUserCertificates, getClubSubscription,
} from '../../lib/firestore';
import type { ContactMessage, Certificate, ClubDigitosSubscription } from '../../types';

const Onboarding = lazy(() => import('../../pages/lms/Onboarding'));

export interface StudentLayoutContext {
  displayName: string;
  initials: string;
  photoURL?: string | null;
  enrolledFormations: EnrolledFormation[];
  loadingEnrollments: boolean;
  avgProgress: number;
  completedCount: number;
  certificates: Certificate[];
  setCertificates: React.Dispatch<React.SetStateAction<Certificate[]>>;
  loadingCerts: boolean;
  sentMessages: ContactMessage[];
  setSentMessages: React.Dispatch<React.SetStateAction<ContactMessage[]>>;
  loadingMessages: boolean;
  notesHook: ReturnType<typeof useNotes>;
  clubSubscription: ClubDigitosSubscription | null | undefined;
  isClubActive: boolean;
  isClubPending: boolean;
  addToast: (type: 'success' | 'error', message: string) => void;
  userId?: string;
  userEmail: string;
}

export default function StudentLayout() {
  const { user, userData } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();

  const { enrolledFormations, loadingEnrollments, avgProgress, completedCount } = useStudentData(user?.uid);
  const notesActive = location.pathname.startsWith('/mon-espace/notes');
  const notesHook = useNotes(user?.uid, notesActive);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sentMessages, setSentMessages] = useState<ContactMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(false);
  const [clubSubscription, setClubSubscription] = useState<ClubDigitosSubscription | null | undefined>(undefined);

  // Onboarding first-time users
  useEffect(() => {
    if (userData && userData.onboardingCompleted === undefined) {
      setShowOnboarding(true);
    }
  }, [userData]);

  // Load messages when on /messages
  useEffect(() => {
    if (!user || !location.pathname.startsWith('/mon-espace/messages')) return;
    setLoadingMessages(true);
    getUserMessages(user.uid).then((data) => {
      setSentMessages(data);
      setLoadingMessages(false);
    }).catch(() => { setLoadingMessages(false); addToast('error', 'Impossible de charger tes messages.'); });
  }, [user, location.pathname, addToast]);

  // Load certificates on /succes or /cours
  useEffect(() => {
    if (!user) return;
    const needsCerts = location.pathname.startsWith('/mon-espace/succes') || location.pathname.startsWith('/mon-espace/cours');
    if (!needsCerts) return;
    setLoadingCerts(true);
    getUserCertificates(user.uid).then((data) => {
      setCertificates(data);
      setLoadingCerts(false);
    }).catch(() => { setLoadingCerts(false); addToast('error', 'Impossible de charger tes certificats.'); });
  }, [user, location.pathname, addToast]);

  // Club subscription for sidebar lock + bottom nav
  useEffect(() => {
    if (!user) return;
    getClubSubscription(user.uid).then(setClubSubscription).catch(() => null);
  }, [user]);

  const displayName = userData?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Étudiant';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const photoURL = user?.photoURL || userData?.photoURL;

  const isClubActive = clubSubscription?.status === 'active' && new Date(clubSubscription.expiresAt) > new Date();
  const isClubPending = clubSubscription?.status === 'pending';

  const context: StudentLayoutContext = {
    displayName, initials, photoURL,
    enrolledFormations, loadingEnrollments, avgProgress, completedCount,
    certificates, setCertificates, loadingCerts,
    sentMessages, setSentMessages, loadingMessages,
    notesHook,
    clubSubscription, isClubActive, isClubPending,
    addToast,
    userId: user?.uid, userEmail: user?.email ?? '',
  };

  return (
    <AppShell
      brand={{ label: 'Mon espace', href: '/mon-espace/tableau-de-bord', mark: 'MM' }}
      titleMap={STUDENT_TITLES}
      sidebarSections={[
        {
          title: 'Espace',
          items: [
            { to: '/mon-espace/tableau-de-bord', label: 'Tableau de bord', icon: LayoutDashboard },
            { to: '/mon-espace/cours',           label: 'Mes formations',   icon: BookOpen },
            { to: '/mon-espace/rysmo',           label: 'Rysmo',            icon: Bot },
            { to: '/mon-espace/notes',           label: 'Mes notes',        icon: BookMarked },
            { to: '/mon-espace/succes',          label: 'Succès & Certificats', icon: Award },
            { to: '/mon-espace/messages',        label: 'Messages',         icon: Inbox },
          ],
        },
        {
          title: 'Communauté',
          items: [
            {
              to: '/mon-espace/club', label: 'Club des Digitos', icon: Crown, tone: 'club',
              locked: !isClubActive,
              badge: isClubPending ? 'En attente' : null,
            },
          ],
        },
        {
          title: 'Compte',
          items: [
            { to: '/mon-espace/profil',     label: 'Profil',     icon: User },
            { to: '/mon-espace/parametres', label: 'Paramètres', icon: Settings },
            { to: '/',                       label: 'Retour au site', icon: Home, end: true },
          ],
        },
      ]}
      bottomNavItems={[
        { to: '/mon-espace/tableau-de-bord', label: 'Accueil', icon: Home },
        { to: '/mon-espace/cours',           label: 'Cours',   icon: BookOpen },
        { to: '/mon-espace/club',            label: 'Club',    icon: Crown },
        { to: '/mon-espace/messages',        label: 'Inbox',   icon: Inbox },
        { to: '/mon-espace/profil',          label: 'Profil',  icon: User },
      ]}
      contentClassName="p-4 sm:p-6 max-w-6xl mx-auto w-full"
      outletContext={context}
      beforeOutlet={
        showOnboarding ? (
          <Suspense fallback={null}>
            <Onboarding onComplete={() => setShowOnboarding(false)} />
          </Suspense>
        ) : null
      }
    />
  );
}

const STUDENT_TITLES: Record<string, string> = {
  '/mon-espace/tableau-de-bord': 'Tableau de bord',
  '/mon-espace/cours':           'Mes formations',
  '/mon-espace/rysmo':           'Rysmo',
  '/mon-espace/notes':           'Mes notes',
  '/mon-espace/succes':          'Succès & Certificats',
  '/mon-espace/messages':        'Messages',
  '/mon-espace/club':            'Club des Digitos',
  '/mon-espace/profil':          'Mon profil',
  '/mon-espace/parametres':      'Paramètres',
};
