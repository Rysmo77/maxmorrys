import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { tokens, type Scheme, type TokenName } from '../../src/design-system/tokens.generated';

/**
 * LE PONT DE JETONS. C'est le seul endroit du natif qui connaît une valeur de couleur.
 *
 * Au web, le mode sombre est une PORTÉE CSS : `.dk` redéclare 78 jetons sur 206 et toute la
 * cascade suit, sans qu'aucun composant ne reçoive de prop. Le natif n'a pas de cascade —
 * il faut donc résoudre le mode explicitement. Mais la règle de fond ne change pas :
 *
 *   AUCUN COMPOSANT NE PREND DE PROP DE THÈME.
 *
 * Ils appellent `useToken()`, qui lit le mode une fois, en haut. Une prop `dark` serait le
 * même piège ici qu'au web : elle doit être passée à la main partout, personne ne le fait, et
 * le composant retombe silencieusement sur sa valeur claire.
 *
 * ET LE MODE SOMBRE N'EST PAS UN FILTRE. Sur 206 jetons, 78 changent de valeur : les quatre
 * teintes de marque sont REDÉCLARÉES, parce qu'une palette ne se transpose pas d'un fond à
 * l'autre. `#0057BC` tombe à 2,84:1 sur `#0B0E13` et `#6C23DD` à 2,69:1 — interdits en texte,
 * exactement à l'inverse du mode clair où ce sont l'orange et le teal qui le sont.
 */
const SchemeContext = createContext<Scheme | null>(null);

/**
 * Force un mode sur une sous-partie de l'arbre — l'équivalent natif d'une portée `.dk`
 * locale. Sert au maillage nuit de la console, et à rien d'autre : partout ailleurs, c'est le
 * réglage système qui décide.
 */
export function ThemeScope({ scheme, children }: { scheme: Scheme; children: ReactNode }) {
  return <SchemeContext.Provider value={scheme}>{children}</SchemeContext.Provider>;
}

export function useScheme(): Scheme {
  const forced = useContext(SchemeContext);
  const system = useColorScheme();
  return forced ?? (system === 'dark' ? 'dark' : 'light');
}

/**
 * L'accesseur. `t('mmBleu')` rend `#0057BC` en clair et `#6FB1FF` en nuit — la variante nuit
 * étant un JETON DISTINCT du système, pas un éclaircissement calculé ici.
 */
export function useToken(): (name: TokenName) => string {
  const scheme = useScheme();
  return (name) => tokens[scheme][name] ?? tokens.light[name];
}

/** Plusieurs jetons d'un coup, quand un composant en lit une poignée. */
export function useTokens<K extends TokenName>(...names: K[]): Record<K, string> {
  const t = useToken();
  return Object.fromEntries(names.map((n) => [n, t(n)])) as Record<K, string>;
}

/**
 * Les espacements et rayons du kit, en nombres.
 *
 * Les jetons CSS portent leur unité (`18px`) ; React Native compte en nombres sans unité. On
 * ne retape donc pas les valeurs, on retire le suffixe — la source reste le CSS du système.
 */
export function px(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function useSpace(): (name: TokenName) => number {
  const t = useToken();
  return (name) => px(t(name));
}

/**
 * UN VOILE DÉRIVÉ DE SON ENCRE, jamais une seconde valeur.
 *
 * Le web écrit ses fonds d'état en dur — `rgba(15,123,82,.16)` pour la pastille verte,
 * `rgba(108,35,221,.15)` pour la coche violette. Recopier ces canaux ici créerait une valeur
 * de plus à maintenir, et surtout une valeur QUI NE BASCULERAIT PAS : en mode sombre, `--ok`
 * devient #4ADE9B et son voile doit suivre. Un `rgba` figé resterait le vert du mode clair.
 *
 * On dérive donc le voile de l'encre déjà résolue par `useToken()`. Une seule valeur, un seul
 * mode de panne, et le voile suit son encre par construction.
 */
export function veil(color: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return color;
  const n = Number.parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}
