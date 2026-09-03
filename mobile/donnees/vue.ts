import { useCallback, useEffect, useRef, useState } from 'react';

import type { Etat, Provenance } from '../ds';
import { ErreurAppel, appeler } from './appel';
import { useSession } from './session';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LIRE UNE VUE — une seule mécanique pour les quarante-deux écrans.
 *
 * Le serveur ne renvoie pas des documents mais des VUES : des modèles déjà joints, déjà
 * calculés, et surtout DÉJÀ ESTAMPILLÉS. Chaque réponse porte son `releveA`, et c'est lui
 * qui alimente `<Num asOf>` — la règle du système veut qu'un nombre n'existe pas sans sa
 * date, et jusqu'ici les écrans citaient une date en dur du 2 septembre.
 *
 * ── LE CACHE N'EST PAS UNE OPTIMISATION, C'EST UN GARDE-FOU ──────────────────────────
 * Sans lui, chaque bascule d'onglet redéclenche la lecture : cinq onglets parcourus deux
 * fois font dix appels en quelques secondes, sur un forfait compté. La fenêtre est courte
 * (30 s) — assez pour absorber une navigation, trop peu pour montrer du périmé.
 *
 * Il est EN MÉMOIRE, délibérément. Un cache persistant survivrait à la déconnexion, et il
 * faudrait alors le purger — sinon la vue de la personne précédente s'affiche une fraction
 * de seconde à la connexion suivante. Ce défaut-là ne se voit qu'en production, sur le
 * téléphone de quelqu'un qui prête son appareil.
 *
 * ── ET L'ORDRE DES SITUATIONS COMPTE ─────────────────────────────────────────────────
 * `restauration` avant `anonyme` : avant le premier rappel du SDK, on ne SAIT pas s'il y a
 * quelqu'un, et confondre les deux fait clignoter l'application vers la connexion pour
 * quelqu'un de déjà connecté.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

const FENETRE_MS = 30_000;

interface Entree { valeur: unknown; releveA: number; }
const cache = new Map<string, Entree>();

/** Vider à la déconnexion : une vue appartient à un compte, jamais à un appareil. */
export function viderLesVues(): void {
  cache.clear();
}

interface Reponse<T> { vue: T | null; releveA?: string; }

export function useVue<T>(nom: string, params: Record<string, unknown> = {}): Etat<T> {
  const session = useSession();
  const cle = `${session.phase === 'connectee' ? session.uid : '-'}:${nom}:${JSON.stringify(params)}`;

  const [etat, setEtat] = useState<Etat<T>>({ phase: 'restauration', valeur: null });
  /* Le rendu en cours peut être abandonné (démontage, changement de compte). On garde le
     compteur pour ignorer une réponse tardive qui écraserait une plus récente. */
  const tour = useRef(0);

  /*
   * ⚠️ `params` NE PEUT PAS ÊTRE UNE DÉPENDANCE. C'est un objet littéral : l'appelant en
   * construit un neuf à chaque rendu, donc son identité change à chaque rendu, donc `lire`
   * change, donc l'effet se redéclenche — une boucle infinie qui appelle le serveur à
   * chaque tour. Le compilateur ne voit rien : les types sont justes.
   *
   * `cle` porte déjà les paramètres, sérialisés. C'est LUI qui dit si la demande a changé.
   * La référence ne sert qu'à transporter la valeur jusqu'à l'appel, sans participer à la
   * décision de relire.
   */
  const derniersParams = useRef(params);
  derniersParams.current = params;

  const lire = useCallback(async (forcer: boolean) => {
    if (session.phase === 'restauration') { setEtat({ phase: 'restauration', valeur: null }); return; }
    if (session.phase === 'anonyme') { setEtat({ phase: 'anonyme', valeur: null }); return; }
    if (session.phase === 'nonConfigure') {
      setEtat({ phase: 'panne', valeur: null, motif: session.motif, reessayer: () => {} });
      return;
    }

    const garde = cache.get(cle);
    if (!forcer && garde && Date.now() - garde.releveA < FENETRE_MS) {
      setEtat(depuisCache<T>(garde));
      return;
    }

    const mien = ++tour.current;
    setEtat({ phase: 'charge', valeur: null });
    try {
      const reponse = await appeler<Reponse<T>>(nom, derniersParams.current);
      if (mien !== tour.current) return;

      const asOf = reponse.releveA ? new Date(reponse.releveA) : new Date();
      const provenance: Provenance = { source: 'server', asOf };
      cache.set(cle, { valeur: reponse.vue, releveA: Date.now() });

      setEtat(reponse.vue === null || (Array.isArray(reponse.vue) && reponse.vue.length === 0)
        ? { phase: 'vide', valeur: null, ...provenance }
        : { phase: 'servie', valeur: reponse.vue, ...provenance });
    } catch (erreur: unknown) {
      if (mien !== tour.current) return;
      setEtat({
        phase: 'panne',
        valeur: null,
        motif: erreur instanceof ErreurAppel ? erreur.motif : 'La lecture a échoué.',
        reessayer: () => { void lire(true); },
      });
    }
  }, [cle, nom, session]);

  useEffect(() => { void lire(false); }, [lire]);

  return etat;
}

function depuisCache<T>(entree: Entree): Etat<T> {
  const provenance: Provenance = { source: 'server', asOf: new Date(entree.releveA) };
  const vide = entree.valeur === null
    || (Array.isArray(entree.valeur) && entree.valeur.length === 0);
  return vide
    ? { phase: 'vide', valeur: null, ...provenance }
    : { phase: 'servie', valeur: entree.valeur as T, ...provenance };
}
