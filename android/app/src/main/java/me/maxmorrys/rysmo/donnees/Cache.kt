package me.maxmorrys.rysmo.donnees

import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LE CACHE DES VUES — un garde-fou, pas une optimisation.
 *
 * Sans lui, chaque bascule d'onglet redéclenche la lecture : cinq onglets parcourus deux fois
 * font dix appels en quelques secondes, sur un forfait compté. La fenêtre est courte — assez
 * pour absorber une navigation, trop peu pour montrer du périmé.
 *
 * ⚠️ EN MÉMOIRE, DÉLIBÉRÉMENT. Un cache persistant survivrait à la déconnexion, et il faudrait
 * alors le purger — sinon la vue de la personne précédente s'affiche une fraction de seconde à
 * la connexion suivante. Ce défaut-là ne se voit qu'en production, sur le téléphone de
 * quelqu'un qui prête son appareil. Et une entrée appartient à un UID : un second compte ne
 * peut pas lire les vues du premier.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════
 * ⛔ LES DEUX DÉFAUTS DU PORT QUE CE FICHIER CORRIGE — ET QU'UN TEST PROUVE.
 *
 * 1 · LA CLÉ N'ÉTAIT PAS CANONIQUE. Le port faisait un `JSON.stringify` direct des paramètres,
 *     qui préserve l'ORDRE D'INSERTION. `{onglet, id}` et `{id, onglet}` produisaient donc deux
 *     clés, donc deux entrées, donc un appel de plus. Ce n'est pas une réponse fausse — c'est
 *     un DOUBLON SILENCIEUX sur un forfait compté, masqué par le fait que les hooks
 *     construisaient leurs littéraux dans un ordre stable. Ici, les clés sont triées, et
 *     RÉCURSIVEMENT : trier le premier niveau seulement rendrait la canonicité fausse dès
 *     qu'un paramètre porte un objet.
 *
 * 2 · L'ESTAMPILLE DU SERVEUR ÉTAIT JETÉE AU BOUT DE 30 SECONDES, et c'est le plus grave.
 *     Sur le chemin FRAIS, la provenance venait de `reponse.releveA` — la date DU SERVEUR.
 *     Mais l'entrée de cache stockait `Date.now()` — L'HORLOGE DU TÉLÉPHONE — et le chemin
 *     CACHÉ reconstruisait la provenance depuis cette valeur-là. Le même écran produisait deux
 *     provenances de NATURE différente selon qu'il avait touché le réseau, et sur un téléphone
 *     à l'heure fausse — courant — un nombre servi du cache MENTAIT sur sa date. C'est
 *     exactement la règle que tout ce dispositif existe pour tenir : un nombre n'existe pas
 *     sans sa date.
 *
 *     ⭐ D'où DEUX CHAMPS, DEUX RÔLES : `releveA` est la chaîne du serveur, transmise sans
 *     retouche ; `poseeA` est une horloge MONOTONE locale, qui ne sert qu'à la péremption et
 *     ne sort jamais d'ici. Une horloge monotone plutôt que l'heure murale : un réglage
 *     d'horloge pendant la fenêtre ne doit ni la rallonger ni l'annuler.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
