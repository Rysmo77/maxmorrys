import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';

import { MOTIF_CONFIG_MANQUANTE } from './config';
import { getAuthNatif } from './firebase';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * QUI REGARDE — une seule souscription, pour toute l'application.
 *
 * `onAuthStateChanged` est monté UNE fois, ici. Chaque écran qui en aurait besoin
 * s'abonnerait sinon pour son compte, et le premier rappel arriverait à des instants
 * différents selon l'ordre de montage : deux écrans afficheraient deux vérités.
 *
 * ── POURQUOI `restauration` EST UN ÉTAT À PART ENTIÈRE ───────────────────────────────
 * Au démarrage à froid, le SDK relit la session depuis AsyncStorage AVANT d'émettre son
 * premier rappel. Pendant ce temps, on ne sait pas s'il y a quelqu'un — et le confondre avec
 * « personne » a une conséquence visible : l'application renverrait vers la connexion une
 * personne déjà connectée, le temps d'un battement, avant de se raviser. Ce clignotement est
 * le défaut le plus courant des applications qui branchent Firebase, et il vient toujours
 * d'ici.
 *
 * ── ET `nonConfigure` ────────────────────────────────────────────────────────────────
 * Une construction sans ses six clés ne peut pas répondre à la question. Dire « anonyme »
 * serait faux : ce n'est pas que personne n'est connecté, c'est qu'on ne peut pas le savoir.
 * `config.ts` explique pourquoi on préfère cet aveu à un écran blanc.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

export type Session =
  | { phase: 'restauration' }
  | { phase: 'anonyme' }
  | { phase: 'nonConfigure'; motif: string }
  | { phase: 'connectee'; uid: string; email: string | null; nom: string | null };

const Contexte = createContext<Session>({ phase: 'restauration' });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(() =>
    MOTIF_CONFIG_MANQUANTE
      ? { phase: 'nonConfigure', motif: MOTIF_CONFIG_MANQUANTE }
      : { phase: 'restauration' },
  );

  useEffect(() => {
    const auth = getAuthNatif();
    if (auth === null) return;

    return onAuthStateChanged(auth, (utilisateur: User | null) => {
      setSession(utilisateur === null
        ? { phase: 'anonyme' }
        : {
          phase: 'connectee',
          uid: utilisateur.uid,
          email: utilisateur.email,
          nom: utilisateur.displayName,
        });
    });
  }, []);

  return <Contexte.Provider value={session}>{children}</Contexte.Provider>;
}

export function useSession(): Session {
  return useContext(Contexte);
}

/** L'identifiant, ou `null` — pour les hooks qui n'ont besoin que de ça. */
export function useUid(): string | null {
  const session = useSession();
  return useMemo(() => (session.phase === 'connectee' ? session.uid : null), [session]);
}
