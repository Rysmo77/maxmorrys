import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SEOHead from '../../components/seo/SEOHead';

export default function CookiesPage() {
  return (
    <div className="pt-24 pb-20">
      <SEOHead title="Politique de cookies" noIndex />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-brand-600 dark:hover:text-brand-400 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-8">Politique de cookies</h1>

        <div className="space-y-8 text-neutral-600 dark:text-neutral-400 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Qu'est-ce qu'un cookie ?</h2>
            <p>
              Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, tablette, smartphone) lors de la visite d'un site web. Il permet au site de reconnaître votre navigateur et de stocker certaines informations.
            </p>
            <p className="mt-2">
              Le site Max-Morrys, opéré par <strong>My Onoma SARL</strong>, utilise des cookies et technologies similaires (stockage local du navigateur) pour assurer le fonctionnement du service et améliorer votre expérience.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Types de cookies utilisés</h2>

            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mt-4 mb-2">Cookies essentiels</h3>
            <p>Nécessaires au fonctionnement du site. Ils permettent la navigation, l'authentification et la sécurité. Ils ne nécessitent pas votre consentement.</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Session utilisateur (Firebase Authentication)</li>
              <li>Préférences de thème (mode sombre / clair)</li>
              <li>Préférences de langue</li>
              <li>Consentement cookies</li>
            </ul>

            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mt-4 mb-2">Cookies analytiques</h3>
            <p>Utilisés pour comprendre comment les visiteurs interagissent avec le site. Ces cookies ne sont activés qu'après votre consentement.</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Google Analytics (GA4) — analyse du trafic</li>
              <li>Suivi de progression dans les formations</li>
            </ul>

            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mt-4 mb-2">Cookies marketing</h3>
            <p>Utilisés pour afficher du contenu pertinent. Activés uniquement avec votre consentement.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Gestion de vos préférences</h2>
            <p>
              Lors de votre première visite, un bandeau vous permet de choisir les catégories de cookies que vous acceptez. Vous pouvez modifier vos préférences à tout moment en cliquant sur le lien « Gérer les cookies » en bas de page.
            </p>
            <p className="mt-2">
              Vous pouvez également configurer votre navigateur pour refuser les cookies. Notez que certaines fonctionnalités du site pourraient ne plus fonctionner correctement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Durée de conservation</h2>
            <p>
              Les cookies sont conservés pour une durée maximale de 13 mois. Au-delà, votre consentement sera à nouveau demandé.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Cadre juridique</h2>
            <p>Cette politique est conforme à :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>La directive ePrivacy et le RGPD pour les visiteurs de l'Union Européenne</li>
              <li>La loi sénégalaise n°2008-12 sur la protection des données personnelles</li>
              <li>Les recommandations de la CNIL en matière de cookies et traceurs</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Contact</h2>
            <p>
              Pour toute question relative à cette politique : <strong>contact@maxmorrys.me</strong>
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
