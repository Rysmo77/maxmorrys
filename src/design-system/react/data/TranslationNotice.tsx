import type { CSSProperties, ReactNode } from 'react';

/**
 * Bandeau obligatoire en tête de TOUT contenu éditorial traduit.
 *
 * IL EXISTE PARCE QUE LA TRADUCTION EST GÉNÉRÉE AU PRÉ-RENDU ET MISE EN CACHE. Une correction
 * du français n'atteint la page anglaise qu'à l'expiration du cache, et il n'existe aucune
 * invalidation manuelle. Le dire coûte moins cher que de faire semblant : un lecteur qui
 * découvre l'écart tout seul ne revient pas.
 *
 * TOUJOURS EN ANGLAIS — c'est un lecteur anglophone qui le lit, le traduire en français n'a
 * aucun sens. TOUJOURS AU-DESSUS DU CORPS, jamais en pied de page : après l'article,
 * l'avertissement n'avertit plus.
 *
 * DEUX ÉCARTS AU KIT, TOUS DEUX ASSUMÉS.
 * 1. `href` devient OBLIGATOIRE. Le kit repliait sur `href="#"` quand rien n'était fourni :
 *    un lien qui ne mène nulle part est atteignable au clavier, annoncé comme un lien, et il
 *    renvoie la personne en haut de la page qu'elle est en train de lire. Sans version
 *    française à montrer, ce bandeau n'a rien à dire — il ne se pose pas.
 * 2. La flèche « → » qui suivait le libellé est retirée. La voix du système n'admet que deux
 *    unicodes décoratifs, le point médian et les guillemets français.
 */
export interface TranslationNoticeProps {
  /**
   * Date de génération, telle qu'elle sort du pré-rendu. C'est un chiffre affiché : passe un
   * <Num> avec sa source — jamais une chaîne nue, qui atterrirait en corps de texte alors que
   * tout le poids du bandeau tient à ce que cette date soit vraie.
   */
  date: ReactNode;
  /** URL de la version française. */
  href: string;
  /** @default "Read the original" */
  originalLabel?: string;
  className?: string;
  style?: CSSProperties;
}

export function TranslationNotice({ date, href, originalLabel = 'Read the original', className, style }: TranslationNoticeProps) {
  return (
    <div
      role="note"
      className={className}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '11px', padding: '13px 16px',
        borderRadius: 'var(--r-m)', background: 'var(--fill-1)', border: '1px solid var(--border-hair)',
        ...style,
      }}
    >
      {/* Le voile orange passe par son jeton au lieu d'un rgba figé : sous `.dk`, `--mm-orange`
          prend sa variante nuit et la pastille reste visible. Le trait, lui, lit
          `--mm-orange-t` — l'orange de marque fait 2,47:1 sur blanc et ne porte jamais rien. */}
      <span
        aria-hidden="true"
        style={{ width: '22px', height: '22px', borderRadius: '50%', flex: '0 0 auto', marginTop: '1px', background: 'color-mix(in srgb, var(--mm-orange) 18%, transparent)', display: 'grid', placeItems: 'center' }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--mm-orange-t)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 010 18 14 14 0 010-18z" />
        </svg>
      </span>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
        <b style={{ color: 'var(--text-body)', fontWeight: 600 }}>Machine-translated on {date}</b>
        {' '}— The French version is the one I wrote, and the one I keep up to date.{' '}
        <a href={href} style={{ color: 'var(--mm-bleu)', fontWeight: 600, whiteSpace: 'nowrap' }}>{originalLabel}</a>
      </p>
    </div>
  );
}
