import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SEOHead from '../../components/seo/SEOHead';

export default function CGU() {
  return (
    <div className="pt-24 pb-20">
      <SEOHead
        title="Conditions d'utilisation"
        description="Conditions générales d'utilisation de la plateforme Max-Morrys et de l'assistant IA Rysmo."
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-brand-600 dark:hover:text-brand-400 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-8">Conditions d'utilisation</h1>

        <div className="space-y-8 text-neutral-600 dark:text-neutral-400 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">1. Objet</h2>
            <p>
              Les présentes conditions générales d'utilisation (CGU) régissent l'accès et l'usage de la plateforme Max-Morrys, opérée par <strong>My Onoma SARL</strong>. En créant un compte ou en utilisant le service, tu acceptes ces conditions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">2. Compte & accès</h2>
            <p>
              L'accès à certaines fonctionnalités nécessite la création d'un compte. Tu es responsable de la confidentialité de tes identifiants et des activités réalisées depuis ton compte. Les informations fournies doivent être exactes et tenues à jour.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">3. Usage acceptable</h2>
            <p>Tu t'engages à utiliser la plateforme de manière loyale. Sont notamment interdits :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>le partage de tes accès ou la revente de contenus de formation ;</li>
              <li>toute tentative de contournement des protections ou de la sécurité ;</li>
              <li>l'utilisation du service à des fins illégales, trompeuses ou nuisibles.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">4. Propriété intellectuelle</h2>
            <p>
              Les contenus (formations, articles, podcasts, vidéos, marques, logos) sont la propriété de Max-Morrys ou de ses partenaires et sont protégés. Ton accès te confère un droit d'usage personnel et non exclusif, sans droit de reproduction ou de diffusion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">5. Assistant IA Rysmo</h2>
            <p>
              Rysmo est un assistant pédagogique propulsé par une intelligence artificielle (Google Gemini). Tu en prends connaissance et acceptes les points suivants :
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                Les réponses de Rysmo sont <strong>fournies à titre indicatif</strong> et peuvent comporter des erreurs ou des imprécisions. Elles ne constituent pas un conseil professionnel garanti ; vérifie les informations importantes.
              </li>
              <li>
                Pour personnaliser son accompagnement, Rysmo <strong>mémorise tes échanges</strong> et tient compte de ton <strong>activité de consultation des contenus</strong> (articles lus, temps passé, progression sur les audios/vidéos) afin de cerner tes objectifs, tes centres d'intérêt et ta progression. Cette mémoire est <strong>activée par défaut</strong>.
              </li>
              <li>
                Tu peux à tout moment <strong>désactiver</strong> cette mémoire et <strong>effacer</strong> les données associées depuis ton espace : <em>Espace → Rysmo → Mémoire</em>.
              </li>
              <li>
                Le détail des données traitées, de leur finalité, de leur durée de conservation et de tes droits figure dans notre{' '}
                <Link to="/legal/confidentialite" className="text-brand-600 dark:text-brand-400 underline underline-offset-2">Politique de confidentialité</Link>.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">6. Responsabilité</h2>
            <p>
              Max-Morrys met tout en œuvre pour assurer la disponibilité et la qualité du service, sans garantie d'absence totale d'interruption ou d'erreur. La responsabilité de Max-Morrys ne saurait être engagée pour les décisions prises sur la seule base des réponses de l'assistant IA.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">7. Modification des CGU</h2>
            <p>
              Ces conditions peuvent évoluer. En cas de modification substantielle, tu en seras informé. La poursuite de l'utilisation du service vaut acceptation des conditions mises à jour.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">8. Droit applicable</h2>
            <p>
              Les présentes CGU sont régies par le droit sénégalais, dans le respect du RGPD pour les utilisateurs de l'Union Européenne. Tout litige relève des juridictions compétentes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Contact</h2>
            <p>
              Pour toute question relative à ces conditions : <strong>contact@maxmorrys.me</strong>
            </p>
          </section>

          <p className="text-sm text-neutral-400 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            Dernière mise à jour : Mai 2026
          </p>
        </div>
      </div>
    </div>
  );
}
