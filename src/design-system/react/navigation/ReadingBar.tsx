import type { CSSProperties } from 'react';

/**
 * LE FIL DE LECTURE — 3 px en haut de l'écran, dégradé orange → corail → violet. C'est la
 * seule animation de l'écran article.
 *
 * ELLE ANIME `width`, ET C'EST L'EXCEPTION UNIQUE, DÉJÀ ÉCRITE ET FERMÉE. La règle du
 * mouvement ne laisse passer que `transform` et `opacity`, parce que tout le reste force une
 * recomposition sur un appareil à 2 Go. Ici, `transform: scaleX()` déformerait le dégradé —
 * il s'étirerait au lieu de se dévoiler — et l'exception est bornée à ce qu'elle coûte :
 * UN élément de 3 à 8 px de haut, SANS ENFANT. Aucune nouvelle exception ne s'ouvre. La
 * classe `prog-fill` est le nom sous lequel le système la reconnaît.
 *
 * `position: fixed`, pas `absolute`. Le kit la pose en `absolute` dans un cadre de
 * démonstration de 400 px qui ne défile pas ; une barre de progression de lecture qui
 * disparaît dès la deuxième section ne dit plus rien. Elle ne porte aucun flou : rester
 * visible ne lui coûte donc rien à la composition.
 *
 * ELLE A UN RÔLE ET UNE VALEUR. Le kit rendait deux `<div>` muets : la progression n'existait
 * qu'à l'œil. `role="progressbar"` avec `aria-valuenow` la rend annonçable — et un fil de
 * lecture est précisément l'information qu'on ne peut pas déduire du texte.
 */

/* Les trois teintes basculent seules sous `.dk` — l'orange passe à #FFB24D et le violet à
   #B98CFF, sinon le fil s'éteint sur fond nuit. Le kit les écrivait en hexadécimal (AD-2). */
const FILL = 'linear-gradient(90deg,var(--mm-orange),var(--mm-corail),var(--mm-violet))';

export interface ReadingBarProps {
  /** 0 à 100. Toute valeur hors bornes est ramenée dedans plutôt que rendue telle quelle. */
  value?: number;
  /** Nom accessible : « Progression de lecture ». Il se traduit — la chaîne vient de la surface. */
  label: string;
  className?: string;
  style?: CSSProperties;
}

/*
 * ⚠️ OBSERVATION DE PORTAGE — le produit faisait mieux que le kit sur ce point précis.
 *
 * Le composant `shared/ScrollProgress`, retiré au profit de cette primitive, écrivait une
 * `transform: scaleX()` sur une `ref`, coalescée en `requestAnimationFrame`, et ne relisait
 * la hauteur du document qu'au redimensionnement. Il ne déclenchait donc aucun calcul de mise
 * en page pendant le défilement.
 *
 * Cette primitive anime `width` — l'exception unique de la règle 3, écrite et bornée. Elle
 * est admise parce que le curseur porte un DÉGRADÉ : un `scaleX()` l'étirerait au lieu de le
 * révéler. C'est la vraie raison de l'exception, et elle tient.
 *
 * Ce qui reste à améliorer : le pourcentage vient d'un état React remonté à chaque image de
 * défilement. Le déplacer dans une `ref`, comme le faisait `ScrollProgress`, supprimerait un
 * rendu par image sans toucher au dégradé. À faire quand le profil d'appareil le demandera.
 */
export function ReadingBar({ value = 0, label, className = '', style }: ReadingBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={className || undefined}
      style={{ position: 'fixed', left: 0, right: 0, top: 0, height: '3px', zIndex: 9, background: 'var(--fill-1)', ...style }}
    >
      <i className="prog-fill" style={{ display: 'block', height: '100%', width: `${pct}%`, background: FILL, transition: 'width 1.4s var(--ease-out)' }} />
    </div>
  );
}
