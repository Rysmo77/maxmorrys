import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

const perks = [
  'Accès à toutes vos formations achetées',
  'Suivi de progression en temps réel',
  'Certificats de completion',
  'Communauté d\'apprenants exclusive',
];

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signUp, signInWithGoogle } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Le nom est requis';
    if (!email.trim()) errs.email = "L'email est requis";
    else if (!EMAIL_RE.test(email.trim())) errs.email = 'Email invalide';
    if (password.length < 6) errs.password = 'Minimum 6 caractères';
    if (password !== confirm) errs.confirm = 'Les mots de passe ne correspondent pas';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await signUp(email, password, name);
      addToast('success', 'Compte créé avec succès ! Bienvenue.');
      navigate('/mon-espace');
    } catch (error: any) {
      addToast('error', error.message || 'Une erreur est survenue');
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      addToast('success', 'Compte créé avec succès ! Bienvenue.');
      navigate('/mon-espace');
    } catch (error: any) {
      addToast('error', error.message || 'Erreur de connexion avec Google');
    }
    setGoogleLoading(false);
  };

  const clearError = (field: string) => setErrors((p) => ({ ...p, [field]: '' }));

  return (
    <div className="min-h-screen flex">

      {/* ── Panneau formulaire (gauche) ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 pt-24 lg:pt-12 bg-white dark:bg-neutral-950 overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Logo mobile */}
          <div className="lg:hidden text-center mb-10">
            <Link to="/">
              <span className="font-black text-2xl tracking-tight text-neutral-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                Hellooo<span className="text-brand-500">!</span>
              </span>
            </Link>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white mb-1">
            Créer un compte
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-8">
            Rejoignez la communauté Max-Morrys gratuitement.
          </p>

          {/* Bouton Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {googleLoading ? (
              <span className="w-5 h-5 border-2 border-neutral-300 border-t-brand-500 rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            S'inscrire avec Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
            <span className="text-xs font-medium text-neutral-400">ou créer avec email</span>
            <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
          </div>

          {/* Formulaire email */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                Nom complet
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); clearError('name'); }}
                  placeholder="Ton nom"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors ${errors.name ? 'border-red-400 dark:border-red-500' : 'border-neutral-200 dark:border-neutral-700'}`}
                />
              </div>
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
                  placeholder="ton@email.com"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors ${errors.email ? 'border-red-400 dark:border-red-500' : 'border-neutral-200 dark:border-neutral-700'}`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
                    placeholder="Min. 6 caractères"
                    className={`w-full pl-10 pr-8 py-3 rounded-xl border text-sm bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors ${errors.password ? 'border-red-400 dark:border-red-500' : 'border-neutral-200 dark:border-neutral-700'}`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  Confirmer
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); clearError('confirm'); }}
                    placeholder="Retape"
                    className={`w-full pl-10 pr-8 py-3 rounded-xl border text-sm bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors ${errors.confirm ? 'border-red-400 dark:border-red-500' : 'border-neutral-200 dark:border-neutral-700'}`}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                    {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {errors.confirm && <p className="text-xs text-red-500">{errors.confirm}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : null}
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>

          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 mt-8">
            Déjà un compte ?{' '}
            <Link to="/connexion" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>

      {/* ── Panneau marque (droite, desktop seulement) ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 bg-neutral-950 flex-col relative overflow-hidden">
        {/* Orbes décoratifs */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 -left-16 w-64 h-64 bg-accent-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-32 right-1/4 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 p-10">
          <Link to="/" className="inline-block">
            <span className="font-black text-2xl tracking-tight text-white hover:text-brand-400 transition-colors">
              Hellooo<span className="text-brand-500">!</span>
            </span>
          </Link>
        </div>

        {/* Contenu central */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-10 xl:px-16">
          <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-400 mb-6">
            REJOINS-NOUS
          </p>
          <h2 className="text-4xl xl:text-5xl font-black text-white leading-[1.05] tracking-tight mb-8">
            Tout ce que tu<br />obtiens en<br />
            <span className="text-brand-400">rejoignant</span><br />la plateforme.
          </h2>

          {/* Avantages */}
          <div className="space-y-4">
            {perks.map((perk) => (
              <div key={perk} className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <p className="text-neutral-300 text-sm leading-snug">{perk}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bas du panneau */}
        <div className="relative z-10 p-10 border-t border-white/5">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {['#6366f1','#8b5cf6','#ec4899'].map((c) => (
                <div key={c} className="w-8 h-8 rounded-full border-2 border-neutral-950" style={{ backgroundColor: c }} />
              ))}
            </div>
            <p className="text-xs text-neutral-400">
              <span className="text-white font-bold">50+</span> étudiants me font déjà confiance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
