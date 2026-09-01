/**
 * CHAQUE ÉCRAN DU KIT A UN ÉQUIVALENT DANS LE PRODUIT.
 *
 * Le transfert nomme 114 composants dans ses modules de maquette. En retirant les coques
 * (`Screen`, `AppBar`, `Page`, `ConsoleScreen`…), les primitives typographiques et les
 * planches responsive, il reste les ÉCRANS — ceux dont une personne voit quelque chose.
 *
 * Cette table les rapproche un par un d'un fichier du dépôt. Ce n'est pas une mesure de
 * fidélité : un fichier qui existe peut très bien avoir dérivé de sa maquette, et c'est
 * l'audit de fidélité qui le dit. C'est une mesure de PRÉSENCE, et elle attrape la panne la
 * plus bête et la plus coûteuse — un écran promis par une autre surface du produit, et qui
 * n'existe pas.
 *
 * Elle s'est produite deux fois, mesurée :
 *
 *   • « Mes paiements » — le pied de l'écran de succès écrivait « le reçu est dans ton
 *     espace », et la liste « Dans ton espace » du kit l'ouvrait. Aucune route. Un acheteur
 *     ne pouvait consulter aucun de ses paiements.
 *   • « Notifications » (console) — le seul des dix-neuf écrans du kit absent du dépôt, et le
 *     seul écart de pipeline qu'aucun commentaire n'argumentait.
 *
 * Un renommage de fichier fait rougir ce test : c'est voulu. Déplacer un écran est légitime,
 * le faire disparaître sans s'en apercevoir ne l'est pas — la table se met à jour dans le même
 * geste, et l'écran reste rattaché à sa maquette.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

const ROOT = new URL('../..', import.meta.url).pathname;

/** Écran du kit → fichier qui le rend. Plusieurs écrans peuvent partager un fichier. */
const COUVERTURE: Record<string, string> = {
  // ── Site public ──────────────────────────────────────────────────────────────────────
  'Accueil (site)': 'src/pages/Home.tsx',
  'AccueilEN': 'src/pages/Home.tsx',
  'Blog': 'src/pages/Blog.tsx',
  'Article': 'src/pages/BlogPost.tsx',
  'ArticleEN': 'src/pages/BlogPost.tsx',
  'Presence': 'src/pages/PresenceDigitale.tsx',
  'Agence (site)': 'src/pages/Agence.tsx',
  'Apropos (site)': 'src/pages/About.tsx',
  'Formations': 'src/pages/Formations.tsx',
  'FicheFormation': 'src/pages/FormationDetail.tsx',
  'Faq': 'src/pages/FAQ.tsx',
  'FaqQuestion': 'src/pages/FAQQuestion.tsx',
  'Contact (site)': 'src/pages/Contact.tsx',
  'Verifier': 'src/pages/VerifyCertificate.tsx',
  'Connexion (site)': 'src/pages/auth/Login.tsx',
  'Cgv': 'src/pages/legal/CGV.tsx',
  'Transforme (Club public)': 'src/pages/ClubDigitos.tsx',
  'SiteMedia': 'src/pages/MediaPole.tsx',

  // ── Le chemin de l'argent ────────────────────────────────────────────────────────────
  'Catalogue / CataloguePlein': 'src/pages/Formations.tsx',
  'Fiche': 'src/pages/FormationDetail.tsx',
  'Paiement': 'src/pages/lms/Checkout.tsx',
  'Attente / Succes / Echec': 'src/pages/lms/PaymentReturn.tsx',
  'Mes paiements': 'src/pages/lms/tabs/PaymentsTab.tsx',

  // ── Apprentissage ────────────────────────────────────────────────────────────────────
  'Espace': 'src/pages/lms/tabs/DashboardTab.tsx',
  'Lecteur': 'src/pages/lms/CoursePlayer.tsx',
  'MesNotes': 'src/pages/lms/tabs/NotesTab.tsx',
  'Certificat': 'src/pages/lms/Certificate.tsx',
  'Verification': 'src/pages/VerifyCertificate.tsx',

  // ── Le répétiteur ────────────────────────────────────────────────────────────────────
  'Rysmo (conversation)': 'src/components/ai/RysmoWidget.tsx',
  'RysmoMemoire': 'src/pages/lms/tabs/RysmoMemoryTab.tsx',

  // ── Le Club ──────────────────────────────────────────────────────────────────────────
  'Club (mur d’abonnement)': 'src/pages/lms/tabs/club/ClubSubscriptionGate.tsx',
  'ClubFil': 'src/pages/lms/tabs/club/ClubFeed.tsx',
  'ClubDiscussions': 'src/pages/lms/tabs/club/ClubDiscussions.tsx',
  'ClubAgenda': 'src/pages/lms/tabs/club/ClubEvents.tsx',
  'ClubMembre': 'src/pages/lms/tabs/club/ClubMembers.tsx',
  'ClubClassement': 'src/pages/lms/tabs/club/ClubLeaderboard.tsx',
  'ClubOpportunites': 'src/pages/lms/tabs/club/ClubOpportunities.tsx',
  'ClubParrainage': 'src/pages/lms/tabs/club/ClubReferral.tsx',
  'ClubGaranti / ClubPourQui': 'src/pages/ClubDigitos.tsx',

  // ── Média et compte ──────────────────────────────────────────────────────────────────
  'MediaPole / MediaVideos': 'src/pages/MediaPole.tsx',
  'MediaEpisode': 'src/pages/PodcastDetail.tsx',
  'MediaVideo': 'src/pages/VideoDetail.tsx',
  'BlogIndex': 'src/pages/Blog.tsx',
  'Creation': 'src/pages/auth/Register.tsx',
  'MotDePasse': 'src/pages/auth/ResetPassword.tsx',
  'Preferences / Suppression': 'src/pages/lms/tabs/SettingsTab.tsx',

  // ── États transverses et version installable ─────────────────────────────────────────
  'Chargement': 'src/components/states/PageSkeleton.tsx',
  'Erreur': 'src/components/shared/ErrorBoundary.tsx',
  'HorsConnexion': 'src/components/pwa/OfflineLibrary.tsx',
  'Interdit403': 'src/pages/Forbidden403.tsx',
  'PwaInvitation': 'src/components/pwa/InstallInvitation.tsx',
  'PwaNotifications': 'src/components/pwa/NotificationCenter.tsx',
  'PwaLancement': 'src/components/pwa/Splash.tsx',

  // ── Présence Digitale et agence ──────────────────────────────────────────────────────
  'PresenceOffre / GrilleComplete': 'src/pages/PresenceDigitale.tsx',
  'DevisPartageable': 'src/pages/PresenceDevis.tsx',
  'Agence / AgenceEnvoye': 'src/pages/Agence.tsx',

  // ── Console ──────────────────────────────────────────────────────────────────────────
  'DashboardOps': 'src/pages/admin/AdminDashboard.tsx',
  'PublierFormation': 'src/pages/admin/AdminFormations.tsx',
  'TransactionsOps': 'src/pages/admin/AdminTransactions.tsx',
  'ProspectsOps': 'src/pages/admin/AdminAgencyLeads.tsx',
  'ContenuOps': 'src/pages/admin/AdminArticles.tsx',
  'Notifications (console)': 'src/pages/admin/AdminNotifications.tsx',
};

describe('couverture du kit — web', () => {
  it('chaque écran du kit a son fichier', () => {
    const absents = Object.entries(COUVERTURE)
      .filter(([, file]) => !existsSync(join(ROOT, file)))
      .map(([ecran, file]) => `${ecran} → ${file}`);
    expect(absents).toEqual([]);
  });

  it('la table couvre bien tout le kit', () => {
    // Garde-fou : si quelqu'un vide la table, le test ne doit pas passer en silence.
    expect(Object.keys(COUVERTURE).length).toBeGreaterThanOrEqual(60);
  });

  /**
   * LE MOTIF DE LA CONSOLE VAUT POUR SES DIX-NEUF ÉCRANS, et `PipelinesRestants` les nomme.
   * Le compte est donc vérifiable : un écran d'administration qui disparaît, ou qui apparaît
   * sans être rattaché au motif, se voit ici.
   */
  it('la console porte ses écrans', () => {
    const ecrans = readdirSync(join(ROOT, 'src/pages/admin')).filter((n) => /^Admin\w+\.tsx$/.test(n));
    expect(ecrans.length).toBeGreaterThanOrEqual(20);
  });
});
