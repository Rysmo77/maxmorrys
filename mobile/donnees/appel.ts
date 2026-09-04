import { API_BASE, MOTIF_CONFIG_MANQUANTE } from './config';
import { jetonCourant } from './firebase';
import { etatDuReseau } from './reseau';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LE CLIENT `onCall` — une seule porte vers `api.maxmorrys.me`.
 *
 * Le protocole est celui de Firebase Functions, réimplémenté par le Worker
 * (`worker/packages/shared/src/oncall.ts`, qui l'a relevé dans `@firebase/functions`) :
 *
 *   requête  POST  {"data": <charge>}   + `Authorization: Bearer <jeton>`
 *   succès   200   {"result": <charge>}
 *   erreur   4xx   {"error": {"status": "UNAUTHENTICATED", "message": …}}
 *
 * On n'utilise pas `httpsCallable` du SDK : il exigerait `firebase/functions` (~40 Ko) pour
 * fabriquer exactement cette requête, et il masquerait le cas ci-dessous.
 *
 * ── LE CAS QUI A DÉJÀ COÛTÉ UNE PANNE DE PAIEMENT ─────────────────────────────────────
 * Le Worker ne sert un nom que s'il figure dans sa liste `MIGRATED`. Sinon il RELAIE vers
 * `FUNCTIONS_ORIGIN`, où plus aucune Cloud Function n'est déployée — et Google répond une
 * PAGE HTML « 404 Page not found ». Un `.json()` sur cette réponse lève une erreur de
 * syntaxe, qui se présente comme une panne réseau : injoignable, alors que le serveur va
 * très bien et que le vrai défaut est un nom oublié dans une liste.
 *
 * C'est exactement ce qui est arrivé à `createClubCharge`. On nomme donc ce cas au lieu de
 * le laisser se déguiser — `tests/unit/worker-routage-callables.test.ts` le refuse à la
 * porte, et ici on le dit à voix haute si jamais il passe.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

/** Codes canoniques du protocole, tels que le serveur les écrit. */
export type CodeErreur =
  | 'unauthenticated' | 'permission-denied' | 'not-found' | 'invalid-argument'
  | 'resource-exhausted' | 'failed-precondition' | 'unavailable' | 'deadline-exceeded'
  | 'internal' | 'inconnu';

export class ErreurAppel extends Error {
  constructor(
    readonly code: CodeErreur,
    message: string,
    /** Ce que la personne doit lire. Distinct du message technique. */
    readonly motif: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ErreurAppel';
  }
}

/** `UNAUTHENTICATED` → `unauthenticated`. Un code inconnu reste nommé « inconnu ». */
function versCode(statut: unknown): CodeErreur {
  if (typeof statut !== 'string') return 'inconnu';
  const tiret = statut.toLowerCase().replace(/_/g, '-');
  const connus: CodeErreur[] = [
    'unauthenticated', 'permission-denied', 'not-found', 'invalid-argument',
    'resource-exhausted', 'failed-precondition', 'unavailable', 'deadline-exceeded',
    'internal',
  ];
  return (connus as string[]).includes(tiret) ? (tiret as CodeErreur) : 'inconnu';
}

/** Ce qu'on montre. Jamais un code brut : un code ne dit à personne quoi faire. */
function motifLisible(code: CodeErreur, message: string): string {
  switch (code) {
    case 'unauthenticated': return 'Ta session a expiré.';
    case 'permission-denied': return "Ton compte n'a pas accès à ça.";
    case 'not-found': return "Ça n'existe pas, ou plus.";
    case 'resource-exhausted': return 'Tu as atteint la limite pour aujourd’hui.';
    case 'unavailable':
    case 'deadline-exceeded': return 'Le serveur ne répond pas.';
    // Le message du serveur est écrit pour être lu — on le préfère quand il existe.
    default: return message || 'Quelque chose a échoué côté serveur.';
  }
}

const DELAI = 20_000;

/**
 * Ce qu'on dit quand on ne sait PAS — et rien d'autre.
 *
 * C'était la réponse unique à tous les échecs de transport. Elle reste, réduite au seul cas
 * qu'elle décrit honnêtement : celui où le téléphone n'a pas pu dire dans quel état il est.
 */
const MOTIF_INDETERMINE = 'Pas de connexion.';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * TROIS CAUSES, TROIS GESTES — l'échec de transport cesse d'être une phrase unique.
 *
 * Ce `catch` répondait « Pas de connexion. » à tout : absence de réseau, serveur muet, DNS,
 * délai dépassé. La phrase est fausse la moitié du temps, et sa fausseté COÛTE quelque
 * chose : elle envoie vérifier un forfait, recharger du crédit, chercher une meilleure
 * antenne — pendant que le serveur, lui, est simplement en train de tomber.
 *
 * ── LE DÉLAI SE RECONNAÎT AU SIGNAL, JAMAIS AU NOM DE L'ERREUR ────────────────────────
 * Tentant : lire `echec.name === 'TimeoutError'`. Faux ici, et de trois façons à la fois.
 * `AbortSignal.timeout` est posé par le socle Expo et pose bien un `TimeoutError` en
 * `signal.reason` — mais le `fetch` de React Native rejette avec son propre
 * `DOMException('Aborted', 'AbortError')`, et celui d'Expo enveloppe l'échec natif dans un
 * `FetchError` dont le nom est « Error ». Selon le drapeau `EXPO_PUBLIC_USE_RN_FETCH` et la
 * version du SDK, le même délai dépassé se présente donc sous trois noms différents.
 *
 * Le SIGNAL, lui, ne ment pas : il n'a qu'une seule raison de s'abattre — la nôtre. On le
 * garde sous la main et on lui demande après coup. C'est vrai quelle que soit
 * l'implémentation de `fetch` en dessous, et ça le restera à la prochaine mise à jour.
 *
 * ── ET L'ÉTAT DU RÉSEAU N'EST LU QU'ENSUITE ──────────────────────────────────────────
 * Un appel qui dépasse vingt secondes n'a rien à dire du réseau : on tenait la connexion
 * assez longtemps pour attendre. Interroger `expo-network` sur ce chemin ajouterait une
 * lecture pour une réponse qui ne changerait pas le motif.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
async function echecDeTransport(
  nom: string, limite: AbortSignal | undefined, echec: unknown,
): Promise<ErreurAppel> {
  // La trace porte la cause technique ; le motif porte ce que la personne lit. Les deux
  // vivent dans la même erreur pour qu'un rapport de panne ne perde ni l'un ni l'autre.
  const trace = echec instanceof Error ? echec.message : String(echec);

  if (limite?.aborted === true) {
    return new ErreurAppel(
      'deadline-exceeded',
      `Délai de ${DELAI} ms dépassé sur ${nom} — ${trace}`,
      'Le serveur met trop de temps.',
    );
  }

  switch (await etatDuReseau()) {
    case 'absent':
      return new ErreurAppel(
        'unavailable',
        `Aucun réseau au moment de ${nom} — ${trace}`,
        "Ton téléphone n'a pas de réseau.",
      );
    case 'present':
      /* Le téléphone a du réseau et l'appel n'est pas parti : c'est l'autre bout. Le dire
         évite le seul geste inutile — aller vérifier son forfait. */
      return new ErreurAppel(
        'unavailable',
        `Réseau présent, ${nom} injoignable — ${trace}`,
        'Le serveur ne répond pas.',
      );
    default:
      return new ErreurAppel(
        'unavailable',
        `Transport indisponible pour ${nom} — ${trace}`,
        MOTIF_INDETERMINE,
      );
  }
}

/**
 * Appelle une callable et renvoie sa charge utile.
 *
 * Jette une `ErreurAppel` — jamais une erreur nue : chaque échec porte son motif lisible,
 * pour que `SansDonnees` n'ait pas à réinventer une phrase par écran.
 */
export async function appeler<T>(nom: string, data: unknown = {}): Promise<T> {
  if (MOTIF_CONFIG_MANQUANTE) {
    throw new ErreurAppel('failed-precondition', MOTIF_CONFIG_MANQUANTE, MOTIF_CONFIG_MANQUANTE);
  }

  const jeton = await jetonCourant();
  const entetes: Record<string, string> = { 'Content-Type': 'application/json' };
  if (jeton) entetes.Authorization = `Bearer ${jeton}`;

  let reponse: Response;
  /* Le signal est RETENU : c'est lui qu'on interroge après l'échec pour savoir si le délai
     a été dépassé. Il est fabriqué dans le `try` parce que `AbortSignal.timeout` vient d'un
     correctif du socle — l'absent en ferait une erreur nue, pas un motif lisible. */
  let limite: AbortSignal | undefined;
  try {
    limite = AbortSignal.timeout(DELAI);
    reponse = await fetch(`${API_BASE}/${nom}`, {
      method: 'POST',
      headers: entetes,
      body: JSON.stringify({ data }),
      signal: limite,
    });
  } catch (echec: unknown) {
    // Vraie panne de transport — et elle a trois causes, qui appellent trois gestes.
    throw await echecDeTransport(nom, limite, echec);
  }

  const texte = await reponse.text();

  let json: unknown;
  try {
    json = JSON.parse(texte);
  } catch {
    /*
     * Ce n'est PAS du JSON. Sur ce chemin, la cause de très loin la plus probable est le
     * relais mort décrit en tête de fichier — le corps est alors le HTML de Google. On le
     * dit tel quel plutôt que de le maquiller en panne réseau : c'est un défaut de
     * configuration côté serveur, et il se corrige en une ligne quand on sait le lire.
     */
    const html = texte.trimStart().startsWith('<');
    throw new ErreurAppel(
      'internal',
      html
        ? `« ${nom} » a répondu du HTML, pas du JSON — le nom est probablement absent de MIGRATED`
        : `Réponse illisible de « ${nom} »`,
      'Le serveur a répondu quelque chose d’inattendu.',
    );
  }

  const corps = json as { result?: T; data?: T; error?: { status?: string; message?: string; details?: unknown } };

  if (corps.error) {
    const code = versCode(corps.error.status);
    const message = corps.error.message ?? '';
    throw new ErreurAppel(code, message || `Échec de ${nom}`, motifLisible(code, message), corps.error.details);
  }

  if (!reponse.ok) {
    throw new ErreurAppel('inconnu', `HTTP ${reponse.status} sur ${nom}`, 'Le serveur a refusé la demande.');
  }

  // `data` d'abord, `result` ensuite : l'ordre que le client Firebase applique lui-même.
  return (corps.data ?? corps.result) as T;
}
