import { LogoMark } from '@ds';
import type { Formation } from '../../types';
import { TONES, type PopupTone } from './popupStyles';

/**
 * Le panneau de droite d'une pop-up — kit v3.
 *
 * Il remplace `PopupAurora` (halos flous animés, grille technique, monogramme fondu), qui
 * empilait trois couches floutées sous un voile lui-même flouté : le kit v3 n'admet qu'un flou
 * par écran, et deux fonds au plus — le maillage et une surface.
 *
 * Le panneau porte désormais l'IDENTITÉ DE L'ESPACE dont parle la fenêtre : son maillage
 * (`m-hub`, `m-edu`, `m-club`, `m-digitalise`) et la signature du kit — le M sur sa pastille
 * blanche, le nom en Fraunces 900, le sous-nom en mono (`EDU · JE TE FORME`). Le visiteur sait
 * d'un coup d'œil où la fenêtre l'emmène : sur trois domaines, c'est devenu une information.
 *
 * Avec une formation, sa couverture se pose en carte sur le maillage, plutôt qu'à fond perdu
 * sous un dégradé nuit.
 *
 * Entièrement décoratif : `PopupSurface` le pose sous `aria-hidden` et le masque sous `wide`.
 */

/** Sous-nom de chaque espace, tel que le composant `Brand` du kit les écrit. */
const SUBNAME: Record<PopupTone, string> = {
  /* Rien sous le nom sur le hub : « Max-Morrys · PAR MAX-MORRYS » se répétait. */
  hub: '',
  edu: 'EDU · JE TE FORME',
  club: 'CLUB DES DIGITOS',
  studio: 'CONCEPTION',
};

interface PopupPanelProps {
  tone: PopupTone;
  formation?: Formation | null;
}

export default function PopupPanel({ tone, formation }: PopupPanelProps) {
  const t = TONES[tone];
  return (
    /* `dk` sur le panneau du Club : son maillage est nuit dans les deux thèmes (kit), donc
       l'encre doit y être claire dans les deux thèmes — `.dk` fait basculer `--ink` localement. */
    <div className={`absolute inset-0 overflow-hidden ${t.nightPanel ? 'dk' : ''}`}>
      <div className={t.mesh}>
        <b />
        <b />
        <b />
      </div>

      {formation?.coverImage && (
        <div className="absolute inset-x-8 top-8 bottom-[112px] overflow-hidden rounded-[20px] shadow-[var(--sh-lift)]">
          <img
            src={formation.coverImage}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="absolute inset-x-8 bottom-8 flex items-center gap-3">
        <LogoMark size={40} plate />
        <div className="min-w-0">
          <p className="m-0 font-display text-[20px] font-black leading-none tracking-[-.03em] text-ink">Max-Morrys</p>
          {SUBNAME[tone] && (
            <p className="mt-1.5 mb-0 font-mono text-[10.5px] font-semibold uppercase tracking-[.14em] text-ink-2">
              {SUBNAME[tone]}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
