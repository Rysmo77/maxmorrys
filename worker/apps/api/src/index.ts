/**
 * Worker `maxmorrys-api` — réimplémentation du protocole `onCall` sur
 * `api.maxmorrys.me`.
 *
 * Le frontend bascule d'une seule ligne :
 *
 *   getFunctions(app, import.meta.env.VITE_FUNCTIONS_ORIGIN || 'us-central1')
 *
 * Les 33 sites `httpsCallable` ne changent pas : le SDK construit
 * `${customDomain}/${nom}` dès que le second argument est une URL.
 *
 * Chaque nom est ensuite servi soit localement, soit relayé vers Cloud
 * Functions selon la variable `MIGRATED`. Trois interrupteurs, du plus fin au
 * plus large :
 *   1. retirer un nom de `MIGRATED`   → une callable revient sur GCP (~15 s)
 *   2. VITE_FUNCTIONS_ORIGIN au build → les 33 reviennent sur GCP
 *   3. supprimer le domaine custom    → plus rien ne passe par Cloudflare
 */
import { bearerFrom } from '@mm/firebase-auth-rest';
import {
  callableError,
  callableResult,
  corsHeaders,
  HttpsError,
  parseOrigins,
  preflightResponse,
  readCallableBody,
} from '@mm/shared';

import { getFirestore, getVerifier, type CallContext } from './context';
import type { Env } from './env';
import { handleExportDownload } from './exportDownload';
import { handleUnsubscribe } from './unsubscribeRoute';
import { proxyToFunctions, proxyWebhook } from './proxy';
import { HANDLERS } from './registry';
import { runImportSpotify, runSyncMediaStats } from './lib/media-sync';
import { sendRenewalNotices } from './lib/renewal';
import { sendRysmoRenewalNotices } from './lib/rysmo-renewal';
import { rebuildLeaderboard } from './lib/leaderboard';
import { sendQuoteExpiryNotices } from './lib/quote-expiry';
import { sendReengagementNotices } from './lib/reengagement';
import { synchroniserAudience } from './lib/listmonk';
import { handleBictorysWebhook } from './webhook/bictorys';

