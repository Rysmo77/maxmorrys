import { useEffect, useState, type RefObject } from 'react';

/**
 * LA PROGRESSION DE LECTURE, en pourcentage — ce que `ReadingBar` attend.
 *
 * Elle remplace `shared/ScrollProgress`, qui dessinait sa propre barre en Tailwind. La
 * primitive du système la porte déjà, et c'est elle qui détient l'exception : le curseur
 * anime `width`, ce que la règle 3 interdit partout ailleurs. L'exception est bornée à un
 * élément de 3 px de haut sans enfant, et elle est nommée `prog-fill` pour que le
 * vérificateur la reconnaisse comme telle plutôt que comme un oubli.
 *
 * ── CE QUE LA BARRE MESURE ──────────────────────────────────────────────────────────
 * Sans `cible`, elle mesure le DOCUMENT. C'est juste pour une page ordinaire, et faux
 * pour un article : le pied de page et la bande « À lire ensuite » comptent dans la
 * hauteur, donc la barre n'atteignait 100 % que bien après la dernière phrase — elle
 * annonçait qu'il restait à lire là où il ne restait qu'à faire défiler.
 *
 * Avec une `cible`, la progression est bornée à cet élément : 0 % tant que son haut n'est
 * pas atteint, 100 % quand son bas passe le bas de la fenêtre. Les autres appelants ne
 * passent rien et gardent le comportement d'avant.
 *
 * Le calcul se fait dans un `requestAnimationFrame` : un `scroll` non throttlé recalcule la
 * mise en page à chaque pixel, et c'est précisément le genre de coût qu'on ne peut pas se
 * permettre sur un appareil à 2 Go — le profil du marché visé, pas le cas limite.
 */
export function useReadingProgress(cible?: RefObject<HTMLElement | null>): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const el = cible?.current;

      if (el) {
        const haut = el.offsetTop;
        // La course utile : du haut de l'article au moment où sa dernière ligne est
        // visible. Au-delà, tout ce qui défile appartient au pied de page.
        const course = el.offsetHeight - window.innerHeight;
        if (course <= 0) {
          // Un article plus court que la fenêtre est lu dès qu'il est à l'écran.
          setProgress(window.scrollY >= haut ? 100 : 0);
          return;
        }
        setProgress(Math.min(100, Math.max(0, ((window.scrollY - haut) / course) * 100)));
        return;
      }

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
  }, [cible]);

  return progress;
}
