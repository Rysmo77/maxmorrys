import * as Sentry from '@sentry/react';

// Compatible Sentry SaaS OU GlitchTip auto-hébergé : GlitchTip accepte le même SDK
// et le même format de DSN. Pour basculer, il suffit de pointer VITE_SENTRY_DSN vers
// l'instance GlitchTip — aucun changement de code ici.
const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

export function initSentry() {
  if (!DSN) return;

  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.DEV ? 'development' : 'production',
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.5,
    enabled: !import.meta.env.DEV,
  });
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (DSN) {
    Sentry.captureException(error, { extra: context });
  } else {
    console.error(error);
  }
}
