import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, grantPixelConsent, revokePixelConsent } from '../../lib/meta-pixel';
import { hasFullConsent } from '../shared/CookieBanner';

export default function MetaPixelTracker() {
  const location = useLocation();

  useEffect(() => {
    if (hasFullConsent()) {
      grantPixelConsent();
    } else {
      revokePixelConsent();
    }
  }, []);

  useEffect(() => {
    trackPageView();
  }, [location.pathname]);

  return null;
}
