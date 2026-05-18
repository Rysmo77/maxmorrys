/**
 * Core Web Vitals monitoring — Max-Morrys
 *
 * Mesure les métriques de terrain (field data) LCP, INP, CLS, FCP, TTFB
 * et les pousse dans le dataLayer GTM → GA4 (event `web_vitals`).
 *
 * Permet de suivre les Core Web Vitals réels des utilisateurs dans GA4,
 * facteur de ranking officiel de Google (Page Experience).
 */

import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals';

declare global {
  interface Window {
    dataLayer: Array<Record<string, unknown>>;
  }
}

function sendToDataLayer(metric: Metric): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'web_vitals',
    web_vitals_metric: metric.name,            // LCP | INP | CLS | FCP | TTFB
    web_vitals_value: Math.round(
      metric.name === 'CLS' ? metric.value * 1000 : metric.value,
    ),
    web_vitals_rating: metric.rating,          // good | needs-improvement | poor
    web_vitals_delta: Math.round(
      metric.name === 'CLS' ? metric.delta * 1000 : metric.delta,
    ),
    web_vitals_id: metric.id,
    web_vitals_navigation_type: metric.navigationType,
  });
}

/** Initialise le suivi des Core Web Vitals. À appeler une fois au démarrage. */
export function initWebVitals(): void {
  onCLS(sendToDataLayer);
  onINP(sendToDataLayer);
  onLCP(sendToDataLayer);
  onFCP(sendToDataLayer);
  onTTFB(sendToDataLayer);
}
