import { useEffect, useRef } from 'react';

/**
 * LE DÉCLENCHEUR DE SCÈNE — il pose `.play` quand la section entre dans le champ.
 *
 * Le système décrit une entrée orchestrée : `.rv` (entrée simple), `.rv-s` (avec échelle) et
 * `.rv-l` (ligne de titre sous masque `clip-path`), décalées de `--i × --stagger`. Les trois
 * classes sont écrites dans `brand/motion.css` — mais elles ne font RIEN tant qu'un ancêtre
 * ne porte pas `.play`.
 *
 * Les maquettes posent `.play` en dur, parce qu'un écran de planche est monté une fois et
 * regardé tout de suite. En production, une page fait dix écrans de haut : jouer toutes les
 * scènes au montage revient à ne rien animer du tout, puisque neuf dixièmes se déroulent hors
 * du champ.
 *
 * DEUX PRÉCAUTIONS, et chacune vient d'un défaut prévisible :
 *
 *   • L'observation s'arrête après le premier passage. Une scène qui rejoue à chaque
 *     défilement transforme une entrée en clignotement, et le système n'a que deux moments
 *     scénarisés — l'attente de paiement et le certificat. Celui-ci n'en est pas un.
 *   • Si `IntersectionObserver` manque, ou si la personne a demandé moins de mouvement, on
 *     pose `.play` IMMÉDIATEMENT. Le repli d'une animation n'est pas l'absence de contenu :
 *     `prefers-reduced-motion` ramène déjà toutes les durées à 1 ms dans `brand/fallback.css`,
 *     donc `.play` posé d'emblée y rend le contenu visible, sans transition. L'oublier
 *     laisserait la page vide pour qui a coché ce réglage.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reduced || typeof IntersectionObserver === 'undefined') {
      el.classList.add('play');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('play');
          // Une seule fois : la scène a joué, elle ne se rejoue pas.
          observer.unobserve(entry.target);
        }
      },
      /*
       * `threshold: 0` — PAS 0,12, ET LA RAISON N'EST PAS ESTHÉTIQUE.
       *
       * `intersectionRatio` est un rapport à la surface de la CIBLE. Sur une cible plus
       * haute que la fenêtre — un article long, une page de vente — il plafonne à
       * `hauteur de fenêtre / hauteur de cible` : 10 % pour 8 000 px de contenu dans une
       * fenêtre de 800. Un seuil de 12 % n'est alors jamais franchi.
       *
       * La première observation remonte quand même `isIntersecting: true`, donc la scène
       * jouait bel et bien — ce n'était pas un défaut ouvert. Mais la marge tenait à ce
       * détail d'implémentation, sur les pages précisément les plus longues, et le prix
       * d'un échec serait une page entière restée à `opacity: 0`. Le seuil ne rapporte
       * rien ici : `rootMargin` suffit à empêcher un départ pour un pixel visible.
       */
      { threshold: 0, rootMargin: '0px 0px -8% 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}
