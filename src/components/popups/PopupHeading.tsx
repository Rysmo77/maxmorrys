import { TONES, type PopupTone } from './popupStyles';

/**
 * En-tête partagé par toutes les pop-ups — kit v3.
 *
 * La direction artistique vit ICI et nulle part ailleurs : onze fenêtres qui composeraient
 * chacune leur titrage dériveraient en quelques semaines.
 *
 *   · Sourcil `mm-eyebrow` : mono capitales entre crochets, dans la teinte de l'espace.
 *   · Pilule `highlight` à droite du sourcil : la seule mise en avant de la fenêtre (le kit en
 *     admet une par écran). Elle remplace la pastille inclinée en capitales, qui n'existe pas
 *     dans le kit.
 *   · Titre en Fraunces 900, casse de phrase (« Titres-phrases en casse normale »), 24 px sous
 *     `wide`, 38 px au-delà. Jamais sous 22 px : l'ancien titre mobile en faisait 16.
 */

interface PopupHeadingProps {
  eyebrow: string;
  title: string;
  /** Pilule de mise en avant. Omise si absente — jamais une chaîne vide. */
  highlight?: string;
  tone: PopupTone;
}

export default function PopupHeading({ eyebrow, title, highlight, tone }: PopupHeadingProps) {
  return (
    <div className="pr-12">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className={TONES[tone].eyebrow}>{eyebrow}</span>
        {highlight && (
          <span className="mm-tag is-soon">
            <i aria-hidden="true" />
            {highlight}
          </span>
        )}
      </div>
      <h2 className="mt-3 mb-0 font-display text-[24px] font-black leading-[1.04] tracking-[-.03em] text-ink text-balance wide:text-[38px] wide:leading-[1.02]">
        {title}
      </h2>
    </div>
  );
}
