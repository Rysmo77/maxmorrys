import { useEffect, useState, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toCanonicalPath } from '../../i18n/routing';
import {
  LayoutDashboard, BookOpen, BookMarked, Award, Inbox, User, Settings, Crown, Home, Bot, MessageSquareQuote,
} from 'lucide-react';
import AppShell from './AppShell';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';
import { useStudentData, type EnrolledFormation } from '../../pages/lms/hooks/useStudentData';
import { useNotes } from '../../pages/lms/hooks/useNotes';
import {
  getUserMessages, getUserCertificates, getClubSubscription, getMyTestimonials,
} from '../../lib/firestore';
import type { ContactMessage, Certificate, ClubDigitosSubscription, Testimonial } from '../../types';

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
  myTestimonials: Testimonial[];
  setMyTestimonials: React.Dispatch<React.SetStateAction<Testimonial[]>>;
  loadingTestimonials: boolean;
  clubSubscription: ClubDigitosSubscription | null | undefined;
  isClubActive: boolean;
  isClubPending: boolean;
  addToast: (type: 'success' | 'error', message: string) => void;
  userId?: string;
  userEmail: string;
}

export default function StudentLayout() {
  const { t } = useTranslation('lms');
  const { user, userData } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const path = toCanonicalPath(location.pathname);

  const { enrolledFormations, loadingEnrollments, avgProgress, completedCount } = useStudentData(user?.uid);
  const notesActive = path.startsWith('/mon-espace/notes');
  const notesHook = useNotes(user?.uid, notesActive);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sentMessages, setSentMessages] = useState<ContactMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(false);
  const [clubSubscription, setClubSubscription] = useState<ClubDigitosSubscription | null | undefined>(undefined);
  const [myTestimonials, setMyTestimonials] = useState<Testimonial[]>([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(false);

  // Onboarding first-time users
  useEffect(() => {
    if (userData && userData.onboardingCompleted === undefined) {
      setShowOnboarding(true);
    }
  }, [userData]);

  // Load messages when on /messages
  useEffect(() => {
    if (!user || !path.startsWith('/mon-espace/messages')) return;
    setLoadingMessages(true);
    getUserMessages(user.uid).then((data) => {
      setSentMessages(data);
      setLoadingMessages(false);
    }).catch(() => { setLoadingMessages(false); addToast('error', t('errors.loadMessages')); });
  }, [user, path, addToast, t]);

  // Load certificates on /succes or /cours
  useEffect(() => {
    if (!user) return;
    const needsCerts = path.startsWith('/mon-espace/succes') || path.startsWith('/mon-espace/cours');
    if (!needsCerts) return;
    setLoadingCerts(true);
    getUserCertificates(user.uid).then((data) => {
      setCertificates(data);
      setLoadingCerts(false);
    }).catch(() => { setLoadingCerts(false); addToast('error', t('errors.loadCertificates')); });
  }, [user, path, addToast, t]);

  // Club subscription for sidebar lock + bottom nav
  useEffect(() => {
    if (!user) return;
    getClubSubscription(user.uid).then(setClubSubscription).catch(() => null);
  }, [user]);

  // Load my testimonials when on /temoignages
  useEffect(() => {
    if (!user || !path.startsWith('/mon-espace/temoignages')) return;
    setLoadingTestimonials(true);
    getMyTestimonials(user.uid).then((data) => {
      setMyTestimonials(data);
      setLoadingTestimonials(false);
    }).catch(() => setLoadingTestimonials(false));
  }, [user, path]);

  const displayName = userData?.displayName || user?.displayName || user?.email?.split('@')[0] || t('fallbackName');
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
    myTestimonials, setMyTestimonials, loadingTestimonials,
    clubSubscription, isClubActive, isClubPending,
    addToast,
    userId: user?.uid, userEmail: user?.email ?? '',
  };

  return (
    <AppShell
      brand={{ label: t('nav.brand'), href: '/mon-espace/tableau-de-bord' }}
      titleMap={{
        '/mon-espace/tableau-de-bord': t('titles.dashboard'),
        '/mon-espace/cours':           t('titles.courses'),
        '/mon-espace/rysmo':           t('titles.rysmo'),
        '/mon-espace/notes':           t('titles.notes'),
        '/mon-espace/succes':          t('titles.achievements'),
        '/mon-espace/messages':        t('titles.messages'),
        '/mon-espace/temoignages':     t('titles.testimonials'),
        '/mon-espace/club':            t('titles.club'),
        '/mon-espace/profil':          t('titles.profile'),
        '/mon-espace/parametres':      t('titles.settings'),
      }}
      sidebarSections={[
        {
          title: t('nav.sectionSpace'),
          items: [
            { to: '/mon-espace/tableau-de-bord', label: t('nav.dashboard'), icon: LayoutDashboard },
            { to: '/mon-espace/cours',           label: t('nav.courses'),   icon: BookOpen },
            { to: '/mon-espace/rysmo',           label: t('nav.rysmo'),     icon: Bot },
            { to: '/mon-espace/notes',           label: t('nav.notes'),     icon: BookMarked },
            { to: '/mon-espace/succes',          label: t('nav.achievements'), icon: Award },
            { to: '/mon-espace/messages',        label: t('nav.messages'),  icon: Inbox },
            { to: '/mon-espace/temoignages',     label: t('nav.testimonials'), icon: MessageSquareQuote },
          ],
        },
        {
          title: t('nav.sectionCommunity'),
          items: [
            {
              to: '/mon-espace/club', label: t('nav.club'), icon: Crown, tone: 'club',
              locked: !isClubActive,
              badge: isClubPending ? t('nav.clubPending') : null,
            },
          ],
        },
        {
          title: t('nav.sectionAccount'),
          items: [
            { to: '/mon-espace/profil',     label: t('nav.profile'),    icon: User },
            { to: '/mon-espace/parametres', label: t('nav.settings'),   icon: Settings },
            { to: '/',                       label: t('nav.backToSite'), icon: Home, end: true },
          ],
        },
      ]}
      bottomNavItems={[
        { to: '/mon-espace/tableau-de-bord', label: t('nav.bottomHome'),     icon: Home },
        { to: '/mon-espace/cours',           label: t('nav.bottomCourses'),  icon: BookOpen },
        { to: '/mon-espace/club',            label: t('nav.bottomClub'),     icon: Crown },
        { to: '/mon-espace/messages',        label: t('nav.bottomMessages'), icon: Inbox },
        { to: '/mon-espace/profil',          label: t('nav.bottomProfile'),  icon: User },
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
