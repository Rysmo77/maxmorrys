import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, Linkedin, Youtube, ArrowUpRight } from 'lucide-react';
import NewsletterForm from '../shared/NewsletterForm';

const footerLinks = {
  plateforme: [
    { label: 'Je te forme', path: '/formations' },
    { label: "Je t'informe", path: '/blog' },
    { label: 'Le Podcast du Marketing', path: '/podcasts' },
    { label: 'Le Marketing en Pratique', path: '/videos' },
    { label: 'FAQ', path: '/faq' },
  ],
  apropos: [
    { label: 'Je suis Max-Morrys', path: '/a-propos' },
    { label: 'Contact', path: '/contact' },
    { label: 'Prendre rendez-vous', path: '/contact' },
  ],
  legal: [
    { label: 'Mentions légales', path: '/legal/mentions-legales' },
    { label: 'Confidentialité', path: '/legal/confidentialite' },
    { label: 'CGU', path: '/legal/cgu' },
    { label: 'CGV', path: '/legal/cgv' },
    { label: 'Cookies', path: '/legal/cookies' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-neutral-900 dark:bg-neutral-950 text-neutral-400">

      {/* Newsletter — style "Become an Insider" MF */}
      <div className="border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-400 mb-4">
              NEWSLETTER
            </p>
            <h2 className="text-3xl lg:text-4xl font-black text-white mb-4 tracking-tight">
              Deviens un Insider maintenant
            </h2>
            <p className="text-neutral-400 mb-8 leading-relaxed">
              Écoute, chaque semaine je partage mes meilleures découvertes, mes stratégies qui marchent et mes petits secrets. Et le meilleur ? C'est totalement gratuit !
            </p>
            <div className="max-w-md mx-auto">
              <NewsletterForm source="footer" />
            </div>
          </div>
        </div>
      </div>

      {/* Colonnes de liens */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Brand */}
          <div>
            <Link to="/" className="block mb-5">
              <span className="font-black text-xl tracking-tight text-white">MAX-MORRYS</span>
            </Link>
            <p className="text-sm leading-relaxed mb-6">
              Formateur, consultant et créateur de contenu digital. J'aide les entrepreneurs à maîtriser le marketing digital et accélérer leur croissance.
            </p>
            <div className="flex gap-3">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Plateforme */}
          <div>
            <h3 className="text-white font-bold text-xs uppercase tracking-[0.25em] mb-5">Plateforme</h3>
            <ul className="space-y-3">
              {footerLinks.plateforme.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-sm hover:text-white transition-colors inline-flex items-center gap-1 group">
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* À propos */}
          <div>
            <h3 className="text-white font-bold text-xs uppercase tracking-[0.25em] mb-5">À propos</h3>
            <ul className="space-y-3">
              {footerLinks.apropos.map((link) => (
                <li key={link.label}>
                  <Link to={link.path} className="text-sm hover:text-white transition-colors inline-flex items-center gap-1 group">
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
            <h3 className="text-white font-bold text-xs uppercase tracking-[0.25em] mb-5 mt-8">Légal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-sm hover:text-white transition-colors inline-flex items-center gap-1 group">
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold text-xs uppercase tracking-[0.25em] mb-5">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm">
                <Mail className="w-4 h-4 mt-0.5 shrink-0" />
                <span>hello@maxmorrys.me</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Phone className="w-4 h-4 mt-0.5 shrink-0" />
                <span>+221 77 604 19 85</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Dakar, Sénégal</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="py-6 border-t border-neutral-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs">&copy; {new Date().getFullYear()} Max-Morrys. Tous droits réservés.</p>
          <p className="text-xs">
            Max-Morrys est une marque opérée par{' '}
            <a
              href="https://myonoma.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-300 hover:text-white font-medium underline-offset-2 hover:underline transition-colors"
            >
              My Onoma SARL
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
