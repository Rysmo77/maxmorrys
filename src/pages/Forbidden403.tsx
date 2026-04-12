import { Link } from 'react-router-dom';
import SEOHead from '../components/seo/SEOHead';

export default function Forbidden403() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
      <SEOHead title="Accès refusé" noIndex />
      <div className="max-w-md w-full text-center space-y-6">
        <div>
          <p className="text-sm font-semibold tracking-wider text-brand-600 uppercase mb-2">Erreur 403</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-2">
            Accès refusé
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Tu n&apos;as pas les droits nécessaires pour accéder à cette page.
            Si tu penses qu&apos;il s&apos;agit d&apos;une erreur, contacte l&apos;administrateur.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
          <Link
            to="/mon-espace"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Aller à mon espace
          </Link>
        </div>
      </div>
    </div>
  );
}

