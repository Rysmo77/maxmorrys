import { createHash } from 'crypto';
import { defineSecret } from 'firebase-functions/params';

export const metaAccessToken = defineSecret('META_ACCESS_TOKEN');

const PIXEL_ID = '925361066071417';
const API_VERSION = 'v19.0';

function sha256(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

interface UserData {
  em?: string;
  ph?: string;
  fn?: string;
  ln?: string;
  client_ip_address?: string;
  client_user_agent?: string;
}

export async function sendConversionEvent(
  eventName: string,
  customData: Record<string, unknown>,
  userData: UserData,
  eventId?: string,
): Promise<void> {
  const token = metaAccessToken.value();
  if (!token) {
    console.warn('META_ACCESS_TOKEN not set, skipping CAPI event:', eventName);
    return;
  }

  const hashedUserData: Record<string, string | undefined> = {};
  if (userData.em) hashedUserData.em = sha256(userData.em);
  if (userData.ph) hashedUserData.ph = sha256(userData.ph);
  if (userData.fn) hashedUserData.fn = sha256(userData.fn);
  if (userData.ln) hashedUserData.ln = sha256(userData.ln);
  if (userData.client_ip_address) hashedUserData.client_ip_address = userData.client_ip_address;
  if (userData.client_user_agent) hashedUserData.client_user_agent = userData.client_user_agent;

  const event = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: 'website' as const,
    user_data: hashedUserData,
    custom_data: customData,
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [event],
          access_token: token,
        }),
      },
    );
    if (!res.ok) {
      const body = await res.text();
      console.error('Meta CAPI error:', res.status, body);
    }
  } catch (err) {
    console.error('Meta CAPI request failed:', err);
  }
}
