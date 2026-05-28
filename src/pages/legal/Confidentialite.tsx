import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SEOHead from '../../components/seo/SEOHead';

export default function Confidentialite() {
  return (
    <div className="pt-24 pb-20">
      <SEOHead
        title="Politique de confidentialité"
        description="Politique de confidentialité et protection des données personnelles de Max-Morrys (RGPD)."
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-brand-600 dark:hover:text-brand-400 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-8">Politique de confidentialité</h1>

        <div className="space-y-8 text-neutral-600 dark:text-neutral-400 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Introduction</h2>
            <p>La présente politique de confidentialité décrit comment <strong>My Onoma SARL</strong>, opératrice de la marque Max-Morrys, collecte, utilise et protège vos données personnelles lorsque vous utilisez notre site web et nos services.</p>
            <p className="mt-2">Nous nous engageons à respecter la loi sénégalaise n°2008-12 du 25 janvier 2008 portant sur la protection des données à caractère personnel, ainsi que le RGPD pour les utilisateurs européens.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Données collectées</h2>
            <p>Nous collectons les données suivantes :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Données d'identification : nom, prénom, adresse email</li>
              <li>Données de connexion : adresse IP, données de navigation</li>
              <li>Données relatives aux achats : historique de commandes, moyens de paiement</li>
              <li>Données de progression : avancement dans les formations</li>
              <li>Données de communication : messages envoyés via le formulaire de contact</li>
              <li>Données liées à l'assistant IA Rysmo : historique de tes échanges avec Rysmo et profil d'apprentissage dérivé (sujets d'intérêt, niveau estimé, points à renforcer), stockés côté serveur pour personnaliser son accompagnement</li>
            </ul>
            <p className="mt-2 text-sm">
              La mémoire de Rysmo est <strong>activée par défaut</strong>. Tu peux la désactiver et l'effacer à tout moment depuis ton espace (<em>Espace → Rysmo → Mémoire</em>).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Finalités du traitement</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Gestion de votre compte utilisateur</li>
              <li>Accès et suivi de vos formations</li>
              <li>Traitement des paiements</li>
              <li>Envoi de newsletters (avec votre consentement)</li>
              <li>Amélioration de nos services et de l'expérience utilisateur</li>
              <li>Réponse à vos demandes de contact</li>
              <li>Personnalisation pédagogique de l'assistant IA Rysmo (base légale : intérêt légitime, avec contrôle de votre part — désactivation et effacement à tout moment)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Durée de conservation</h2>
            <p>Vos données sont conservées pendant la durée nécessaire à la réalisation des finalités pour lesquelles elles ont été collectées :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Données de compte : pendant la durée de votre inscription + 3 ans</li>
              <li>Données de transaction : 10 ans (obligation légale)</li>
              <li>Données de newsletter : jusqu'à votre désinscription</li>
              <li>Mémoire de l'assistant Rysmo : conservée tant que la mémoire est active ; effaçable à tout moment depuis votre espace</li>
              <li>Cookies : 13 mois maximum</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Vos droits</h2>
            <p>Conformément à la législation en vigueur, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Droit d'accès à vos données</li>
              <li>Droit de rectification</li>
              <li>Droit de suppression</li>
              <li>Droit d'opposition</li>
              <li>Droit à la portabilité</li>
              <li>Droit à la limitation du traitement</li>
            </ul>
            <p className="mt-2">Pour exercer ces droits, contactez-nous à : contact@maxmorrys.me</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Sous-traitants</h2>
            <p>Nous faisons appel aux sous-traitants suivants pour le fonctionnement de nos services :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Firebase / Google Cloud (Google LLC) — Hébergement, base de données et authentification</li>
              <li>Bictorys — Traitement des paiements (Wave, Orange Money, Free Money, carte bancaire)</li>
              <li>Google Generative AI (Gemini) — Assistant pédagogique Rysmo (traitement des échanges pour générer les réponses ; l'historique est stocké côté serveur Max-Morrys pour la mémoire personnalisée)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Contact</h2>
            <p>Pour toute question relative à cette politique, contactez-nous :</p>
            <p className="mt-2">Email : contact@maxmorrys.me</p>
            <p>Commission de Protection des Données Personnelles (CDP) du Sénégal : <a href="https://www.cdp.sn" target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 hover:underline">www.cdp.sn</a></p>
          </section>

          <p className="text-sm text-neutral-400 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            Dernière mise à jour : Avril 2026
          </p>
        </div>
      </div>
    </div>
  );
}
