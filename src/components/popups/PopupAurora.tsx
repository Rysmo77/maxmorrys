import { motion, useReducedMotion } from 'framer-motion';

/**
 * Panneau graphique du dialogue d'aiguillage — l'équivalent de marque du visuel de droite.
 *
 * ⚠️ **Pourquoi une composition et non une photographie.** `/agence` ne porte AUCUNE image, et
 * les seuls visuels du dépôt illustrent l'offre de commerce local ou les formations. Y plaquer
 * l'un d'eux pour meubler ferait joli et mentirait sur ce que vend la page. Le panneau est donc
 * construit : halos lagoon sur fond quasi noir, grille technique, et le monogramme en très grand,
 * recadré et fondu — la teinte de marque tient le rôle du néon de la référence.
 *
 * Entièrement décoratif : le composant parent le pose derrière `aria-hidden`.
 */

interface PopupAuroraProps {
  /** Teinte dominante. `lagoon` pour l'agence, `brand` pour les formations. */
  tone?: 'lagoon' | 'brand';
}

/** Halos écrits en littéral : Tailwind purge tout nom de classe construit par concaténation. */
const TONES = {
  lagoon: {
    glow: 'bg-lagoon-500/30',
    halo: 'bg-lagoon-400/20',
    ring: 'border-lagoon-400/25',
  },
  brand: {
    glow: 'bg-brand-500/30',
    halo: 'bg-brand-400/20',
    ring: 'border-brand-400/25',
  },
} as const;

export default function PopupAurora({ tone = 'lagoon' }: PopupAuroraProps) {
  const reduced = useReducedMotion();
  const { glow, halo, ring } = TONES[tone];

  /*
    Dérive en translation seule, volontairement sans `scale`.
    Le rayon d'un `blur-3xl` (`filter: blur(64px)`) est exprimé en coordonnées
    locales : mettre l'échelle à l'échelle oblige le navigateur à re-rastériser
    un calque flouté de 416x416 px à chaque frame, deux fois, tant que la fenêtre
    est ouverte — et par-dessus le `backdrop-blur` plein écran de `PopupSurface`.
    Une translation sur un calque promu (`will-change: transform`) reste, elle,
    entièrement au compositeur. Le mouvement est conservé ; seule la pulsation
    de taille disparaît.
  */
  const drift = reduced
    ? {}
    : {
        animate: { x: [0, 18, 0], y: [0, -14, 0] },
        transition: { duration: 14, repeat: Infinity, ease: 'easeInOut' as const },
        style: { willChange: 'transform' },
      };
  const counterDrift = reduced
    ? {}
    : {
        animate: { x: [0, -22, 0], y: [0, 10, 0] },
        transition: { duration: 18, repeat: Infinity, ease: 'easeInOut' as const },
        style: { willChange: 'transform' },
      };

  return (
    <div className="absolute inset-0 bg-neutral-950 overflow-hidden">
      {/* Halos : la source lumineuse de la composition. */}
      <motion.div
        className={`absolute -top-16 -right-10 w-[26rem] h-[26rem] rounded-full blur-3xl ${glow}`}
        {...drift}
      />
      <motion.div
        className={`absolute bottom-[-6rem] left-[-4rem] w-[22rem] h-[22rem] rounded-full blur-3xl ${halo}`}
        {...counterDrift}
      />

      {/* Grille technique, très basse opacité — donne une matière au fond. */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Anneaux concentriques recadrés — l'écho du motif circulaire de la référence. */}
      <div className={`absolute -right-24 top-1/2 -translate-y-1/2 w-[30rem] h-[30rem] rounded-full border ${ring}`} />
      <div className={`absolute -right-16 top-1/2 -translate-y-1/2 w-[22rem] h-[22rem] rounded-full border ${ring}`} />

      {/* Monogramme, recadré à la manière du sujet de la référence. */}
      <img
        src="/monogramme-320.png"
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute -bottom-12 -left-8 w-72 opacity-[0.13] mix-blend-luminosity select-none"
      />

      {/* Fondu vers la colonne de contenu : la couture entre les deux moitiés ne doit pas se voir. */}
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-neutral-950 to-transparent" />
    </div>
  );
}
