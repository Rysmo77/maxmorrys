package me.maxmorrys.rysmo.donnees

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.Handler
import android.os.Looper
import java.util.concurrent.atomic.AtomicBoolean

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

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * ⭐ LE RETOUR DU RÉSEAU — la SEULE chose qu'une lecture ponctuelle ne peut pas faire.
 *
 * ⛔ ET CE N'EST PAS UNE ENTORSE À LA RÈGLE 1 CI-DESSUS, C'EST SON REVERS. La règle interdit
 * de GARDER un état réseau pour en tirer un verdict plus tard — parce qu'un verdict périmé
 * accuse le forfait de quelqu'un qui vient de retrouver la 4G. Ici, rien n'est gardé et rien
 * n'est affirmé : on ne mémorise pas « il n'y a pas de réseau », on demande au système de
 * nous PRÉVENIR quand il y en a. La différence est celle entre une photo qu'on ressort et
 * une sonnette.
 *
 * ── ⛔ TROIS BORNES, ET CHACUNE EMPÊCHE UN DÉFAUT PRÉCIS ────────────────────────────
 *
 * 1 · ELLE NE S'OUVRE QUE SUR UN ÉCHEC DÉJÀ ATTRIBUÉ À L'ABSENCE DE RÉSEAU, et elle se
 *     referme dès que l'écran quitte cet état. Une veille permanente redeviendrait le
 *     bandeau que la spécification refuse : « un bandeau qui clignote sur un réseau instable
 *     coûte plus d'attention qu'il n'en économise ».
 *
 * 2 · ELLE NE DIT RIEN, ELLE REFAIT. Le geste offert à l'écran est « on réessaie tout seul
 *     dès que le réseau revient » — une phrase qui doit être VRAIE, donc branchée sur un
 *     appel réel, sinon c'est le contrôle mort d'une promesse au lieu d'un bouton.
 *
 * 3 · ELLE RAPPELLE SUR UN FIL DE SERVICE. `onAvailable` n'arrive PAS sur le fil principal :
 *     écrire un état Compose depuis là est une écriture concurrente que rien ne signale et
 *     que tout le monde finit par voir une fois, en production. Le saut est fait ici, une
 *     fois, plutôt que dans chaque appelant.
 *
 * ⚠️ ET « DISPONIBLE » N'EST PAS « QUI SORT ». Un Wi-Fi de portail captif déclenche
 * `onAvailable`. La reprise repartira, échouera peut-être encore, et `Appel` relira l'état au
 * moment de CET échec-là : c'est le bon endroit pour trancher, pas ici.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
fun interface VeilleDuReseau {
    /** Referme la veille. ⚠️ Ne jamais oublier : une veille orpheline survit à l'écran. */
    fun arreter()
}

/**
 * Prévient UNE fois, sur le fil principal, quand un réseau redevient disponible.
 *
 * @return de quoi refermer la veille. Rend une veille inerte si le système refuse
 *   l'enregistrement — sans jamais lever : cette fonction est appelée depuis un écran en
 *   panne, et une exception y remplacerait la panne d'origine par la sienne.
 */
fun veillerLeRetourDuReseau(contexte: Context, quandIlRevient: () -> Unit): VeilleDuReseau {
    val gestionnaire = contexte.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
        ?: return VeilleDuReseau { /* rien à refermer */ }

    val principal = Handler(Looper.getMainLooper())
    /* ⛔ UNE SEULE FOIS. Sans ce drapeau, un réseau qui bat — courant sur une cellule en
       limite de couverture — relancerait l'appel à chaque bascule, et la reprise deviendrait
       une boucle que personne n'a demandée. */
    val dejaPrevenu = AtomicBoolean(false)

    val rappel = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(reseau: Network) {
            if (dejaPrevenu.compareAndSet(false, true)) principal.post(quandIlRevient)
        }
    }

    val demande = NetworkRequest.Builder()
        /*
         * ⚠️ `NET_CAPABILITY_INTERNET` SEULEMENT, PAS `VALIDATED`. La capacité « validé » est
         * lisible sur un réseau existant, mais elle ne se DEMANDE pas de la même façon selon
         * la version d'Android : la poser ici donnerait une veille qui ne se déclenche jamais
         * sur une partie du parc, sans erreur et sans trace. On demande donc le moins
         * exigeant, et c'est `DiagnosticSysteme` — au moment de l'échec suivant — qui garde la
         * lecture fine.
         */
        .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        .build()

    return try {
        gestionnaire.registerNetworkCallback(demande, rappel)
        VeilleDuReseau {
            try {
                gestionnaire.unregisterNetworkCallback(rappel)
            } catch (_: IllegalArgumentException) {
                /* Déjà retiré : Android lève sur un double retrait. Ce n'est pas une erreur
                   à faire remonter — c'est l'idempotence qu'on voulait. */
            }
        }
    } catch (_: SecurityException) {
        /* `ACCESS_NETWORK_STATE` retirée par une politique d'entreprise : pas de veille, et
           le bouton « Réessayer » reste, lui, toujours là. */
        VeilleDuReseau { /* rien à refermer */ }
    } catch (_: RuntimeException) {
        /* Trop de veilles enregistrées par le processus (le système en plafonne le nombre).
           Perdre la reprise automatique est acceptable ; faire tomber l'écran ne l'est pas. */
        VeilleDuReseau { /* rien à refermer */ }
    }
}
