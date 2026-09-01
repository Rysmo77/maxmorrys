import { useState } from 'react';
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
 * ⚠️ AD-24 · LA PHOTO ENTRE, LA SILHOUETTE RESTE. Le kit écrivait « Aucune photographie » sur
 * `gradient`, et l'argument tenait : sur un téléphone tenu à bout de bras, une étiquette
 * « Podcast » se perd là où une forme ne se perd pas. Mais le produit POSSÈDE les images et ne
 * les montrait pas : `Video.thumbnailUrl` et `Podcast.coverImage` sont des champs OBLIGATOIRES,
 * remplis automatiquement par l'import YouTube et l'import Spotify, et la fiche vidéo affiche
 * déjà sa miniature une page plus loin. La carte était le seul endroit qui les jetait.
 *
 * L'écart ne rembourse donc pas l'argument du kit, il le garde : la photo remplit la vignette,
 * et l'onde comme le cadre 16:9 sont redessinés PAR-DESSUS, sur un voile sombre qui les rend
 * lisibles quelle que soit l'image. Le format se lit toujours à la silhouette ; l'image est ce
 * qui donne envie d'ouvrir.
 *
 * LE DÉGRADÉ DEVIENT UN REPLI, pas un rebut. Il reste le fond de la zone : pochette absente,
 * URL cassée, image encore en vol — c'est lui qu'on voit, jamais un trou ni un carton blanc.
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
  /**
   * Dégradé de la vignette. Par défaut celui du format. C'est le FOND de la zone, et donc le
   * repli de `image` : il reste seul tant qu'aucune photo n'est fournie, ou si elle échoue.
   */
  gradient?: string;
  /**
   * Miniature ou pochette — `Video.thumbnailUrl`, `Podcast.coverImage`. Elle recouvre le
   * dégradé sans le remplacer (AD-24), et la silhouette du format se redessine par-dessus.
   * Si elle casse, on retombe sur le dégradé : jamais d'icône de lien brisé.
   */
  image?: string;
  /**
   * Décorative par défaut : le titre de la carte est l'étiquette de la même cible, et le
   * redire à voix haute ne fait que doubler l'annonce. Ne l'écrire que si l'image PORTE une
   * information que le titre ne porte pas.
   */
  imageAlt?: string;
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
  /** @default 150 — ignorée dès que `artRatio` est fourni. */
  artHeight?: number;
  /**
   * Rapport de la vignette — « 16 / 9 », « 1 / 1 ». Il PREND LE PAS sur `artHeight` : une
   * hauteur figée dans une grille fluide recadre l'image différemment à chaque largeur.
   */
  artRatio?: string;
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
  format = 'audio', gradient, image, imageAlt = '', eyebrow, title, body, cost = [], badge,
  artHeight = 150, artRatio, titleSize = 17, actions, playHref, onPlay, playLabel, style,
}: MediaCardProps) {
  /* Voir `onError` plus bas : on retient l'URL cassée, pas un simple « c'est cassé ». */
  const [broken, setBroken] = useState<string | null>(null);
  const shown = !!image && broken !== image;

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
          // Le rapport prime sur la hauteur : dans une grille fluide, une hauteur figée
          // recadre l'image autrement à chaque largeur de colonne.
          ...(artRatio ? { aspectRatio: artRatio } : { height: `${artHeight}px` }),
          background: grad, position: 'relative', overflow: 'hidden',
        }}
      >
        {shown && (
          <img
            src={image}
            alt={imageAlt}
            aria-hidden={imageAlt ? undefined : true}
            loading="lazy"
            decoding="async"
            // Le repli est PORTÉ PAR LA SOURCE, pas par un simple booléen : mémoriser « cassée »
            // sans mémoriser LAQUELLE laisserait la carte suivante au dégradé alors que sa
            // propre image est bonne — le filtre de la liste réordonne sans démonter.
            onError={() => setBroken(image ?? null)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}

        {/* LE VOILE. Une photo est imprévisible : sans lui, l'onde, le cadre et le badge se
            posent sur ce que la miniature leur donne — parfois du blanc. Il ne monte qu'à
            38 % de la hauteur, assez pour tenir la rangée du bas sans assombrir le sujet.
            Aucun flou : la carte vit en grille, et c'est la règle 1. */}
        {shown && (
          <span
            aria-hidden="true"
            style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,.62),rgba(0,0,0,0) 38%)' }}
          />
        )}

        {/* LA SILHOUETTE SURVIT À LA PHOTO — c'est la condition d'AD-24. Le cadre 16:9 de la
            vidéo garde sa place en réserve d'image ; l'onde de l'audio descend sur le voile,
            où elle reste lisible sur n'importe quel fond. */}
        {format === 'video' && (
          <span aria-hidden="true" style={{ position: 'absolute', inset: '14px', border: '2px solid rgba(255,255,255,.28)', borderRadius: '14px' }} />
        )}

        <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>{play}</span>

        <span
          style={{
            position: 'absolute', left: '14px', right: '14px', bottom: '14px', display: 'flex',
            alignItems: 'flex-end', justifyContent: 'space-between', gap: '10px', pointerEvents: 'none',
          }}
        >
          {format === 'audio' ? (
            // `align-items:flex-end` est la recette du kit (`.wave`) : les barres reposent sur
            // la même ligne, comme un vumètre. Les seize valeurs restent celles du relevé.
            <span aria-hidden="true" style={{ display: 'flex', alignItems: 'flex-end', gap: '3px' }}>
              {MM_ONDE.map((h, i) => (
                <i key={i} style={{ width: '3px', height: `${h}px`, borderRadius: '2px', background: shown ? 'rgba(255,255,255,.88)' : 'rgba(255,255,255,.72)' }} />
              ))}
            </span>
          ) : (
            <span />
          )}
          {badge && (
            <span style={{ display: 'inline-flex', alignItems: 'center', height: '25px', padding: '0 10px', borderRadius: 'var(--r-pill)', fontSize: '10.5px', fontWeight: 600, background: 'rgba(0,0,0,.5)', color: 'var(--text-invert)', whiteSpace: 'nowrap' }}>
              {badge}
            </span>
          )}
        </span>
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