class CacheDesVues(
    private val fenetreMs: Long = FENETRE_MS,
    /**
     * ⚠️ UNE BORNE, parce que le port n'en avait aucune. Sans conséquence pratique tant que les
     * vues ne se paramètrent pas finement (une vingtaine de clés) — mais rien ne l'empêchait de
     * croître, et `appFormation(slug)` se paramètre déjà.
     */
    private val plafond: Int = PLAFOND,
    /** Horloge MONOTONE en millisecondes. Injectée pour que la péremption se teste sans attendre. */
    private val horloge: () -> Long = { System.nanoTime() / 1_000_000 },
) {

    /**
     * Une entrée du cache.
     *
     * @property valeur la charge `vue` TELLE QUE LE SERVEUR L'A RENDUE — `null` compris, parce
     *   qu'un `null` est une réponse et non une absence de réponse.
     * @property releveA l'estampille ISO DU SERVEUR. Jamais recalculée, jamais reformatée.
     * @property poseeA l'instant monotone LOCAL de l'insertion. Ne sert qu'à la péremption.
     */
    data class Entree(
        val nomDeVue: String,
        val valeur: JsonElement,
        val releveA: String,
        val poseeA: Long,
    )

    /* `accessOrder = true` : la plus anciennement LUE sort en premier, pas la plus anciennement
       écrite. Une vue qu'on rouvre sans cesse doit survivre à une vue lue une fois. */
    private val entrees = object : LinkedHashMap<String, Entree>(16, 0.75f, true) {
        override fun removeEldestEntry(eldest: MutableMap.MutableEntry<String, Entree>?): Boolean =
            size > plafond
    }

    val taille: Int get() = entrees.size

    /** Une entrée encore dans la fenêtre, ou `null`. Une entrée périmée est retirée au passage. */
    @Synchronized
    fun lire(cle: String): Entree? {
        val entree = entrees[cle] ?: return null
        if (horloge() - entree.poseeA >= fenetreMs) {
            entrees.remove(cle)
            return null
        }
        return entree
    }

    /**
     * Pose une réponse.
     *
     * ⚠️ UNE PANNE N'EST JAMAIS MISE EN CACHE. Ce n'est pas un oubli à combler : servir une
     * panne pendant trente secondes ferait échouer un geste que le serveur aurait accepté.
     * C'est pour ça que cette méthode ne prend qu'une réponse, et jamais une erreur.
     */
    @Synchronized
    fun poser(cle: String, nomDeVue: String, valeur: JsonElement, releveA: String) {
        entrees[cle] = Entree(nomDeVue, valeur, releveA, horloge())
    }

    /**
     * ⭐ CE QU'UNE ÉCRITURE PÉRIME — le défaut le plus visible du port, et le seul qui se voyait
     * à l'usage.
     *
     * Là-bas, AUCUNE invalidation n'existait. `marquerLecon` rendait une progression
     * recalculée, et rien n'évinçait `appEspace`, `appLecon` ni `appCours` : pendant trente
     * secondes, revenir sur l'onglet d'à côté montrait l'état d'avant. C'est POUR CELA que
     * `ecrireUneNote` et `posterAuClub` renvoient l'objet écrit — un contournement qui marche
     * pour l'écran actif, pas pour le voisin.
     *
     * La liste vient du contrat, GÉNÉRÉE (`Perime.PAR_ECRITURE`). Ce n'est pas une discipline :
     * une écriture ajoutée sans déclarer ce qu'elle périme ne passe pas la validation du
     * contrat.
     *
     * @return le nombre d'entrées évincées.
     */
    @Synchronized
    fun perimerApres(nomDEcriture: String): Int {
        val vues = Perime.PAR_ECRITURE[nomDEcriture]
            ?: error(
                "« $nomDEcriture » n'est pas une écriture du contrat. Une écriture qui ne déclare "
                    + "pas ce qu'elle périme laisse l'onglet d'à côté sur l'état d'avant.",
            )
        if (vues.isEmpty()) return 0
        val aRetirer = entrees.entries.filter { it.value.nomDeVue in vues }.map { it.key }
        aRetirer.forEach { entrees.remove(it) }
        return aRetirer.size
    }

    /**
     * Vider — À LA DÉCONNEXION, ET APRÈS ELLE, JAMAIS AVANT.
     *
     * Une vue appartient à un compte, jamais à un appareil. Purger avant que la déconnexion
     * n'aboutisse laisserait une lecture en vol reposer une entrée au nom de la personne qui
     * vient de partir.
     */
    @Synchronized
    fun vider() {
        entrees.clear()
    }

    companion object {
        /** Assez pour absorber une navigation, trop peu pour montrer du périmé. */
        const val FENETRE_MS: Long = 30_000
        const val PLAFOND: Int = 64

        /**
         * LA CLÉ CANONIQUE — `uid:nom:params`, paramètres TRIÉS.
         *
         * L'uid d'abord : c'est lui qui empêche un second compte de lire les vues du premier.
         * `-` quand personne n'est connecté ; une lecture anonyme n'aboutira de toute façon pas.
         */
        fun cle(uid: String?, nomDeVue: String, params: JsonObject = JsonObject(emptyMap())): String =
            "${uid ?: "-"}:$nomDeVue:${canoniser(params)}"

        /**
         * Un JSON dont les clés sont triées, à TOUS LES NIVEAUX.
         *
         * Trier le premier niveau seulement suffirait aujourd'hui — les paramètres du produit
         * sont plats. Mais la canonicité serait alors une propriété des appels actuels, pas de
         * la fonction, et le premier paramètre imbriqué la perdrait sans que rien ne le dise.
         */
        fun canoniser(element: JsonElement): String = when (element) {
            is JsonObject -> element.entries
                .sortedBy { it.key }
                .joinToString(",", "{", "}") { "${JsonPrimitive(it.key)}:${canoniser(it.value)}" }
            /* Un tableau garde son ordre : il PORTE son ordre, contrairement à un objet. */
            is JsonArray -> element.joinToString(",", "[", "]") { canoniser(it) }
            else -> element.toString()
        }
    }
}

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * DE LA RÉPONSE À L'ÉTAT — et la seule règle qui décide de `Vide`.
 *
 * ⭐ LE `sens` VIENT DU CONTRAT, PAS DE L'ÉCRAN. Le port aplatissait les trois significations
 * de `vue: null` en une phase unique : « le Club est réservé aux membres », « tu n'as encore
 * rien ici » et « cette liste est vide » s'affichaient pareil. La nuance est maintenant une
 * donnée générée, et elle arrive intacte jusqu'à l'écran.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
