import type { CSSProperties, ReactNode } from 'react';
import type { NumSource } from '../types';
import { Num } from './Num';

/** L'onde du kit, relevée barre par barre. Aucune valeur n'est recalculée ni lissée. */
const MM_ONDE = [16, 30, 44, 24, 38, 14, 33, 44, 20, 36, 26, 42, 18, 30, 40, 22];

/**
 * LA SILHOUETTE DIT LE FORMAT. Une onde pour l'audio, un cadre 16:9 pour la vidéo. Une
 * étiquette « Podcast » ou « Vidéo » se perd sur un téléphone tenu à bout de bras ; une forme
 * non. C'est pour ça que le format n'est pas un mot mais un dessin.
 *
 * `cost` PORTE TOUJOURS LE POIDS. C'est la seule information qui permet à quelqu'un dont le
 * forfait est compté de décider d'ouvrir ou non. Pour une vidéo, on donne les DEUX qualités —
 * « 96 Mo en HD », « 24 Mo en 480p » — parce que le choix n'existe que si les deux chiffres
 * sont là. Ne jamais retirer le poids.
 *
 * AUCUN FLOU. Le kit posait `blur(24px)` sur la vignette. Une carte de média vit toujours en
 * GRILLE : un flou par carte et par image, sur le poste le plus coûteux du produit. Le faux
 * verre `--surface-card-flat` est visuellement quasi identique sur un maillage et gratuit à
 * faire défiler.
 *
 * ⚠️ CE QUE LE KIT SE CONTREDIT À LUI-MÊME. Les conventions déclarent le bouton de lecture
 * comme l'une des « trois exceptions assumées, sur des surfaces colorées QUI NE CHANGENT PAS
 * DE MODE » — un disque blanc, un glyphe sombre, dans les deux thèmes. Mais le dégradé de
 * vignette qu'il dessine est fait des quatre teintes de marque, et celles-ci PRENNENT LEUR
 * VARIANTE NUIT sous `.dk`. La surface change donc de mode, ce que l'exception suppose
 * impossible. Aucun jeton fixe n'existe pour l'exprimer autrement, et AD-2 interdit d'écrire
 * les teintes en dur pour les figer. Choix fait ici : la vignette bascule avec les jetons —
 * elle s'éclaircit en sombre —, le disque et le glyphe restent fixes. Si la vignette doit
 * rester profonde dans les deux modes, il faut un jeton `--art-audio` / `--art-video` dans le
 * design system : la correction se fait là-bas, puis se resynchronise (AD-1).
 */
export interface MediaCardProps {
  /** @default "audio" */
  format?: 'audio' | 'video';
  /** Dégradé de la vignette. Par défaut celui du format. Aucune photographie. */
  gradient?: string;
  /** Sourcil monospace — il passe par `.mm-eyebrow`, qui porte la face, la casse et l'espacement. */
  eyebrow?: ReactNode;
  title?: ReactNode;
  body?: ReactNode;
  /**
   * Durée, poids, et le coût de l'alternative texte. Le triplet se lit en trois morceaux, et
   * un seul prend la monospace : `prefix` porte le mot qui précède — « Transcription · » —,
   * `value` porte le chiffre, `unit` porte « Mo » ou « en 480p ». La fonte des chiffres est
   * réservée au chiffre : une phrase entière en monospace lui emprunte une crédibilité
   * qu'elle n'a pas.
   */
  cost?: { prefix?: ReactNode; value: number | string; unit?: string; source: NumSource; asOf: Date }[];
  /** Étiquette en bas de vignette — « Vidéo · 16:9 », une durée. */
  badge?: string;
  /** @default 150 */
  artHeight?: number;
  /** @default 17 */
  titleSize?: number;
  actions?: ReactNode;
  /** La lecture NAVIGUE : rendue en <a href>. */
  playHref?: string;
  /** La lecture AGIT sur place : rendue en <button type="button">. */
  onPlay?: () => void;
  /** Obligatoire dès que le disque est un contrôle : une cible sans texte n'est rien. */
  playLabel?: string;
  style?: CSSProperties;
}

