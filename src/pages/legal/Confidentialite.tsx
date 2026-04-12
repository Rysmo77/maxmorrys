import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SEOHead from '../../components/seo/SEOHead';

export default function Confidentialite() {
  return (
    <div className="pt-24 pb-20">
      <SEOHead title="Politique de confidentialité" noIndex />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-brand-600 dark:hover:text-brand-400 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour a l'accueil
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-8">Politique de confidentialite</h1>

        <div className="space-y-8 text-neutral-600 dark:text-neutral-400 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Introduction</h2>
            <p>La presente politique de confidentialite decrit comment Max-Morrys collecte, utilise et protege vos donnees personnelles lorsque vous utilisez notre site web et nos services.</p>
            <p className="mt-2">Nous nous engageons a respecter la loi senegalaise n 2008-12 du 25 janvier 2008 portant sur la protection des donnees a caractere personnel, ainsi que le RGPD pour les utilisateurs europeens.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Donnees collectees</h2>
            <p>Nous collectons les donnees suivantes :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Donnees d'identification : nom, prenom, adresse email</li>
              <li>Donnees de connexion : adresse IP, donnees de navigation</li>
              <li>Donnees relatives aux achats : historique de commandes, moyens de paiement</li>
              <li>Donnees de progression : avancement dans les formations</li>
              <li>Donnees de communication : messages envoyes via le formulaire de contact</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Finalites du traitement</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Gestion de votre compte utilisateur</li>
              <li>Acces et suivi de vos formations</li>
              <li>Traitement des paiements</li>
              <li>Envoi de newsletters (avec votre consentement)</li>
              <li>Amelioration de nos services et de l'experience utilisateur</li>
              <li>Reponse a vos demandes de contact</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Duree de conservation</h2>
            <p>Vos donnees sont conservees pendant la duree necessaire a la realisation des finalites pour lesquelles elles ont ete collectees :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Donnees de compte : pendant la duree de votre inscription + 3 ans</li>
              <li>Donnees de transaction : 10 ans (obligation legale)</li>
              <li>Donnees de newsletter : jusqu'a votre desinscription</li>
              <li>Cookies : 13 mois maximum</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Vos droits</h2>
            <p>Conformement a la legislation en vigueur, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Droit d'acces a vos donnees</li>
              <li>Droit de rectification</li>
              <li>Droit de suppression</li>
              <li>Droit d'opposition</li>
              <li>Droit a la portabilite</li>
              <li>Droit a la limitation du traitement</li>
            </ul>
            <p className="mt-2">Pour exercer ces droits, contactez-nous a : contact@maxmorrys.com</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Sous-traitants</h2>
            <p>Nous faisons appel aux sous-traitants suivants pour le fonctionnement de nos services :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Firebase (Google) - Hebergement et base de donnees</li>
              <li>Netlify - Hebergement web</li>
              <li>Services de paiement - Traitement des transactions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Contact</h2>
            <p>Pour toute question relative a cette politique, contactez-nous :</p>
            <p className="mt-2">Email : contact@maxmorrys.com</p>
            <p>Commission de Protection des Donnees Personnelles (CDP) du Senegal : <a href="https://www.cdp.sn" target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 hover:underline">www.cdp.sn</a></p>
          </section>

          <p className="text-sm text-neutral-400 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            Derniere mise a jour : Fevrier 2026
          </p>
        </div>
      </div>
    </div>
  );
}
