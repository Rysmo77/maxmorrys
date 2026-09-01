import { useState, useEffect } from 'react';

/**
 * Vrai lorsque la media query correspond.
 *
 * ⚠️ À réserver aux cas où masquer en CSS ne suffit PAS. `display: none` cache un élément
 * mais ne l'empêche ni d'être monté, ni de déclencher ses requêtes réseau : une image
 * masquée est quand même téléchargée. Quand le rendu conditionnel a un coût réseau, il doit
 * donc passer par JavaScript et non par une classe `wide:hidden`.
 *
 * Rend `false` au premier rendu côté serveur ou avant hydratation — les appelants doivent
 * traiter ce cas comme « pas encore connu », jamais comme « faux ».
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** Point de bascule `lg` de Tailwind (1024 px) — celui qui sépare accordéon et deux colonnes. */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}
