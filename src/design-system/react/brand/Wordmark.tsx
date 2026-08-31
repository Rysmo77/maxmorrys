import type { CSSProperties } from 'react';

/**
 * TROIS NOMS, TROIS CHOSES. Ce composant est l'endroit où la distinction tient.
 *
 *   « Hello ! »   le mot-symbole des PAGES WEB — barre haute et pied de page du site.
 *                 Dégradé #0057BC → #F38B0A → #02AC9C : les trois couleurs qui portaient
 *                 « Max », dans leur ordre.
 *   « Rysmo »     le nom de l'APPLICATION — écran de lancement, bannière d'installation,
 *                 connexion, création de compte, /403.
 *   « Max-Morrys » la PERSONNE, plus le produit — page « Je suis Max-Morrys », signature
 *                 d'article, mentions légales, « Max-Morrys Agency » qui est un nom de
 *                 practice. D'où un variant `signature` plutôt qu'une suppression.
 *
 * AUCUNE PROP DE THÈME (AD-3). Le kit en portait une (`night`) — ce que sa propre règle
 * interdit : « elle doit être passée à la main partout, personne ne le fait, et le composant
 * retombe silencieusement sur sa valeur claire ». Les variantes en lettres lisent --mm-bleu
 * et consorts, qui basculent seuls ; le dégradé de « Hello ! » est devenu le jeton
 * --wordmark-hello, qui bascule sous `.dk` comme les autres.
 *
 * Sur `hello`, `color` est déclaré AVANT `WebkitTextFillColor` : là où le remplissage
 * transparent n'est pas compris, le texte reste lisible en bleu au lieu de disparaître.
 */
export interface WordmarkProps {
  brand?: 'hello' | 'rysmo' | 'signature';
  size?: number;
  /** L'encre de la partie non colorée. Par défaut, l'encre du corps. */
  tail?: string;
  /** `signature` court : « Max » seul. */
  short?: boolean;
  style?: CSSProperties;
}

const base: CSSProperties = {
  fontFamily: 'var(--f-display)',
  fontWeight: 900,
  letterSpacing: '-.045em',
  lineHeight: 1,
  whiteSpace: 'nowrap',
};

export function Wordmark({ brand = 'hello', size = 22, tail, short, style }: WordmarkProps) {
  const s: CSSProperties = { ...base, fontSize: `${size}px`, ...style };

  if (brand === 'hello') {
    return (
      <span
        style={{
          ...s,
          background: 'var(--wordmark-hello)',
          color: 'var(--wordmark-hello-flat)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Hello&nbsp;!
      </span>
    );
  }

  // Le R reprend le bleu, le o final le teal : la marque garde ses bornes de couleur.
  if (brand === 'rysmo') {
    return (
      <span style={s}>
        <span style={{ color: 'var(--mm-bleu)' }}>R</span>
        <span style={{ color: tail ?? 'var(--text-body)' }}>ysm</span>
        <span style={{ color: 'var(--mm-teal)' }}>o</span>
      </span>
    );
  }

  return (
    <span style={s}>
      <span style={{ color: 'var(--mm-bleu)' }}>M</span>
      <span style={{ color: 'var(--mm-orange)' }}>a</span>
      <span style={{ color: 'var(--mm-teal)' }}>x</span>
      {!short && (
        <>
          <span style={{ color: 'var(--mm-violet)' }}>-</span>
          <span style={{ color: tail ?? 'var(--text-body)' }}>Morrys</span>
        </>
      )}
    </span>
  );
}
