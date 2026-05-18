import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SEOHead from '../../components/seo/SEOHead';

export default function CGV() {
  return (
    <div className="pt-24 pb-20">
      <SEOHead
        title="Conditions Générales de Vente"
        description="Conditions Générales de Vente des formations et services Max-Morrys."
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-brand-600 dark:hover:text-brand-400 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
        </Link>

        <p className="text-xs font-bold tracking-[0.3em] uppercase text-brand-600 dark:text-brand-400 mb-3">
          Plateforme Max-Morrys
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-8">
          Conditions Générales de Vente
        </h1>

        <div className="space-y-8 text-neutral-600 dark:text-neutral-400 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Article 1 — Objet</h2>
            <p>
              Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles entre la société <strong>My Onoma SARL</strong> (ci-après « l'Éditeur ») et toute personne physique ou morale (ci-après « le Client ») souhaitant accéder aux formations en ligne et services proposés sur la plateforme Max-Morrys.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Article 2 — Identification de l'Éditeur</h2>
            <p>La plateforme Max-Morrys est exploitée par :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Société :</strong> My Onoma SARL</li>
              <li><strong>RCCM :</strong> SN DKR 2022 B 11134</li>
              <li><strong>NINEA :</strong> 009319501</li>
              <li><strong>E-mail :</strong> contact@maxmorrys.me</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Article 3 — Description des services</h2>
            <p>Max-Morrys propose, sous la marque exploitée par My Onoma SARL :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li>
                <strong>Formations en ligne</strong> sur le marketing digital, le SEO et l'intelligence artificielle, accessibles à vie après achat (vidéos, contenus textuels, quiz, missions pratiques, ressources téléchargeables).
              </li>
              <li>
                <strong>Certificats de réussite</strong> délivrés à la complétion à 100 % d'une formation, vérifiables publiquement via un code unique.
              </li>
              <li>
                <strong>Rysmo</strong>, assistant pédagogique fondé sur l'intelligence artificielle, disponible pour les apprenants inscrits.
              </li>
              <li>
                <strong>Club des Digitos</strong>, communauté privée payante en abonnement annuel (10 000 FCFA / an), donnant accès à un fil d'actualité, à des discussions, à des sessions live, à des événements et à des contenus exclusifs.
              </li>
              <li>
                <strong>Sessions live et événements</strong> réservés aux membres du Club des Digitos.
              </li>
              <li>
                <strong>Contenus gratuits</strong> : articles de blog, podcasts et vidéos accessibles à tous.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Article 4 — Commande et création de compte</h2>
            <p>
              Pour accéder aux formations, le Client doit créer un compte utilisateur. Il s'engage à fournir des informations exactes et à les maintenir à jour. L'accès aux contenus est strictement personnel et ne peut être partagé, cédé ou transféré à un tiers, sous peine de résiliation immédiate du compte.
            </p>
            <p className="mt-2">
              La validation d'une commande implique l'acceptation pleine et entière des présentes CGV. Le Client reconnaît avoir pris connaissance des CGV et les avoir acceptées via une case à cocher dédiée avant la finalisation du paiement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Article 5 — Tarifs et modalités de paiement</h2>

            <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mt-4 mb-1">5.1 — Prix</h3>
            <p>
              Les prix sont indiqués en Francs CFA (XOF), toutes taxes comprises. Le prix applicable est celui affiché au moment de la commande. Des promotions et coupons de réduction peuvent être proposés ponctuellement.
            </p>

            <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mt-4 mb-1">5.2 — Paiement</h3>
            <p>
              Le règlement s'effectue via <strong>Bictorys</strong>, agrégateur de paiement intégrant Wave, Orange Money, Free Money et carte bancaire (Visa / Mastercard). La transaction est sécurisée et chiffrée par le prestataire de paiement.
            </p>

            <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mt-4 mb-1">5.3 — Débit</h3>
            <p>
              Le Client reconnaît que la transaction sera enregistrée sous le nom commercial de la société mère, <strong>My Onoma</strong>. Une facture est envoyée automatiquement par e-mail au nom de My Onoma SARL dès validation du paiement.
            </p>

            <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mt-4 mb-1">5.4 — Abonnement Club des Digitos</h3>
            <p>
              L'abonnement au Club des Digitos est conclu pour une durée de douze (12) mois à compter de la date de paiement.
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                Le Client choisit, lors de l'activation, entre un <strong>renouvellement automatique</strong> à l'échéance ou un <strong>renouvellement manuel</strong>.
              </li>
              <li>
                En cas de renouvellement automatique, le Client est informé par e-mail au moins quinze (15) jours avant l'échéance, et peut désactiver le renouvellement à tout moment depuis son espace étudiant.
              </li>
              <li>
                Aucun remboursement au prorata n'est effectué en cas de résiliation en cours d'abonnement.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Article 6 — Droit de rétractation et remboursement</h2>
            <p>Conformément aux usages du commerce numérique pour les contenus dématérialisés :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li>
                Le Client accepte que l'exécution de la prestation commence immédiatement après le paiement.
              </li>
              <li>
                En conséquence, dès lors que le Client a accédé au contenu de la formation (visionnage d'une vidéo ou téléchargement d'un document), il <strong>renonce expressément à son droit de rétractation</strong>.
              </li>
              <li>
                Aucun remboursement ne sera effectué une fois l'accès aux cours activé, sauf en cas de défaut technique majeur de la plateforme empêchant l'accès durable au contenu.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Article 7 — Propriété intellectuelle</h2>
            <p>
              Tous les contenus (vidéos, textes, graphiques, supports PDF, modèles, etc.) présents sur la plateforme Max-Morrys sont la propriété exclusive de My Onoma SARL ou de Max-Morrys.
            </p>
            <p className="mt-2">
              Toute reproduction, distribution, modification ou utilisation commerciale de tout ou partie du contenu sans autorisation écrite préalable est strictement interdite et peut donner lieu à des poursuites judiciaires.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Article 8 — Responsabilité</h2>
            <p>
              L'Éditeur met tout en œuvre pour assurer une disponibilité de la plateforme 24h/24. Toutefois, il ne pourra être tenu responsable des interruptions liées à la maintenance, à des problèmes de connexion internet du Client, ou à des cas de force majeure.
            </p>
            <p className="mt-2">
              Les formations sont des outils de conseil et de pédagogie ; l'Éditeur ne peut garantir de résultats financiers ou commerciaux spécifiques suite à leur suivi. Les résultats obtenus dépendent de l'engagement et de l'application personnelle du Client.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Article 9 — Protection des données personnelles</h2>
            <p>
              Les données collectées sont nécessaires à la gestion de la commande, à l'accès aux services et au suivi pédagogique. Conformément à la loi sénégalaise n°2008-12 du 25 janvier 2008 sur la protection des données à caractère personnel, le Client dispose d'un droit d'accès, de rectification, d'opposition et de suppression des données le concernant.
            </p>
            <p className="mt-2">
              Pour exercer ces droits, le Client peut contacter l'Éditeur à l'adresse <strong>contact@maxmorrys.me</strong>. Pour plus de détails, voir notre <Link to="/legal/confidentialite" className="text-brand-600 dark:text-brand-400 hover:underline">politique de confidentialité</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Article 10 — Droit applicable et litiges</h2>
            <p>
              Les présentes CGV sont soumises au droit sénégalais et aux normes de l'OHADA. En cas de litige, une solution amiable sera recherchée avant toute action judiciaire. À défaut, les tribunaux de Dakar seront seuls compétents.
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
