import { useEffect, useState } from 'react';

/**
 * LA PROGRESSION DE LECTURE, en pourcentage — ce que `ReadingBar` attend.
 *
 * Elle remplace `shared/ScrollProgress`, qui dessinait sa propre barre en Tailwind. La
 * primitive du système la porte déjà, et c'est elle qui détient l'exception : le curseur
 * anime `width`, ce que la règle 3 interdit partout ailleurs. L'exception est bornée à un
 * élément de 3 px de haut sans enfant, et elle est nommée `prog-fill` pour que le
 * vérificateur la reconnaisse comme telle plutôt que comme un oubli.
 *
 * Le calcul se fait dans un `requestAnimationFrame` : un `scroll` non throttlé recalcule la
 * mise en page à chaque pixel, et c'est précisément le genre de coût qu'on ne peut pas se
 * permettre sur un appareil à 2 Go — le profil du marché visé, pas le cas limite.
 */
export function useReadingProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      // Une page plus courte que la fenêtre n'a pas de progression : afficher 0 plutôt
      // qu'une division par zéro qui rendrait `NaN`, puis une barre pleine.
      setProgress(scrollable > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)) : 0);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return progress;
}
