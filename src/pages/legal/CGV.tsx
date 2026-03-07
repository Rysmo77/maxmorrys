import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function CGV() {
  return (
    <div className="pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-brand-600 dark:hover:text-brand-400 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour a l'accueil
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-8">Conditions Generales de Vente</h1>

        <div className="space-y-8 text-neutral-600 dark:text-neutral-400 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Article 1 - Objet</h2>
            <p>Les presentes Conditions Generales de Vente (CGV) regissent les ventes de formations en ligne et de services proposes par Max-Morrys via le site maxmorrys.com. Conformement a la loi senegalaise n 2008-08 sur les transactions electroniques, toute commande implique l'acceptation pleine et entiere des presentes CGV.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Article 2 - Produits et services</h2>
            <p>Max-Morrys propose :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Des formations en ligne (videos, textes, quiz, ressources telechargeables)</li>
              <li>Des sessions de coaching et consulting</li>
              <li>Des contenus gratuits (articles, podcasts, videos)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Article 3 - Prix</h2>
            <p>Les prix sont indiques en Francs CFA (XOF) et sont susceptibles de modifications. Le prix applicable est celui affiche au moment de la commande. Des promotions et coupons de reduction peuvent etre proposes ponctuellement.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Article 4 - Commande et paiement</h2>
            <p>La commande est validee apres paiement complet. Les moyens de paiement acceptes sont : Wave, Orange Money, carte bancaire et virement. Un email de confirmation est envoye apres validation du paiement.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Article 5 - Acces aux formations</h2>
            <p>L'acces aux formations est accorde immediatement apres confirmation du paiement. L'acces est personnel, non-cessible et non-transferable. L'acces est valable a vie a compter de la date d'achat, incluant toutes les mises a jour futures de la formation.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Article 6 - Droit de retractation et remboursement</h2>
            <p>Vous disposez d'un delai de 14 jours a compter de la date d'achat pour demander un remboursement, sans avoir a justifier de motifs. Pour exercer ce droit, envoyez un email a contact@maxmorrys.com. Le remboursement sera effectue dans les 14 jours suivant la reception de la demande, via le meme moyen de paiement utilise lors de l'achat.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Article 7 - Propriete intellectuelle</h2>
            <p>Les contenus des formations sont proteges par le droit d'auteur. L'achat d'une formation confere un droit d'utilisation personnel et non-commercial. Toute reproduction, diffusion ou partage des contenus est strictement interdit.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Article 8 - Responsabilite</h2>
            <p>Max-Morrys s'engage a fournir des formations de qualite. Cependant, les resultats obtenus dependent de l'engagement et de l'application de chaque apprenant. Max-Morrys ne garantit pas de resultats specifiques.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Article 9 - Droit applicable</h2>
            <p>Les presentes CGV sont soumises au droit senegalais. Tout litige sera soumis aux juridictions competentes de Dakar.</p>
          </section>

          <p className="text-sm text-neutral-400 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            Derniere mise a jour : Fevrier 2026
          </p>
        </div>
      </div>
    </div>
  );
}
