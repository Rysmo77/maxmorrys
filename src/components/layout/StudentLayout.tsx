import { useEffect, useState, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toCanonicalPath } from '../../i18n/routing';
import AppShell from './AppShell';
import { useAuth } from '../../contexts/AuthContext';
import { tutorName } from '../../lib/naming';
import { useToast } from '@ds';
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
        // AD-12 — le nom du répétiteur vient du PROFIL, jamais d'une clé de traduction.
        // C'est un réglage : chaque personne peut le renommer, et le nom choisi doit
        // remplacer le mot partout. Une clé i18n figerait « Rysmo » pour tout le monde.
        '/mon-espace/repetiteur':      tutorName(userData),
        '/mon-espace/notes':           t('titles.notes'),
        '/mon-espace/paiements':       t('titles.payments'),
        '/mon-espace/succes':          t('titles.achievements'),
        '/mon-espace/messages':        t('titles.messages'),
        '/mon-espace/temoignages':     t('titles.testimonials'),
        '/mon-espace/club':            t('titles.club'),
        '/mon-espace/profil':          t('titles.profile'),
        '/mon-espace/parametres':      t('titles.settings'),
      }}
      /*
       * LES TERRITOIRES DE L'ESPACE APPRENANT, relevés écran par écran sur le kit.
       *
       * `ScreensSpace.js` : accueil (`:15`), répétiteur (`:83`) et Club (`:117`) sur
       * « transforme » ; lecteur de leçon (`:53`) sur « forme ». `ScreensNotes.js:14` :
       * notes sur « forme ». `ScreensCompte.js:115`, `:160` : préférences et suppression
       * sur « transforme ».
       *
       * La règle qui s'en dégage, et qui couvre les écrans que le kit ne dessine pas :
       * ce qui relève de L'ÉTUDE prend « forme » (bleu), ce qui relève de la COMMUNAUTÉ et
       * du compte prend « transforme » (violet). Succès et certificats suivent l'étude ;
       * messages, témoignages et profil suivent le compte.
       */
      territoryMap={{
        '/mon-espace': 'transforme',
        '/mon-espace/tableau-de-bord': 'transforme',
        '/mon-espace/cours': 'forme',
        '/mon-espace/notes': 'forme',
        // Le chemin de l'argent relève de ce qu'on a ACHETÉ, donc de l'étude.
        '/mon-espace/paiements': 'forme',
        '/mon-espace/succes': 'forme',
        '/mon-espace/repetiteur': 'transforme',
        '/mon-espace/club': 'transforme',
        '/mon-espace/messages': 'transforme',
        '/mon-espace/temoignages': 'transforme',
        '/mon-espace/profil': 'transforme',
        '/mon-espace/parametres': 'transforme',
      }}
      /*
       * ── HUIT ENTRÉES DANS UN SEUL GROUPE, C'ÉTAIT UNE LISTE, PAS UNE NAVIGATION ────────
       *
       * « Espace » portait tableau de bord, cours, répétiteur, notes, paiements, succès,
       * messages et témoignages — pendant que « Communauté » en portait une et « Compte »
       * trois. La loi de Miller était à sa limite haute, mais le vrai défaut était ailleurs :
       * l'écart de FRÉQUENCE. « Cours » se visite chaque jour, « Témoignages » une fois dans
       * la vie d'un compte, et les deux avaient exactement le même poids visuel. Pour
       * trouver « Paiements », il fallait lire les huit.
       *
       * Le partage suit celui que `territoryMap` fait déjà juste au-dessus, et qui est le bon
       * — il n'est simplement pas répercuté ici :
       *
       *   · APPRENDRE (bleu, « forme ») — cours, notes, succès. Ce qui relève de l'étude.
       *   · MON COMPTE (violet, « transforme ») — paiements, messages, témoignages, profil,
       *     réglages. Ce qui relève du dossier plutôt que du travail.
       *
       * DEUX ENTRÉES NE SUIVENT PAS LEUR TEINTE, ET C'EST DÉLIBÉRÉ :
       *   · Le tableau de bord reste SEUL en tête, hors groupe : c'est le point d'entrée, pas
       *     une rubrique. Lui donner un titre de section l'aurait rangé au même rang que ce
       *     qu'il résume.
       *   · Le répétiteur est violet dans `territoryMap`, mais il vit dans « Apprendre » : on
       *     l'ouvre pour réviser, jamais pour gérer son compte. La teinte dit le territoire,
       *     le groupe dit le geste — ce sont deux axes.
       *
       * « Paiements » quitte donc l'étude pour le compte. `territoryMap` le laisse en bleu
       * — « le chemin de l'argent relève de ce qu'on a ACHETÉ » — et les deux restent vrais :
       * on le range avec le dossier, il garde la couleur de ce qu'il paie.
       */
      sidebarSections={[
        {
          items: [
            { to: '/mon-espace/tableau-de-bord', label: t('nav.dashboard'), icon: 'dashboard' },
          ],
        },
        {
          title: t('nav.sectionLearn'),
          items: [
            { to: '/mon-espace/cours',           label: t('nav.courses'),   icon: 'book' },
            { to: '/mon-espace/repetiteur',      label: tutorName(userData), icon: 'bot' },
            { to: '/mon-espace/notes',           label: t('nav.notes'),     icon: 'bookmark' },
            { to: '/mon-espace/succes',          label: t('nav.achievements'), icon: 'award' },
          ],
        },
        {
          title: t('nav.sectionCommunity'),
          items: [
            {
              to: '/mon-espace/club', label: t('nav.club'), icon: 'crown', tone: 'club',
              locked: !isClubActive,
              badge: isClubPending ? t('nav.clubPending') : null,
            },
          ],
        },
        {
          title: t('nav.sectionAccount'),
          items: [
            { to: '/mon-espace/paiements',   label: t('nav.payments'),     icon: 'card' },
            { to: '/mon-espace/messages',    label: t('nav.messages'),     icon: 'inbox' },
            { to: '/mon-espace/temoignages', label: t('nav.testimonials'), icon: 'quote' },
            { to: '/mon-espace/profil',      label: t('nav.profile'),      icon: 'user' },
            { to: '/mon-espace/parametres',  label: t('nav.settings'),     icon: 'settings' },
            { to: '/',                       label: t('nav.backToSite'),   icon: 'home', end: true },
          ],
        },
      ]}
      /*
       * LES CINQ ONGLETS DU KIT, DANS SON ORDRE — `ScreensSpace.js:3-9`, repris à l'identique
       * par `ScreensNotes.js` :
       *
       *     Espace · Cours · {nom du répétiteur} · Club · Profil
       *
       * L'ENTRÉE DU RÉPÉTITEUR MANQUAIT. C'est la seule entrée de barre que le kit fait lire
       * dans le PROFIL plutôt que dans une clé de traduction — et sous 700 px, cette barre est
       * la seule navigation : le répétiteur n'était plus atteignable que par la carte du
       * tableau de bord. « Messages » occupait sa place, sous le libellé « Inbox », seul mot
       * anglais au milieu de quatre libellés français.
       *
       * Messages ne disparaît pas : il reste dans la barre latérale au-delà de 700 px, et dans
       * la liste « Dans ton espace » du tableau de bord, qui est le chemin que le kit lui donne.
       */
      bottomNavItems={[
        { to: '/mon-espace/tableau-de-bord', label: t('nav.bottomHome'),    icon: 'home' },
        { to: '/mon-espace/cours',           label: t('nav.bottomCourses'), icon: 'book' },
        { to: '/mon-espace/repetiteur',      label: tutorName(userData),    icon: 'bot' },
        { to: '/mon-espace/club',            label: t('nav.bottomClub'),    icon: 'crown' },
        { to: '/mon-espace/profil',          label: t('nav.bottomProfile'), icon: 'user' },
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
