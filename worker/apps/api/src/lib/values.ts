import { Timestamp } from '@mm/firestore-rest';

/**
 * Lit une date quel que soit son encodage en base.
 *
 * Les collections mélangent chaînes ISO et Timestamps. Les Cloud Functions font
 * `new Date(data.expiresAt)`, ce qui produit une date invalide sur un Timestamp
 * — donc une comparaison toujours fausse, donc un abonnement expiré considéré
 * comme actif. Traiter les deux cas est un correctif, pas un écart.
 */
export function toDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export function toNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function toStringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

/**
 * Lit un champ texte quel que soit son encodage réel.
 *
 * Les collections mélangent chaînes ISO et Timestamps selon l'ancienneté des
 * documents ; l'indexation ne doit pas s'en apercevoir.
 */
export function asText(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (value instanceof Timestamp) return value.rfc3339;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number') return String(value);
  return undefined;
}
