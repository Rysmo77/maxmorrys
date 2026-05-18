import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

interface ParallaxImageProps {
  src: string;
  alt?: string;
  /** Amplitude du déplacement vertical, en pixels. */
  range?: number;
  className?: string;
}

/**
 * Image de fond plein-cadre avec parallax subtil au défilement.
 * À placer dans un conteneur `relative overflow-hidden`. L'image est
 * surdimensionnée (`scale-110`) pour ne jamais révéler ses bords.
 * Statique si `prefers-reduced-motion`.
 */
export default function ParallaxImage({ src, alt = '', range = 50, className = '' }: ParallaxImageProps) {
  const ref = useRef<HTMLImageElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-range, range]);

  return (
    <motion.img
      ref={ref}
      src={src}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      loading="lazy"
      style={reduced ? undefined : { y }}
      className={`absolute inset-0 w-full h-full object-cover scale-110 ${className}`}
    />
  );
}
