import { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';
import Button from '../ui/Button';

/** Returns the stored consent level, or null if not yet given. */
export function getCookieConsent(): { level: 'all' | 'essential'; date: string } | null {
  try {
    const raw = localStorage.getItem('mm-cookie-consent');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** True only when the user accepted all cookies (analytics/marketing allowed). */
export function hasFullConsent(): boolean {
  return getCookieConsent()?.level === 'all';
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('mm-cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = (level: 'all' | 'essential') => {
    localStorage.setItem('mm-cookie-consent', JSON.stringify({ level, date: new Date().toISOString() }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 animate-slide-up">
      <div className="max-w-3xl mx-auto bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-accent-100 dark:bg-accent-900/30 rounded-xl flex-shrink-0">
            <Cookie className="w-5 h-5 text-accent-600 dark:text-accent-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">Gestion des cookies</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Nous utilisons des cookies pour améliorer ton expérience. Les cookies essentiels sont nécessaires au fonctionnement du site. Les cookies analytiques nous aident à comprendre comment tu utilises la plateforme.
                </p>
              </div>
              <button onClick={() => setVisible(false)} className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            {showDetails && (
              <div className="mt-4 space-y-3 text-sm">
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked disabled className="rounded accent-brand-600" />
                  <span className="text-neutral-700 dark:text-neutral-300"><strong>Essentiels</strong> - Necessaires au fonctionnement</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="rounded accent-brand-600" />
                  <span className="text-neutral-700 dark:text-neutral-300"><strong>Analytiques</strong> - Comprendre l'utilisation du site</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="rounded accent-brand-600" />
                  <span className="text-neutral-700 dark:text-neutral-300"><strong>Marketing</strong> - Contenus personnalises</span>
                </label>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <Button size="sm" onClick={() => accept('all')}>Tout accepter</Button>
              <Button variant="outline" size="sm" onClick={() => accept('essential')}>Essentiels uniquement</Button>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 underline underline-offset-2"
              >
                {showDetails ? 'Masquer les details' : 'Personnaliser'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
