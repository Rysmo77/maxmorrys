/** Navigation prenant un chemin canonique FR ; l'appelant peut le localiser (/en + segments). */
type CommandNavigate = (to: string) => void;
import type { User as FirebaseUser } from 'firebase/auth';
import type { User as AppUser, Enrollment } from '../types';
import type { IconName } from '@ds';

export type CommandKind = 'navigation' | 'action' | 'admin';

export interface AppCommand {
  id: string;
  label: string;
  hint?: string;
  /*
   * UN NOM DE GLYPHE. La palette de commandes portait des composants `LucideIcon` — donc une
   * seconde famille d'icônes, dans un module de DONNÉES qui n'a aucune raison de connaître le
   * rendu. Le nom la découple : `lib/` décrit ce qu'il y a à faire, `Icon` décide à quoi ça
   * ressemble.
   */
  icon: IconName;
  kind: CommandKind;
  keywords?: string;
  run: () => void;
}

interface CommandContext {
  user: FirebaseUser | null;
  userData: AppUser | null;
  navigate: CommandNavigate;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  signOut: () => Promise<void>;
  lastEnrollment?: Enrollment | null;
}

export function buildCommands(ctx: CommandContext): AppCommand[] {
  const { user, userData, navigate, theme, setTheme, signOut, lastEnrollment } = ctx;
  const isLogged = !!user;
  const role = userData?.role;
  const isStaff = role === 'admin' || role === 'support';

  const cmds: AppCommand[] = [];

  if (isLogged) {
    cmds.push(
      { id: 'go-dashboard',    label: 'Aller au tableau de bord', icon: 'dashboard', kind: 'navigation', keywords: 'accueil home espace', run: () => navigate('/mon-espace/tableau-de-bord') },
      { id: 'go-courses',      label: 'Mes formations',            icon: 'book',       kind: 'navigation', keywords: 'cours formations apprendre', run: () => navigate('/mon-espace/cours') },
      { id: 'go-notes',        label: 'Mes notes',                 icon: 'bookmark',     kind: 'navigation', keywords: 'notes prise notes', run: () => navigate('/mon-espace/notes') },
      { id: 'go-achievements', label: 'Mes succès & certificats',  icon: 'award',          kind: 'navigation', keywords: 'succes certificats achievements badges', run: () => navigate('/mon-espace/succes') },
      { id: 'go-messages',     label: 'Mes messages',              icon: 'inbox',          kind: 'navigation', keywords: 'inbox messages contact', run: () => navigate('/mon-espace/messages') },
      { id: 'go-club',         label: 'Le Club des Digitos',       icon: 'crown',          kind: 'navigation', keywords: 'club digitos communaute', run: () => navigate('/mon-espace/club') },
      { id: 'go-profile',      label: 'Mon profil',                icon: 'user',           kind: 'navigation', keywords: 'profil avatar bio', run: () => navigate('/mon-espace/profil') },
      { id: 'go-settings',     label: 'Paramètres',                icon: 'settings',       kind: 'navigation', keywords: 'reglages parametres preferences', run: () => navigate('/mon-espace/parametres') },
    );

    if (lastEnrollment) {
      cmds.push({
        id: 'resume-course',
        label: 'Reprendre la formation en cours',
        hint: `Progression ${lastEnrollment.progress ?? 0}%`,
        icon: 'play',
        kind: 'action',
        keywords: 'reprendre continue course play',
        run: () => navigate(`/cours/${lastEnrollment.formationId}`),
      });
    }

    cmds.push({
      id: 'new-note',
      label: 'Créer une note',
      icon: 'plus',
      kind: 'action',
      keywords: 'nouvelle note creer add',
      run: () => navigate('/mon-espace/notes?new=1'),
    });
  } else {
    cmds.push(
      { id: 'go-login',    label: 'Se connecter', icon: 'user',         kind: 'navigation', keywords: 'login connexion', run: () => navigate('/connexion') },
      { id: 'go-register', label: 'Créer un compte', icon: 'plus',      kind: 'navigation', keywords: 'inscription register signup', run: () => navigate('/inscription') },
    );
  }

  cmds.push(
    { id: 'nav-home',       label: 'Accueil du site',  icon: 'home',           kind: 'navigation', keywords: 'home accueil', run: () => navigate('/') },
    { id: 'nav-formations', label: 'Voir les formations', icon: 'graduation', kind: 'navigation', keywords: 'formations catalogue', run: () => navigate('/formations') },
    { id: 'nav-blog',       label: 'Lire le blog',     icon: 'doc',        kind: 'navigation', keywords: 'blog articles', run: () => navigate('/blog') },
    { id: 'nav-podcasts',   label: 'Écouter les podcasts', icon: 'mic',        kind: 'navigation', keywords: 'podcasts audio', run: () => navigate('/podcasts') },
    { id: 'nav-videos',     label: 'Regarder les vidéos', icon: 'video',       kind: 'navigation', keywords: 'videos youtube', run: () => navigate('/videos') },
    { id: 'nav-contact',    label: 'Nous contacter',   icon: 'comment',   kind: 'navigation', keywords: 'contact message', run: () => navigate('/contact') },
    { id: 'nav-faq',        label: 'FAQ',              icon: 'help',      kind: 'navigation', keywords: 'aide help faq questions', run: () => navigate('/faq') },
  );

  if (isStaff) {
    cmds.push(
      { id: 'admin-dashboard', label: "Aller à l'admin",          icon: 'shield',    kind: 'admin', keywords: 'admin panel', run: () => navigate('/admin') },
      { id: 'admin-articles',  label: 'Admin · Articles',         icon: 'doc',  kind: 'admin', keywords: 'admin articles', run: () => navigate('/admin/articles') },
      { id: 'admin-formations',label: 'Admin · Formations',       icon: 'graduation', kind: 'admin', keywords: 'admin formations', run: () => navigate('/admin/formations') },
      { id: 'admin-users',     label: 'Admin · Utilisateurs',     icon: 'user',      kind: 'admin', keywords: 'admin users utilisateurs', run: () => navigate('/admin/utilisateurs') },
    );
  }

  cmds.push({
    id: 'toggle-theme',
    label: theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre',
    icon: theme === 'dark' ? 'sun' : 'moon',
    kind: 'action',
    keywords: 'theme dark light sombre clair',
    run: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
  });

  if (isLogged) {
    cmds.push({
      id: 'sign-out',
      label: 'Se déconnecter',
      icon: 'logout',
      kind: 'action',
      keywords: 'deconnexion logout signout',
      run: () => { void signOut().then(() => navigate('/')); },
    });
  }

  cmds.push({
    id: 'open-help',
    label: "Ouvrir l'aide (nouvelle fenêtre)",
    icon: 'external',
    kind: 'action',
    keywords: 'aide help support',
    run: () => window.open('/faq', '_blank', 'noopener,noreferrer'),
  });

  return cmds;
}

export function filterCommands(commands: AppCommand[], query: string): AppCommand[] {
  const q = query.trim().toLowerCase().replace(/^>/, '').trim();
  if (!q) return commands;
  return commands.filter((c) => {
    const hay = `${c.label} ${c.keywords ?? ''}`.toLowerCase();
    return q.split(/\s+/).every((token) => hay.includes(token));
  });
}
