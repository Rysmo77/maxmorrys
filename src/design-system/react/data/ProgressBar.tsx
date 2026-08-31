import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import type { NumSource } from '../types';
import { Num } from './Num';

/**
 * L'EXCEPTION UNIQUE D'AD-16, ET ELLE EST DÉJÀ ÉCRITE.
 *
 * Le remplissage anime `width`. C'est le seul cas du système où `transform: scaleX()`
 * déformerait le contenu — un dégradé étiré n'est pas le même dégradé. L'exception est
 * bornée par sa forme : un élément de 3 à 8 px de haut, sans enfant, donc sans texte à
 * relayouter. `ds:check` la reconnaît au marqueur `prog-fill` porté par l'élément.
 * AUCUNE AUTRE EXCEPTION NE S'OUVRE À PARTIR DE CELLE-CI.
 *
 * ⚠️ CONTRADICTION RELEVÉE DANS LE KIT : REGLES-DE-REVUE.md et AD-16 nomment tous deux la
 * classe `.prog-fill`, mais `brand/motion.css` déclare `.bar-fill` — et ce que `.bar-fill`
 * fait n'est PAS ce qu'il faut ici : sous un parent `.play`, elle joue `barfill`, une
 * animation qui va de 8 % à 38 % quelle que soit la valeur réelle. La poser reviendrait à
 * afficher une progression inventée. `prog-fill` est donc porté comme MARQUEUR — c'est le nom
 * que la règle et le vérificateur emploient — et le remplissage reste piloté par `value`.
 *
 * LE REPLI HORS PEINTURE. La barre part de 0 et rejoint `value` à la trame suivante, pour que
 * le mouvement se voie. `requestAnimationFrame` ne se déclenche pas dans un onglet en
 * arrière-plan : sans le `setTimeout` de secours, la barre resterait à 0 pour qui revient sur
 * l'onglet — une progression réelle affichée comme nulle.
 */
export interface ProgressBarProps {
  /** 0 à 100. */
  value: number;
  /**
   * D'où vient le pourcentage. Une barre est une AFFIRMATION CHIFFRÉE — « tu as fait 34 % » —
   * même quand aucun chiffre n'est écrit. Elle passe donc par le même contrat que <Num> :
   * pas de source, pas de compilation.
   */
  source: NumSource;
  asOf: Date;
  /** @default 8 */
  height?: number;
  /** Ce que la barre mesure, pour qui ne la voit pas. Obligatoire : une jauge sans nom ne dit rien. */
  label: string;
  /** Affiche le pourcentage à côté de la barre. Le rendu chiffré est celui de <Num>. */
  readout?: boolean;
  style?: CSSProperties;
}

export function ProgressBar({ value, source, asOf, height = 8, label, readout, style }: ProgressBarProps) {
  const [w, setW] = useState(0);

  useEffect(() => {
    const r = requestAnimationFrame(() => setW(value));
    const t = setTimeout(() => setW(value), 60);
    return () => { cancelAnimationFrame(r); clearTimeout(t); };
  }, [value]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', ...style }}>
      {/* Un vrai rôle de jauge : la valeur annoncée est `value`, jamais `w` — `w` n'est que
          l'état de l'animation, et un lecteur d'écran n'a pas à entendre 0 % pendant 60 ms. */}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        style={{ flex: 1, height: `${height}px`, borderRadius: '5px', background: 'var(--fill-2)', overflow: 'hidden' }}
      >
        {/* Les quatre teintes du logo, dans l'ordre du mot-symbole. Elles passent par leurs
            jetons, donc elles prennent leur variante nuit sous `.dk` — un dégradé écrit en
            hexadécimal resterait sombre sur fond sombre et la barre s'effacerait. */}
        <i
          className="prog-fill" style={{ transition: 'width var(--t-scene) var(--ease-out)',
            display: 'block', height: '100%', borderRadius: '5px', width: `${w}%`,
            background: 'linear-gradient(90deg,var(--mm-bleu),var(--mm-violet),var(--mm-orange),var(--mm-teal))',
            backgroundSize: '220% 100%' }}
        />
      </div>
      {/* Le signe passe par `unit` et non par la valeur : il se rend alors en corps et non
          en monospace — la fonte des chiffres est réservée au chiffre lui-même. */}
      {readout && <Num value={value} unit="%" source={source} asOf={asOf} />}
    </div>
  );
}
