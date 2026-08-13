import { createBrowserRouter, RouterProvider, Outlet, ScrollRestoration, useLocation, useParams, Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { useState, lazy, Suspense } from 'react';
import type { ComponentType, ReactNode } from 'react';

/** Wrap React.lazy to auto-reload once when a stale chunk (post-deploy) fails to load. */
function lazyWithReload<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      const KEY = 'mm-chunk-reload';
      if (typeof window !== 'undefined' && !sessionStorage.getItem(KEY)) {
        sessionStorage.setItem(KEY, '1');
        window.location.reload();
      }
      throw err;
    }
  });
}
import { motion, useReducedMotion } from 'framer-motion';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { useTranslation } from 'react-i18next';
import './i18n';
import { pageVariants, pageTransition } from './lib/animations';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { localizeSegments } from './i18n/segments';
import { localizedPath } from './i18n/routing';
import { ToastProvider } from './components/ui/Toast';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ScrollProgress from './components/shared/ScrollProgress';
import CookieBanner from './components/shared/CookieBanner';
import LanguageSuggestionBanner from './components/shared/LanguageSuggestionBanner';
import SearchOverlay from './components/shared/SearchOverlay';
import ErrorBoundary from './components/shared/ErrorBoundary';
import MetaPixelTracker from './components/tracking/MetaPixelTracker';
import Home from './pages/Home';
import Forbidden403 from './pages/Forbidden403';
import NotFound from './pages/NotFound';

// Lazy-loaded public pages
const About = lazyWithReload(() => import('./pages/About'));
const Blog = lazyWithReload(() => import('./pages/Blog'));
const BlogPost = lazyWithReload(() => import('./pages/BlogPost'));
const Formations = lazyWithReload(() => import('./pages/Formations'));
const FormationDetail = lazyWithReload(() => import('./pages/FormationDetail'));
const Podcasts = lazyWithReload(() => import('./pages/Podcasts'));
const PodcastDetail = lazyWithReload(() => import('./pages/PodcastDetail'));
const Videos = lazyWithReload(() => import('./pages/Videos'));
const VideoDetail = lazyWithReload(() => import('./pages/VideoDetail'));
const FAQPage = lazyWithReload(() => import('./pages/FAQ'));
const Contact = lazyWithReload(() => import('./pages/Contact'));
const Agence = lazyWithReload(() => import('./pages/Agence'));
const PresenceDigitale = lazyWithReload(() => import('./pages/PresenceDigitale'));
const PresenceDevis = lazyWithReload(() => import('./pages/PresenceDevis'));
const MentionsLegales = lazyWithReload(() => import('./pages/legal/MentionsLegales'));
const Confidentialite = lazyWithReload(() => import('./pages/legal/Confidentialite'));
const CGV = lazyWithReload(() => import('./pages/legal/CGV'));
const CGU = lazyWithReload(() => import('./pages/legal/CGU'));
const CookiesPage = lazyWithReload(() => import('./pages/legal/CookiesPage'));
import { AdminRoute, ProtectedRoute } from './components/routing/ProtectedRoute';
import RysmoWidget from './components/ai/RysmoWidget';

