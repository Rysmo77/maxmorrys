/**
 * L'ÉTAT DU VISITEUR, COMMUN AUX TROIS ESPACES.
 *
 * `localStorage` et `sessionStorage` sont rangés PAR ORIGINE : `maxmorrys.me`,
 * `edu.maxmorrys.me` et `club.maxmorrys.me` ont chacun les leurs. Depuis les sous-domaines,
 * tout ce qui y vivait se comptait trois fois :
 *
 *   · le plafond « une pop-up par session » devenait trois pop-ups par session ;
 *   · le groupe témoin se tirait au sort sur chaque hôte, et un même visiteur pouvait être
 *     témoin ici, exposé là — la mesure ne comparait plus deux populations ;
 *   · le panier laissé au paiement (sur edu.) n'était jamais lu par le hub ;
 *   · le bandeau cookies reposait la question sur chaque sous-domaine — le kit v3 exige un
 *     consentement unique, « partagé par le cookie de domaine ».
 *
 * Ce module range donc ces valeurs dans un cookie posé sur `.maxmorrys.me`, que les trois hôtes
 * lisent. Hors production (localhost, aperçus, tests sous Node), il n'y a pas de domaine commun :
 * il retombe sur `localStorage` / `sessionStorage`, SOUS LES MÊMES CLÉS qu'avant.
 *
 * ⚠️ Une valeur lue en `localStorage` alors que le cookie manque est MIGRÉE vers le cookie : les
 * délais et les refus déjà enregistrés sur le hub avant les sous-domaines ne sont pas perdus.
 *
 * ⚠️ Portée `session` en mode cookie : un cookie de session vit jusqu'à la fermeture du
 * navigateur, pas de l'onglet. C'est plus strict que `sessionStorage`, et c'est voulu : un
 * visiteur qui ouvre trois onglets ne doit pas recevoir trois pop-ups.
 *
 * Rien ici n'est un traceur : ni identifiant, ni donnée personnelle — des horodatages, un
 * choix de consentement, un numéro de groupe.
 */
import { DOMAINE } from './espaces';

export type Portee = 'session' | 'durable';

/** Durée de vie d'un cookie durable : 400 jours, le plafond que Chrome applique de toute façon. */
const MAX_AGE_S = 400 * 24 * 60 * 60;

function modeCookie(): boolean {
  if (typeof document === 'undefined' || typeof location === 'undefined') return false;
  const h = location.hostname.toLowerCase();
  return h === DOMAINE || h.endsWith(`.${DOMAINE}`);
}

function stockage(portee: Portee): Storage | null {
  try {
    return portee === 'session' ? sessionStorage : localStorage;
  } catch {
    return null;
  }
}

function lireCookie(cle: string): string | null {
  const prefixe = `${encodeURIComponent(cle)}=`;
  for (const morceau of document.cookie.split('; ')) {
    if (!morceau.startsWith(prefixe)) continue;
    try {
      return decodeURIComponent(morceau.slice(prefixe.length));
    } catch {
      return null;
    }
  }
  return null;
}

function poserCookie(cle: string, valeur: string, maxAge: number | null): void {
  const duree = maxAge === null ? '' : `; Max-Age=${maxAge}`;
  document.cookie = `${encodeURIComponent(cle)}=${encodeURIComponent(valeur)}; Domain=.${DOMAINE}; Path=/; SameSite=Lax; Secure${duree}`;
}

/** La valeur rangée sous `cle`, ou `null`. */
export function lirePartage(cle: string, portee: Portee = 'durable'): string | null {
  const local = stockage(portee);
  if (!modeCookie()) {
    try {
      return local?.getItem(cle) ?? null;
    } catch {
      return null;
    }
  }
  const valeur = lireCookie(cle);
  if (valeur !== null) return valeur;
  // Migration : la valeur d'avant les sous-domaines, sur l'hôte où elle avait été écrite.
  try {
    const ancienne = local?.getItem(cle) ?? null;
    if (ancienne !== null) {
      poserCookie(cle, ancienne, portee === 'session' ? null : MAX_AGE_S);
      local?.removeItem(cle);
    }
    return ancienne;
  } catch {
    return null;
  }
}

/** Range `valeur` sous `cle`. `maxAgeS` borne un cookie durable (par défaut 400 jours). */
export function ecrirePartage(cle: string, valeur: string, portee: Portee = 'durable', maxAgeS = MAX_AGE_S): void {
  if (!modeCookie()) {
    try {
      stockage(portee)?.setItem(cle, valeur);
    } catch {
      // Stockage plein ou interdit : la valeur est perdue, rien ne casse.
    }
    return;
  }
  poserCookie(cle, valeur, portee === 'session' ? null : maxAgeS);
}

/** Efface `cle`, sur le domaine commun et sur l'hôte courant. */
export function effacerPartage(cle: string, portee: Portee = 'durable'): void {
  try {
    stockage(portee)?.removeItem(cle);
  } catch {
    // Rien à effacer.
  }
  if (modeCookie()) poserCookie(cle, '', 0);
}

/** Les clés rangées qui commencent par `prefixe` (pour un effacement en bloc). */
export function clesPartagees(prefixe: string, portee: Portee = 'durable'): string[] {
  const cles = new Set<string>();
  try {
    const local = stockage(portee);
    for (let i = 0; i < (local?.length ?? 0); i += 1) {
      const cle = local?.key(i);
      if (cle?.startsWith(prefixe)) cles.add(cle);
    }
  } catch {
    // Stockage inaccessible.
  }
  if (modeCookie()) {
    for (const morceau of document.cookie.split('; ')) {
      const nom = morceau.split('=')[0];
      try {
        const cle = decodeURIComponent(nom);
        if (cle.startsWith(prefixe)) cles.add(cle);
      } catch {
        // Nom illisible : ce n'est pas l'un des nôtres.
      }
    }
  }
  return [...cles];
}
