import { motion, useReducedMotion } from 'framer-motion';

/**
 * En-tête éditorial partagé par toutes les pop-ups : sur-titre, titre d'affichage, pastille.
 *
 * ⚠️ Extrait pour que la direction artistique vive à UN seul endroit. Six fenêtres qui
 * réimplémenteraient chacune leur titrage dériveraient en quelques semaines, et corriger le
 * contraste ou l'échelle supposerait six modifications au lieu d'une.
 *
 * Le site n'embarque aucune fonte condensée : le titrage suit l'idiome maison, `font-black` avec
 * interlettrage resserré, comme `fontSize.heading-hero` de la configuration Tailwind.
 *
 * Sous `lg`, tout se réduit : ces fenêtres s'affichent alors en bandeau bas plafonné à 30 vh
 * (voir `PopupSurface`), où un titre d'affichage pousserait l'action sous la ligne de flottaison.
 */

interface PopupHeadingProps {
  eyebrow: string;
  title: string;
  /** Pastille pivotée. Omise si absente — elle ne doit jamais afficher une chaîne vide. */
  sticker?: string;
  /** Teinte d'accent. `lagoon` pour l'agence et le commerce, `brand` pour l'apprentissage. */
  tone?: 'lagoon' | 'brand';
}

/** Chaînes littérales : Tailwind purge tout nom de classe construit par concaténation. */
const TONES = {
  lagoon: {
    eyebrow: 'text-digitalise-txt',
    sticker: 'bg-[color:var(--mm-teal)] text-ink shadow-digitalise',
  },
  brand: {
    eyebrow: 'text-forme',
    sticker: 'bg-[color:var(--mm-bleu)] text-ink shadow-forme',
  },
} as const;

export default function PopupHeading({ eyebrow, title, sticker, tone = 'lagoon' }: PopupHeadingProps) {
  const reduced = useReducedMotion();
  const palette = TONES[tone];

  return (
    <div>
      <p className={`hidden wide:block text-[0.625rem] font-bold tracking-[0.3em] uppercase ${palette.eyebrow}`}>
        {eyebrow}
      </p>

      <div className="relative wide:mt-3 wide:pr-24">
        <h2 className="text-base wide:text-5xl font-bold wide:font-black wide:uppercase wide:tracking-tight wide:leading-[0.95] text-white text-balance">
          {title}
        </h2>
        {sticker && (
          <motion.span
            /*
              `-rotate-6` sert de repli : en mouvement réduit, framer ne pose aucun transform
              inline et c'est la classe qui donne l'inclinaison.
            */
            initial={reduced ? false : { scale: 0.4, rotate: 0, opacity: 0 }}
            animate={reduced ? undefined : { scale: 1, rotate: -8, opacity: 1 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 320, damping: 14 }}
            className={`hidden wide:inline-block absolute -top-1 right-0 px-3 py-1.5 rounded-md text-xs font-black uppercase tracking-wide -rotate-6 ${palette.sticker}`}
          >
            {sticker}
          </motion.span>
        )}
      </div>
    </div>
  );
}
