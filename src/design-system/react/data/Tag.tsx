import type { CSSProperties, ReactNode } from 'react';

export type TagTone = 'ok' | 'warn' | 'stop' | 'neutral';

/**
 * QUATRE TONS SEULEMENT, et ils veulent dire quelque chose : `ok` = acquis, `warn` = en
 * attente, `stop` = bloquant, `neutral` = information. Une étiquette qui ne dit qu'une
 * catégorie n'a pas de ton — elle est `neutral`.
 *
 * LES VOILES ÉTAIENT ÉCRITS EN rgba LITTÉRAL DANS LE KIT — `rgba(15,123,82,.13)`, et ainsi de
 * suite. Trois défauts d'un coup : la teinte est figée hors de tout jeton, donc elle ne suit
 * plus `--ok` si le système le corrige ; rien ne le signale ; et elle ne bascule pas.
 * `color-mix` garde le POURCENTAGE DU KIT AU CENTIÈME PRÈS — .13, .18, .13, jamais arrondis —
 * en le rattachant au jeton.
 *
 * ✅ RÉGLÉ DEPUIS. Ce commentaire signalait que `--ok`, `--warn` et `--stop` n'étaient pas
 * redéclarés sous `.dk` — un vert #0F7B52 sur #0B0E13 tombant à 2,5:1 — et concluait : « il
 * se corrige dans le design system puis se resynchronise (AD-1), et le composant en héritera
 * sans être retouché ». C'est exactement ce qui s'est passé : la révision reçue livre les
 * trois valeurs nuit dans `tokens/dark.css` (#4ADE9B, #FFB24D, #FF8A80), et ce fichier n'a
 * pas bougé d'une ligne. C'est tout l'intérêt de passer par `var(--…)` plutôt que par un
 * rgba figé.
 */
const TONE: Record<TagTone, CSSProperties> = {
  ok: { background: 'color-mix(in srgb, var(--ok) 13%, transparent)', color: 'var(--ok)' },
  // Le fond emprunte l'orange de marque, l'encre son alternative texte : #F38B0A fait 2,47:1
  // sur blanc, il ne porte jamais de texte — d'où deux jetons différents sur une seule pilule.
  warn: { background: 'color-mix(in srgb, var(--mm-orange) 18%, transparent)', color: 'var(--warn)' },
  stop: { background: 'color-mix(in srgb, var(--stop) 13%, transparent)', color: 'var(--stop)' },
  // --fill-tag s'inverse sous `.dk` : encre en clair, lumière en sombre. Une valeur d'encre
  // en dur ne blanchirait pas en sombre, elle DISPARAÎTRAIT.
  neutral: { background: 'var(--fill-tag)', color: 'var(--text-muted)' },
};

export interface TagProps {
  /** @default "neutral" */
  tone?: TagTone;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Tag({ tone = 'neutral', children, className, style }: TagProps) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        height: '27px', padding: '0 11px',
        borderRadius: 'var(--r-pill)', fontSize: '11px', fontWeight: 600,
        // Fond et encre seulement : ni transform, ni mise en page. Une étiquette qui change
        // d'état ne doit pas déplacer la ligne qui la porte.
        transition: 'background var(--t-ui) var(--ease),color var(--t-ui) var(--ease)',
        ...TONE[tone],
        ...style,
      }}
    >
      {children}
    </span>
  );
}
