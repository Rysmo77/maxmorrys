import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Cookie, X } from 'lucide-react';
import Button from '../ui/Button';
import { grantPixelConsent, revokePixelConsent } from '../../lib/meta-pixel';

export interface CookieConsent {
  analytics: boolean;
  marketing: boolean;
  date: string;
  // Legacy 'level' field kept for backward compat reading only
  level?: 'all' | 'essential';
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** Returns the stored consent, or null if not yet given. */
export function getCookieConsent(): CookieConsent | null {
  try {
    const raw = localStorage.getItem('mm-cookie-consent');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    // Migrate legacy format { level: 'all' | 'essential' }
    if (parsed.level && typeof parsed.analytics === 'undefined') {
      const all = parsed.level === 'all';
      return { analytics: all, marketing: all, date: parsed.date };
    }
    return parsed;
  } catch {
    return null;
  }
}

/** True if the user accepted analytics cookies (GA4). */
export function hasAnalyticsConsent(): boolean {
  return getCookieConsent()?.analytics === true;
}

/** True if the user accepted marketing cookies (Meta Pixel, remarketing). */
export function hasMarketingConsent(): boolean {
  return getCookieConsent()?.marketing === true;
}

function pushConsentToGoogle(analytics: boolean, marketing: boolean): void {
  if (typeof window === 'undefined') return;
  const dataLayer = (window as unknown as { dataLayer?: Array<Record<string, unknown>> }).dataLayer;
  if (!dataLayer) return;
  dataLayer.push({
    event: 'consent_update',
    analytics_storage: analytics ? 'granted' : 'denied',
    ad_storage: marketing ? 'granted' : 'denied',
    ad_user_data: marketing ? 'granted' : 'denied',
    ad_personalization: marketing ? 'granted' : 'denied',
  });
  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      analytics_storage: analytics ? 'granted' : 'denied',
      ad_storage: marketing ? 'granted' : 'denied',
      ad_user_data: marketing ? 'granted' : 'denied',
      ad_personalization: marketing ? 'granted' : 'denied',
    });
  }
}

function saveAndApplyConsent(analytics: boolean, marketing: boolean): void {
  localStorage.setItem('mm-cookie-consent', JSON.stringify({
    analytics,
    marketing,
    date: new Date().toISOString(),
  } as CookieConsent));
  pushConsentToGoogle(analytics, marketing);
  if (marketing) {
    grantPixelConsent();
  } else {
    revokePixelConsent();
  }
}

export default function CookieBanner() {
  const { t } = useTranslation('shared');
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('mm-cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    saveAndApplyConsent(true, true);
    setVisible(false);
  };

  const acceptEssential = () => {
    saveAndApplyConsent(false, false);
    setVisible(false);
  };

  const saveCustom = () => {
    saveAndApplyConsent(analytics, marketing);
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
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">{t('cookies.title')}</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {t('cookies.text')}
                </p>
              </div>
              <button onClick={() => setVisible(false)} className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300" aria-label={t('cookies.close')}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {showDetails && (
              <div className="mt-4 space-y-3 text-sm">
                <label className="flex items-center gap-3 cursor-not-allowed opacity-70">
                  <input type="checkbox" checked disabled className="rounded accent-brand-600" />
                  <span className="text-neutral-700 dark:text-neutral-300"><strong>{t('cookies.essentialLabel')}</strong> — {t('cookies.essentialDesc')}</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                    className="rounded accent-brand-600"
                  />
                  <span className="text-neutral-700 dark:text-neutral-300"><strong>{t('cookies.analyticsLabel')}</strong> — {t('cookies.analyticsDesc')}</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                    className="rounded accent-brand-600"
                  />
                  <span className="text-neutral-700 dark:text-neutral-300"><strong>{t('cookies.marketingLabel')}</strong> — {t('cookies.marketingDesc')}</span>
                </label>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <Button size="sm" onClick={acceptAll}>{t('cookies.acceptAll')}</Button>
              <Button variant="outline" size="sm" onClick={acceptEssential}>{t('cookies.essentialOnly')}</Button>
              {showDetails && (
                <Button variant="outline" size="sm" onClick={saveCustom}>{t('cookies.saveChoices')}</Button>
              )}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 underline underline-offset-2"
              >
                {showDetails ? t('cookies.hideDetails') : t('cookies.customize')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
