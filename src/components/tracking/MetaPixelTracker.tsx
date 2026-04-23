import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../../lib/tracking';
import { grantPixelConsent, revokePixelConsent } from '../../lib/meta-pixel';
import { hasMarketingConsent } from '../shared/CookieBanner';

/**
 * Tracks page views on every SPA route change.
 * Pushes page_view to dataLayer (consumed by GTM → GA4) AND calls Meta Pixel PageView.
 * Also re-syncs Meta Pixel consent on initial mount (in case banner hasn't loaded yet).
 */
export default function MetaPixelTracker() {
  const location = useLocation();

  useEffect(() => {
    if (hasMarketingConsent()) {
      grantPixelConsent();
    } else {
      revokePixelConsent();
    }
  }, []);

  useEffect(() => {
    trackPageView(location.pathname, document.title);
  }, [location.pathname]);

  return null;
}
