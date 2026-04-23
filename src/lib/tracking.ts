/**
 * Librairie de tracking unifiée — Max-Morrys
 *
 * Architecture :
 * - GTM (GTM-PJ3R433M) = tag manager central
 * - GA4 (G-5EFPZ71YX0) piloté par GTM via dataLayer
 * - Meta Pixel (925361066071417) appelé directement via meta-pixel.ts
 *
 * Chaque fonction pousse dans window.dataLayer (pour GTM/GA4) et appelle
 * la fonction Meta Pixel équivalente. Le consentement est géré en amont :
 * - Google : Consent Mode v2 (gtag('consent','update',...)) dans CookieBanner
 * - Meta : fbq('consent','grant'|'revoke') dans CookieBanner
 */

import * as pixel from './meta-pixel';
import { hasAnalyticsConsent } from '../components/shared/CookieBanner';

declare global {
  interface Window {
    dataLayer: Array<Record<string, unknown>>;
  }
}

function pushDataLayer(event: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  // Clear previous ecommerce data to prevent merging
  if (params && 'ecommerce' in params) {
    window.dataLayer.push({ ecommerce: null });
  }
  window.dataLayer.push({ event, ...(params || {}) });
}

// ── Page views ──────────────────────────────────────────────────────────────

export function trackPageView(path: string, title?: string): void {
  pushDataLayer('page_view', {
    page_path: path,
    page_location: typeof window !== 'undefined' ? window.location.href : path,
    page_title: title,
  });
  // Meta Pixel PageView automatic on SPA route change
  pixel.trackPageView();
}

// ── Content viewing ─────────────────────────────────────────────────────────

export function trackViewItem(params: {
  id: string;
  name: string;
  category: string;
  content_type: 'article' | 'formation' | 'podcast' | 'video';
  price?: number;
  currency?: string;
}): void {
  pushDataLayer('view_item', {
    ecommerce: {
      currency: params.currency || 'XOF',
      value: params.price || 0,
      items: [{
        item_id: params.id,
        item_name: params.name,
        item_category: params.category,
        item_category2: params.content_type,
        price: params.price || 0,
        quantity: 1,
      }],
    },
  });
  pixel.trackViewContent({
    content_type: params.content_type,
    content_ids: [params.id],
    content_name: params.name,
    value: params.price,
    currency: params.currency || 'XOF',
  });
}

// ── Search ──────────────────────────────────────────────────────────────────

export function trackSearch(query: string): void {
  pushDataLayer('search', { search_term: query });
  pixel.trackSearch(query);
}

// ── Auth ────────────────────────────────────────────────────────────────────

export function trackSignUp(method: 'email' | 'google' = 'email'): void {
  pushDataLayer('sign_up', { method });
  pixel.trackCompleteRegistration({ content_name: 'Inscription', status: 'completed' });
}

export function trackLogin(method: 'email' | 'google' = 'email'): void {
  pushDataLayer('login', { method });
  // Meta Pixel doesn't have a standard login event
}

// ── Lead generation ─────────────────────────────────────────────────────────

export function trackGenerateLead(source: string, value?: number): void {
  pushDataLayer('generate_lead', {
    source,
    value: value || 0,
    currency: 'XOF',
  });
  pixel.trackLead(source);
}

export function trackSubscribeNewsletter(list = 'newsletter'): void {
  pushDataLayer('generate_lead', { source: list, value: 0, currency: 'XOF' });
  pixel.trackSubscribe(list);
}

export function trackContact(subject: string): void {
  pushDataLayer('generate_lead', { source: 'contact_form', subject, value: 0, currency: 'XOF' });
  pixel.trackContact();
}

// ── E-commerce ──────────────────────────────────────────────────────────────

interface EcommerceItem {
  id: string;
  name: string;
  category?: string;
  price: number;
  currency?: string;
}

