import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function CookiesPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-brand-600 dark:hover:text-brand-400 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour a l'accueil
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-8">Politique de cookies</h1>

        <div className="space-y-8 text-neutral-600 dark:text-neutral-400 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Qu'est-ce qu'un cookie ?</h2>
            <p>Un cookie est un petit fichier texte depose sur votre terminal (ordinateur, tablette, smartphone) lors de la visite d'un site web. Il permet au site de reconnaitre votre navigateur et de stocker certaines informations.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Types de cookies utilises</h2>

            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mt-4 mb-2">Cookies essentiels</h3>
            <p>Necessaires au fonctionnement du site. Ils permettent la navigation, l'authentification et la securite. Ils ne necessitent pas votre consentement.</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Session utilisateur</li>
              <li>Preferences de theme (mode sombre/clair)</li>
              <li>Preferences de langue</li>
              <li>Consentement cookies</li>
            </ul>

            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mt-4 mb-2">Cookies analytiques</h3>
            <p>Utilises pour comprendre comment les visiteurs interagissent avec le site. Ces cookies ne sont actives qu'apres votre consentement.</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Google Analytics (GA4) - analyse du trafic</li>
              <li>Suivi de progression dans les formations</li>
            </ul>

            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mt-4 mb-2">Cookies marketing</h3>
            <p>Utilises pour afficher du contenu pertinent. Actives uniquement avec votre consentement.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Gestion de vos preferences</h2>
            <p>Lors de votre premiere visite, un bandeau vous permet de choisir les categories de cookies que vous acceptez. Vous pouvez modifier vos preferences a tout moment en cliquant sur le lien "Gerer les cookies" en bas de page.</p>
            <p className="mt-2">Vous pouvez egalement configurer votre navigateur pour refuser les cookies. Notez que certaines fonctionnalites du site pourraient ne plus fonctionner correctement.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Duree de conservation</h2>
            <p>Les cookies sont conserves pour une duree maximale de 13 mois. Au-dela, votre consentement sera a nouveau demande.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Cadre juridique</h2>
            <p>Cette politique est conforme a :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>La directive ePrivacy et le RGPD pour les visiteurs de l'Union Europeenne</li>
              <li>La loi senegalaise n 2008-12 sur la protection des donnees personnelles</li>
              <li>Les recommandations de la CNIL en matiere de cookies et traceurs</li>
            </ul>
          </section>

          <p className="text-sm text-neutral-400 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            Derniere mise a jour : Fevrier 2026
          </p>
        </div>
      </div>
    </div>
  );
}
