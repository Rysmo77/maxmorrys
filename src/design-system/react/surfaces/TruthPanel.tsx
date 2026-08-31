import type { CSSProperties, ReactNode } from 'react';
import { Icon } from '../brand/Icon';

/**
 * L'ENCART DE VÉRITÉ — ce qui remplace la preuve sociale.
 *
 * Chaque écran de vente porte un bloc « Ce que je peux te prouver » / « Ce que je n'affiche
 * pas » qui NOMME CE QUI MANQUE :
 *
 *   « Je n'affiche ni note ni nombre d'inscrits : la plateforme vient d'ouvrir, je n'ai rien
 *     d'honnête à en dire. »
 *
 * C'est un composant, pas une figure de style. Et ce n'est pas de la modestie : c'est le
 * calcul qui rend le reste crédible. Les chiffres de façade — 340 % de croissance de trafic,
 * 50 étudiants formés, 94 % de réussite, 10 cours créés — étaient affichés sur l'accueil et
 * l'écran de connexion pendant que la base de production comptait 5 comptes, 0 formation
 * publiée et 0 certificat émis. Ces chiffres-là se vérifient en trente secondes, et un
 * visiteur qui les prend en défaut ne revient pas — ni sur ces chiffres, ni sur les autres.
 *
 * INTERDITS ABSOLUS que ce composant remplace, sans exception : note en étoiles, nombre
 * d'avis, nombre d'élèves ou d'inscrits, taux de réussite, témoignage, logo client,
 * « rejoint par N personnes ».
 *
 * Aucun flou. Le voile est relevé à .72 pour tenir le contraste sans lui : l'encart est
 * présent sur une quarantaine d'écrans, et à `blur(10px)` il n'apportait rien qu'une couche
 * de composition par écran.
 */
export interface TruthPanelProps {
  /** Par défaut « Ce que je peux te prouver ». */
  provenTitle?: string;
  /** Par défaut « Ce que je n'affiche pas ». */
  withheldTitle?: string;
  /**
   * Ce qui est démontrable. Chaque entrée doit pouvoir citer sa source — en pratique, un
   * <Num> ou une phrase vérifiable. Une liste vide est légitime : c'est une information.
   */
  proven: ReactNode[];
  /**
   * Ce qui n'est pas affiché, ET POURQUOI. La raison est la moitié qui compte : « je n'ai
   * rien d'honnête à en dire » se lit tout autrement que l'absence silencieuse.
   */
  withheld: ReactNode[];
  className?: string;
  style?: CSSProperties;
}

export function TruthPanel({
  provenTitle = 'Ce que je peux te prouver',
  withheldTitle = "Ce que je n'affiche pas",
  proven,
  withheld,
  className = '',
  style,
}: TruthPanelProps) {
  return (
    <div className={['truth', className].filter(Boolean).join(' ')} style={style}>
      <Block title={provenTitle} items={proven} glyph="check" tone="var(--ok)" />
      {withheld.length > 0 && (
        <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border-hair)' }}>
          <Block title={withheldTitle} items={withheld} glyph="close" tone="var(--text-muted)" />
        </div>
      )}
    </div>
  );
}

function Block({ title, items, glyph, tone }: { title: string; items: ReactNode[]; glyph: 'check' | 'close'; tone: string }) {
  return (
    <>
      <p className="mm-eyebrow" style={{ margin: 0, marginBottom: '8px' }}>{title}</p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '7px' }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: 'flex', gap: '9px', alignItems: 'flex-start', fontSize: 'var(--fs-meta)', lineHeight: 1.45 }}>
            <span style={{ flex: '0 0 auto', marginTop: '2px', color: tone }}>
              <Icon name={glyph} size={13} />
            </span>
            {/* --text-body pour ce qui est prouvé, --text-muted pour ce qui ne l'est pas.
                Jamais --text-faint : l'encre tertiaire ne porte pas de texte (AD-18). */}
            <span style={{ color: glyph === 'check' ? 'var(--text-body)' : 'var(--text-muted)' }}>{item}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
