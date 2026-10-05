/* Pur, sans dépendance : `tests/unit/mobile-cache-vues.test.ts` l'importe directement. */

/** Sérialisation à clés triées : deux objets égaux donnent la même chaîne. */
export function canonique(valeur: unknown): string {
  if (Array.isArray(valeur)) return `[${valeur.map(canonique).join(',')}]`;
  if (valeur !== null && typeof valeur === 'object') {
    const o = valeur as Record<string, unknown>;
    return `{${Object.keys(o).filter((k) => o[k] !== undefined).sort()
      .map((k) => `${JSON.stringify(k)}:${canonique(o[k])}`).join(',')}}`;
  }
  return JSON.stringify(valeur) ?? 'null';
}