fun sensDuVide(nomDeVue: String): SensDuVide =
    Vues.SENS_DU_VIDE[nomDeVue]
        ?: error("« $nomDeVue » n'est pas une vue du contrat : son sens du vide est inconnu.")

/**
 * Vrai quand la charge servie doit produire `Vide` plutôt que `Servie`.
 *
 * Deux cas : `null`, et le TABLEAU VIDE. Un tableau vide relevé est une information —
 * « zéro certificat depuis l'ouverture de ton compte » — à condition d'être daté, ce que
 * `Provenance` garantit.
 *
 * ⚠️ CETTE FONCTION NE DIT PAS LE SENS, et c'est tout le sujet de `sensDuVideServi`.
 */
fun estVide(charge: JsonElement): Boolean =
    charge is JsonNull || (charge is JsonArray && charge.isEmpty())

/**
 * ⛔ `vue: null` ET `vue: []` NE VEULENT PAS DIRE LA MÊME CHOSE — et les confondre dit à
 * quelqu'un QUI PAIE que le Club est réservé aux membres.
 *
 * Le contrat qualifie le REFUS du serveur (`vueNulle`) : pour les neuf vues du Club il vaut
 * `sansAcces`, parce que chacune commence par `if (!abonnement) return { vue: null }`. C'est
 * juste — pour ce cas-là.
 *
 * Mais le même handler rend `vue: []` quelques lignes plus bas, quand l'abonnement EST actif
 * et que la liste est simplement vide. Appliquer là le sens du refus produit l'écran
 * verrouillé sur l'agenda d'un membre qui n'a pas de séance à venir, sur son fil au premier
 * jour, sur ses discussions avant la première. Aucune erreur, aucun signal : juste une porte
 * fermée à quelqu'un qui a la clé.
 *
 * Un tableau vide est donc TOUJOURS `SANS_DONNEE`, quelle que soit la vue. Le serveur a
 * regardé et a répondu — c'est le contraire d'un refus.
 *
 * @return le sens à afficher, ou `null` si la charge porte quelque chose.
 */
fun sensDuVideServi(nomDeVue: String, charge: JsonElement): SensDuVide? = when {
    charge is JsonNull -> sensDuVide(nomDeVue)
    charge is JsonArray && charge.isEmpty() -> SensDuVide.SANS_DONNEE
    else -> null
}
