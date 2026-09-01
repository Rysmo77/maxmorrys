import { useEffect, useState } from 'react';

/**
 * QUELLE SECTION EST EN TRAIN D'ÊTRE LUE — le repère du sommaire.
 *
 * ── LE DÉFAUT QUE CE CROCHET FERME ──────────────────────────────────────────────────
 * Le sommaire d'article marquait son entrée active par `i === 0` : la PREMIÈRE, en dur,
 * quelle que soit la position de lecture. On cliquait la quatrième entrée, la page
 * défilait, et le gras ne bougeait pas. Un panneau dont rien ne répond au défilement se
 * lit « il ne fonctionne pas » — et c'est exactement ce qui a été rapporté.
 *
 * ── POURQUOI UN OBSERVATEUR, ET PAS UN ÉCOUTEUR DE DÉFILEMENT ───────────────────────
 * Un `scroll` non throttlé mesure la position de chaque titre à chaque pixel. Sur un
 * article de quinze sections et un appareil à 2 Go — le profil du marché visé —, c'est
 * une recomposition par image. `IntersectionObserver` ne coûte rien tant que rien ne
 * franchit la ligne.
 *
 * ── OÙ EST POSÉE LA LIGNE ───────────────────────────────────────────────────────────
 * `rootMargin` haut négatif de la hauteur du chrome : un titre passé DERRIÈRE la pilule
 * flottante n'est plus lu, il est dépassé. Le bas est ramené très haut (`-70%`) pour que
 * la fenêtre active ne fasse qu'une bande étroite sous l'en-tête : sans quoi trois titres
 * seraient « actifs » à la fois sur un grand écran, et le repère sauterait.
 *
 * On garde le DERNIER titre franchi plutôt que le premier visible : entre deux sections,
 * on lit encore celle qu'on vient de commencer, pas celle qui arrive.
 */
export function useActiveHeading(ids: string[]): string | null {
  const [actif, setActif] = useState<string | null>(ids[0] ?? null);

  useEffect(() => {
    if (!ids.length) {
      setActif(null);
      return;
    }
    setActif(ids[0]);

    if (typeof IntersectionObserver === 'undefined') return;

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (!elements.length) return;

    // `--header-h` est la source unique de la hauteur du chrome, marges comprises. Lue
    // au calcul plutôt que codée : elle change entre la barre pleine et la barre compacte.
    const chrome =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 5;
    const hautPx = Math.round(chrome * parseFloat(getComputedStyle(document.documentElement).fontSize || '16'));

    const visibles = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visibles.add(entry.target.id);
          else visibles.delete(entry.target.id);
        }
        // L'ordre du document fait foi : on prend le premier titre de la bande active.
        const dansLaBande = ids.find((id) => visibles.has(id));
        if (dansLaBande) {
          setActif(dansLaBande);
          return;
        }
        // Aucun titre dans la bande : on est AU MILIEU d'une section. Le dernier titre
        // passé au-dessus de la ligne est celui qu'on lit.
        let dernier: string | null = null;
        for (const el of elements) {
          if (el.getBoundingClientRect().top <= hautPx + 24) dernier = el.id;
        }
        setActif(dernier ?? ids[0]);
      },
      { rootMargin: `-${hautPx}px 0px -70% 0px`, threshold: 0 },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
    // `ids.join` et non `ids` : le tableau est recréé à chaque rendu du parent, son
    // contenu non. Sans ça, l'observateur se démonterait et se remonterait sans fin.
  }, [ids.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  return actif;
}
