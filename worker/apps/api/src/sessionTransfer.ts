/**
 * LE TRANSFERT DE SESSION ENTRE LES TROIS HÔTES — maxmorrys.me, edu., club.
 *
 * Firebase Auth range la session par origine : sans ce relais, passer du hub à l'Edu
 * obligerait à se reconnecter. Deux routes, en JSON simple (pas le protocole onCall) :
 *
 *   POST /session/emettre   Authorization: Bearer <ID token>   { cible: "https://edu.maxmorrys.me" }
 *        → { code }        code aléatoire de 32 octets, usage unique, 60 s
 *
 *   POST /session/echanger  { code }   (depuis l'origine `cible`)
 *        → { token }       custom token Firebase signé RS256 par le compte de service
 *
 * Ce qui tient la sécurité :
 *   · l'émission exige un ID token VÉRIFIÉ — personne n'obtient un code pour un autre ;
 *   · l'origine de chaque appel doit figurer dans `ALLOWED_ORIGINS`, et l'échange doit venir
 *     de l'origine désignée à l'émission : un code détourné ne s'échange pas ailleurs ;
 *   · le code n'est stocké que haché (SHA-256) : la liste du namespace ne livre rien
 *     d'utilisable ; il est supprimé AVANT la signature, et refusé passé 60 s ;
 *   · côté navigateur il voyage dans le fragment (`#h=`), jamais dans une requête ni un
 *     `Referer`.
 *
 * ⚠️ LIMITE ASSUMÉE : KV n'a pas de « lire-et-supprimer » atomique. Deux échanges strictement
 * simultanés du même code, dans deux PoP, pourraient tous deux le lire avant sa suppression.
 * Ils viendraient de la même origine autorisée, dans la même minute, pour le même compte —
 * un Durable Object fermerait ce trou, au prix d'une brique de plus.
 */
import { bearerFrom, type IdTokenVerifier } from '@mm/firebase-auth-rest';
import { bytesToBase64Url, parseServiceAccount, signFirebaseCustomToken } from '@mm/gcp-auth';
import { corsHeaders, parseOrigins } from '@mm/shared';

import { getVerifier } from './context';
import type { Env } from './env';

/** Durée de vie d'un code, en secondes — aussi le minimum que KV accepte en `expirationTtl`. */
export const TTL_CODE_SECONDES = 60;

const CODE_RE = /^[A-Za-z0-9_-]{43}$/;

export interface DependancesTransfert {
  verifier: IdTokenVerifier;
  /** Horloge, en secondes epoch. */
  maintenant: () => number;
  /** Signe le custom token d'un uid. */
  signer: (uid: string) => Promise<string>;
}

interface Enregistrement {
  uid: string;
  cible: string;
  exp: number;
}

function dependancesParDefaut(env: Env): DependancesTransfert {
  return {
    verifier: getVerifier(env),
    maintenant: () => Math.floor(Date.now() / 1000),
    signer: (uid) => signFirebaseCustomToken(parseServiceAccount(env.GCP_SA_JSON), uid),
  };
}

async function cle(code: string): Promise<string> {
  const empreinte = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code));
  return `transfert:${bytesToBase64Url(new Uint8Array(empreinte))}`;
}

async function lireCorps(request: Request): Promise<Record<string, unknown>> {
  try {
    const corps = (await request.json()) as unknown;
    return corps && typeof corps === 'object' ? (corps as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** Les deux chemins servis par ce module. */
export function estRouteTransfert(nom: string): boolean {
  return nom === 'session/emettre' || nom === 'session/echanger';
}

export async function handleSessionTransfer(
  request: Request,
  env: Env,
  deps: DependancesTransfert = dependancesParDefaut(env),
): Promise<Response> {
  const autorisees = parseOrigins(env.ALLOWED_ORIGINS);
  const origine = request.headers.get('Origin');
  const cors = corsHeaders(origine, { allowedOrigins: autorisees });
  const repondre = (corps: unknown, statut = 200) =>
    new Response(JSON.stringify(corps), {
      status: statut,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cors },
    });

  if (!origine || !autorisees.includes(origine)) return repondre({ erreur: 'origine-refusee' }, 403);
  if (request.method !== 'POST') return repondre({ erreur: 'methode' }, 405);

  const kv = env.TRANSFERTS_SESSION;
  if (!kv) return repondre({ erreur: 'indisponible' }, 503);

  const nom = new URL(request.url).pathname.replace(/^\/+/, '');
  const corps = await lireCorps(request);
  const maintenant = deps.maintenant();

  if (nom === 'session/emettre') {
    const appelant = await deps.verifier(bearerFrom(request));
    if (!appelant) return repondre({ erreur: 'non-authentifie' }, 401);

    const cible = typeof corps.cible === 'string' ? corps.cible : '';
    if (!autorisees.includes(cible)) return repondre({ erreur: 'cible-refusee' }, 400);

    const code = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
    const enregistrement: Enregistrement = { uid: appelant.uid, cible, exp: maintenant + TTL_CODE_SECONDES };
    await kv.put(await cle(code), JSON.stringify(enregistrement), { expirationTtl: TTL_CODE_SECONDES });
    return repondre({ code, expireDans: TTL_CODE_SECONDES });
  }

  // session/echanger
  const code = typeof corps.code === 'string' ? corps.code : '';
  if (!CODE_RE.test(code)) return repondre({ erreur: 'code-invalide' }, 400);

  const k = await cle(code);
  const brut = await kv.get(k);
  if (!brut) return repondre({ erreur: 'code-invalide' }, 410);
  // Supprimé AVANT tout le reste : un code lu est un code consommé, même si la suite échoue.
  await kv.delete(k);

  let enregistrement: Enregistrement;
  try {
    enregistrement = JSON.parse(brut) as Enregistrement;
  } catch {
    return repondre({ erreur: 'code-invalide' }, 410);
  }
  if (!(enregistrement.exp > maintenant)) return repondre({ erreur: 'code-expire' }, 410);
  if (enregistrement.cible !== origine) return repondre({ erreur: 'origine-refusee' }, 403);

  return repondre({ token: await deps.signer(enregistrement.uid) });
}
