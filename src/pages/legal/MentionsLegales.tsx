import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SEOHead from '../../components/seo/SEOHead';

export default function MentionsLegales() {
  return (
    <div className="pt-24 pb-20">
      <SEOHead
        title="Mentions légales"
        description="Mentions légales de Max-Morrys : éditeur, hébergeur et informations légales du site."
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-brand-600 dark:hover:text-brand-400 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-8">Mentions légales</h1>

        <div className="space-y-8 text-neutral-600 dark:text-neutral-400 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Éditeur du site</h2>
            <p>
              Le site maxmorrys.me est édité par la société <strong>My Onoma SARL</strong>,
              opératrice de la marque Max-Morrys.
            </p>
            <ul className="mt-3 space-y-1">
              <li><strong>Raison sociale :</strong> My Onoma SARL</li>
              <li><strong>Capital social :</strong> 100 000 FCFA</li>
              <li><strong>RCCM :</strong> SN DKR 2022 B 11134</li>
              <li><strong>NINEA :</strong> 009319501</li>
              <li><strong>Siège social :</strong> Dakar, Sénégal</li>
              <li><strong>Directeur de la publication :</strong> Max-Morrys Eyoum</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Hébergement</h2>
            <p>
              Le site est hébergé par <strong>Firebase Hosting</strong> (Google LLC), 1600 Amphitheatre Parkway, Mountain View, CA 94043, États-Unis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Données personnelles</h2>
            <p>
              Conformément à la loi sénégalaise n°2008-12 du 25 janvier 2008 portant sur la protection des données à caractère personnel, et au Règlement Général sur la Protection des Données (RGPD) pour les visiteurs de l'Union Européenne, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles.
            </p>
            <p className="mt-2">
              Pour plus d'informations, consultez notre <Link to="/legal/confidentialite" className="text-brand-600 dark:text-brand-400 hover:underline">politique de confidentialité</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Cookies</h2>
            <p>
              Ce site utilise des cookies. Pour en savoir plus, consultez notre <Link to="/legal/cookies" className="text-brand-600 dark:text-brand-400 hover:underline">politique de cookies</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Limitation de responsabilité</h2>
            <p>
              My Onoma SARL s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur ce site. Toutefois, l'éditeur ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations mises à disposition.
            </p>
          </section>

          <p className="text-sm text-neutral-400 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            Dernière mise à jour : Avril 2026
          </p>
        </div>
      </div>
    </div>
  );
}
