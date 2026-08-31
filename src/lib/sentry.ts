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

/**
 * Renvoie l'IDENTIFIANT D'ÉVÉNEMENT Sentry, quand il y en a un.
 *
 * La maquette d'erreur du système affiche une « référence de l'incident » sous le message.
 * Ce n'est pas un ornement : c'est la seule chose qu'une personne bloquée peut recopier au
 * support, et la seule qui permette de retrouver SA trace parmi des milliers. Sentry produit
 * cet identifiant à chaque envoi — il était jeté ici.
 *
 * Sans DSN (développement, ou télémétrie coupée), il n'y a pas d'identifiant : la fonction
 * renvoie `undefined`, et l'appelant doit dire qu'il n'y en a pas plutôt qu'en inventer un.
 */
export function captureError(error: unknown, context?: Record<string, unknown>): string | undefined {
  if (DSN) {
    return Sentry.captureException(error, { extra: context });
  }
  console.error(error);
  return undefined;
}
