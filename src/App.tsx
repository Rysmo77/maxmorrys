import { createBrowserRouter, RouterProvider, Outlet, ScrollRestoration } from 'react-router-dom';
import { useState, lazy, Suspense } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ScrollProgress from './components/shared/ScrollProgress';
import CookieBanner from './components/shared/CookieBanner';
import AnnouncementBanner from './components/shared/AnnouncementBanner';
import SearchOverlay from './components/shared/SearchOverlay';
import Home from './pages/Home';
import About from './pages/About';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Formations from './pages/Formations';
import FormationDetail from './pages/FormationDetail';
import Podcasts from './pages/Podcasts';
import PodcastDetail from './pages/PodcastDetail';
import Videos from './pages/Videos';
import VideoDetail from './pages/VideoDetail';
import FAQPage from './pages/FAQ';
import Contact from './pages/Contact';
import MentionsLegales from './pages/legal/MentionsLegales';
import Confidentialite from './pages/legal/Confidentialite';
import CGV from './pages/legal/CGV';
import CookiesPage from './pages/legal/CookiesPage';
import Forbidden403 from './pages/Forbidden403';
import NotFound from './pages/NotFound';
import { AdminRoute, ProtectedRoute } from './components/routing/ProtectedRoute';
import RysmoWidget from './components/ai/RysmoWidget';

// Lazy-loaded routes — not needed on first public page load
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const StudentDashboard = lazy(() => import('./pages/lms/StudentDashboard'));
const CoursePlayer = lazy(() => import('./pages/lms/CoursePlayer'));
const Checkout = lazy(() => import('./pages/lms/Checkout'));
const PaymentReturn = lazy(() => import('./pages/lms/PaymentReturn'));
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminArticles = lazy(() => import('./pages/admin/AdminArticles'));
const AdminFormations = lazy(() => import('./pages/admin/AdminFormations'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminMessages = lazy(() => import('./pages/admin/AdminMessages'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminPodcasts = lazy(() => import('./pages/admin/AdminPodcasts'));
const AdminVideos = lazy(() => import('./pages/admin/AdminVideos'));
const AdminTransactions = lazy(() => import('./pages/admin/AdminTransactions'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));
const AdminAnnouncements = lazy(() => import('./pages/admin/AdminAnnouncements'));
const AdminFAQ = lazy(() => import('./pages/admin/AdminFAQ'));
const AdminTestimonials = lazy(() => import('./pages/admin/AdminTestimonials'));
const AdminAppointments = lazy(() => import('./pages/admin/AdminAppointments'));
const AdminClubDigitos = lazy(() => import('./pages/admin/AdminClubDigitos'));
const CertificatePage = lazy(() => import('./pages/lms/Certificate'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" aria-label="Chargement..." />
    </div>
  );
}

function PublicLayout() {
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold">
        Aller au contenu principal
      </a>
      <AnnouncementBanner />
      <ScrollProgress />
      <Header onSearchOpen={() => setSearchOpen(true)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <main id="main-content" className="min-h-screen">
        <Outlet />
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
      <Outlet />
      <ScrollRestoration />
    </>
  );
}

function LmsLayout() {
  return (
    <>
      <Outlet />
      <RysmoWidget />
      <ScrollRestoration />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/a-propos', element: <About /> },
      { path: '/blog', element: <Blog /> },
      { path: '/blog/:slug', element: <BlogPost /> },
      { path: '/formations', element: <Formations /> },
      { path: '/formations/:slug', element: <FormationDetail /> },
      { path: '/podcasts', element: <Podcasts /> },
      { path: '/podcasts/:slug', element: <PodcastDetail /> },
      { path: '/videos', element: <Videos /> },
      { path: '/videos/:slug', element: <VideoDetail /> },
      { path: '/faq', element: <FAQPage /> },
      { path: '/contact', element: <Contact /> },
      { path: '/legal/mentions-legales', element: <MentionsLegales /> },
      { path: '/legal/confidentialite', element: <Confidentialite /> },
      { path: '/legal/cgv', element: <CGV /> },
      { path: '/legal/cookies', element: <CookiesPage /> },
    ],
  },
  {
    element: <LmsLayout />,
    children: [
      {
        path: '/mon-espace',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <StudentDashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/cours/:slug',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <CoursePlayer />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/checkout/:slug',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <Checkout />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/paiement/retour',
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
      { path: '/connexion', element: <Suspense fallback={<PageLoader />}><Login /></Suspense> },
      { path: '/inscription', element: <Suspense fallback={<PageLoader />}><Register /></Suspense> },
      { path: '/mot-de-passe-oublie', element: <Suspense fallback={<PageLoader />}><ResetPassword /></Suspense> },
      { path: '/certificat/:code', element: <Suspense fallback={<PageLoader />}><CertificatePage /></Suspense> },
      { path: '/403', element: <Forbidden403 /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    path: '/admin',
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
    ],
  },
]);

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
