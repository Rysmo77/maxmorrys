import { useCallback, useState, type ReactNode } from 'react';
import { Bandeau, type BandeauTon } from './Bandeau';

/**
 * Le bandeau d'un écran, tenu par l'écran : `montrer(…)` le pose, la croix le retire, et
 * un nouveau message remplace l'ancien au lieu de s'empiler.
 *
 *   const { bandeau, montrer } = useBandeau();
 *   …
 *   catch { montrer('stop', "L'export n'a pas abouti", motif); }
 *   …
 *   {bandeau}
 */
export function useBandeau(): {
  bandeau: ReactNode;
  montrer: (ton: BandeauTon, titre: string, corps?: string) => void;
  effacer: () => void;
} {
  const [message, setMessage] = useState<{ cle: number; ton: BandeauTon; titre: string; corps?: string } | null>(null);
  const montrer = useCallback((ton: BandeauTon, titre: string, corps?: string) => {
    setMessage({ cle: Date.now(), ton, titre, corps });
  }, []);
  const effacer = useCallback(() => setMessage(null), []);
  const bandeau = message === null ? null : (
    <Bandeau
      key={message.cle}
      ton={message.ton}
      titre={message.titre}
      corps={message.corps}
      onFermer={effacer}
      style={{ marginTop: 14 }}
    />
  );
  return { bandeau, montrer, effacer };
}
