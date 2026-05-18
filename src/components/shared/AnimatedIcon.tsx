import type { LucideIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Transition, TargetAndTransition } from 'framer-motion';

type AnimationKind = 'float' | 'pulse' | 'spin';

interface AnimatedIconProps {
  /** Composant d'icône lucide. */
  icon: LucideIcon;
  /** Type d'animation en boucle. */
  animation?: AnimationKind;
  /** Classes de la boîte (taille, fond, arrondi…). */
  className?: string;
  /** Classes de l'icône elle-même. */
  iconClassName?: string;
}

const ANIMATIONS: Record<AnimationKind, { animate: TargetAndTransition; transition: Transition }> = {
  float: { animate: { y: [0, -6, 0] }, transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' } },
  pulse: { animate: { scale: [1, 1.08, 1] }, transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } },
  spin: { animate: { rotate: [0, 360] }, transition: { duration: 9, repeat: Infinity, ease: 'linear' } },
};

/**
 * Icône décorative avec une animation en boucle subtile. La page fournit les
 * classes de boîte (taille, fond, arrondi). Statique si `prefers-reduced-motion`.
 */
export default function AnimatedIcon({
  icon: Icon,
  animation = 'float',
  className = '',
  iconClassName = '',
}: AnimatedIconProps) {
  const reduced = useReducedMotion();
  const { animate, transition } = ANIMATIONS[animation];

  return (
    <motion.div
      className={`inline-flex items-center justify-center ${className}`}
      animate={reduced ? undefined : animate}
      transition={reduced ? undefined : transition}
      aria-hidden="true"
    >
      <Icon className={iconClassName} />
    </motion.div>
  );
}
