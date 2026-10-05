import { getNetworkStateAsync } from 'expo-network';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * L'ÉTAT DU RÉSEAU — lu AU MOMENT DE L'ÉCHEC, pour ne plus accuser le forfait de quelqu'un.
 *
 * `appel.ts` répondait « Pas de connexion. » à tout échec de transport : absence de réseau,
 * serveur muet, DNS, délai dépassé. Sur ce marché, où les données se comptent, cette phrase
 * n'est pas une approximation — c'est une accusation. Elle envoie vérifier un forfait quand
 * c'est le serveur qui tombe, et elle fait recharger du crédit pour rien.
 *
 * ── POURQUOI RIEN N'EST GARDÉ EN MÉMOIRE ─────────────────────────────────────────────
 * Aucun cache, aucun abonnement, aucune variable de module. Un état réseau mis en cache est
 * faux dès qu'on passe une porte : il ferait dire « ton téléphone n'a pas de réseau » à
 * quelqu'un qui vient de retrouver la 4G, et cette personne-là ne peut pas savoir que
 * l'application parle d'il y a trente secondes. On relit à chaque échec — c'est-à-dire
 * rarement, et toujours au seul instant où la réponse sert.
 *
 * ── ET CE QUE CETTE FONCTION NE FAIT PAS ─────────────────────────────────────────────
 * Elle ne BLOQUE jamais un appel. L'état du système se trompe — capture de portail, VPN,
 * réseau d'entreprise, opérateur qui répond `VALIDATED` avec deux minutes de retard. Un
 * client qui refuserait de partir sur la foi de cet état refuserait des appels qui auraient
 * abouti. On tente toujours, et on explique après.
 *
 * ── ELLE NE JETTE PAS, ET C'EST LA RAISON DE SON EXISTENCE ────────────────────────────
 * Elle est appelée DEPUIS UN `catch`. Une fonction de diagnostic qui échoue dans un
 * gestionnaire d'erreur ne fait pas que rater son diagnostic : elle remplace l'erreur
 * d'origine par la sienne, et la personne lit alors le défaut de l'outil de mesure au lieu
 * du sien. Tout est donc dans un `try`, y compris l'import indirect du module natif — qui
 * jette quand le paquet n'est pas lié à la construction en cours.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * Trois réponses, parce qu'il y a trois gestes.
 *
 * `indetermine` n'est pas un échec masqué : c'est la seule réponse honnête quand le système
 * ne sait pas. `appel.ts` retombe alors sur son motif générique plutôt que d'affirmer
 * quelque chose que personne n'a mesuré.
 */
export type EtatReseau = 'absent' | 'present' | 'indetermine';

/**
 * Le diagnostic ne doit pas durer plus longtemps que la panne qu'il explique.
 *
 * Un appel natif qui ne revient JAMAIS serait pire qu'un appel qui jette : le `catch` de
 * `appel.ts` ne se terminerait pas, l'état ne passerait jamais en `panne`, et l'écran
 * resterait sur son squelette indéfiniment. Deux secondes suffisent très largement à lire
 * un état que le système tient déjà en mémoire.
 */
const DELAI_DIAGNOSTIC = 2_000;

/**
 * Ce que le téléphone dit de son réseau, à l'instant où on le lui demande.
 *
 * Ne jette jamais. Ne bloque jamais. Ne garde rien.
 */
export async function etatDuReseau(): Promise<EtatReseau> {
  let minuteur: ReturnType<typeof setTimeout> | undefined;
  try {
    const etat = await Promise.race([
      getNetworkStateAsync(),
      new Promise<null>((resoudre) => {
        minuteur = setTimeout(() => resoudre(null), DELAI_DIAGNOSTIC);
      }),
    ]);

    if (etat === null) return 'indetermine';

    /*
     * ⚠️ LES DEUX CHAMPS SONT FACULTATIFS, et leur absence n'est pas un « non ».
     * `isInternetReachable` vaut `undefined` tant qu'Android n'a pas tranché sur la
     * capacité `NET_CAPABILITY_VALIDATED`, et sur iOS il ne fait que recopier
     * `isConnected`. Tester `!etat.isInternetReachable` — le raccourci naturel — dirait
     * donc « pas de réseau » sur un téléphone parfaitement connecté dont la validation
     * n'est pas encore revenue. On compare à `false`, jamais à la véracité.
     */
    if (etat.isInternetReachable === false || etat.isConnected === false) return 'absent';
    if (etat.isInternetReachable === true || etat.isConnected === true) return 'present';
    return 'indetermine';
  } catch {
    // Module natif absent de cette construction, permission refusée, état illisible :
    // dans les trois cas on ne sait pas, et on le dit plutôt que de le deviner.
    return 'indetermine';
  } finally {
    if (minuteur !== undefined) clearTimeout(minuteur);
  }
}
