import type { CSSProperties, ReactNode } from 'react';
import type { NumSource } from '../types';
import { Num } from './Num';

/**
 * Le quota du répétiteur : cinq barres, remplies en violet.
 *
 * IL EST VISIBLE EN PERMANENCE, ET C'EST DÉLIBÉRÉ. Le plafond est un choix de marge assumé,
 * pas une limite honteuse à cacher : une personne qui voit son compte descendre décide ; une
 * personne qui tombe sur un mur ne décide pas, elle subit.
 *
 * NE PAS CONFONDRE AVEC LE SOLDE. Un pack acheté s'ajoute au solde et ne se périme pas au
 * changement de jour ; le quota, lui, se réarme. Les afficher dans le même compteur ferait
 * croire qu'on perd ce qu'on a payé.
 *
 * `used` et `total` sont des NOMBRES AFFICHÉS, donc ils passent par <Num> et exigent leur
 * source : un quota est lu sur le document de la personne, pas déduit d'un état local.
 */
export interface QuotaMeterProps {
  /** @default 0 */
  used?: number;
  /** @default 5 */
  total?: number;
  source: NumSource;
  asOf: Date;
  /**
   * Ce qui suit le compte. Repris VERBATIM du kit, qui écrit « aujourd'hui ».
   * ⚠️ C'est de la copie française dans une primitive, sur une plateforme bilingue : une
   * surface anglophone DOIT le surcharger, rien ne le traduira pour elle.
   */
  suffix?: ReactNode;
  /** Remplace tout le libellé, compte compris. */
  label?: ReactNode;
  /**
   * Au-delà de ce nombre de barres, le compteur n'en dessine AUCUNE et ne garde que le
   * compte chiffré.  @default 10
   *
   * Le kit dessine cinq barres, et cinq barres se comptent d'un coup d'œil. Le quota du
   * répétiteur, lui, vaut 2 en gratuit, 5 avec le Club, 20 en Lite et 100 en Pro : à cent
   * barres, la rangée ne se compte plus, elle décore — et elle déborde de la ligne bien
   * avant. Le compte sourcé, lui, reste juste à n'importe quelle valeur.
   */
  maxBars?: number;
  style?: CSSProperties;
}

export function QuotaMeter({ used = 0, total = 5, source, asOf, suffix = "aujourd'hui", label, maxBars = 10, style }: QuotaMeterProps) {
  const drawBars = total <= maxBars;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '11.5px', color: 'var(--text-muted)', ...style }}>
      {/* Les barres redisent exactement ce que le libellé énonce : elles sont donc muettes
          pour un lecteur d'écran, qui entendrait sinon cinq éléments vides avant le compte. */}
      {drawBars && (
      <span aria-hidden="true" style={{ display: 'flex', gap: '3px' }}>
        {Array.from({ length: total }).map((_, i) => (
          // --fill-3 pour la barre éteinte : elle s'inverse sous `.dk`, là où un gris d'encre
          // figé disparaîtrait dans le fond au lieu de rester lisible comme une place vide.
          <i
            key={i}
            style={{
              width: '15px', height: '5px', borderRadius: '3px',
              background: i < used ? 'var(--mm-violet)' : 'var(--fill-3)',
              transition: 'background var(--t-ui) var(--ease)',
            }}
          />
        ))}
      </span>
      )}
      <span>
        {label ?? (
          <>
            <Num value={`${used} / ${total}`} source={source} asOf={asOf} /> {suffix}
          </>
        )}
      </span>
    </div>
  );
}
