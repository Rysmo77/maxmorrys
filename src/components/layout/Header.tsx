import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Search, Sun, Moon, LogOut, LayoutDashboard, GraduationCap, ChevronDown, Headphones, Youtube, LogIn } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const navLinks = [
  { label: 'Je suis Max-Morrys', path: '/a-propos' },
  { label: 'Je te forme', path: '/formations' },
  { label: "Je t'informe", path: '/blog' },
];

const transformerLinks = [
  { label: 'Le Podcast du Marketing', path: '/podcasts', icon: Headphones },
  { label: 'Le Marketing en Pratique avec Max-Morrys', path: '/videos', icon: Youtube },
];

interface HeaderProps {
  onSearchOpen: () => void;
}

export default function Header({ onSearchOpen }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileTransformerOpen, setMobileTransformerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, userData, signOut } = useAuth();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
    setDropdownOpen(false);
    setMobileTransformerOpen(false);
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isTransformerActive = location.pathname.startsWith('/podcasts') || location.pathname.startsWith('/videos');

  const userInitials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
          scrolled
            ? 'bg-white dark:bg-neutral-900 shadow-[0_1px_0_0_rgba(0,0,0,0.08)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.06)]'
            : 'bg-white dark:bg-neutral-950 border-b border-neutral-200/50 dark:border-neutral-800/50'
        )}
      >
        {/* Brand accent stripe */}
        <div className={cn(
          'absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-500 via-brand-600 to-brand-400 transition-opacity duration-300',
          scrolled ? 'opacity-100' : 'opacity-0'
        )} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 lg:h-[68px]">

            {/* Logo */}
            <Link to="/" className="group shrink-0 flex items-center gap-2">
              <div className="relative">
                <span className="font-black text-[1.35rem] tracking-tight text-neutral-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors duration-200 drop-shadow-sm">
                  Hellooo<span className="text-brand-500">!</span>
                </span>
              </div>
            </Link>

            {/* Nav desktop */}
            <nav className="hidden lg:flex items-center gap-0.5 ml-auto">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path || location.pathname.startsWith(link.path + '/');
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      'relative px-3.5 py-2 text-[0.8125rem] font-semibold transition-colors duration-150 rounded-lg group',
                      isActive
                        ? 'text-neutral-900 dark:text-white font-semibold'
                        : 'text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
                    )}
                  >
                    {link.label}
                    <span className={cn(
                      'absolute bottom-1 left-3.5 right-3.5 h-[1.5px] bg-brand-500 rounded-full transition-transform duration-200 origin-left',
                      isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    )} />
                  </Link>
                );
              })}

              {/* Dropdown "Je te transforme" */}
              <div
                className="relative"
                ref={dropdownRef}
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  aria-label="Je te transforme — contenu gratuit"
                  className={cn(
                    'relative flex items-center gap-1 px-3.5 py-2 text-[0.8125rem] font-semibold transition-colors duration-150 rounded-lg group',
                    isTransformerActive
                      ? 'text-neutral-900 dark:text-white font-semibold'
                      : 'text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
                  )}
                >
                  Je te transforme
                  <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', dropdownOpen && 'rotate-180')} aria-hidden="true" />
                  <span className={cn(
                    'absolute bottom-1 left-3.5 right-8 h-[1.5px] bg-brand-500 rounded-full transition-transform duration-200 origin-left',
                    isTransformerActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  )} />
                </button>

                {dropdownOpen && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-80 z-50 pt-2.5">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl shadow-neutral-900/10 dark:shadow-black/40 border border-neutral-100 dark:border-neutral-800 py-2 animate-slide-down">
                      <div className="px-4 pb-2 pt-1 mb-1 border-b border-neutral-100 dark:border-neutral-800">
                        <p className="text-[0.625rem] font-bold tracking-[0.2em] uppercase text-brand-600 dark:text-brand-400">
                          Contenu gratuit
                        </p>
                      </div>
                      {transformerLinks.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors group/item"
                        >
                          <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
                            <item.icon className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                          </div>
                          <p className={cn(
                            'text-sm font-semibold leading-snug group-hover/item:text-brand-600 dark:group-hover/item:text-brand-400 transition-colors',
                            location.pathname.startsWith(item.path)
                              ? 'text-brand-600 dark:text-brand-400'
                              : 'text-neutral-800 dark:text-neutral-200'
                          )}>
                            {item.label}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Contacte-moi */}
              <Link
                to="/contact"
                className={cn(
                  'relative px-3.5 py-2 text-[0.8125rem] font-semibold transition-all duration-150 rounded-lg group',
                  location.pathname === '/contact'
                    ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20'
                    : 'text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20'
                )}
              >
                Contacte-moi
                <span className={cn(
                  'absolute bottom-1 left-3.5 right-3.5 h-[1.5px] bg-brand-500 rounded-full transition-transform duration-200 origin-left',
                  location.pathname === '/contact' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                )} />
              </Link>

            </nav>

            {/* Actions droite */}
            <div className="flex items-center gap-0.5 ml-auto lg:ml-0">
              <button
                onClick={onSearchOpen}
                className="p-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors rounded-lg hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60"
                aria-label="Rechercher"
              >
                <Search className="w-[18px] h-[18px]" />
              </button>

              <button
                onClick={toggleTheme}
                className="p-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors rounded-lg hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60"
                aria-label="Changer le thème"
              >
                {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
              </button>

              {user ? (
                <div className="relative ml-1" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    aria-expanded={profileOpen}
                    aria-haspopup="true"
                    aria-label={`Menu du compte de ${user.displayName || user.email}`}
                    className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-full border border-neutral-200/80 dark:border-neutral-700/80 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-all duration-200"
                  >
                    <div className="w-7 h-7 rounded-full bg-brand-600 dark:bg-brand-500 flex items-center justify-center text-white text-xs font-bold">
                      {userInitials}
                    </div>
                    <span className="hidden sm:block text-xs font-semibold text-neutral-700 dark:text-neutral-300 max-w-[80px] truncate">
                      {user.displayName?.split(' ')[0] || 'Mon compte'}
                    </span>
                    <ChevronDown className={cn('w-3 h-3 text-neutral-400 transition-transform duration-200', profileOpen && 'rotate-180')} />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2.5 w-60 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl shadow-neutral-900/10 dark:shadow-black/40 border border-neutral-100 dark:border-neutral-800 py-1.5 animate-slide-down">
                      <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                        <p className="text-sm font-bold text-neutral-900 dark:text-white">{user.displayName || 'Apprenant'}</p>
                        <p className="text-xs text-neutral-400 mt-0.5 truncate">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          to="/mon-espace"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                        >
                          <GraduationCap className="w-4 h-4" />
                          Mon espace étudiant
                        </Link>
                        {userData?.role === 'admin' && (
                          <Link
                            to="/admin"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            Administration
                          </Link>
                        )}
                      </div>
                      <div className="pt-1 border-t border-neutral-100 dark:border-neutral-800">
                        <button
                          onClick={() => { signOut(); setProfileOpen(false); }}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 w-full transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Déconnexion
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/connexion"
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-2 ml-1.5 text-[0.8125rem] font-semibold text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 rounded-full hover:border-brand-400 hover:text-brand-600 dark:hover:border-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all duration-200"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Connexion
                </Link>
              )}

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden ml-1 p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors rounded-lg hover:bg-neutral-100/60 dark:hover:bg-neutral-800/50"
                aria-label="Menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Menu mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div
            className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed top-16 left-0 right-0 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 shadow-xl animate-slide-down max-h-[calc(100vh-4rem)] overflow-y-auto">
            <nav className="py-3 px-3 space-y-0.5">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path || location.pathname.startsWith(link.path + '/');
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      'block px-4 py-3 text-sm font-medium transition-colors rounded-xl',
                      isActive
                        ? 'text-brand-600 dark:text-brand-400 font-semibold bg-brand-50 dark:bg-brand-900/20'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {/* Mobile: Je te transforme */}
              <div>
                <button
                  onClick={() => setMobileTransformerOpen(!mobileTransformerOpen)}
                  aria-expanded={mobileTransformerOpen}
                  aria-controls="mobile-transformer-menu"
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors rounded-xl',
                    isTransformerActive
                      ? 'text-brand-600 dark:text-brand-400 font-semibold bg-brand-50 dark:bg-brand-900/20'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                  )}
                >
                  Je te transforme
                  <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', mobileTransformerOpen && 'rotate-180')} aria-hidden="true" />
                </button>
                <div
                  id="mobile-transformer-menu"
                  className={cn(
                    'ml-3 space-y-0.5 overflow-hidden transition-all duration-200',
                    mobileTransformerOpen ? 'max-h-40 mt-0.5 opacity-100' : 'max-h-0 opacity-0'
                  )}
                >
                    {transformerLinks.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-600 dark:text-neutral-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    ))}
                </div>
              </div>

              {/* Mobile: Contacte-moi */}
              <Link
                to="/contact"
                className={cn(
                  'block px-4 py-3 text-sm font-semibold transition-colors rounded-xl',
                  location.pathname === '/contact'
                    ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20'
                    : 'text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20'
                )}
              >
                Contacte-moi
              </Link>

              <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />

              {user ? (
                <div className="space-y-0.5">
                  <Link
                    to="/mon-espace"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 rounded-xl"
                  >
                    <GraduationCap className="w-4 h-4" />
                    Mon espace étudiant
                  </Link>
                  <button
                    onClick={() => { signOut(); }}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              ) : (
                <Link
                  to="/connexion"
                  className="flex items-center justify-center gap-2 px-4 py-3 mt-1 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Connexion
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
