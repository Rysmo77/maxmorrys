import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function MentionsLegales() {
  return (
    <div className="pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-brand-600 dark:hover:text-brand-400 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour a l'accueil
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-8">Mentions legales</h1>

        <div className="space-y-8 text-neutral-600 dark:text-neutral-400 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Editeur du site</h2>
            <p>Le site maxmorrys.com est edite par Max-Morrys, entrepreneur individuel.</p>
            <ul className="mt-3 space-y-1">
              <li>Responsable de publication : Max-Morrys</li>
              <li>Adresse : Dakar, Senegal</li>
              <li>Email : contact@maxmorrys.com</li>
              <li>Telephone : +221 77 000 00 00</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Hebergement</h2>
            <p>Le site est heberge par Netlify, Inc. 44 Montgomery Street, Suite 300, San Francisco, California 94104, USA.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Propriete intellectuelle</h2>
            <p>L'ensemble des contenus presents sur ce site (textes, images, videos, formations, podcasts, logos) sont proteges par le droit de la propriete intellectuelle et appartiennent a Max-Morrys, sauf mention contraire. Toute reproduction, meme partielle, est soumise a autorisation prealable.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Donnees personnelles</h2>
            <p>Conformement a la loi n 2008-12 du 25 janvier 2008 portant sur la protection des donnees a caractere personnel au Senegal et au Reglement General sur la Protection des Donnees (RGPD) pour les visiteurs de l'Union Europeenne, vous disposez d'un droit d'acces, de rectification et de suppression de vos donnees personnelles.</p>
            <p className="mt-2">Pour plus d'informations, consultez notre <Link to="/legal/confidentialite" className="text-brand-600 dark:text-brand-400 hover:underline">politique de confidentialite</Link>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Cookies</h2>
            <p>Ce site utilise des cookies. Pour en savoir plus, consultez notre <Link to="/legal/cookies" className="text-brand-600 dark:text-brand-400 hover:underline">politique de cookies</Link>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Limitation de responsabilite</h2>
            <p>Max-Morrys s'efforce d'assurer l'exactitude et la mise a jour des informations diffusees sur ce site. Toutefois, Max-Morrys ne peut garantir l'exactitude, la precision ou l'exhaustivite des informations mises a disposition.</p>
          </section>

          <p className="text-sm text-neutral-400 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            Derniere mise a jour : Fevrier 2026
          </p>
        </div>
      </div>
    </div>
  );
}
