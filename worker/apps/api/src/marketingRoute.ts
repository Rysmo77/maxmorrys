import { constantTimeEqual, json } from '@mm/shared';

import { getFirestore } from './context';
import type { Env } from './env';
import { executerCampagne, validerDemande, type ErreurCampagne } from './lib/campagne';

/**
 * LA ROUTE DE CAMPAGNE — `POST https://api.maxmorrys.me/marketing/campagne`.
 *
 * Le transport est BREVO (campagnes pour le réel, envoi unitaire pour l'épreuve) — jamais le
 * binding Cloudflare, réservé au transactionnel. Voir `lib/campagne.ts` et `lib/brevo-send.ts`.
 *
 * Pour des machines, pas pour le navigateur : n8n (WF-09, la lettre) et les agents BMad
 * (`mm-agent-serge`). Ce n'est donc PAS une callable — pas de jeton Firebase, pas de CORS,
 * pas d'enveloppe `{data}` — mais un JSON simple, authentifié par un secret partagé dans
 * l'en-tête `X-Marketing-Key`.
 *
 * Le secret vit dans le Worker (`wrangler secret put MARKETING_API_KEY`) et dans le coffre
 * d'identifiants de n8n. Jamais dans le dépôt, jamais dans une URL. Absent ⇒ 503 : une route
 * d'envoi qui accepterait tout le monde parce qu'on a oublié de poser sa clé est exactement
 * le défaut qu'on ne voit qu'après coup.
 */

const STATUT: Record<ErreurCampagne, number> = {
  canalFerme: 403,
  nonConfigure: 503,
  adresseTestNonAutorisee: 400,
  testRequis: 409,
  plafondTests: 429,
  // Brevo a refusé ou n'a pas répondu : rien n'est parti, le même appel peut être rejoué.
  brevoIndisponible: 502,
};

const PAS_DE_CACHE = { 'cache-control': 'no-store' };

export async function handleMarketing(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ ok: false, erreur: 'methode' }, 405, { ...PAS_DE_CACHE, allow: 'POST' });

  if (!env.MARKETING_API_KEY) {
    console.error('Marketing : MARKETING_API_KEY absente — route fermée');
    return json({ ok: false, erreur: 'nonConfigure' }, 503, PAS_DE_CACHE);
  }
  const cle = request.headers.get('X-Marketing-Key') ?? '';
  if (!cle || !constantTimeEqual(cle, env.MARKETING_API_KEY)) {
    return json({ ok: false, erreur: 'nonAutorise' }, 401, PAS_DE_CACHE);
  }

  let corps: unknown;
  try {
    corps = await request.json();
  } catch {
    // Corps illisible : c'est une erreur de l'appelant, on la lui dit sans rien journaliser.
    return json({ ok: false, erreur: 'json', erreurs: ['corps JSON illisible'] }, 400, PAS_DE_CACHE);
  }

  const v = validerDemande(corps);
  if (!v.ok) return json({ ok: false, erreur: 'invalide', erreurs: v.erreurs }, 400, PAS_DE_CACHE);

  try {
    const bilan = await executerCampagne(getFirestore(env), env, v.demande);
    if (!bilan.ok) return json(bilan, STATUT[bilan.erreur], PAS_DE_CACHE);
    console.log('Campagne', bilan.campagne, bilan.mode, JSON.stringify(bilan));
    return json(bilan, 200, PAS_DE_CACHE);
  } catch (error: unknown) {
    console.error('Campagne', v.demande.id, ': interrompue —', error);
    return json({ ok: false, erreur: 'interne' }, 500, PAS_DE_CACHE);
  }
}
