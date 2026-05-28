import type { NavigateFunction } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, BookOpen, BookMarked, Award, Inbox, User, Settings, Crown,
  Sun, Moon, LogOut, ExternalLink, Plus, Play, Home, FileText, GraduationCap,
  Shield, Mic, Video, MessageSquare, HelpCircle,
} from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import type { User as AppUser, Enrollment } from '../types';

export type CommandKind = 'navigation' | 'action' | 'admin';

export interface AppCommand {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  kind: CommandKind;
  keywords?: string;
  run: () => void;
}

interface CommandContext {
  user: FirebaseUser | null;
  userData: AppUser | null;
  navigate: NavigateFunction;
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
      { id: 'go-dashboard',    label: 'Aller au tableau de bord', icon: LayoutDashboard, kind: 'navigation', keywords: 'accueil home espace', run: () => navigate('/mon-espace/tableau-de-bord') },
      { id: 'go-courses',      label: 'Mes formations',            icon: BookOpen,       kind: 'navigation', keywords: 'cours formations apprendre', run: () => navigate('/mon-espace/cours') },
      { id: 'go-notes',        label: 'Mes notes',                 icon: BookMarked,     kind: 'navigation', keywords: 'notes prise notes', run: () => navigate('/mon-espace/notes') },
      { id: 'go-achievements', label: 'Mes succès & certificats',  icon: Award,          kind: 'navigation', keywords: 'succes certificats achievements badges', run: () => navigate('/mon-espace/succes') },
      { id: 'go-messages',     label: 'Mes messages',              icon: Inbox,          kind: 'navigation', keywords: 'inbox messages contact', run: () => navigate('/mon-espace/messages') },
      { id: 'go-club',         label: 'Le Club des Digitos',       icon: Crown,          kind: 'navigation', keywords: 'club digitos communaute', run: () => navigate('/mon-espace/club') },
      { id: 'go-profile',      label: 'Mon profil',                icon: User,           kind: 'navigation', keywords: 'profil avatar bio', run: () => navigate('/mon-espace/profil') },
      { id: 'go-settings',     label: 'Paramètres',                icon: Settings,       kind: 'navigation', keywords: 'reglages parametres preferences', run: () => navigate('/mon-espace/parametres') },
    );

    if (lastEnrollment) {
      cmds.push({
        id: 'resume-course',
        label: 'Reprendre la formation en cours',
        hint: `Progression ${lastEnrollment.progress ?? 0}%`,
        icon: Play,
        kind: 'action',
        keywords: 'reprendre continue course play',
        run: () => navigate(`/cours/${lastEnrollment.formationId}`),
      });
    }

    cmds.push({
      id: 'new-note',
      label: 'Créer une note',
      icon: Plus,
      kind: 'action',
      keywords: 'nouvelle note creer add',
      run: () => navigate('/mon-espace/notes?new=1'),
    });
  } else {
    cmds.push(
      { id: 'go-login',    label: 'Se connecter', icon: User,         kind: 'navigation', keywords: 'login connexion', run: () => navigate('/connexion') },
      { id: 'go-register', label: 'Créer un compte', icon: Plus,      kind: 'navigation', keywords: 'inscription register signup', run: () => navigate('/inscription') },
    );
  }

  cmds.push(
    { id: 'nav-home',       label: 'Accueil du site',  icon: Home,           kind: 'navigation', keywords: 'home accueil', run: () => navigate('/') },
    { id: 'nav-formations', label: 'Voir les formations', icon: GraduationCap, kind: 'navigation', keywords: 'formations catalogue', run: () => navigate('/formations') },
    { id: 'nav-blog',       label: 'Lire le blog',     icon: FileText,        kind: 'navigation', keywords: 'blog articles', run: () => navigate('/blog') },
    { id: 'nav-podcasts',   label: 'Écouter les podcasts', icon: Mic,        kind: 'navigation', keywords: 'podcasts audio', run: () => navigate('/podcasts') },
    { id: 'nav-videos',     label: 'Regarder les vidéos', icon: Video,       kind: 'navigation', keywords: 'videos youtube', run: () => navigate('/videos') },
    { id: 'nav-contact',    label: 'Nous contacter',   icon: MessageSquare,   kind: 'navigation', keywords: 'contact message', run: () => navigate('/contact') },
    { id: 'nav-faq',        label: 'FAQ',              icon: HelpCircle,      kind: 'navigation', keywords: 'aide help faq questions', run: () => navigate('/faq') },
  );

  if (isStaff) {
    cmds.push(
      { id: 'admin-dashboard', label: "Aller à l'admin",          icon: Shield,    kind: 'admin', keywords: 'admin panel', run: () => navigate('/admin') },
      { id: 'admin-articles',  label: 'Admin · Articles',         icon: FileText,  kind: 'admin', keywords: 'admin articles', run: () => navigate('/admin/articles') },
      { id: 'admin-formations',label: 'Admin · Formations',       icon: GraduationCap, kind: 'admin', keywords: 'admin formations', run: () => navigate('/admin/formations') },
      { id: 'admin-users',     label: 'Admin · Utilisateurs',     icon: User,      kind: 'admin', keywords: 'admin users utilisateurs', run: () => navigate('/admin/utilisateurs') },
    );
  }

  cmds.push({
    id: 'toggle-theme',
    label: theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre',
    icon: theme === 'dark' ? Sun : Moon,
    kind: 'action',
    keywords: 'theme dark light sombre clair',
    run: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
  });

  if (isLogged) {
    cmds.push({
      id: 'sign-out',
      label: 'Se déconnecter',
      icon: LogOut,
      kind: 'action',
      keywords: 'deconnexion logout signout',
      run: () => { void signOut().then(() => navigate('/')); },
    });
  }

  cmds.push({
    id: 'open-help',
    label: "Ouvrir l'aide (nouvelle fenêtre)",
    icon: ExternalLink,
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
