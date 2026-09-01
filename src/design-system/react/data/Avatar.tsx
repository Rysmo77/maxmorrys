import type { CSSProperties } from 'react';

/**
 * La pastille d'initiales. Elles sont l'état LIVRÉ, pas un fond d'attente en train de
 * patienter qu'on lui trouve une image — et elles le restent pour les membres du Club, dont
 * aucune photographie n'existe au dépôt.
 *
 * ⚠️ CE COMPOSANT NE REND PAS D'IMAGE, ET C'EST VOULU. Là où une photo existe — le
 * `photoURL` d'un membre connecté, le portrait de la maison dans `src/lib/author.ts` —
 * l'écran pose un `<img … className="rounded-full object-cover">` et garde `Avatar` en
 * repli du ternaire. Ajouter ici une prop `src` ferait porter à la pastille la décision de
 * QUI est sur la photo : c'est une décision de page, jamais de primitive.
 *
 * LE DÉGRADÉ NE PEUT PAS ÊTRE `var(--mm-violet)` → `var(--mm-bleu)`, ET C'EST LE PIÈGE ENTIER
 * DU MODE SOMBRE. Ces deux jetons prennent leur variante nuit sous `.dk` — #B98CFF et
 * #6FB1FF, deux pastels clairs — et les initiales, elles, restent blanches : blanc sur
 * pastel, illisible, dans tous les fils de discussion à la fois. `--action-transforme` porte
 * EXACTEMENT le même dégradé (135°, violet vers bleu) mais il est déclaré hors de la portée
 * `.dk` : il reste profond dans les deux modes, donc le blanc tient. Aucune valeur du kit
 * n'est perdue au passage — seule la façon de la nommer change.
 *
 * `--text-invert` plutôt qu'un blanc écrit à la main : lui non plus ne bascule pas, et il dit
 * ce qu'il fait — de l'encre POUR une surface colorée.
 */
export interface AvatarProps {
  /** Une ou deux initiales. */
  initials?: string;
  /** @default 42 */
  size?: number;
  /** Dégradé de fond, pour différencier des membres. Il doit tenir dans les DEUX modes. */
  background?: string;
  /**
   * Le nom du membre. Fourni, la pastille devient une image nommée ; absent, elle est
   * décorative — c'est le cas normal, le nom étant presque toujours écrit juste à côté, et
   * l'entendre deux fois n'apprend rien.
   */
  label?: string;
  style?: CSSProperties;
}

export function Avatar({ initials = '', size = 42, background = 'var(--action-transforme)', label, style }: AvatarProps) {
  return (
    <span
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      style={{
        width: `${size}px`, height: `${size}px`, borderRadius: '50%', background,
        display: 'grid', placeItems: 'center',
        color: 'var(--text-invert)', fontWeight: 700,
        fontSize: `${Math.round(size / 3)}px`, fontFamily: 'var(--f-display)',
        // Liseré de lumière à 60 %, valeur du kit. Il vit sur une surface colorée qui ne
        // change pas de mode : il n'a donc pas de pendant nuit à prévoir.
        border: '1.5px solid rgba(255,255,255,.6)',
        flex: '0 0 auto',
        ...style,
      }}
    >
      {initials}
    </span>
  );
}
