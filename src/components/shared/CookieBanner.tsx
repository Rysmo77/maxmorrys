import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { grantPixelConsent, revokePixelConsent } from '../../lib/meta-pixel';
import { Button, Icon } from '@ds';

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

/**
 * Émis sur `window` dès qu'un choix de consentement est enregistré.
 *
 * Le consentement vit dans `localStorage`, que rien n'observe : les composants qui en dépendent
 * ne se re-rendent pas tout seuls quand il change. `PopupManager` s'en sert pour s'armer dès que
 * le bandeau disparaît, au lieu d'attendre le prochain changement de route.
 */
export const COOKIE_CONSENT_EVENT = 'mm-cookie-consent-change';

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
  window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
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
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 stack:p-6 mm-drop">
      <div className="max-w-3xl mx-auto bg-surface-sheet rounded-2xl shadow-xl border border-[color:var(--line)] p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-[color-mix(in_srgb,var(--mm-orange)_4%,transparent)] rounded-xl flex-shrink-0">
            <Icon name="cookie" size={20} className="text-informe-txt" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-ink mb-1">{t('cookies.title')}</h3>
                <p className="text-sm text-ink-2 leading-relaxed">
                  {t('cookies.text')}
                </p>
              </div>
              {/*
                FERMER, C'EST REFUSER — ET ÇA S'ENREGISTRE.

                Ce bouton se contentait de `setVisible(false)` : rien n'était écrit, donc le
                bandeau revenait au chargement suivant, et surtout le refus n'existait nulle
                part. Un rejet qu'on ne consigne pas n'est pas un rejet : c'est une question
                reposée indéfiniment. Fermer vaut donc « essentiels seulement », comme le
                bouton explicite — jamais un consentement, qui ne peut être qu'un acte positif.
              */}
              <button onClick={acceptEssential} className="p-1 text-ink-2 hover:text-ink-2 dark:hover:text-ink-2" aria-label={t('cookies.close')}>
                <Icon name="close" size={16} />
              </button>
            </div>

            {showDetails && (
              <div className="mt-4 space-y-3 text-sm">
                <label className="flex items-center gap-3 opacity-70">
                  <input type="checkbox" checked disabled className="rounded accent-[color:var(--mm-bleu)]" />
                  <span className="text-ink-2"><strong>{t('cookies.essentialLabel')}</strong> — {t('cookies.essentialDesc')}</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                    className="rounded accent-[color:var(--mm-bleu)]"
                  />
                  <span className="text-ink-2"><strong>{t('cookies.analyticsLabel')}</strong> — {t('cookies.analyticsDesc')}</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                    className="rounded accent-[color:var(--mm-bleu)]"
                  />
                  <span className="text-ink-2"><strong>{t('cookies.marketingLabel')}</strong> — {t('cookies.marketingDesc')}</span>
                </label>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <Button size="sm" fullWidth={false} onClick={acceptAll}>{t('cookies.acceptAll')}</Button>
              <Button tone="quiet" size="sm" fullWidth={false} onClick={acceptEssential}>{t('cookies.essentialOnly')}</Button>
              {showDetails && (
                <Button tone="quiet" size="sm" fullWidth={false} onClick={saveCustom}>{t('cookies.saveChoices')}</Button>
              )}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-ink-2 hover:text-ink dark:hover:text-ink-2 underline underline-offset-2"
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
