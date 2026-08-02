import { Timestamp } from '@mm/firestore-rest';

/** Échappement XML, identique à celui des Cloud Functions (les 5 entités). */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Section CDATA, avec neutralisation du terminateur. */
export function cdata(value: string): string {
  return `<![CDATA[${value.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

/**
 * Lit un champ texte quel que soit son encodage réel.
 *
 * Les collections mélangent les types : `publishedAt` est une chaîne ISO ici,
 * un Timestamp ailleurs. Les Cloud Functions supposaient la chaîne — ce qui
 * ferait lever `toISOString()` sur un Timestamp. Cette normalisation est donc
 * un durcissement, pas un écart de comportement.
 */
export function asText(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (value instanceof Timestamp) return value.rfc3339;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number') return String(value);
  return undefined;
}

/** Date ISO à partir d'un champ hétérogène. Renvoie `undefined` si non interprétable. */
export function asIsoDate(value: unknown): string | undefined {
  const raw = asText(value);
  if (!raw) return undefined;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** Date RFC 822 (format des `pubDate` RSS), avec repli sur maintenant. */
export function rfc822(value: unknown): string {
  const raw = asText(value);
  const date = raw ? new Date(raw) : new Date();
  return (Number.isNaN(date.getTime()) ? new Date() : date).toUTCString();
}

export function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
