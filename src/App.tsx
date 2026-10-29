import { CLUB_TAB_SEGMENTS } from './lib/club/tabs';
import { createBrowserRouter, RouterProvider, Outlet, ScrollRestoration, useLocation, useParams, Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import type { ComponentType, ReactNode } from 'react';

/**
 * Wrap React.lazy to auto-reload once when a stale chunk (post-deploy) fails to load.
 *
 * `namespaces` charge en parallèle les namespaces i18n de la route : ils sont
 * donc prêts avant le montage, sous le `<Suspense>` qui enveloppe déjà chaque
 * route. Sans cela, `useSuspense: false` afficherait les clés brutes le temps du
 * chargement. `loadNamespaces` ne rejette jamais : un chunk de langue manquant
 * ne doit pas déclencher le rechargement de page réservé aux chunks périmés.
 */
function lazyWithReload<P extends object>(
  factory: () => Promise<{ default: ComponentType<P> }>,
  namespaces?: readonly string[],
) {
  return lazy(async () => {
    try {
      const [mod] = await Promise.all([
        factory(),
        namespaces?.length ? loadNamespaces(namespaces) : undefined,
      ]);
      return mod;
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
import { loadNamespaces } from './i18n';
import { pageVariants, pageTransition } from './lib/animations';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { localizeSegments } from './i18n/segments';
import { localizedPath } from './i18n/routing';
import { placer, type Espace } from './lib/espaces';
import { espaceCourant, hrefPour, urlCorrigee } from './lib/hosts';
import { allerVers } from './lib/sessionHandoff';
import { ToastProvider } from '@ds';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import PageMesh from './components/layout/PageMesh';
import { universeFromPath, universeThemes } from './lib/sectionThemes';
import { OfflineBanner, PageLogoLoader, NavigationLoader, RouteVeil } from './components/states';
import CookieBanner from './components/shared/CookieBanner';
import LanguageSuggestionBanner from './components/shared/LanguageSuggestionBanner';
// Ne s'ouvre que sur action ; il renvoie `null` tant que `open` est faux, donc
// le monter à la demande ne change rien au comportement.
const SearchOverlay = lazyWithReload(() => import('./components/shared/SearchOverlay'));
import ErrorBoundary from './components/shared/ErrorBoundary';
import RouteError from './components/shared/RouteError';
import MetaPixelTracker from './components/tracking/MetaPixelTracker';
import PopupManager from './components/popups/PopupManager';
import Home from './pages/Home';
import Forbidden403 from './pages/Forbidden403';
import NotFound from './pages/NotFound';

// Lazy-loaded public pages
const About = lazyWithReload(() => import('./pages/About'), ['about']);
const Blog = lazyWithReload(() => import('./pages/Blog'), ['blog']);
const BlogPost = lazyWithReload(() => import('./pages/BlogPost'), ['blog']);
const Formations = lazyWithReload(() => import('./pages/Formations'));
const FormationDetail = lazyWithReload(() => import('./pages/FormationDetail'));
const PodcastDetail = lazyWithReload(() => import('./pages/PodcastDetail'), ['media']);
const VideoDetail = lazyWithReload(() => import('./pages/VideoDetail'), ['media']);
const FAQPage = lazyWithReload(() => import('./pages/FAQ'), ['faq']);
/*
 * UNE PAGE PAR QUESTION — l'écart que le kit nomme lui-même : « aujourd'hui la FAQ n'a qu'un
 * index : aucune question n'a d'URL partageable ni de position propre en recherche ».
 */
const FAQQuestion = lazyWithReload(() => import('./pages/FAQQuestion'), ['faq']);
const Contact = lazyWithReload(() => import('./pages/Contact'), ['contact']);
/*
  ── LA PISTE CONCEPTION (CDC du 14/09/2026) ────────────────────────────────────────────────
  `/agence` n'existe plus comme page : elle part en 301 vers `/conception`, dont elle est
  devenue la page mère. Le CDC en donne la raison, et ce n'est pas une affaire d'URL — c'est
  l'objectif O3 : « Faire disparaître le doublon avec My Onoma. La page agence ne propose plus
  de direction marketing ; elle renvoie. »
*/
const Conception = lazyWithReload(() => import('./pages/conception/Conception'), ['conception']);
const ProjetsSurMesure = lazyWithReload(() => import('./pages/conception/ProjetsSurMesure'), ['conception']);
const Realisations = lazyWithReload(() => import('./pages/conception/Realisations'), ['realisations']);
const RealisationDetail = lazyWithReload(() => import('./pages/conception/RealisationDetail'), ['realisations']);
/* La page mère de l'autre piste. Elle ne rejoue pas le catalogue : elle présente les quatre
   entrées et leur logique — on lit, on écoute, on se forme, on rejoint. */
const Apprendre = lazyWithReload(() => import('./pages/Apprendre'), ['apprendre']);
const PresenceDigitale = lazyWithReload(() => import('./pages/PresenceDigitale'), ['presence']);
const PresenceDevis = lazyWithReload(() => import('./pages/PresenceDevis'), ['presence']);
const MentionsLegales = lazyWithReload(() => import('./pages/legal/MentionsLegales'), ['legal']);
const Confidentialite = lazyWithReload(() => import('./pages/legal/Confidentialite'), ['legal']);
const CGV = lazyWithReload(() => import('./pages/legal/CGV'), ['legal']);
const CGU = lazyWithReload(() => import('./pages/legal/CGU'), ['legal']);
const CookiesPage = lazyWithReload(() => import('./pages/legal/CookiesPage'), ['legal']);
import { AdminRoute, ProtectedRoute } from './components/routing/ProtectedRoute';
// Rendu uniquement dans `LmsLayout`, mais l'import statique le plaçait — avec
// DOMPurify — dans le chunk d'entrée de chaque visiteur anonyme.
const RysmoWidget = lazyWithReload(() => import('./components/ai/RysmoWidget'), ['rysmo']);

/* Version installable. Chargés paresseusement comme le reste : quelqu'un qui n'installe pas
   l'application ne doit pas payer leur poids en données. */
const OfflinePage = lazy(() => import('./components/pwa/OfflineLibrary'));
const InstallInvitation = lazy(() => import('./components/pwa/InstallInvitation'));

/* Le pôle média — une page pour les deux formats, sous « Je te transforme ». */
/*
  ── POURQUOI CETTE ROUTE PORTE SON NAMESPACE, ET PAS `lazy` BRUT ──────────────────────────
  `MediaPole` était la seule page chargée par `lazy` nu, donc SANS préchargement de son
  namespace `media`. Avec `useSuspense: false`, une lecture de `pole.titleLines` en
  `returnObjects` rend alors la CLÉ — une chaîne — et le `.join(' ')` qui la suit lève
  « t(...).join is not a function ». Ce n'est pas un texte manquant : c'est la page entière
  qui tombe sur la frontière d'erreur, avec « Unexpected Application Error » à la place de
  tout le territoire « Je te transforme ».

  Ses deux voisines, `PodcastDetail` et `VideoDetail`, déclaraient bien `['media']`.
  Verrouillé par `tests/unit/route-namespaces.test.ts`.
*/
const MediaPole = lazyWithReload(() => import('./pages/MediaPole'), ['media']);
/* L'autre étage du même territoire : la page publique du Club, payante et fermée. */
const ClubDigitos = lazyWithReload(() => import('./pages/ClubDigitos'), ['club']);
const NotificationsPage = lazy(() => import('./components/pwa/NotificationCenter'));

// Lazy-loaded routes — not needed on first public page load
const Login = lazyWithReload(() => import('./pages/auth/Login'), ['auth']);
const Register = lazyWithReload(() => import('./pages/auth/Register'), ['auth']);
const ResetPassword = lazyWithReload(() => import('./pages/auth/ResetPassword'), ['auth']);
const StudentLayout = lazyWithReload(() => import('./components/layout/StudentLayout'), ['lms']);
const DashboardPage = lazyWithReload(() => import('./pages/lms/routes/DashboardPage'), ['lms', 'lmsTabs']);
const CoursesPage = lazyWithReload(() => import('./pages/lms/routes/CoursesPage'), ['lms', 'lmsTabs']);
const NotesPage = lazyWithReload(() => import('./pages/lms/routes/NotesPage'), ['lms', 'lmsTabs']);
const MessagesPage = lazyWithReload(() => import('./pages/lms/routes/MessagesPage'), ['lms', 'lmsTabs']);
const AchievementsPage = lazyWithReload(() => import('./pages/lms/routes/AchievementsPage'), ['lms', 'lmsTabs']);
const ProfilePage = lazyWithReload(() => import('./pages/lms/routes/ProfilePage'), ['lms', 'lmsTabs']);
const SettingsPage = lazyWithReload(() => import('./pages/lms/routes/SettingsPage'), ['lmsTabs']);
/* « Mes paiements » — l'écran que le pied de l'écran de succès désigne depuis toujours
   (« Le reçu est dans ton espace ») et que la liste « Dans ton espace » du kit ouvre. */
const PaymentsPage = lazyWithReload(() => import('./pages/lms/routes/PaymentsPage'), ['lms', 'lmsTabs']);
const ClubPage = lazyWithReload(() => import('./pages/lms/routes/ClubPage'), ['club', 'lms']);
const RysmoPage = lazyWithReload(() => import('./pages/lms/routes/RysmoPage'), ['lms', 'lmsTabs']);
/* ── Passe 2 (châssis) : écrans des maquettes et du PRD rév. 6 sans page jusqu'ici. Chacun est
   un squelette honnête (`EcranSquelette`) que son lot remplace. Table : ROUTES.md. ── */
const ComptePage = lazyWithReload(() => import('./pages/hub/Compte'), ['ecrans']);
const MethodePage = lazyWithReload(() => import('./pages/edu/Methode'), ['ecrans']);
const AssistantPublicPage = lazyWithReload(() => import('./pages/edu/AssistantPublic'), ['ecrans']);
const ClubSessionsPage = lazyWithReload(() => import('./pages/club/Sessions'), ['ecrans']);
const ClubAdhesionPage = lazyWithReload(() => import('./pages/club/Adhesion'), ['ecrans']);
const AgendaPage = lazyWithReload(() => import('./pages/lms/routes/AgendaPage'), ['ecrans']);
const CohortePage = lazyWithReload(() => import('./pages/lms/routes/CohortePage'), ['ecrans']);
const CohorteLivePage = lazyWithReload(() => import('./pages/lms/routes/CohorteLivePage'), ['ecrans']);
const MissionsPage = lazyWithReload(() => import('./pages/lms/routes/MissionsPage'), ['ecrans']);
const QuizPage = lazyWithReload(() => import('./pages/lms/routes/QuizPage'), ['ecrans']);
const ClubDefisPage = lazyWithReload(() => import('./pages/lms/routes/club/DefisPage'), ['ecrans']);
const ClubLivePage = lazyWithReload(() => import('./pages/lms/routes/club/ClubLivePage'), ['ecrans']);
const ClubMembreProfilPage = lazyWithReload(() => import('./pages/lms/routes/club/MembreProfilPage'), ['ecrans']);
const ClubPublicationPage = lazyWithReload(() => import('./pages/lms/routes/club/PublicationPage'), ['ecrans']);
const TestimonialsPage = lazyWithReload(() => import('./pages/lms/routes/TestimonialsPage'), ['lms', 'lmsTabs']);
const CoursePlayer = lazyWithReload(() => import('./pages/lms/CoursePlayer'), ['lms']);
const Checkout = lazyWithReload(() => import('./pages/lms/Checkout'), ['lms']);
const PaymentReturn = lazyWithReload(() => import('./pages/lms/PaymentReturn'), ['lms']);
const AdminLayout = lazyWithReload(() => import('./components/layout/AdminLayout'), ['admin', 'lms']);
const AdminDashboard = lazyWithReload(() => import('./pages/admin/AdminDashboard'), ['admin']);
const AdminArticles = lazyWithReload(() => import('./pages/admin/AdminArticles'), ['admin']);
const AdminFormations = lazyWithReload(() => import('./pages/admin/AdminFormations'), ['admin']);
const AdminUsers = lazyWithReload(() => import('./pages/admin/AdminUsers'), ['admin', 'adminClub']);
const AdminMessages = lazyWithReload(() => import('./pages/admin/AdminMessages'), ['admin']);
const AdminAnalytics = lazyWithReload(() => import('./pages/admin/AdminAnalytics'), ['admin']);
const AdminSettings = lazyWithReload(() => import('./pages/admin/AdminSettings'), ['admin']);
const AdminPodcasts = lazyWithReload(() => import('./pages/admin/AdminPodcasts'), ['admin']);
const AdminVideos = lazyWithReload(() => import('./pages/admin/AdminVideos'), ['admin']);
const AdminTransactions = lazyWithReload(() => import('./pages/admin/AdminTransactions'), ['admin']);
const AdminRevenue = lazyWithReload(() => import('./pages/admin/AdminRevenue'), ['admin']);
const AdminCoupons = lazyWithReload(() => import('./pages/admin/AdminCoupons'), ['admin']);
const AdminAnnouncements = lazyWithReload(() => import('./pages/admin/AdminAnnouncements'), ['admin']);
const AdminFAQ = lazyWithReload(() => import('./pages/admin/AdminFAQ'), ['admin']);
const AdminTestimonials = lazyWithReload(() => import('./pages/admin/AdminTestimonials'), ['admin']);
const AdminAppointments = lazyWithReload(() => import('./pages/admin/AdminAppointments'), ['admin']);
const AdminClubDigitos = lazyWithReload(() => import('./pages/admin/AdminClubDigitos'), ['admin', 'adminClub']);
const AdminAgencyLeads = lazyWithReload(() => import('./pages/admin/AdminAgencyLeads'), ['admin']);
const AdminMissions = lazyWithReload(() => import('./pages/admin/AdminMissions'), ['admin']);
const AdminRedirects = lazyWithReload(() => import('./pages/admin/AdminRedirects'), ['admin']);
/* Le dix-neuvième écran du kit — `screens-motif.jsx` § PipelinesRestants lui donne son
   pipeline : tout · envoyées · planifiées. C'était le seul écart de pipeline que rien
   n'argumentait. */
const AdminNotifications = lazyWithReload(() => import('./pages/admin/AdminNotifications'), ['admin']);
const AdminJournal = lazyWithReload(() => import('./pages/admin/AdminJournal'), ['ecrans']);
const AdminRoles = lazyWithReload(() => import('./pages/admin/AdminRoles'), ['ecrans']);
const AdminModeration = lazyWithReload(() => import('./pages/admin/AdminModeration'), ['ecrans']);
const AdminQuotas = lazyWithReload(() => import('./pages/admin/AdminQuotas'), ['ecrans']);
const AdminInfra = lazyWithReload(() => import('./pages/admin/AdminInfra'), ['ecrans']);
const CertificatePage = lazyWithReload(() => import('./pages/lms/Certificate'), ['lms']);
/*
 * La vérification d'un code. Elle n'est PAS le certificat : `/certificat/:code` affiche un
 * document dont on a déjà le lien, `/verifier` répond à un code recopié depuis un PDF. Le
 * pied de page annonçait la seconde depuis le début — elle tombait sur la page 404.
 */
const VerifyCertificate = lazyWithReload(() => import('./pages/VerifyCertificate'), ['lms']);

/**
 * Le repli des soixante routes paresseuses.
 *
 * C'était un rond qui tourne. Le système l'interdit — `Button` l'écrit pour tout le
 * produit : « Un liseré le balaie. Jamais de rond qui tourne. » Et l'écran `Chargement`
 * du kit dit ce qu'il faut faire à la place, en une phrase qu'il met lui-même en pied :
 * **« Quand le contenu arrive, rien ne saute. »** D'où un squelette à la forme du contenu,
 * qui réserve la place au lieu de la promettre.
 */
function PageLoader() {
  /*
   * Le squelette générique a cédé la place au LOGO ANIMÉ (demande de 29/10/2026) : un repli
   * de route ne sait pas quelle page arrive, et trois cartes grises promettaient une mise en
   * page qu'aucune page ne tenait. `PageLogoLoader` réserve la hauteur d'un écran (rien ne
   * saute) et n'apparaît qu'après 180 ms — un chunk déjà en cache ne montre rien. Les pages
   * qui connaissent leur forme (blog, article) gardent leur squelette à la bonne hauteur.
   */
  const { t } = useTranslation('common');
  return <PageLogoLoader label={t('loading')} />;
}

/*
 * La toute première page ne s'anime PAS : elle arrive déjà sous un pré-rendu ou un écran
 * blanc, et un fondu depuis `opacity: 0` repoussait d'autant l'affichage (LCP compris).
 * Seules les navigations suivantes glissent.
 */
let pageDejaAffichee = false;

/** Transition d'entrée légère à chaque changement de route (fondu/glissé). */
function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const reduced = useReducedMotion();
  const initial = pageDejaAffichee ? 'initial' : false;
  useEffect(() => { pageDejaAffichee = true; }, []);
  if (reduced) return <>{children}</>;
  return (
    <motion.div
      key={location.pathname}
      variants={pageVariants}
      initial={initial}
      animate="animate"
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}

function PublicLayout() {
  const [searchOpen, setSearchOpen] = useState(false);
  /*
    LA ROTATION DE L'ARC (AD-23) VIENT DE LA MÊME TABLE QUE LE MAILLAGE.

    Le fragment mis en valeur dans chaque titre démarre sur la teinte de sa page — sinon le
    titre ouvrirait sur du bleu au milieu d'une page orange, et le maillage cesserait d'être
    le repère de territoire continu qu'il est. `universeFromPath` décide déjà du fond ; lui
    faire décider aussi de l'arc garde UNE seule source, au lieu d'une prop à passer sur neuf
    pages et à oublier sur la dixième.

    L'agence n'a pas de maillage — elle vit hors des quatre verbes — mais elle a une teinte
    déclarée, le corail, qu'elle porte déjà dans la barre haute et ses sourcils (AD-20).
  */
  const { pathname } = useLocation();
  const arc = universeThemes[universeFromPath(pathname)].mesh ?? 'agence';
  return (
    <>
      <MetaPixelTracker />
      {/*
        LE FOND DU SITE — un maillage par territoire, posé une seule fois pour les quinze
        pages. Poids : 0 octet. C'est ce qui remplace la vidéo d'accueil de 2 à 6 Mo.
      */}
      <PageMesh />
      {/*
        Le lien de saut vit maintenant DANS la barre haute, en `.mm-skip`, et il en est le
        premier élément focalisable — c'est la primitive `TopBar` qui le pose. Celui qui vivait
        ici en faisait un DOUBLON : deux « Aller au contenu » à la suite au clavier, dont un
        seul stylé par le système.
      */}
      <Header onSearchOpen={() => setSearchOpen(true)} />
      {/* Le logo animé pendant une navigation du routeur de données (après 200 ms). */}
      <NavigationLoader />
      {/* La transition de page : voile du territoire + logo, à chaque changement de pathname. */}
      <RouteVeil />
      {searchOpen && (
        <Suspense fallback={null}>
          <SearchOverlay open onClose={() => setSearchOpen(false)} />
        </Suspense>
      )}
      {/* `relative z-[1]` : le maillage est fixé à la fenêtre en `z-0`, le contenu se pose
          dessus. Sans ça, une couche positionnée peindrait par-dessus le texte. */}
      <main id="main-content" data-arc={arc} className="relative z-[1] min-h-screen">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <Footer />
      <CookieBanner />
      {/*
        Arbitre des pop-ups contextuelles. Import DIRECT et non `lazyWithReload` : ce dernier
        recharge la page quand un chunk périmé échoue, ce qui serait disproportionné pour un
        composant qui ne rend rien la plupart du temps.
      */}
      <PopupManager />
      {/*
        L'INVITATION À INSTALLER — elle était écrite, correcte, et MONTÉE NULLE PART.

        `main.tsx` appelle pourtant `countVisit()` au démarrage, expressément pour alimenter
        sa règle « pas avant la deuxième visite » : le compteur tournait, l'écran n'existait
        pas. Le kit lui consacre une des quarante-deux planches (`PwaInvitation`), et c'est
        le seul argument d'installation qui vaille sur ce marché — le forfait, pas la vitesse.

        Elle ne rend rien tant que le navigateur n'a pas émis `beforeinstallprompt`, que la
        deuxième visite n'est pas atteinte, ou qu'un refus a déjà été enregistré : la monter
        ici ne coûte donc rien aux autres pages.
      */}
      <Suspense fallback={null}>
        <InstallInvitation />
      </Suspense>
      <ScrollRestoration />
    </>
  );
}

function AuthLayout() {
  return (
    <>
      <MetaPixelTracker />
      <Outlet />
      {/*
        LE BANDEAU DE CONSENTEMENT VIT DANS LES TROIS LAYOUTS, PAS DANS UN SEUL.

        Il n'était monté que dans `PublicLayout`. Or `MetaPixelTracker` — juste au-dessus —
        est monté ici aussi : la mesure démarrait sur des écrans où le choix ne pouvait
        JAMAIS être proposé. Qui arrive directement sur `/connexion` par un lien, ou qui vit
        dans l'espace apprenant, était mesuré sans avoir vu la question.
        Le bandeau ne rend rien dès qu'un choix est enregistré : le monter ici ne coûte rien
        à qui a déjà répondu.
      */}
      <CookieBanner />
      <ScrollRestoration />
    </>
  );
}

function LmsLayout() {
  return (
    <>
      <MetaPixelTracker />
      <Outlet />
      {/* `LmsLayout` n'est pas lui-même sous <Suspense> : le widget porte le sien. */}
      <Suspense fallback={null}>
        <RysmoWidget />
      </Suspense>
      {/*
        LE BANDEAU DE CONSENTEMENT VIT DANS LES TROIS LAYOUTS, PAS DANS UN SEUL.

        Il n'était monté que dans `PublicLayout`. Or `MetaPixelTracker` — juste au-dessus —
        est monté ici aussi : la mesure démarrait sur des écrans où le choix ne pouvait
        JAMAIS être proposé. Qui arrive directement sur `/connexion` par un lien, ou qui vit
        dans l'espace apprenant, était mesuré sans avoir vu la question.
        Le bandeau ne rend rien dès qu'un choix est enregistré : le monter ici ne coûte rien
        à qui a déjà répondu.
      */}
      <CookieBanner />
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
      {/*
        Monté ICI et nulle part ailleurs : la coupure réseau ne connaît pas les coquilles.
        Elle frappe le site public, la console et l'espace apprenant de la même façon, et
        `RootProviders` est le seul point qui les couvre tous les trois. Il est aussi sous
        `LanguageProvider`, dont le bandeau a besoin pour localiser son lien.
      */}
      <OfflineBanner />
    </LanguageProvider>
  );
}

/**
 * Le lien de parrainage des maquettes, `club.maxmorrys.me/r/<code>` : il mène à l'inscription
 * avec le code, qu'`Register` enregistre sur le compte créé.
 */
function ReferralRedirect() {
  const { language } = useLanguage();
  const { code } = useParams<{ code: string }>();
  return <Navigate to={hrefPour(`/inscription?ref=${encodeURIComponent(code ?? '')}`, language)} replace />;
}

/**
 * La page introuvable, après un dernier essai : un chemin qui vit sur un AUTRE espace (un lien
 * interne d'avant les sous-domaines, une adresse tapée au mauvais endroit) y est envoyé, comme
 * le ferait la 301 du Worker pour une requête de document. Une navigation interne à la SPA
 * ne passe jamais par le Worker : sans ce relais, elle tomberait ici.
 */
function Introuvable() {
  const { pathname, search, hash } = useLocation();
  const cible = urlCorrigee(pathname, search, hash);
  useEffect(() => {
    if (cible && /^https?:\/\//.test(cible)) void allerVers(cible, true);
  }, [cible]);
  if (!cible) return <NotFound />;
  if (!/^https?:\/\//.test(cible)) return <Navigate to={cible} replace />;
  return <PageLoader />;
}

/**
 * Ancienne URL de devis `/agence/devis/:ref` → `/conception/commerces-et-tpe/devis/:ref`.
 *
 * L'offre « Digital Commerce Local » a quitté `/agence`, mais des récapitulatifs ont déjà
 * été partagés en WhatsApp : ces liens doivent continuer de résoudre.
 */
function LegacyQuoteRedirect() {
  const { language } = useLanguage();
  const { ref } = useParams<{ ref: string }>();
  return <Navigate to={localizedPath(`/conception/commerces-et-tpe/devis/${ref ?? ''}`, language)} replace />;
}

/**
 * ── LES TROIS REDIRECTIONS DE LA REFONTE EN DEUX PISTES (CDC §3.4) ───────────────────────
 *
 * Elles sont montées ICI en plus des 301 de l'hébergement, et ce n'est pas un doublon : le
 * 301 du bord répond à une requête de DOCUMENT — un lien cliqué depuis l'extérieur, un robot.
 * Une navigation interne à la SPA, elle, ne sort jamais vers le réseau : sans ces routes, un
 * `LocalizedLink` oublié vers `/agence` tomberait sur la page 404 sans qu'aucune 301 ne soit
 * jamais consultée.
 *
 * ⚠️ `/presence-digitale` est « très probablement liée depuis l'extérieur : la redirection est
 * obligatoire, pas optionnelle » — ce sont les mots du CDC. Elle est aussi dans les mains des
 * commerçants, en WhatsApp, sur des cartes de visite.
 */
function ConceptionRedirect() {
  const { language } = useLanguage();
  return <Navigate to={localizedPath('/conception', language)} replace />;
}

function CommercesRedirect() {
  const { language } = useLanguage();
  return <Navigate to={localizedPath('/conception/commerces-et-tpe', language)} replace />;
}

/**
 * `/mon-espace/rysmo` → `/mon-espace/repetiteur`.  (AD-12)
 *
 * « Rysmo » désigne désormais l'APPLICATION, et le tuteur s'appelle « Répétiteur » —
 * renommable par chaque personne depuis son profil. La route, elle, ne suit PAS le
 * renommage : elle est un contrat, pas un libellé.
 *
 * L'ancienne route survit en redirection permanente. Elle a été partagée, mise en favori et
 * indexée ; la casser pour un renommage de marque ferait payer le changement à ceux qui
 * utilisaient déjà le produit.
 */
function LegacyTutorRedirect() {
  /* Passe 2 — PRD rév. 6 (§1.1) : « Répétiteur » quitte l'interface, et
     `/mon-espace/repetiteur` (comme l'ancien `/mon-espace/rysmo`) redirige vers
     `/mon-espace/assistant`. La requête et l'ancre suivent (`?tab=tokens`, `#memoire`). */
  const { language } = useLanguage();
  const { search, hash } = useLocation();
  return <Navigate to={localizedPath(`/mon-espace/assistant${search}${hash}`, language)} replace />;
}

/** Les deux anciens index de média mènent désormais au pôle unique. */
function MediaPoleRedirect() {
  const { language } = useLanguage();
  return <Navigate to={localizedPath('/podcast-et-videos', language)} replace />;
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
        { path: 'podcast-et-videos', element: <Suspense fallback={<PageLoader />}><MediaPole /></Suspense> },
        /*
         * La page publique du Club vit sur le MÊME territoire que le pôle média : la
         * sous-navigation des deux pages montre les deux étages d'un coup — gratuit ouvert
         * d'un côté, payant fermé de l'autre. Elle n'ouvre aucun tunnel de paiement : le
         * bouton mène à `/mon-espace/club`, seul endroit où l'abonnement se crée, et gardé.
         */
        { path: 'club-des-digitos', element: <Suspense fallback={<PageLoader />}><ClubDigitos /></Suspense> },
        /* Passe 2 : barre publique du Club (Le Club · Sessions · Tarif) et de l'Edu
           (Formations · Méthode · Rysmo · Vérifier). Squelettes `noindex` jusqu'au lot. */
        { path: 'club-des-digitos/sessions', element: <Suspense fallback={<PageLoader />}><ClubSessionsPage /></Suspense> },
        { path: 'club-des-digitos/adhesion', element: <Suspense fallback={<PageLoader />}><ClubAdhesionPage /></Suspense> },
        { path: 'apprendre/methode', element: <Suspense fallback={<PageLoader />}><MethodePage /></Suspense> },
        { path: 'apprendre/assistant', element: <Suspense fallback={<PageLoader />}><AssistantPublicPage /></Suspense> },
        { path: 'compte', element: <ProtectedRoute><Suspense fallback={<PageLoader />}><ComptePage /></Suspense></ProtectedRoute> },
        /*
         * Les deux anciens index redirigent vers le pôle. Leurs FICHES de détail, elles, ne
         * bougent pas : un épisode et une vidéo ne se lisent pas pareil — transcription d'un
         * côté, chapitres et choix de qualité de l'autre — et leurs URL sont indexées.
         *
         * Cette redirection est côté client. Le 301 pour le référencement passe par la table
         * de redirections (`RedirectKind: 'path'`, administrable), qui existe déjà.
         */
        { path: 'podcasts', element: <MediaPoleRedirect /> },
        { path: 'videos', element: <MediaPoleRedirect /> },
        { path: 'podcasts/:slug', element: <Suspense fallback={<PageLoader />}><PodcastDetail /></Suspense> },
        { path: 'videos/:slug', element: <Suspense fallback={<PageLoader />}><VideoDetail /></Suspense> },
        { path: 'faq', element: <Suspense fallback={<PageLoader />}><FAQPage /></Suspense> },
        { path: 'faq/:slug', element: <Suspense fallback={<PageLoader />}><FAQQuestion /></Suspense> },
        { path: 'contact', element: <Suspense fallback={<PageLoader />}><Contact /></Suspense> },
        /*
         * ── LA PISTE CONCEPTION ────────────────────────────────────────────────────────
         * Trois niveaux d'engagement sous une page mère : l'offre productisée qu'on achète
         * en ligne, les projets sur mesure qui passent par un devis, et les réalisations qui
         * prouvent les deux. Le CDC les veut tous les trois VISIBLES : « elle présente deux
         * niveaux d'engagement et n'en cache aucun ».
         */
        { path: 'conception', element: <Suspense fallback={<PageLoader />}><Conception /></Suspense> },
        /*
         * L'ancienne présence digitale, à sa nouvelle adresse. Le FICHIER ne change pas de nom
         * — `PresenceDigitale` — parce que le contenu, lui, ne change pas de promesse : c'est
         * toujours le territoire teal, le ton direct et la grille en francs CFA. Ce qui change
         * est son rangement, et le bandeau de segment qui dit au visiteur corporate qu'il
         * n'est pas sur la bonne page.
         */
        { path: 'conception/commerces-et-tpe', element: <Suspense fallback={<PageLoader />}><PresenceDigitale /></Suspense> },
        { path: 'conception/commerces-et-tpe/devis/:ref', element: <Suspense fallback={<PageLoader />}><PresenceDevis /></Suspense> },
        { path: 'conception/projets-sur-mesure', element: <Suspense fallback={<PageLoader />}><ProjetsSurMesure /></Suspense> },
        { path: 'conception/realisations', element: <Suspense fallback={<PageLoader />}><Realisations /></Suspense> },
        { path: 'conception/realisations/:slug', element: <Suspense fallback={<PageLoader />}><RealisationDetail /></Suspense> },
        /* La page mère de la piste Apprendre. Les quatre territoires gardent leurs URL : elles
           portent des années de référencement, et le CDC interdit d'y toucher. */
        { path: 'apprendre', element: <Suspense fallback={<PageLoader />}><Apprendre /></Suspense> },
        /* Les anciennes adresses, en redirection. Aucune ne disparaît. */
        { path: 'agence', element: <ConceptionRedirect /> },
        { path: 'presence-digitale', element: <CommercesRedirect /> },
        { path: 'presence-digitale/devis/:ref', element: <LegacyQuoteRedirect /> },
        // Legacy : des liens de devis circulent déjà sur WhatsApp, ils doivent continuer de résoudre.
        { path: 'agence/devis/:ref', element: <LegacyQuoteRedirect /> },
        { path: 'legal/mentions-legales', element: <Suspense fallback={<PageLoader />}><MentionsLegales /></Suspense> },
        { path: 'legal/confidentialite', element: <Suspense fallback={<PageLoader />}><Confidentialite /></Suspense> },
        { path: 'legal/cgv', element: <Suspense fallback={<PageLoader />}><CGV /></Suspense> },
        { path: 'legal/cgu', element: <Suspense fallback={<PageLoader />}><CGU /></Suspense> },
        { path: 'legal/cookies', element: <Suspense fallback={<PageLoader />}><CookiesPage /></Suspense> },
        /*
         * LES TROIS ÉCRANS DE COMPTE VIVENT DANS LE CADRE DU SITE.
         *
         * Ils étaient montés sous `AuthLayout`, qui ne rend ni barre haute, ni pied de page,
         * ni maillage : trois pages centrées dans une colonne de 440 px, sans chrome. Le kit
         * les dessine DANS le site (`PagesUtiles.js:148` — `<Page territory="forme">`), avec
         * sa navigation et son pied. C'est ce qui permet de repartir sans revenir en arrière,
         * et de retrouver les mentions légales depuis un écran où l'on confie un mot de passe.
         *
         * `AuthLayout` garde ce qui n'a effectivement pas de chrome : le certificat public, la
         * vérification, le /403 et le 404.
         */
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
            { path: 'tableau-de-bord', element: <Suspense fallback={<PageLoader />}><DashboardPage /></Suspense> },
            { path: 'cours',           element: <Suspense fallback={<PageLoader />}><CoursesPage /></Suspense> },
            { path: 'notes',           element: <Suspense fallback={<PageLoader />}><NotesPage /></Suspense> },
            { path: 'paiements',       element: <Suspense fallback={<PageLoader />}><PaymentsPage /></Suspense> },
            { path: 'messages',        element: <Suspense fallback={<PageLoader />}><MessagesPage /></Suspense> },
            { path: 'succes',          element: <Suspense fallback={<PageLoader />}><AchievementsPage /></Suspense> },
            { path: 'profil',          element: <Suspense fallback={<PageLoader />}><ProfilePage /></Suspense> },
            { path: 'parametres',      element: <Suspense fallback={<PageLoader />}><SettingsPage /></Suspense> },
            { path: 'club',            element: <Suspense fallback={<PageLoader />}><ClubPage /></Suspense> },
            /* Kit v3 / FR-031 (AD-27) : chaque onglet du Club devient une ADRESSE. Les huit
               routes sont posées par le lot Fondations ; `ClubPage` les sert toutes, et c'est
               au Club de lire l'onglet dans l'URL (`useLocation`). Segments EN : `segments.ts`. */
            ...CLUB_TAB_SEGMENTS.map((onglet) => ({
              path: `club/${onglet}`,
              element: <Suspense fallback={<PageLoader />}><ClubPage /></Suspense>,
            })),
            { path: 'assistant',       element: <Suspense fallback={<PageLoader />}><RysmoPage /></Suspense> },
            { path: 'repetiteur',      element: <LegacyTutorRedirect /> },
            { path: 'agenda',          element: <Suspense fallback={<PageLoader />}><AgendaPage /></Suspense> },
            { path: 'cohorte',         element: <Suspense fallback={<PageLoader />}><CohortePage /></Suspense> },
            { path: 'cohorte/live',    element: <Suspense fallback={<PageLoader />}><CohorteLivePage /></Suspense> },
            { path: 'missions',        element: <Suspense fallback={<PageLoader />}><MissionsPage /></Suspense> },
            { path: 'quiz/:moduleId',  element: <Suspense fallback={<PageLoader />}><QuizPage /></Suspense> },
            { path: 'club/defis',      element: <Suspense fallback={<PageLoader />}><ClubDefisPage /></Suspense> },
            { path: 'club/live',       element: <Suspense fallback={<PageLoader />}><ClubLivePage /></Suspense> },
            { path: 'club/membres/:memberId', element: <Suspense fallback={<PageLoader />}><ClubMembreProfilPage /></Suspense> },
            { path: 'club/publication/:postId', element: <Suspense fallback={<PageLoader />}><ClubPublicationPage /></Suspense> },
            { path: 'hors-connexion',  element: <Suspense fallback={<PageLoader />}><OfflinePage /></Suspense> },
            { path: 'notifications',   element: <Suspense fallback={<PageLoader />}><NotificationsPage /></Suspense> },
            { path: 'rysmo',           element: <LegacyTutorRedirect /> },
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
        /*
         * LES TROIS ÉCRANS DE COMPTE, SANS BARRE NI PIED — maquette `Edu-Connexion` : le
         * mot-symbole de l'espace et un « Retour » discret (`AuthSplit`), rien d'autre. Ils
         * existent sur les trois hôtes : la session Firebase est rangée par origine, on se
         * connecte donc là où l'on est (`CHEMINS_PARTAGES`, `lib/espaces.ts`).
         */
        { path: 'connexion', element: <Suspense fallback={<PageLoader />}><Login /></Suspense> },
        { path: 'inscription', element: <Suspense fallback={<PageLoader />}><Register /></Suspense> },
        { path: 'mot-de-passe-oublie', element: <Suspense fallback={<PageLoader />}><ResetPassword /></Suspense> },
        { path: 'certificat/:code', element: <Suspense fallback={<PageLoader />}><CertificatePage /></Suspense> },
        { path: 'verifier', element: <Suspense fallback={<PageLoader />}><VerifyCertificate /></Suspense> },
        /* L'adresse des maquettes : `edu.maxmorrys.me/verifier/MM-7K2Q-9F`. */
        { path: 'verifier/:code', element: <Suspense fallback={<PageLoader />}><VerifyCertificate /></Suspense> },
        { path: 'r/:code', element: <ReferralRedirect /> },
        { path: '403', element: <Forbidden403 /> },
        { path: '*', element: <Introuvable /> },
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
        { path: 'revenu', element: <Suspense fallback={<PageLoader />}><AdminRevenue /></Suspense> },
        { path: 'coupons', element: <Suspense fallback={<PageLoader />}><AdminCoupons /></Suspense> },
        { path: 'annonces', element: <Suspense fallback={<PageLoader />}><AdminAnnouncements /></Suspense> },
        { path: 'faq', element: <Suspense fallback={<PageLoader />}><AdminFAQ /></Suspense> },
        { path: 'temoignages', element: <Suspense fallback={<PageLoader />}><AdminTestimonials /></Suspense> },
        { path: 'rendez-vous', element: <Suspense fallback={<PageLoader />}><AdminAppointments /></Suspense> },
        { path: 'club-digitos', element: <Suspense fallback={<PageLoader />}><AdminClubDigitos /></Suspense> },
        { path: 'prospects-agence', element: <Suspense fallback={<PageLoader />}><AdminAgencyLeads /></Suspense> },
        { path: 'projets', element: <Suspense fallback={<PageLoader />}><AdminMissions /></Suspense> },
        { path: 'redirections', element: <Suspense fallback={<PageLoader />}><AdminRedirects /></Suspense> },
        { path: 'notifications', element: <Suspense fallback={<PageLoader />}><AdminNotifications /></Suspense> },
        { path: 'journal', element: <Suspense fallback={<PageLoader />}><AdminJournal /></Suspense> },
        { path: 'roles', element: <Suspense fallback={<PageLoader />}><AdminRoles /></Suspense> },
        { path: 'moderation', element: <Suspense fallback={<PageLoader />}><AdminModeration /></Suspense> },
        { path: 'quotas', element: <Suspense fallback={<PageLoader />}><AdminQuotas /></Suspense> },
        { path: 'infrastructure', element: <Suspense fallback={<PageLoader />}><AdminInfra /></Suspense> },
      ],
    },
  ];
}

/**
 * ── UN FILET D'ERREUR PAR ROUTE, POSÉ EN UNE FOIS ─────────────────────────────────────
 *
 * Le dépôt n'avait qu'UNE frontière, autour des fournisseurs, pour soixante-dix routes :
 * le plantage d'un écran emportait l'en-tête, la navigation et le pied avec lui.
 *
 * React Router fait remonter une erreur jusqu'à l'`errorElement` le plus proche. En
 * l'annotant sur chaque nœud, l'écran fautif est remplacé DANS l'`<Outlet>` de son
 * gabarit : la coquille reste debout, la navigation reste utilisable.
 *
 * Écrit en récursion plutôt qu'à la main sur soixante-dix objets de route — une annotation
 * manuelle aurait été oubliée à la première route ajoutée, et rien ne l'aurait signalé.
 * `errorElement` déjà posé est respecté : la fonction n'écrase aucune décision explicite.
 */
function withRouteErrors(routes: RouteObject[]): RouteObject[] {
  return routes.map((route): RouteObject => {
    const errorElement = route.errorElement ?? <RouteError />;
    /* `RouteObject` est une union DISCRIMINÉE : une route `index` déclare
       `children?: undefined`. Un `...spread` unique la casse, d'où les deux branches —
       chacune reconstruit la forme que TypeScript attend. */
    return route.children
      ? { ...route, errorElement, children: withRouteErrors(route.children) }
      : { ...route, errorElement };
  });
}

/**
 * ── UN HÔTE, UN ESPACE — LES ROUTES MONTÉES SONT CELLES DE L'HÔTE ────────────────────────
 *
 * `appChildren()` déclare TOUTES les routes, en chemins LOGIQUES (ceux d'avant les
 * sous-domaines). Cette fonction garde celles que l'hôte courant sert et les remonte à leur
 * chemin PHYSIQUE, d'après la table unique `lib/espaces.ts` :
 *
 *   sur edu.   `apprendre` → index, `mon-espace/cours` → `mes-formations`, `formations/:slug` reste ;
 *   sur club.  `club-des-digitos` → index, `mon-espace/club/agenda` → `agenda` ;
 *   sur le hub tout le reste.
 *
 * Une route mère à chemin (`mon-espace`, `admin`) devient une mère SANS chemin : son gabarit
 * reste, ses enfants portent le chemin physique complet. Une route qui n'existe pas sur
 * l'hôte n'est pas montée ; si quelqu'un la demande, `Introuvable` l'envoie sur le bon hôte.
 */
function routesDeLEspace(routes: RouteObject[], espace: Espace, base = ''): RouteObject[] {
  const out: RouteObject[] = [];
  const vus = new Set<string>();
  for (const route of routes) {
    if (route.path === '*') { out.push(route); continue; }
    const logique = route.index || route.path === undefined
      ? base || '/'
      : `${base.replace(/\/$/, '')}/${route.path}`;
    if (route.children) {
      const enfants = routesDeLEspace(route.children, espace, route.path === undefined ? base : logique);
      if (enfants.length === 0) continue;
      const { path: _chemin, ...mere } = route;
      out.push({ ...mere, children: enfants } as RouteObject);
      continue;
    }
    const place = placer(logique, espace);
    if (place.espace !== espace) continue;
    const physique = place.chemin.replace(/^\//, '');
    // Deux chemins logiques pour une même page (`mon-espace/club` et `mon-espace/club/fil`) :
    // la première déclarée sert.
    if (vus.has(physique)) continue;
    vus.add(physique);
    const { path: _p, index: _i, ...feuille } = route;
    out.push((physique === '' ? { ...feuille, index: true } : { ...feuille, path: physique }) as RouteObject);
  }
  return out;
}

const routesFr = () => routesDeLEspace(appChildren() as RouteObject[], espaceCourant());

const router = createBrowserRouter([
  {
    element: <RootProviders />,
    errorElement: <RouteError />,
    children: [
      { path: '/en', children: withRouteErrors(localizeRouteTree(routesFr(), 'en')) },
      { path: '/', children: withRouteErrors(routesFr()) },
    ],
  },
]);

export default function App() {
  /* `ui` fait partie des espaces de noms de base (`CORE_NAMESPACES`), donc chargé avec
     le bundle : `t` répond ici sans attendre. Le design system, lui, ne connaît pas
     i18next — c'est la coquille qui lui passe ses libellés. */
  /* Alias explicite : `PageLoader`, plus bas dans ce fichier, tient déjà `t` pour
     l'espace `common`. Deux `const { t }` dans le même fichier, c'est une clé attribuée
     au mauvais espace de noms — et `tests/unit/i18n-keys.test.ts` l'a dit tout de suite. */
  const { t: tUi } = useTranslation('ui');
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <ThemeProvider>
          <AuthProvider>
            <QueryClientProvider client={queryClient}>
              <ToastProvider closeLabel={tUi('toast.close')}>
                <RouterProvider router={router} />
              </ToastProvider>
            </QueryClientProvider>
          </AuthProvider>
        </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}
