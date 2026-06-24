import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';
import { useFormat } from '../../hooks/useFormat';

interface CountUpProps {
  /** Valeur finale (entier). */
  value: number;
  prefix?: string;
  suffix?: string;
  /** Durée de l'incrément en secondes. */
  duration?: number;
  /** Formate le nombre avec séparateurs de milliers (fr-FR). */
  format?: boolean;
  className?: string;
}

/**
 * Compteur animé : s'incrémente de 0 à `value` lorsqu'il entre dans le viewport
 * (une seule fois). Respecte `prefers-reduced-motion` (affiche la valeur finale).
 */
export default function CountUp({ value, prefix = '', suffix = '', duration = 1.6, format = false, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const { locale } = useFormat();
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduced, value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{format ? display.toLocaleString(locale) : display}{suffix}
    </span>
  );
}
