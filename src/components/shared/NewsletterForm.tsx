import { useState } from 'react';
import { Mail, ArrowRight } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useToast } from '../ui/Toast';

interface NewsletterFormProps {
  variant?: 'inline' | 'card';
  source?: string;
}

export default function NewsletterForm({ variant = 'inline', source = 'footer' }: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'newsletter'), {
        email: email.trim(),
        subscribedAt: new Date().toISOString(),
        source,
      });
      addToast('success', 'Inscription reussie ! Bienvenue dans la communaute.');
      setEmail('');
    } catch {
      addToast('error', 'Une erreur est survenue. Veuillez réessayer.');
    }
    setLoading(false);
  };

  if (variant === 'card') {
    return (
      <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold">Reste informé</h3>
        </div>
        <p className="text-brand-100 text-sm mb-6 leading-relaxed">
          Reçois chaque semaine les meilleurs conseils en marketing digital, SEO et IA directement dans ta boîte email.
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <label htmlFor="newsletter-card-email" className="sr-only">Adresse email</label>
          <input
            id="newsletter-card-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
            required
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-brand-200 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          <button
            type="submit"
            disabled={loading}
            aria-label={loading ? 'Inscription en cours...' : "S'inscrire à la newsletter"}
            className="px-4 py-2.5 bg-white text-brand-700 rounded-xl font-semibold text-sm hover:bg-brand-50 transition-colors disabled:opacity-50"
          >
            {loading ? 'Chargement…' : "S'inscrire"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" aria-hidden="true" />
        <label htmlFor="newsletter-inline-email" className="sr-only">Adresse email</label>
        <input
          id="newsletter-inline-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@email.com"
          required
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        aria-label={loading ? 'Inscription en cours…' : "S'inscrire à la newsletter"}
        className="px-4 py-2.5 bg-brand-600 text-white rounded-xl font-semibold text-sm hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center gap-1"
      >
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </button>
    </form>
  );
}
