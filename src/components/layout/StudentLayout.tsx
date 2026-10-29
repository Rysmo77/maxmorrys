import { useEffect, useState, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { espaceCourant, toLogicalPath } from '../../lib/hosts';
import AppShell from './AppShell';
import LocalizedLink from '../shared/LocalizedLink';
import { useAuth } from '../../contexts/AuthContext';
import { tutorName } from '../../lib/naming';
import { useToast } from '@ds';
import { useStudentData, type EnrolledFormation } from '../../pages/lms/hooks/useStudentData';
import { useNotes } from '../../pages/lms/hooks/useNotes';
import {
  getUserMessages, getUserCertificates, getClubSubscription, getMyTestimonials,
} from '../../lib/firestore';
import { estMembreActif } from '../../lib/club/membership';
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
  const path = toLogicalPath(location.pathname);

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

  const isClubActive = estMembreActif(clubSubscription);
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

  /*
   * PASSE 2 — DEUX COQUILLES, UNE ROUTE MÈRE. Sous `/mon-espace/club*`, l'espace est le Club
   * (`Club-Fil.dc.html` : rail d'icônes violet, onglets Fil · Discussions · Agenda ·
   * Opportunités · Plus) ; ailleurs, l'école Edu (`Edu-Espace.dc.html` : « Mon école »,
   * onglets Accueil · Cours · Agenda · Succès · assistant). Le nom de l'assistant est celui
   * que la personne a choisi (« Rysmo IA » par défaut, PRD rév. 6 FR-283) ; trop long pour
   * un onglet, il cède la place à « Assistant ».
   */
  /* L'espace est celui de l'HÔTE (`lib/espaces.ts`) : club. sert les onglets du Club,
     edu. l'école, et maxmorrys.me l'espace personnel général (compte, paiements, messages,
     assistant). */
  const espace = espaceCourant();
  const inClub = espace === 'club';
  const inHub = espace === 'hub';
  const assistant = tutorName(userData);
  const assistantTab = assistant.length > 12 ? t('nav.assistantShort') : assistant;

  const eduSections = [
    {
      title: t('nav.sectionSchool'),
      items: [
        { to: '/mon-espace/tableau-de-bord', label: t('nav.dashboard'), icon: 'home' as const },
        { to: '/mon-espace/cours', label: t('nav.courses'), icon: 'book' as const },
        { to: '/mon-espace/agenda', label: t('nav.agenda'), icon: 'calendar' as const },
        { to: '/mon-espace/cohorte', label: t('nav.cohort'), icon: 'users' as const },
        { to: '/mon-espace/succes', label: t('nav.achievementsShort'), icon: 'award' as const },
        { to: '/mon-espace/notes', label: t('nav.notes'), icon: 'doc' as const },
        { to: '/mon-espace/assistant', label: assistant, icon: 'sparkles' as const },
      ],
    },
    {
      title: t('nav.sectionCommunity'),
      items: [
        {
          to: '/mon-espace/club', label: t('nav.club'), icon: 'crown' as const, tone: 'club' as const,
          locked: !isClubActive,
          badge: isClubPending ? t('nav.clubPending') : null,
        },
      ],
    },
    {
      title: t('nav.sectionAccount'),
      items: [
        { to: '/compte', label: t('nav.account'), icon: 'globe' as const },
        { to: '/mon-espace/paiements', label: t('nav.payments'), icon: 'card' as const },
        { to: '/mon-espace/messages', label: t('nav.messages'), icon: 'inbox' as const },
        { to: '/mon-espace/temoignages', label: t('nav.testimonials'), icon: 'quote' as const },
        { to: '/mon-espace/profil', label: t('nav.profile'), icon: 'user' as const },
        { to: '/mon-espace/parametres', label: t('nav.settings'), icon: 'settings' as const },
        { to: '/', label: t('nav.backToSite'), icon: 'home' as const, end: true },
      ],
    },
  ];

  const hubSections = [
    {
      title: t('nav.sectionAccount'),
      items: [
        { to: '/compte', label: t('nav.account'), icon: 'globe' as const },
        { to: '/mon-espace/assistant', label: assistant, icon: 'sparkles' as const },
        { to: '/mon-espace/paiements', label: t('nav.payments'), icon: 'card' as const },
        { to: '/mon-espace/messages', label: t('nav.messages'), icon: 'inbox' as const },
        { to: '/mon-espace/temoignages', label: t('nav.testimonials'), icon: 'quote' as const },
        { to: '/mon-espace/profil', label: t('nav.profile'), icon: 'user' as const },
        { to: '/mon-espace/parametres', label: t('nav.settings'), icon: 'settings' as const },
      ],
    },
    {
      items: [
        { to: '/mon-espace', label: t('nav.backToSchool'), icon: 'book' as const },
        {
          to: '/mon-espace/club', label: t('nav.club'), icon: 'crown' as const, tone: 'club' as const,
          locked: !isClubActive,
          badge: isClubPending ? t('nav.clubPending') : null,
        },
        { to: '/', label: t('nav.backToSite'), icon: 'home' as const, end: true },
      ],
    },
  ];

  const clubSections = [
    {
      items: [
        { to: '/mon-espace/club/fil', label: t('nav.clubFeed'), icon: 'home' as const },
        { to: '/mon-espace/club/discussions', label: t('nav.clubDiscussions'), icon: 'chat' as const },
        { to: '/mon-espace/club/agenda', label: t('nav.agenda'), icon: 'calendar' as const },
        { to: '/mon-espace/club/membres', label: t('nav.clubMembers'), icon: 'users' as const },
        { to: '/mon-espace/club/classement', label: t('nav.clubLeaderboard'), icon: 'bars' as const },
        { to: '/mon-espace/club/opportunites', label: t('nav.clubOpportunities'), icon: 'case' as const },
        { to: '/mon-espace/club/defis', label: t('nav.clubChallenges'), icon: 'target' as const },
        { to: '/mon-espace/club/infos', label: t('nav.clubInfo'), icon: 'info' as const },
        { to: '/mon-espace/club/parrainage', label: t('nav.clubReferral'), icon: 'gift' as const },
      ],
    },
    {
      items: [
        { to: '/mon-espace/tableau-de-bord', label: t('nav.backToSchool'), icon: 'book' as const },
        { to: '/compte', label: t('nav.account'), icon: 'settings' as const },
      ],
    },
  ];

  return (
    <AppShell
      brand={inClub
        ? { label: t('nav.clubBrand'), href: '/mon-espace/club' }
        : inHub
          ? { label: t('nav.brand'), href: '/compte' }
          : { label: t('nav.brand'), href: '/mon-espace/tableau-de-bord', badge: 'EDU' }}
      space={espace}
      rail={inClub}
      mesh={false}
      /* Maquettes Edu v3 : la zone principale se pose sur `--paper-2`, comme le Club. */
      shellClassName="bg-[color:var(--paper-2)]"
      /*
        « Ta cohorte » (maquettes `Edu-*`, colonne latérale) : aucune donnée de cohorte n'est
        servie à ce jour, donc l'état vide — jamais les quatre camarades d'exemple de la maquette.
      */
      sidebarFooter={espace !== 'edu' ? undefined : (
        <div className="px-2 py-2">
          <LocalizedLink to="/mon-espace/cohorte" className="block text-[11px] font-bold uppercase tracking-[0.08em] text-ink-3 no-underline">
            {t('sidebarCohort.title')}
          </LocalizedLink>
          <p className="m-0 mt-1.5 text-[11.5px] leading-snug text-ink-3">{t('sidebarCohort.empty')}</p>
        </div>
      )}
      titleMap={{
        '/mon-espace/tableau-de-bord': t('titles.dashboard'),
        '/mon-espace/cours':           t('titles.courses'),
        '/mon-espace/assistant':       assistant,
        '/mon-espace/notes':           t('titles.notes'),
        '/mon-espace/paiements':       t('titles.payments'),
        '/mon-espace/succes':          t('titles.achievements'),
        '/mon-espace/messages':        t('titles.messages'),
        '/mon-espace/temoignages':     t('titles.testimonials'),
        '/mon-espace/club':            t('titles.club'),
        '/mon-espace/profil':          t('titles.profile'),
        '/mon-espace/parametres':      t('titles.settings'),
        '/mon-espace/agenda':          t('nav.agenda'),
        '/mon-espace/cohorte':         t('nav.cohort'),
        '/mon-espace/cohorte/live':    t('titles.cohortLive'),
        '/mon-espace/missions':        t('titles.missions'),
        '/mon-espace/quiz/*':          t('titles.quiz'),
      }}
      territoryMap={{
        '/mon-espace': 'transforme',
        '/mon-espace/cours': 'forme',
        '/mon-espace/notes': 'forme',
        '/mon-espace/paiements': 'forme',
        '/mon-espace/succes': 'forme',
      }}
      sidebarSections={inClub ? clubSections : inHub ? hubSections : eduSections}
      bottomNavItems={inClub
        ? [
            { to: '/mon-espace/club/fil',          label: t('nav.clubFeed'),          icon: 'home' },
            { to: '/mon-espace/club/discussions',  label: t('nav.clubDiscussions'),   icon: 'chat' },
            { to: '/mon-espace/club/agenda',       label: t('nav.agenda'),            icon: 'calendar' },
            { to: '/mon-espace/club/opportunites', label: t('nav.clubOpportunities'), icon: 'case' },
            { to: '/mon-espace/club/membres',      label: t('nav.more'),              icon: 'dots' },
          ]
        : inHub
          ? [
            { to: '/mon-espace/assistant',  label: assistantTab,       icon: 'sparkles' },
            { to: '/mon-espace/paiements',  label: t('nav.payments'),  icon: 'card' },
            { to: '/mon-espace/messages',   label: t('nav.messages'),  icon: 'inbox' },
            { to: '/mon-espace/profil',     label: t('nav.profile'),   icon: 'user' },
            { to: '/mon-espace',            label: t('nav.backToSchool'), icon: 'book' },
          ]
          : [
            { to: '/mon-espace/tableau-de-bord', label: t('nav.bottomHome'),    icon: 'home' },
            { to: '/mon-espace/cours',           label: t('nav.bottomCourses'), icon: 'book' },
            { to: '/mon-espace/agenda',          label: t('nav.agenda'),        icon: 'calendar' },
            { to: '/mon-espace/succes',          label: t('nav.achievementsShort'), icon: 'award' },
            { to: '/mon-espace/assistant',       label: assistantTab,           icon: 'sparkles' },
          ]}
      contentClassName="p-4 stack:p-6 max-w-6xl mx-auto w-full"
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