export function MediaCard({
  format = 'audio', gradient, eyebrow, title, body, cost = [], badge,
  artHeight = 150, titleSize = 17, actions, playHref, onPlay, playLabel, style,
}: MediaCardProps) {
  const grad = gradient || (format === 'audio'
    ? 'linear-gradient(140deg,var(--mm-violet),var(--mm-bleu) 62%,var(--mm-teal))'
    : 'linear-gradient(140deg,var(--mm-bleu),var(--mm-violet))');

  const playCss: CSSProperties = {
    width: '56px', height: '56px', borderRadius: '50%',
    // Le disque et son glyphe sont l'exception assumée : blanc et encre fixes, jamais des
    // jetons qui basculent — `--ink` deviendrait blanc sous `.dk` et le triangle disparaîtrait
    // dans le disque. `--night-2` est le seul jeton d'encre déclaré HORS de la portée `.dk`.
    background: 'rgba(255,255,255,.92)', display: 'grid', placeItems: 'center', flex: '0 0 auto',
    boxShadow: '0 8px 22px rgba(14,17,22,.24)', border: 0, padding: 0,
    cursor: playHref || onPlay ? 'pointer' : undefined,
  };
  const playGlyph = <svg width="19" height="19" viewBox="0 0 24 24"><polygon points="7 4 20 12 7 20" fill="var(--night-2)" /></svg>;

  let play: ReactNode;
  if (playHref) {
    play = <a href={playHref} aria-label={playLabel} className="mm-press-sm" style={playCss}>{playGlyph}</a>;
  } else if (onPlay) {
    play = <button type="button" onClick={onPlay} aria-label={playLabel} className="mm-press-sm" style={playCss}>{playGlyph}</button>;
  } else {
    // Sans action, le disque n'est pas un contrôle : il ne le prétend pas non plus. La lecture
    // se déclenche alors par `actions`, où le libellé est écrit en toutes lettres.
    play = <span aria-hidden="true" style={playCss}>{playGlyph}</span>;
  }

  return (
    <div
      style={{
        borderRadius: 'var(--r-l)', overflow: 'hidden', background: 'var(--surface-card-flat)',
        // `--border-glass` et non `--glass-brd` : les deux valent le même blanc à 55 % en
        // clair, mais seul le premier s'effondre sous `.dk`. Une bordure à 55 % de blanc sur
        // fond nuit cercle la carte d'un trait lumineux qui la découpe au lieu de la poser.
        border: '1px solid var(--border-glass)',
        boxShadow: 'var(--glass-hl),var(--glass-sh-flat)',
        ...style,
      }}
    >
      <div
        style={{
          height: `${artHeight}px`, background: grad, position: 'relative', display: 'flex',
          alignItems: 'center', justifyContent: format === 'audio' ? 'space-between' : 'center', padding: '18px',
        }}
      >
        {format === 'audio' && (
          <span aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '46px' }}>
            {MM_ONDE.map((h, i) => (
              <i key={i} style={{ width: '3px', height: `${h}px`, borderRadius: '2px', background: 'rgba(255,255,255,.72)' }} />
            ))}
          </span>
        )}
        {format === 'video' && (
          <span aria-hidden="true" style={{ position: 'absolute', inset: '14px', border: '2px solid rgba(255,255,255,.28)', borderRadius: '14px' }} />
        )}
        {play}
        {badge && (
          <span style={{ position: 'absolute', left: '14px', bottom: '14px', display: 'inline-flex', alignItems: 'center', height: '25px', padding: '0 10px', borderRadius: 'var(--r-pill)', fontSize: '10.5px', fontWeight: 600, background: 'rgba(0,0,0,.5)', color: 'var(--text-invert)' }}>
            {badge}
          </span>
        )}
      </div>

      <div style={{ padding: '18px' }}>
        {/* `.mm-eyebrow` porte exactement les valeurs que le kit écrivait à la main — 10,5 px,
            .14em, capitales, `--text-eyebrow` — et il les porte depuis les jetons. */}
        {eyebrow && <p className="mm-eyebrow" style={{ margin: 0 }}>{eyebrow}</p>}
        {title && (
          <b style={{ display: 'block', fontFamily: 'var(--f-display)', fontWeight: 900, fontSize: `${titleSize}px`, letterSpacing: '-.032em', lineHeight: 1.05, marginTop: '7px' }}>
            {title}
          </b>
        )}
        {body && <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.5, margin: '9px 0 0' }}>{body}</p>}
        {cost.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '13px', fontSize: '11px', color: 'var(--text-muted)' }}>
            {cost.map((c, i) => (
              <span key={i}>
                {c.prefix}
                {c.prefix ? ' ' : null}
                <Num value={c.value} unit={c.unit} source={c.source} asOf={c.asOf} />
              </span>
            ))}
          </div>
        )}
        {actions && <div style={{ display: 'flex', gap: '9px', marginTop: '16px' }}>{actions}</div>}
      </div>
    </div>
  );
}
