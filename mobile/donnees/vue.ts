import { useCallback, useEffect, useRef, useState } from 'react';

import type { Etat, Provenance } from '../ds';
import { ErreurAppel, appeler } from './appel';
import { useSession } from './session';
import { cleDeVue, ecrireCache, lireCache, type Entree } from './cache';
import { VUE_NULLE } from './contrat.generated';

export { viderLesVues } from './cache';

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

interface Reponse<T> { vue: T | null; releveA?: string; }

/** `actif: false` : la vue n'a pas encore de quoi être demandée (un paramètre manque) — rien ne part. */
export function useVue<T>(nom: string, params: Record<string, unknown> = {}, actif = true): Etat<T> {
  const session = useSession();
  const cle = cleDeVue(session.phase === 'connectee' ? session.uid : '-', nom, params);

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
    if (!actif) { setEtat({ phase: 'nonBranche', valeur: null }); return; }
    if (session.phase === 'restauration') { setEtat({ phase: 'restauration', valeur: null }); return; }
    if (session.phase === 'anonyme') { setEtat({ phase: 'anonyme', valeur: null }); return; }
    if (session.phase === 'nonConfigure') {
      setEtat({ phase: 'panne', valeur: null, motif: session.motif, reessayer: () => {} });
      return;
    }

    const garde = lireCache(cle);
    if (!forcer && garde) {
      setEtat(depuisCache<T>(garde, porteFermee(nom, derniersParams.current)));
      return;
    }

    const mien = ++tour.current;
    setEtat({ phase: 'charge', valeur: null });
    try {
      const reponse = await appeler<Reponse<T>>(nom, derniersParams.current);
      if (mien !== tour.current) return;

      /* L'heure de l'appareil ne sert qu'en dernier recours, si le serveur n'a pas estampillé.
         Le cache garde l'estampille du SERVEUR : c'est elle qu'une relecture affichera. */
      const asOf = reponse.releveA ? new Date(reponse.releveA) : new Date();
      const provenance: Provenance = { source: 'server', asOf };
      ecrireCache(cle, { valeur: reponse.vue, releveA: asOf, luA: Date.now() });

      setEtat(etatDe<T>(reponse.vue, provenance, porteFermee(nom, derniersParams.current)));
    } catch (erreur: unknown) {
      if (mien !== tour.current) return;
      setEtat({
        phase: 'panne',
        valeur: null,
        motif: erreur instanceof ErreurAppel ? erreur.motif : 'La lecture a échoué.',
        reessayer: () => { void lire(true); },
      });
    }
  }, [actif, cle, nom, session]);

  useEffect(() => { void lire(false); }, [lire]);

  return etat;
}

function depuisCache<T>(entree: Entree, ferme: boolean): Etat<T> {
  return etatDe<T>(entree.valeur, { source: 'server', asOf: entree.releveA }, ferme);
}

/**
 * Ce que `vue: null` veut dire POUR CETTE VUE. `appClubListe` s'ouvre en trois formes : son
 * sens se lit sous `appClubListe.<onglet>`.
 */
function porteFermee(nom: string, params: Record<string, unknown>): boolean {
  const table = VUE_NULLE as Readonly<Record<string, string>>;
  const sens = table[nom] ?? (typeof params.onglet === 'string' ? table[`${nom}.${params.onglet}`] : undefined);
  return sens === 'sansAcces';
}

/**
 * ⛔ UNE LISTE VIDE N'EST PAS UNE PORTE FERMÉE. Seul `null` porte le sens du contrat ; `[]`
 * veut toujours dire « rien pour l'instant », même sur une vue `sansAcces`.
 */
function etatDe<T>(valeur: unknown, provenance: Provenance, fermeSiNul: boolean): Etat<T> {
  if (valeur === null || valeur === undefined) {
    return { phase: 'vide', valeur: null, ferme: fermeSiNul, ...provenance };
  }
  if (Array.isArray(valeur) && valeur.length === 0) return { phase: 'vide', valeur: null, ...provenance };
  return { phase: 'servie', valeur: valeur as T, ...provenance };
}