// Lazy-loaded routes — not needed on first public page load
const Login = lazyWithReload(() => import('./pages/auth/Login'));
const Register = lazyWithReload(() => import('./pages/auth/Register'));
const ResetPassword = lazyWithReload(() => import('./pages/auth/ResetPassword'));
const StudentLayout = lazyWithReload(() => import('./components/layout/StudentLayout'));
const DashboardPage = lazyWithReload(() => import('./pages/lms/routes/DashboardPage'));
const CoursesPage = lazyWithReload(() => import('./pages/lms/routes/CoursesPage'));
const NotesPage = lazyWithReload(() => import('./pages/lms/routes/NotesPage'));
const MessagesPage = lazyWithReload(() => import('./pages/lms/routes/MessagesPage'));
const AchievementsPage = lazyWithReload(() => import('./pages/lms/routes/AchievementsPage'));
const ProfilePage = lazyWithReload(() => import('./pages/lms/routes/ProfilePage'));
const SettingsPage = lazyWithReload(() => import('./pages/lms/routes/SettingsPage'));
const ClubPage = lazyWithReload(() => import('./pages/lms/routes/ClubPage'));
const RysmoPage = lazyWithReload(() => import('./pages/lms/routes/RysmoPage'));
const TestimonialsPage = lazyWithReload(() => import('./pages/lms/routes/TestimonialsPage'));
const CoursePlayer = lazyWithReload(() => import('./pages/lms/CoursePlayer'));
const Checkout = lazyWithReload(() => import('./pages/lms/Checkout'));
const PaymentReturn = lazyWithReload(() => import('./pages/lms/PaymentReturn'));
const AdminLayout = lazyWithReload(() => import('./components/layout/AdminLayout'));
const AdminDashboard = lazyWithReload(() => import('./pages/admin/AdminDashboard'));
const AdminArticles = lazyWithReload(() => import('./pages/admin/AdminArticles'));
const AdminFormations = lazyWithReload(() => import('./pages/admin/AdminFormations'));
const AdminUsers = lazyWithReload(() => import('./pages/admin/AdminUsers'));
const AdminMessages = lazyWithReload(() => import('./pages/admin/AdminMessages'));
const AdminAnalytics = lazyWithReload(() => import('./pages/admin/AdminAnalytics'));
const AdminSettings = lazyWithReload(() => import('./pages/admin/AdminSettings'));
const AdminPodcasts = lazyWithReload(() => import('./pages/admin/AdminPodcasts'));
const AdminVideos = lazyWithReload(() => import('./pages/admin/AdminVideos'));
const AdminTransactions = lazyWithReload(() => import('./pages/admin/AdminTransactions'));
const AdminCoupons = lazyWithReload(() => import('./pages/admin/AdminCoupons'));
const AdminAnnouncements = lazyWithReload(() => import('./pages/admin/AdminAnnouncements'));
const AdminFAQ = lazyWithReload(() => import('./pages/admin/AdminFAQ'));
const AdminTestimonials = lazyWithReload(() => import('./pages/admin/AdminTestimonials'));
const AdminAppointments = lazyWithReload(() => import('./pages/admin/AdminAppointments'));
const AdminClubDigitos = lazyWithReload(() => import('./pages/admin/AdminClubDigitos'));
const AdminAgencyLeads = lazyWithReload(() => import('./pages/admin/AdminAgencyLeads'));
const AdminMissions = lazyWithReload(() => import('./pages/admin/AdminMissions'));
const CertificatePage = lazyWithReload(() => import('./pages/lms/Certificate'));

function PageLoader() {
  const { t } = useTranslation('common');
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" aria-label={t('loading')} />
    </div>
  );
}

/** Transition d'entrée légère à chaque changement de route (fondu/glissé). */
function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const reduced = useReducedMotion();
  if (reduced) return <>{children}</>;
  return (
    <motion.div
      key={location.pathname}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}

function PublicLayout() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { t } = useTranslation('nav');
  return (
    <>
      <MetaPixelTracker />
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold">
        {t('skipToContent')}
      </a>
      <ScrollProgress />
      <Header onSearchOpen={() => setSearchOpen(true)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <main id="main-content" className="min-h-screen">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <Footer />
      <CookieBanner />
      <ScrollRestoration />
    </>
  );
}

function AuthLayout() {
  return (
    <>
      <MetaPixelTracker />
      <Outlet />
      <ScrollRestoration />
    </>
  );
}

function LmsLayout() {
  return (
    <>
      <MetaPixelTracker />
      <Outlet />
      <RysmoWidget />
      <ScrollRestoration />
    </>
  );
}

/** Enveloppe la langue : monte le LanguageProvider, lequel doit vivre dans le Router. */
function RootProviders() {
  return (
    <LanguageProvider>
      <Outlet />
      <LanguageSuggestionBanner />
    </LanguageProvider>
  );
}

/** Redirection d'index de /mon-espace vers le tableau de bord, segment localisé. */
function MonEspaceIndexRedirect() {
  const { language } = useLanguage();
  return <Navigate to={localizeSegments('tableau-de-bord', language)} replace />;
}

/**
 * Ancienne URL de devis `/agence/devis/:ref` → `/presence-digitale/devis/:ref`.
 *
 * L'offre « Digital Commerce Local » a quitté `/agence`, mais des récapitulatifs ont déjà
 * été partagés en WhatsApp : ces liens doivent continuer de résoudre.
 */