function migratedNames(env: Env): Set<string> {
  return new Set(
    env.MIGRATED.split(',')
      .map((name) => name.trim())
      .filter(Boolean),
  );
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const policy = { allowedOrigins: parseOrigins(env.ALLOWED_ORIGINS) };
    const origin = request.headers.get('Origin');
    const cors = corsHeaders(origin, policy);

    if (request.method === 'OPTIONS') return preflightResponse(origin, policy);

    const url = new URL(request.url);
    const name = url.pathname.replace(/^\/+/, '');

    // Le webhook est examiné avant le contrôle de méthode : c'est lui qui répond
    // 405 sur une méthode inattendue, comme le fait la Cloud Function.
    // Bictorys poste du JSON brut, sans enveloppe `{data}`. Ce chemin doit
    // court-circuiter la validation onCall **dans les deux cas** : servi
    // localement, ou relayé. Le faire passer par `readCallableBody` le
    // rejetterait en 400 avant même d'atteindre Cloud Functions.
    // Téléchargement d'un export RGPD : une requête GET signée, pas une callable.
    if (name === 'exportDownload') return handleExportDownload(request, env);

    /*
     * Le désabonnement : une requête GET signée, publique, sans compte et sans JavaScript.
     * Placé ici, avant le contrôle de méthode POST des callables — c'est un lien qu'on
     * clique depuis un client de messagerie, pas une fonction qu'on appelle.
     */
    if (name === 'desabonnement') return handleUnsubscribe(request, env);

    if (name === 'bictorysWebhook') {
      if (migratedNames(env).has(name)) return handleBictorysWebhook(request, env);
      return proxyWebhook(name, request, env);
    }

    if (request.method !== 'POST' || !name || name.includes('/')) {
      return callableError(new HttpsError('not-found', 'Fonction inconnue.'), cors);
    }

    let raw = '';
    let data: unknown;
    try {
      ({ data, raw } = await readCallableBody(request));
    } catch (error: unknown) {
      return callableError(error, cors);
    }

    // Non migrée : relais vers Cloud Functions, sans toucher au contenu.
    const handler = migratedNames(env).has(name) ? HANDLERS[name] : undefined;
    if (!handler) {
      try {
        return await proxyToFunctions(name, raw, request, env, cors);
      } catch (error: unknown) {
        console.error(`Relais de ${name} vers Cloud Functions impossible :`, error);
        return callableError(
          new HttpsError('unavailable', 'Service temporairement indisponible.'),
          cors,
        );
      }
    }

    try {
      const auth = await getVerifier(env)(bearerFrom(request));
      const context: CallContext = { env, ctx, db: getFirestore(env), auth, raw, request };
      return callableResult(await handler(data, context), cors);
    } catch (error: unknown) {
      return callableError(error, cors);
    }
  },

  /**
   * LE RAPPEL D'ÉCHÉANCE DU CLUB — une fois par jour, à 08:00 UTC.
   *
   * C'est le premier `scheduled` du Worker. Il vit ici plutôt qu'en Cloud Function pour une
   * raison simple : le canal d'envoi est le binding `EMAIL`, et un binding n'existe que dans
   * le runtime Workers.
   *
   * Le cron est quotidien et la fenêtre est d'un jour calendaire exactement (voir
   * `estAEcheance`). Une exécution manquée ne se rattrape donc pas le lendemain : « ton accès
   * se termine dans 15 jours » écrit le quatorzième jour serait faux. Perdre un rappel est
   * préférable à en envoyer un qui ment sur la date.
   */
  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    /*
     * TROIS CRONS, UN SEUL POINT D'ENTRÉE. Workers n'appelle qu'un `scheduled` : c'est
     * `event.cron` qui dit lequel des trois rendez-vous a sonné. Sans ce filtre, les trois
     * travaux tourneraient trois fois par jour chacun — et l'import Spotify réécrirait des
     * brouillons à 03:00 comme à 08:00.
     *
     * Chaque branche est isolée dans son `try` : une panne de l'API YouTube ne doit pas
     * emporter les rappels d'échéance, qui n'ont rien à voir avec elle.
     */
    const travaux: Record<string, () => Promise<void>> = {
      '0 3 * * *': async () => {
        const bilan = await runSyncMediaStats(getFirestore(env), env);
        console.log(
          `Statistiques média : ${bilan.videosUpdated}/${bilan.videosProcessed} vidéo(s), ` +
            `${bilan.podcastsUpdated}/${bilan.podcastsProcessed} podcast(s)` +
            (bilan.errors.length ? ` — ${bilan.errors.length} erreur(s) : ${bilan.errors.join(' | ')}` : ''),
        );
      },
      '0 4 * * *': async () => {
        const bilan = await runImportSpotify(getFirestore(env), env);
        console.log(
          `Import Spotify : ${bilan.created} créé(s), ${bilan.skipped} déjà présent(s), ` +
            `sur ${bilan.fetched} épisode(s)` +
            (bilan.errors.length ? ` — ${bilan.errors.length} erreur(s) : ${bilan.errors.join(' | ')}` : ''),
        );
      },
      '0 8 * * *': async () => {
        const db = getFirestore(env);

        /*
          CINQ TRAVAUX, CINQ `try`. Ils n'ont rien à voir entre eux : une requête refusée
          sur la gamification ne doit pas empêcher un rappel d'échéance de partir. Le premier
          qui lèverait emporterait tous les suivants s'ils partageaient un seul bloc.
        */
        const etapes: Array<[string, () => Promise<string>]> = [
          ['Rappels d’échéance du Club', async () => {
            const b = await sendRenewalNotices(db, env);
            return `${b.envoyes} envoyé(s), ${b.echecs} échec(s), sur ${b.examines} abonnement(s) actif(s)`;
          }],
          /*
            LE MENSUEL A SA PROPRE PASSE, ET SA PROPRE FENÊTRE. Rysmo+ n'était prévenu de
            rien : le balayage ne lisait que `club_subscriptions`. Un abonnement mensuel sans
            prélèvement et sans rappel meurt au trentième jour, en silence. Voir
            `lib/rysmo-renewal.ts` pour le préavis de cinq jours et sa raison.
          */
          ['Rappels d’échéance Rysmo+', async () => {
            const b = await sendRysmoRenewalNotices(db, env);
            return `${b.envoyes} envoyé(s), ${b.echecs} échec(s), sur ${b.examines} abonnement(s) actif(s)`;
          }],
          ['Relances de devis', async () => {
            const b = await sendQuoteExpiryNotices(db, env);
            return `${b.envoyes} envoyé(s), ${b.echecs} échec(s), ${b.sansAdresse} sans adresse, sur ${b.examines} devis`;
          }],
          ['Relances d’engagement', async () => {
            const b = await sendReengagementNotices(db);
            return `${b.series} série(s), ${b.reprises} reprise(s) de cours, sur ${b.examines} inscription(s)`;
          }],
          ['Classement du Club', async () => `${await rebuildLeaderboard(db)} entrée(s) reconstruite(s)`],
          /*
            LA SYNCHRONISATION MARKETING PASSE EN DERNIER, ET CE N'EST PAS UN DÉTAIL.

            Les quatre travaux au-dessus portent des promesses : un rappel d'échéance annoncé
            par les CGV, une relance de devis, un classement affiché. Celui-ci pousse une
            audience vers un service TIERS, sur le réseau, et c'est donc le plus susceptible
            de traîner ou d'échouer. Placé avant, une instance Listmonk injoignable retarderait
            des courriers contractuels ; placé ici, il ne retarde que lui-même.
          */
          ['Synchronisation Listmonk', async () => {
            const b = await synchroniserAudience(db, env);
            const motifs = b.erreurs.length ? ` — ${b.erreurs.join(' | ')}` : '';
            return `${b.pousses} poussé(s), ${b.bloques} bloqué(s), ${b.echecs} échec(s), sur ${b.candidats} candidat(s)${motifs}`;
          }],
        ];

        for (const [nom, etape] of etapes) {
          try {
            console.log(`${nom} : ${await etape()}.`);
          } catch (error: unknown) {
            console.error(`${nom} : interrompu —`, error);
          }
        }
      },
    };

    const travail = travaux[event.cron];
    if (!travail) {
      // Un cron ajouté à la configuration sans branche ici ne ferait RIEN, en silence.
      console.error(`Cron sans travail associé : ${event.cron}`);
      return;
    }

    ctx.waitUntil(
      (async () => {
        try {
          await travail();
        } catch (error: unknown) {
          console.error(`Cron ${event.cron} : exécution interrompue —`, error);
        }
      })(),
    );
  },
} satisfies ExportedHandler<Env>;
