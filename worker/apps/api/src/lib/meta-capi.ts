import { sha256Hex } from '@mm/shared';

import type { Env } from '../env';

/**
 * Meta Conversions API — port de `functions/src/meta-capi.ts`.
 *
 * `createHash('sha256')` de node:crypto devient `crypto.subtle.digest`. La
 * normalisation avant hachage (trim + minuscules) est celle qu'impose Meta pour
 * que les identifiants correspondent — la modifier casserait silencieusement le
 * rapprochement des conversions.
 */

const PIXEL_ID = '925361066071417';
const API_VERSION = 'v19.0';

export interface MetaUserData {
  em?: string;
  ph?: string;
  fn?: string;
  ln?: string;
  client_ip_address?: string;
  client_user_agent?: string;
}

const HASHED_FIELDS = ['em', 'ph', 'fn', 'ln'] as const;
const PASSTHROUGH_FIELDS = ['client_ip_address', 'client_user_agent'] as const;

/**
 * Envoie un événement de conversion.
 *
 * N'échoue jamais : un incident Meta ne doit pas faire échouer le webhook de
 * paiement, ce qui déclencherait des relivraisons Bictorys alors que le paiement
 * est déjà traité.
 */
export async function sendConversionEvent(
  env: Env,
  eventName: string,
  customData: Record<string, unknown>,
  userData: MetaUserData,
  eventId?: string,
): Promise<void> {
  const token = env.META_ACCESS_TOKEN;
  if (!token) {
    console.warn('META_ACCESS_TOKEN absent, événement CAPI ignoré :', eventName);
    return;
  }

  const hashedUserData: Record<string, string> = {};
  for (const field of HASHED_FIELDS) {
    const value = userData[field];
    if (value) hashedUserData[field] = await sha256Hex(value.trim().toLowerCase());
  }
  for (const field of PASSTHROUGH_FIELDS) {
    const value = userData[field];
    if (value) hashedUserData[field] = value;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [
            {
              event_name: eventName,
              event_time: Math.floor(Date.now() / 1000),
              event_id: eventId,
              action_source: 'website',
              user_data: hashedUserData,
              custom_data: customData,
            },
          ],
          access_token: token,
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!response.ok) {
      console.error('Meta CAPI :', response.status, (await response.text()).slice(0, 200));
    }
  } catch (error: unknown) {
    console.error('Requête Meta CAPI échouée :', error);
  }
}
