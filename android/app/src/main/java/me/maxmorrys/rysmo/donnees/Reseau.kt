package me.maxmorrys.rysmo.donnees

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * L'ÉTAT DU RÉSEAU — lu AU MOMENT DE L'ÉCHEC, pour ne plus accuser le forfait de quelqu'un.
 *
 * Le port répondait « Pas de connexion. » à TOUT échec de transport : absence de réseau,
 * serveur muet, DNS, délai dépassé. Sur ce marché, où les données se comptent, cette phrase
 * n'est pas une approximation — c'est une accusation. Elle envoie vérifier un forfait quand
 * c'est le serveur qui tombe, et elle fait recharger du crédit pour rien.
 *
 * TROIS RÉPONSES, PARCE QU'IL Y A TROIS GESTES. `INDETERMINE` n'est pas un échec masqué :
 * c'est la seule réponse honnête quand le système ne sait pas, et c'est elle qui empêche
 * d'accuser le forfait de quelqu'un sur une mesure qu'on n'a pas pu faire.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
enum class EtatReseau { ABSENT, PRESENT, INDETERMINE }

/** Ce que le téléphone dit de son réseau. Ne jette jamais, ne bloque jamais, ne garde rien. */
fun interface DiagnosticReseau {
    fun etat(): EtatReseau
}

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * TROIS RÈGLES REPORTÉES TELLES QUELLES DU PORT, parce qu'elles ne dépendent pas de la
 * technologie et que chacune a coûté quelque chose.
 *
 * 1 · AUCUN CACHE, AUCUN ABONNEMENT, AUCUNE VARIABLE DE CLASSE. Un état réseau mémorisé est
 *     faux dès qu'on passe une porte : il ferait dire « ton téléphone n'a pas de réseau » à
 *     quelqu'un qui vient de retrouver la 4G, et cette personne-là ne peut pas savoir que
 *     l'application parle d'il y a trente secondes. On relit à chaque échec — c'est-à-dire
 *     rarement, et toujours au seul instant où la réponse sert.
 *
 * 2 · ELLE NE REFUSE JAMAIS UN APPEL. L'état système se trompe : portail captif, VPN, réseau
 *     d'entreprise, opérateur qui valide avec deux minutes de retard. Un client qui refuserait
 *     de partir sur la foi de cet état refuserait des appels qui auraient abouti. On tente
 *     toujours, on explique après.
 *
 * 3 · ELLE NE JETTE PAS, ET C'EST SA RAISON D'ÊTRE. Elle est appelée DEPUIS UN `catch`. Une
 *     fonction de diagnostic qui échoue dans un gestionnaire d'erreur ne rate pas seulement
 *     son diagnostic : elle REMPLACE l'erreur d'origine par la sienne, et la personne lit le
 *     défaut de l'outil de mesure au lieu du sien.
 *
 * ⛔ ET LA QUATRIÈME, PROPRE À ANDROID : ON LIT `NET_CAPABILITY_VALIDATED` EXPLICITEMENT.
 * `activeNetwork != null` dit qu'une interface existe, pas qu'elle porte quoi que ce soit —
 * un Wi-Fi de portail captif la satisfait. Et l'inverse est aussi vrai : tant qu'Android n'a
 * pas tranché sur la validation, l'absence de la capacité ne veut PAS dire « pas de réseau ».
 * On distingue donc trois cas au lieu de deux, exactement comme le port comparait à `false`
 * plutôt qu'à la véracité.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
class DiagnosticSysteme(private val context: Context) : DiagnosticReseau {

    override fun etat(): EtatReseau = try {
        val gestionnaire = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
        val reseau = gestionnaire?.activeNetwork
        val capacites = reseau?.let { gestionnaire.getNetworkCapabilities(it) }
        when {
            gestionnaire == null -> EtatReseau.INDETERMINE
            /* Aucune interface active : c'est le seul cas où le système AFFIRME l'absence. */
            reseau == null -> EtatReseau.ABSENT
            /* Une interface, mais le système ne dit rien de ses capacités — course au
               démarrage, ou état transitoire. On ne sait pas, et on le dit. */
            capacites == null -> EtatReseau.INDETERMINE
            !capacites.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) -> EtatReseau.ABSENT
            /* ⚠️ VALIDÉ = le système a vérifié qu'on sort vraiment. Son ABSENCE n'est pas un
               « non » : elle vaut aussi pendant les quelques secondes qui suivent
               l'association. Tester la véracité dirait « pas de réseau » sur un téléphone
               parfaitement connecté dont la validation n'est pas encore revenue. */
            capacites.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED) -> EtatReseau.PRESENT
            else -> EtatReseau.INDETERMINE
        }
    } catch (erreur: SecurityException) {
        /* Permission refusée : on ne sait pas, et on ne remplace pas l'erreur d'origine. */
        EtatReseau.INDETERMINE
    } catch (erreur: RuntimeException) {
        EtatReseau.INDETERMINE
    }
}
