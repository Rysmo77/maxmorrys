import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('mm-theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    const dark = theme === 'dark';

    /*
     * LE THÈME EST UNE PORTÉE CSS, PAS UNE PROP DE COMPOSANT.  (AD-3)
     *
     * `.dk` est la portée du design system : elle redéclare 78 jetons sur 206 — les quatre
     * teintes prennent leur valeur nuit, l'encre s'inverse, le verre effondre son opacité de
     * 62 % à 7,5 %, l'échelle de remplissage passe de teintes d'encre à des teintes de
     * lumière. Aucun écran n'est redessiné, aucun composant ne reçoit de prop.
     *
     * Une prop `dark` serait un piège : elle doit être passée à la main partout, personne ne
     * le fait, et le composant retombe silencieusement sur sa valeur claire — un disque de
     * chrome à 60 % de blanc sous un glyphe #ECF0F5 donne 1,4:1, dans douze écrans à la fois.
     *
     * `data-mm-dark` est l'attribut que le design system attend sur <html> ; `.dark` reste
     * posée pour le code hérité, le temps de la passe de migration.
     */
    root.classList.toggle('dk', dark);
    root.classList.toggle('dark', dark);
    root.classList.toggle('light', !dark);
    if (dark) root.setAttribute('data-mm-dark', '');
    else root.removeAttribute('data-mm-dark');

    // La barre système du navigateur suit le fond réel de la page, sinon elle tranche.
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', dark ? '#0B0E13' : '#FFFFFF');  // ok-ds — la balise meta theme-color ne lit pas une variable CSS : la valeur doit être littérale

    localStorage.setItem('mm-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'light' ? 'dark' : 'light')), []);

  // Objet mémoïsé : recréé en ligne, il donnait une nouvelle identité à chaque
  // rendu du provider et re-rendait tous les consommateurs sans raison.
  const value = useMemo(() => ({ theme, toggleTheme, setTheme }), [theme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
