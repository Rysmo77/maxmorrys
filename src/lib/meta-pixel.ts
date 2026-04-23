import { hasMarketingConsent } from '../components/shared/CookieBanner';

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: (...args: unknown[]) => void;
  }
}

const PIXEL_ID = '925361066071417';

// ── Consent management ──────────────────────────────────────────────────────

export function grantPixelConsent(): void {
  if (typeof window.fbq === 'function') {
    window.fbq('consent', 'grant');
  }
}

export function revokePixelConsent(): void {
  if (typeof window.fbq === 'function') {
    window.fbq('consent', 'revoke');
  }
}

// ── Core tracking (all events route through here) ───────────────────────────

function track(
  eventName: string,
  params?: Record<string, unknown>,
  options?: { eventID?: string },
): void {
  if (typeof window.fbq !== 'function' || !hasMarketingConsent()) return;

  if (options?.eventID) {
    window.fbq('track', eventName, params, { eventID: options.eventID });
  } else {
    window.fbq('track', eventName, params);
  }
}

function trackCustom(
  eventName: string,
  params?: Record<string, unknown>,
): void {
  if (typeof window.fbq !== 'function' || !hasMarketingConsent()) return;
  window.fbq('trackCustom', eventName, params);
}

// ── Event ID generation (for client/server deduplication) ───────────────────

export function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ── Advanced Matching ───────────────────────────────────────────────────────

async function sha256(value: string): Promise<string> {
  const buffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value.trim().toLowerCase()),
  );
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function setUserData(email: string): Promise<void> {
  if (typeof window.fbq !== 'function') return;
  const em = await sha256(email);
  window.fbq('init', PIXEL_ID, { em });
}

// ── Standard events ─────────────────────────────────────────────────────────

export function trackPageView(): void {
  track('PageView');
}

export function trackViewContent(params: {
  content_type: string;
  content_ids: string[];
  content_name: string;
  value?: number;
  currency?: string;
}): void {
  track('ViewContent', { ...params, currency: params.currency ?? 'XOF' });
}

export function trackSearch(searchString: string): void {
  track('Search', { search_string: searchString });
}

export function trackAddToCart(params: {
  content_ids: string[];
  content_name: string;
  value: number;
  currency?: string;
  content_type: string;
}): void {
  track('AddToCart', { ...params, currency: params.currency ?? 'XOF' });
}

export function trackInitiateCheckout(params: {
  content_ids: string[];
  content_name: string;
  value: number;
  currency?: string;
  num_items: number;
}): void {
  track('InitiateCheckout', { ...params, currency: params.currency ?? 'XOF' });
}

export function trackPurchase(
  params: {
    content_ids: string[];
    content_name: string;
    value: number;
    currency?: string;
    content_type: string;
  },
  eventId?: string,
): void {
  track('Purchase', { ...params, currency: params.currency ?? 'XOF' }, { eventID: eventId });
}

export function trackLead(contentName: string): void {
  track('Lead', { content_name: contentName });
}

export function trackCompleteRegistration(
  params: { content_name: string; status: string },
  eventId?: string,
): void {
  track('CompleteRegistration', params, { eventID: eventId });
}

export function trackSubscribe(contentName: string): void {
  track('Subscribe', { content_name: contentName });
}

export function trackContact(): void {
  track('Contact');
}

// ── Custom events ───────────────────────────────────────────────────────────

export function trackLessonCompleted(formationId: string, lessonId: string): void {
  trackCustom('LessonCompleted', { formation_id: formationId, lesson_id: lessonId });
}

export function trackCertificateEarned(formationTitle: string, certificateCode: string): void {
  trackCustom('CertificateEarned', {
    formation_title: formationTitle,
    certificate_code: certificateCode,
  });
}

export function trackChatbotInteraction(): void {
  trackCustom('ChatbotInteraction');
}

export function trackCourseProgress(formationId: string, progressPercent: number): void {
  trackCustom('CourseProgress', {
    formation_id: formationId,
    progress_percent: progressPercent,
  });
}

export function trackClubJoinIntent(): void {
  trackCustom('ClubJoinIntent');
}

export function trackShareContent(
  contentType: string,
  contentId: string,
  platform: string,
): void {
  trackCustom('ShareContent', {
    content_type: contentType,
    content_id: contentId,
    platform,
  });
}