function LegacyQuoteRedirect() {
  const { language } = useLanguage();
  const { ref } = useParams<{ ref: string }>();
  return <Navigate to={localizedPath(`/presence-digitale/devis/${ref ?? ''}`, language)} replace />;
}

/** Clone récursif d'un arbre de routes en traduisant les segments `path` vers `lang`. */
function localizeRouteTree(routes: RouteObject[], lang: 'fr' | 'en'): RouteObject[] {
  return routes.map((r) => {
    const out = { ...r } as RouteObject & { path?: string; children?: RouteObject[] };
    if (typeof out.path === 'string') out.path = localizeSegments(out.path, lang);
    if (out.children) out.children = localizeRouteTree(out.children, lang);
    return out;
  });
}

/**
 * Arbre de routes (chemins relatifs). Monté deux fois : à la racine (fr)
 * et sous /en (anglais). La langue est dérivée du préfixe d'URL.
 */
function appChildren() {
  return [
    {
      element: <PublicLayout />,
      children: [
        { index: true, element: <Home /> },
        { path: 'a-propos', element: <Suspense fallback={<PageLoader />}><About /></Suspense> },
        { path: 'blog', element: <Suspense fallback={<PageLoader />}><Blog /></Suspense> },
        { path: 'blog/:slug', element: <Suspense fallback={<PageLoader />}><BlogPost /></Suspense> },
        { path: 'formations', element: <Suspense fallback={<PageLoader />}><Formations /></Suspense> },
        { path: 'formations/:slug', element: <Suspense fallback={<PageLoader />}><FormationDetail /></Suspense> },
        { path: 'podcasts', element: <Suspense fallback={<PageLoader />}><Podcasts /></Suspense> },
        { path: 'podcasts/:slug', element: <Suspense fallback={<PageLoader />}><PodcastDetail /></Suspense> },
        { path: 'videos', element: <Suspense fallback={<PageLoader />}><Videos /></Suspense> },
        { path: 'videos/:slug', element: <Suspense fallback={<PageLoader />}><VideoDetail /></Suspense> },
        { path: 'faq', element: <Suspense fallback={<PageLoader />}><FAQPage /></Suspense> },
        { path: 'contact', element: <Suspense fallback={<PageLoader />}><Contact /></Suspense> },
        { path: 'agence', element: <Suspense fallback={<PageLoader />}><Agence /></Suspense> },
        { path: 'presence-digitale', element: <Suspense fallback={<PageLoader />}><PresenceDigitale /></Suspense> },
        { path: 'presence-digitale/devis/:ref', element: <Suspense fallback={<PageLoader />}><PresenceDevis /></Suspense> },
        // Legacy : des liens de devis circulent déjà sur WhatsApp, ils doivent continuer de résoudre.
        { path: 'agence/devis/:ref', element: <LegacyQuoteRedirect /> },
        { path: 'legal/mentions-legales', element: <Suspense fallback={<PageLoader />}><MentionsLegales /></Suspense> },
        { path: 'legal/confidentialite', element: <Suspense fallback={<PageLoader />}><Confidentialite /></Suspense> },
        { path: 'legal/cgv', element: <Suspense fallback={<PageLoader />}><CGV /></Suspense> },
        { path: 'legal/cgu', element: <Suspense fallback={<PageLoader />}><CGU /></Suspense> },
        { path: 'legal/cookies', element: <Suspense fallback={<PageLoader />}><CookiesPage /></Suspense> },
      ],
    },
    {
      element: <LmsLayout />,
      children: [
        {
          path: 'mon-espace',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <StudentLayout />
              </Suspense>
            </ProtectedRoute>
          ),
          children: [
            { index: true, element: <MonEspaceIndexRedirect /> },
            { path: 'tableau-de-bord', element: <Suspense fallback={<PageLoader />}><DashboardPage /></Suspense> },
            { path: 'cours',           element: <Suspense fallback={<PageLoader />}><CoursesPage /></Suspense> },
            { path: 'notes',           element: <Suspense fallback={<PageLoader />}><NotesPage /></Suspense> },
            { path: 'messages',        element: <Suspense fallback={<PageLoader />}><MessagesPage /></Suspense> },
            { path: 'succes',          element: <Suspense fallback={<PageLoader />}><AchievementsPage /></Suspense> },
            { path: 'profil',          element: <Suspense fallback={<PageLoader />}><ProfilePage /></Suspense> },
            { path: 'parametres',      element: <Suspense fallback={<PageLoader />}><SettingsPage /></Suspense> },
            { path: 'club',            element: <Suspense fallback={<PageLoader />}><ClubPage /></Suspense> },
            { path: 'rysmo',           element: <Suspense fallback={<PageLoader />}><RysmoPage /></Suspense> },
            { path: 'temoignages',     element: <Suspense fallback={<PageLoader />}><TestimonialsPage /></Suspense> },
          ],
        },
        {
          path: 'cours/:slug',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <CoursePlayer />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'checkout/:slug',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <Checkout />
              </Suspense>
            </ProtectedRoute>
          ),
        },
        {
          path: 'paiement/retour',
          element: (
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <PaymentReturn />
              </Suspense>
            </ProtectedRoute>
          ),
        },
      ],
    },
    {
      element: <AuthLayout />,
      children: [
        { path: 'connexion', element: <Suspense fallback={<PageLoader />}><Login /></Suspense> },
        { path: 'inscription', element: <Suspense fallback={<PageLoader />}><Register /></Suspense> },
        { path: 'mot-de-passe-oublie', element: <Suspense fallback={<PageLoader />}><ResetPassword /></Suspense> },
        { path: 'certificat/:code', element: <Suspense fallback={<PageLoader />}><CertificatePage /></Suspense> },
        { path: '403', element: <Forbidden403 /> },
        { path: '*', element: <NotFound /> },
      ],
    },
    {
      path: 'admin',
      element: (
        <AdminRoute>
          <Suspense fallback={<PageLoader />}>
            <AdminLayout />
          </Suspense>
        </AdminRoute>
      ),
      children: [
        { index: true, element: <Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense> },
        { path: 'articles', element: <Suspense fallback={<PageLoader />}><AdminArticles /></Suspense> },
        { path: 'formations', element: <Suspense fallback={<PageLoader />}><AdminFormations /></Suspense> },
        { path: 'utilisateurs', element: <Suspense fallback={<PageLoader />}><AdminUsers /></Suspense> },
        { path: 'messages', element: <Suspense fallback={<PageLoader />}><AdminMessages /></Suspense> },
        { path: 'analytics', element: <Suspense fallback={<PageLoader />}><AdminAnalytics /></Suspense> },
        { path: 'parametres', element: <Suspense fallback={<PageLoader />}><AdminSettings /></Suspense> },
        { path: 'podcasts', element: <Suspense fallback={<PageLoader />}><AdminPodcasts /></Suspense> },
        { path: 'videos', element: <Suspense fallback={<PageLoader />}><AdminVideos /></Suspense> },
        { path: 'transactions', element: <Suspense fallback={<PageLoader />}><AdminTransactions /></Suspense> },
        { path: 'coupons', element: <Suspense fallback={<PageLoader />}><AdminCoupons /></Suspense> },
        { path: 'annonces', element: <Suspense fallback={<PageLoader />}><AdminAnnouncements /></Suspense> },
        { path: 'faq', element: <Suspense fallback={<PageLoader />}><AdminFAQ /></Suspense> },
        { path: 'temoignages', element: <Suspense fallback={<PageLoader />}><AdminTestimonials /></Suspense> },
        { path: 'rendez-vous', element: <Suspense fallback={<PageLoader />}><AdminAppointments /></Suspense> },
        { path: 'club-digitos', element: <Suspense fallback={<PageLoader />}><AdminClubDigitos /></Suspense> },
        { path: 'prospects-agence', element: <Suspense fallback={<PageLoader />}><AdminAgencyLeads /></Suspense> },
        { path: 'projets', element: <Suspense fallback={<PageLoader />}><AdminMissions /></Suspense> },
      ],
    },
  ];
}

const router = createBrowserRouter([
  {
    element: <RootProviders />,
    children: [
      { path: '/en', children: localizeRouteTree(appChildren() as RouteObject[], 'en') },
      { path: '/', children: appChildren() as RouteObject[] },
    ],
  },
]);

export default function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <ThemeProvider>
          <AuthProvider>
            <QueryClientProvider client={queryClient}>
              <ToastProvider>
                <RouterProvider router={router} />
              </ToastProvider>
            </QueryClientProvider>
          </AuthProvider>
        </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}
