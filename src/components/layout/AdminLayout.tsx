import { useTranslation } from 'react-i18next';
import AppShell from './AppShell';
import { useAuth } from '../../contexts/AuthContext';
import type { AppSidebarItem } from './AppSidebar';
import { isSupportAllowedPath } from '../../lib/adminAccess';
import { useConsoleCounts } from '../../lib/admin/consoleCounts';
import { ADMIN_NAV, ADMIN_SECTIONS } from '../../lib/admin/consoleNav';

/*
  LA TABLE DES ÉCRANS ET LEURS CINQ FAMILLES VIVENT DANS `lib/admin/consoleNav.ts`.

  Elles étaient déclarées ici, et l'écran des réglages a besoin exactement de la même
  chose — `handoff_tableaux_de_bord` § ParametresDesktop lui demande un panneau
  « Rôles et portée » qui compte les écrans qu'un rôle atteint. Deux déclarations, c'est
  deux occasions de mentir à la personne sur ce qu'elle a le droit de faire ;
  `lib/adminAccess.ts` écrit déjà cette phrase pour la moitié support de la question.
*/

export default function AdminLayout() {
  const { t } = useTranslation('admin');
  const { userData } = useAuth();
  const isAdmin = userData?.role === 'admin';
  const isSupport = userData?.role === 'support';
  const panelLabel = isSupport ? t('nav.panelSupport') : t('nav.panelAdmin');

  const ADMIN_TITLES: Record<string, string> = Object.fromEntries(
    ADMIN_NAV.map((item) => [item.to, t(item.titleKey)]),
  );

  // Le menu et le garde de route (`AdminRoute`) lisent la MÊME table — `lib/adminAccess`.
  // Il n'y a volontairement plus de drapeau `adminOnly` ici : c'était un second endroit où
  // déclarer le périmètre du rôle support, et un écran pouvait devenir visible sans être
  // atteignable. Une seule table, deux lecteurs.
  /*
    ── LES COMPTEURS DU MENU ───────────────────────────────────────────────────────
    Le handoff des tableaux de bord veut un compte par entrée, parce que l'opérateur
    est une seule personne : un menu muet l'oblige à ouvrir les dix-neuf écrans pour
    savoir lequel attend quelque chose.

    ON N'EN POSE QUE CINQ, ET C'EST DÉLIBÉRÉ. `getPlatformStats()` relève onze
    nombres ; les autres entrées n'en ont aucun. Un badge absent dit « non relevé ».
    Inventer « 0 » pour les entrées sans compte serait affirmer un relevé qu'on n'a
    pas fait — exactement ce que la règle 6 interdit, et ce que le handoff redit :
    « une donnée d'exemple est un mensonge qu'on oublie de retirer ».

    Les seuils (`> 0`) ne cachent pas une information : ils évitent d'afficher
    « 0 brouillon » là où l'absence de badge dit déjà qu'il n'y a rien à traiter.
    Le compte des comptes utilisateurs, lui, s'affiche même à 5 — un zéro daté est
    une information, et c'est le seul relevé qui vaut sans condition.
  */
  const { counts } = useConsoleCounts();
  const drafts = counts ? counts.articles - counts.publishedPosts : 0;
  const unpublished = counts ? counts.formations - counts.publishedFormations : 0;

  const badges: Record<string, string | null> = counts
    ? {
        '/admin/utilisateurs': String(counts.users),
        '/admin/articles': drafts > 0 ? t('nav.badgeDrafts', { count: drafts }) : null,
        '/admin/formations': unpublished > 0 ? t('nav.badgeUnpublished', { count: unpublished }) : null,
        '/admin/messages': counts.newMessages > 0 ? t('nav.badgeNew', { count: counts.newMessages }) : null,
        '/admin/prospects-agence': counts.newAgencyLeads > 0 ? t('nav.badgeToQualify', { count: counts.newAgencyLeads }) : null,
        /*
          LE SIXIÈME BADGE — et le seul qui signale une PANNE plutôt qu'une file d'attente.

          Les cinq autres comptent du travail à faire ; celui-ci compte des clients qui ont
          payé et n'ont rien reçu. L'article 4 des CGV promet la facture « automatiquement,
          dès validation du paiement » : quand l'envoi échoue, la promesse est rompue et
          personne ne le sait — l'échec ne laissait qu'un `console.error` dans les journaux
          du Worker.

          D'où le ton `warn` sur l'entrée : c'est la seule chose de ce menu qui ne peut pas
          attendre demain.
        */
        '/admin/transactions': counts.mailPending > 0 ? t('nav.badgeMailPending', { count: counts.mailPending }) : null,
      }
    : {};

  const items: AppSidebarItem[] = ADMIN_NAV
    .filter((item) => isAdmin || isSupportAllowedPath(item.to))
    .map(({ to, labelKey, icon, end, tone }) => ({
      to, label: t(labelKey), icon, end, tone, badge: badges[to] ?? null,
    }));

  return (
    <AppShell
      brand={{ label: panelLabel, href: '/admin' }}
      /*
        LA CONSOLE PREND LE MAILLAGE NUIT, DANS LES DEUX MODES. `nuit` est un TERRITOIRE — le
        cinquième maillage du kit, sur #0A0D11 — et il dit ce que dit une console : tu n'es
        plus sur le site, tu es dans la salle des machines. Les dix-neuf écrans le prennent
        d'un coup.
      */
      territory="nuit"
      /*
        ── ET IL FAUT LA PORTÉE `.dk` AVEC, SANS QUOI LA CONSOLE EST ILLISIBLE ────────────
        La version précédente de ce commentaire soutenait le contraire : « ce n'est pas une
        prop de thème (AD-3) et ça n'en tiendrait pas lieu ; `.dk` reste la portée du mode
        sombre, posée sur <html> ». Le raisonnement confondait deux choses.

        AD-3 interdit de passer le THÈME EN PROP de composant. Il n'interdit pas la portée
        CSS — c'est même le mécanisme qu'il prescrit, et le dépôt l'emploie déjà deux fois en
        local : `Forbidden403` (« le seul écran sombre du produit ») et le pied de page.

        Le défaut que ça laissait est mesurable. `AppShell` ne peint aucun fond sur son
        `<main>` : le contenu de la console est posé DIRECTEMENT sur le maillage nuit. En
        mode clair, les jetons restaient clairs — `--ink` foncé sur #0A0D11. Encre foncée sur
        fond foncé, sur les dix-neuf écrans, pour qui n'avait pas choisi le mode sombre.

        `dk` ici fait basculer les 78 jetons concernés en même temps que le maillage, et rend
        cohérent le `territory="nuit"` déjà décidé au-dessus.
        ────────────────────────────────────────────────────────────────────────────────
      */
      contentClassName="dk p-4 stack:p-pane"
      /*
        « Max-Morrys » ne survit que comme PERSONNE (AD-12) : la page « Je suis Max-Morrys »,
        la signature d'article, les mentions légales, « Max-Morrys Agency ». La console est
        l'outil de cette personne — d'où la signature, et non « Rysmo », qui est le nom de
        l'application apprenante.
      */
      wordmark="signature"
      titleMap={ADMIN_TITLES}
      sidebarSections={[
        ...ADMIN_SECTIONS.map((s) => ({
          title: t(s.titleKey),
          items: items.filter((i) => s.paths.includes(i.to)),
        })),
        { title: t('nav.sectionSite'), items: [{ to: '/', label: t('nav.backToSite'), icon: 'home' as const, end: true }] },
      ].filter((section) => section.items.length > 0)}
    />
  );
}
