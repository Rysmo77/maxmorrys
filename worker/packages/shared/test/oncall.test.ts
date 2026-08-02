import { describe, expect, it } from 'vitest';

import { callableError, callableResult, httpStatusFor, HttpsError, readCallableBody } from '../src/oncall';

/**
 * Le format de fil est celui qu'attend `@firebase/functions`. Une erreur ici ne
 * casserait pas une callable mais **les 33 d'un coup**, et de façon opaque côté
 * client. Les attentes sont donc calquées sur le code du SDK, pas sur la doc.
 */

const NO_HEADERS: Record<string, string> = {};

describe('protocole onCall — succès', () => {
  it('enveloppe le résultat dans `result`', async () => {
    const response = callableResult({ dailyLimit: 2 }, NO_HEADERS);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ result: { dailyLimit: 2 } });
  });

  it('sérialise `undefined` en null plutôt que d omettre le champ', async () => {
    // Le client rejette une réponse dont `data` et `result` sont tous deux
    // absents : « Response is missing data field ».
    expect(await callableResult(undefined, NO_HEADERS).json()).toEqual({ result: null });
  });

  it('reporte les en-têtes CORS fournis', () => {
    const response = callableResult(null, { 'Access-Control-Allow-Origin': 'https://maxmorrys.me' });
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://maxmorrys.me');
  });
});

describe('protocole onCall — erreurs', () => {
  it('émet le code canonique en MAJUSCULES_SOULIGNÉES', async () => {
    // `errorCodeMap` du SDK est indexée par RESOURCE_EXHAUSTED, pas par
    // resource-exhausted : un code non reconnu est ramené à `internal`.
    const response = callableError(
      new HttpsError('resource-exhausted', 'Quota atteint.', { reason: 'daily_limit' }),
      NO_HEADERS,
    );
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      error: {
        status: 'RESOURCE_EXHAUSTED',
        message: 'Quota atteint.',
        details: { reason: 'daily_limit' },
      },
    });
  });

  it('associe le bon statut HTTP à chaque code', () => {
    expect(httpStatusFor('unauthenticated')).toBe(401);
    expect(httpStatusFor('permission-denied')).toBe(403);
    expect(httpStatusFor('invalid-argument')).toBe(400);
    expect(httpStatusFor('not-found')).toBe(404);
    expect(httpStatusFor('already-exists')).toBe(409);
    expect(httpStatusFor('aborted')).toBe(409);
    expect(httpStatusFor('resource-exhausted')).toBe(429);
    expect(httpStatusFor('failed-precondition')).toBe(400);
    expect(httpStatusFor('internal')).toBe(500);
    expect(httpStatusFor('unavailable')).toBe(503);
    expect(httpStatusFor('deadline-exceeded')).toBe(504);
  });

  it('omet `details` quand il n y en a pas', async () => {
    const body = (await callableError(
      new HttpsError('not-found', 'Introuvable.'),
      NO_HEADERS,
    ).json()) as { error: Record<string, unknown> };
    expect('details' in body.error).toBe(false);
  });

  it('ne divulgue pas le message d une erreur imprévue', async () => {
    const response = callableError(new Error('connexion Postgres refusée sur 10.0.0.3'), NO_HEADERS);
    expect(response.status).toBe(500);
    const body = (await response.json()) as { error: { status: string; message: string } };
    expect(body.error.status).toBe('INTERNAL');
    expect(body.error.message).not.toContain('10.0.0.3');
  });
});

describe('lecture du corps — mêmes règles que isValidRequest du SDK', () => {
  function post(body: string, contentType: string | null = 'application/json'): Request {
    return new Request('https://api.maxmorrys.me/x', {
      method: 'POST',
      body,
      headers: contentType ? { 'Content-Type': contentType } : {},
    });
  }

  it('extrait la charge utile de l enveloppe `data`', async () => {
    expect(await readCallableBody(post(JSON.stringify({ data: { videoId: 'abc' } })))).toEqual({
      data: { videoId: 'abc' },
      raw: '{"data":{"videoId":"abc"}}',
    });
  });

  it('accepte un charset sur le Content-Type', async () => {
    const request = post('{"data":null}', 'application/json; charset=utf-8');
    expect((await readCallableBody(request)).data).toBeNull();
  });

  it('conserve le corps brut, nécessaire aux vérifications de signature', async () => {
    // Un webhook calcule son HMAC sur les octets exacts : lire `request.json()`
    // d abord les détruirait définitivement.
    const raw = '{"data":{"a":1},  "extra":"espaces  significatifs"}';
    expect((await readCallableBody(post(raw))).raw).toBe(raw);
  });

  // Les quatre rejets ci-dessous reproduisent, message compris, ce que renvoie
  // la Cloud Function — vérifié en interrogeant la production.
  const REJECTED: Array<[string, Request]> = [
    ['JSON invalide', post('{pas du json')],
    ['corps qui n est pas un objet', post('"une chaîne"')],
    ['corps vide', post('')],
    ['absence de clé data', post('{}')],
    ['Content-Type manquant', post('{"data":{}}', null)],
    ['Content-Type non JSON', post('{"data":{}}', 'text/plain')],
  ];

  for (const [label, request] of REJECTED) {
    it(`rejette ${label} en invalid-argument « Bad Request »`, async () => {
      await expect(readCallableBody(request)).rejects.toMatchObject({
        code: 'invalid-argument',
        message: 'Bad Request',
      });
    });
  }
});