export function trackAddToCart(item: EcommerceItem): void {
  pushDataLayer('add_to_cart', {
    ecommerce: {
      currency: item.currency || 'XOF',
      value: item.price,
      items: [{
        item_id: item.id,
        item_name: item.name,
        item_category: item.category,
        price: item.price,
        quantity: 1,
      }],
    },
  });
  pixel.trackAddToCart({
    content_ids: [item.id],
    content_name: item.name,
    value: item.price,
    currency: item.currency || 'XOF',
    content_type: 'formation',
  });
}

export function trackBeginCheckout(item: EcommerceItem): void {
  pushDataLayer('begin_checkout', {
    ecommerce: {
      currency: item.currency || 'XOF',
      value: item.price,
      items: [{
        item_id: item.id,
        item_name: item.name,
        item_category: item.category,
        price: item.price,
        quantity: 1,
      }],
    },
  });
  pixel.trackInitiateCheckout({
    content_ids: [item.id],
    content_name: item.name,
    value: item.price,
    currency: item.currency || 'XOF',
    num_items: 1,
  });
}

export function trackPurchase(params: {
  transactionId: string;
  item: EcommerceItem;
  coupon?: string;
}): void {
  pushDataLayer('purchase', {
    ecommerce: {
      transaction_id: params.transactionId,
      value: params.item.price,
      currency: params.item.currency || 'XOF',
      coupon: params.coupon,
      items: [{
        item_id: params.item.id,
        item_name: params.item.name,
        item_category: params.item.category,
        price: params.item.price,
        quantity: 1,
      }],
    },
  });
  pixel.trackPurchase(
    {
      content_ids: [params.item.id],
      content_name: params.item.name,
      value: params.item.price,
      currency: params.item.currency || 'XOF',
      content_type: 'formation',
    },
    params.transactionId,
  );
}

// ── Social / sharing ────────────────────────────────────────────────────────

export function trackShare(method: string, contentType: string, id: string): void {
  pushDataLayer('share', {
    method,
    content_type: contentType,
    item_id: id,
  });
  pixel.trackShareContent(contentType, id, method);
}

// ── Media ───────────────────────────────────────────────────────────────────

export function trackVideoPlay(videoId: string, videoTitle: string): void {
  pushDataLayer('video_play', { video_id: videoId, video_title: videoTitle });
}

export function trackPodcastPlay(episodeId: string, episodeTitle: string): void {
  pushDataLayer('podcast_play', { episode_id: episodeId, episode_title: episodeTitle });
}

export function trackFileDownload(fileId: string, fileName: string): void {
  pushDataLayer('file_download', { file_id: fileId, file_name: fileName });
}

// ── LMS / Cours ─────────────────────────────────────────────────────────────

export function trackLessonCompleted(formationId: string, lessonId: string): void {
  pushDataLayer('lesson_completed', {
    formation_id: formationId,
    lesson_id: lessonId,
  });
  pixel.trackLessonCompleted(formationId, lessonId);
}

export function trackCourseProgress(formationId: string, progressPercent: number): void {
  pushDataLayer('course_progress', {
    formation_id: formationId,
    progress_percent: progressPercent,
  });
  pixel.trackCourseProgress(formationId, progressPercent);
}

export function trackCertificateEarned(formationTitle: string, certificateCode: string): void {
  pushDataLayer('certificate_earned', {
    formation_title: formationTitle,
    certificate_code: certificateCode,
  });
  pixel.trackCertificateEarned(formationTitle, certificateCode);
}

// ── Engagement ──────────────────────────────────────────────────────────────

export function trackChatbotInteraction(): void {
  pushDataLayer('chatbot_interaction', {});
  pixel.trackChatbotInteraction();
}

export function trackClubJoinIntent(source?: string): void {
  pushDataLayer('club_join_intent', { source: source || 'unknown' });
  pixel.trackClubJoinIntent();
}

// ── Generic event (fallback) ────────────────────────────────────────────────

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  pushDataLayer(name, params);
}

// Re-export for convenience
export { hasAnalyticsConsent };
